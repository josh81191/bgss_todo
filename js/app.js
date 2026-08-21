const state = {
  tasks: [],
  users: [],
  projects: typeof projects !== "undefined" ? projects : [],
  currentUser: null,
  refreshTimer: null,
  taskView: "active",
  projectFilter: "",
  assigneeFilter: "",
  personalTaskFilter: "assigned",
};

const taskList = document.getElementById("taskList");
const taskModal = document.getElementById("taskModal");
const taskDetailsModal = document.getElementById("taskDetailsModal");
const taskForm = document.getElementById("taskForm");
const createTaskBtn = document.getElementById("createTaskBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");
const taskAssignTo = document.getElementById("taskAssignTo");
const refreshBtn = document.getElementById("refreshBtn");
const refreshingIndicator = document.getElementById("refreshingIndicator");
const connectionBanner = document.getElementById("connectionBanner");
const closeTaskDetailsBtn = document.getElementById("closeTaskDetailsBtn");
const detailCompleteBtn = document.getElementById("detailCompleteBtn");
const detailDeleteBtn = document.getElementById("detailDeleteBtn");
const detailRemoveDeadlineBtn = document.getElementById(
  "detailRemoveDeadlineBtn",
);
const taskDetailsComment = document.getElementById("taskDetailsComment");
const taskDetailsCommentStatus = document.getElementById(
  "taskDetailsCommentStatus",
);
const taskDetailsCommentCount = document.getElementById(
  "taskDetailsCommentCount",
);
const taskDetailsPhoto = document.getElementById("taskDetailsPhoto");
const taskDetailsPhotoPreview = document.getElementById(
  "taskDetailsPhotoPreview",
);
const taskPhotoInput = document.getElementById("taskPhotoInput");
const taskPhotoRemoveBtn = document.getElementById("taskPhotoRemoveBtn");
const taskPhotoStatus = document.getElementById("taskPhotoStatus");

let detailTaskId = null;
let detailCommentSaveTimer = null;

const statMapping = {
  total: document.getElementById("statTotal"),
  urgent: document.getElementById("statUrgent"),
  done: document.getElementById("statDone"),
  open: document.getElementById("statOpen"),
};
const taskSummary = document.getElementById("taskSummary");
const taskViewSelector = document.getElementById("taskViewSelector");
const projectFilterSelector = document.getElementById("projectFilterSelector");
const projectFilterSelectorInitial = projectFilterSelector?.value;
const assigneeFilterSelector = document.getElementById(
  "assigneeFilterSelector",
);
const personalTaskFilterSelector = document.getElementById(
  "personalTaskFilterSelector",
);

if (projectFilterSelectorInitial) {
  state.projectFilter = projectFilterSelectorInitial;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return t("No deadline");

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date
    .toLocaleString(getCurrentLang() === "bn" ? "bn-BD" : undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "");
}

function getUserById(userId) {
  return state.users.find((user) => user.id === userId) || null;
}

// Fetches a Bangla translation for `text` and swaps it into `el` once ready.
async function translateElementText(el, text) {
  if (!el) return;
  const translated = await translateDynamicText(text);
  if (getCurrentLang() === "bn" && el.dataset.original === text) {
    el.textContent = translated;
  }
}

// Same as translateElementText but for form field values (e.g. the comment textarea).
async function translateFieldValue(el, text) {
  if (!el || !text) return;
  const translated = await translateDynamicText(text);
  if (
    getCurrentLang() === "bn" &&
    el.dataset.original === text &&
    el.value === text
  ) {
    el.value = translated;
    if (el === taskDetailsComment) {
      taskDetailsCommentCount.textContent = `${taskDetailsComment.value.length}/200`;
    }
  }
}

// Translates every visible task description in the table when Bangla is active.
function applyDynamicDescriptionTranslations() {
  if (getCurrentLang() !== "bn") return;
  taskList
    ?.querySelectorAll(".task-name[data-field='description']")
    .forEach((el) => {
      translateElementText(el, el.dataset.original);
    });
}

function showConnectionBanner(message, isWarning) {
  if (!connectionBanner) return;
  connectionBanner.textContent = message;
  connectionBanner.classList.toggle("warning", Boolean(isWarning));
  connectionBanner.classList.remove("hidden");
  document.body.classList.add("has-banner");
}

function hideConnectionBanner() {
  if (!connectionBanner) return;
  connectionBanner.classList.add("hidden");
  document.body.classList.remove("has-banner");
}

window.addEventListener("online", hideConnectionBanner);
window.addEventListener("offline", () =>
  showConnectionBanner(t("No internet connection"), false),
);

function renderTaskSummary() {
  if (!taskSummary) return;

  const visibleTasks = state.tasks
    .filter((task) => !task.completed)
    .filter((task) =>
      state.currentUser?.role === "manager" && state.projectFilter
        ? task.project_id === state.projectFilter
        : true,
    )
    .filter((task) =>
      state.currentUser?.role === "manager" && state.assigneeFilter
        ? task.assigned_to?.[0] === state.assigneeFilter
        : true,
    )
    .filter((task) => {
      if (state.currentUser?.role === "manager") return true;
      return state.personalTaskFilter === "created"
        ? String(task.created_by) === String(state.currentUser?.id)
        : task.assigned_to?.some(
            (assignedId) =>
              String(assignedId) === String(state.currentUser?.id),
          );
    });

  const total = visibleTasks.length;
  const urgent = visibleTasks.filter(
    (task) => task.priority === "urgent",
  ).length;
  taskSummary.innerHTML = `
    <span><strong>${total}</strong> ${t(total === 1 ? "task" : "tasks")}</span>
    <span class="urgent-summary"><strong>${urgent}</strong> ${t(urgent === 1 ? "urgent" : "urgents")}</span>
  `;
}

function renderTasks() {
  if (!taskList) return;

  renderTaskSummary();

  const visibleTasks = [...state.tasks]
    .filter((task) =>
      state.taskView === "completed" ? task.completed : !task.completed,
    )
    .filter((task) =>
      state.currentUser?.role === "manager" && state.projectFilter
        ? task.project_id === state.projectFilter
        : true,
    )
    .filter((task) =>
      state.currentUser?.role === "manager" && state.assigneeFilter
        ? task.assigned_to?.[0] === state.assigneeFilter
        : true,
    )
    .filter((task) => {
      if (state.currentUser?.role === "manager") return true;
      return state.personalTaskFilter === "created"
        ? String(task.created_by) === String(state.currentUser?.id)
        : task.assigned_to?.some(
            (assignedId) =>
              String(assignedId) === String(state.currentUser?.id),
          );
    });

  const sortedTasks = visibleTasks.sort((a, b) => {
    if (state.taskView === "completed") {
      return (
        new Date(b.completed_at || b.created_at || 0) -
        new Date(a.completed_at || a.created_at || 0)
      );
    }

    if (a.priority === "urgent" && b.priority !== "urgent") return -1;
    if (a.priority !== "urgent" && b.priority === "urgent") return 1;
    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
  });

  const isManager = state.currentUser?.role === "manager";
  const isAssignedTasksView =
    !isManager && state.personalTaskFilter === "assigned";
  const canCreateInlineTask = isManager || !isAssignedTasksView;

  createTaskBtn?.classList.toggle("hidden", !canCreateInlineTask);

  const peopleOptions = (assignedId) =>
    [
      `<option value="" ${assignedId ? "" : "selected"}>----</option>`,
      ...state.users.map(
        (user) =>
          `<option value="${escapeHtml(user.id)}" ${user.id === assignedId ? "selected" : ""}>${escapeHtml(user.name)}</option>`,
      ),
    ].join("");

  taskList.innerHTML = `
  <div class="task-table-wrap">
    <table class="task-table">
      <tbody>
        ${sortedTasks
          .map((task) => {
            const assignedId = task.assigned_to?.[0] || "";
            const readOnlyTask = task.completed;
            const creatorId = String(task.created_by || "");
            const creator = getUserById(creatorId);
            const isCreator = creatorId === String(state.currentUser?.id || "");
            const canEditTask =
              (isManager || isCreator) && !readOnlyTask && !isAssignedTasksView;
            const createdByLabel =
              creatorId && creatorId !== String(state.currentUser?.id || "")
                ? `<div class="task-created-by">${t("Entry by")}: ${escapeHtml(creator?.name || creatorId)}</div>`
                : "";

            return `
              <tr
                class="task-row ${
                  task.priority === "urgent" ? "is-urgent" : "is-normal"
                }"
                data-task-id="${task.id}"
              >
                <td>
                  <div
                    class="table-editable task-name"
                    contenteditable="${canEditTask}"
                    data-field="description"
                    data-original="${escapeHtml(task.description)}"
                  >
                    ${escapeHtml(task.description)}
                  </div>
                  ${createdByLabel}
                </td>

                ${
                  !isManager
                    ? ""
                    : `
                  <td>
                    <select
                      class="assigned-select table-select"
                      data-task-id="${task.id}"
                      ${canEditTask ? "" : "disabled"}
                      aria-label="${t("Assign task")}"
                    >
                      ${peopleOptions(assignedId)}
                    </select>
                  </td>
                `
                }

                <td class="action-cell">
                  <span class="table-actions">
                    ${
                      isAssignedTasksView
                        ? ""
                        : `
                    <button
                      type="button"
                      class="priority-button ${task.priority}"
                      data-task-id="${task.id}"
                      ${canEditTask ? "" : "disabled"}
                      aria-label="${t("Change priority")}"
                      title="${t("Change priority")}"
                    >
                      <span class="material-symbols-outlined">${task.priority === "urgent" ? "flag" : "outlined_flag"}</span>
                    </button>
                    <select class="priority-select" data-task-id="${task.id}" ${canEditTask ? "" : "disabled"} aria-label="${t("Task priority")}">
                      <option value="normal" ${task.priority === "normal" ? "selected" : ""}>${t("Normal")}</option>
                      <option value="urgent" ${task.priority === "urgent" ? "selected" : ""}>${t("Urgent")}</option>
                    </select>
                    `
                    }
                    ${
                      readOnlyTask || isAssignedTasksView
                        ? ""
                        : `
                          <span class="deadline-picker">
                            <button type="button" class="deadline-button" ${canEditTask ? "" : "disabled"} aria-label="${t("Choose deadline")}" title="${t("Choose deadline")}">
                              <span class="material-symbols-outlined">calendar_month</span>
                            </button>
                            <input class="deadline-input" type="date" data-task-id="${task.id}" value="${escapeHtml(task.deadline ? task.deadline.slice(0, 10) : "")}" aria-label="Task deadline" ${canEditTask ? "" : "disabled"}>
                          </span>
                        `
                    }

                    <button
                      type="button"
                      class="details-button"
                      data-task-id="${task.id}"
                      aria-label="${t("Open task details")}"
                      title="${t("Task details")}"
                    >
                      <span class="material-symbols-outlined">
                        info
                      </span>
                    </button>
                  </span>
                  ${task.deadline ? `<span class="deadline-label">${escapeHtml(formatDateOnly(task.deadline, ""))}</span>` : ""}
                </td>
              </tr>
            `;
          })
          .join("")}

        ${
          state.taskView === "completed" || !canCreateInlineTask
            ? ""
            : `
          <tr class="new-task-row">
            <td>
              <input
                id="inlineTask"
                class="inline-input"
                placeholder="${t("Click to add task...")}"
                autocomplete="off"
              >
            </td>

            ${
              isManager
                ? `<td>
              <select id="inlineAssignee" class="assigned-select table-select">
                ${peopleOptions("")}
              </select>
            </td>`
                : ""
            }

            <td class="action-cell">
              <span class="table-actions">
                <button
                  type="button"
                  class="priority-button normal"
                  aria-label="${t("Task priority")}"
                  title="${t("Normal priority")}"
                >
                  <span class="material-symbols-outlined">
                    outlined_flag
                  </span>
                </button>

                <select class="priority-select" disabled>
                  <option>${t("Normal")}</option>
                </select>
                <span class="deadline-picker">
                  <button type="button" class="deadline-button" aria-label="${t("Choose deadline")}" title="${t("Choose deadline")}">
                    <span class="material-symbols-outlined">calendar_month</span>
                  </button>
                  <input id="inlineDeadline" class="deadline-input" type="date" aria-label="Task deadline">
                </span>

                <button
                  type="button"
                  class="details-button placeholder"
                  disabled
                  aria-label="Task details unavailable"
                >
                  <span class="material-symbols-outlined">
                    info
                  </span>
                </button>
              </span>
            </td>
          </tr>
        `
        }
      </tbody>
    </table>
  </div>
`;

  applyDynamicDescriptionTranslations();

  const inlineTask = document.getElementById("inlineTask");
  const inlineAssignee = document.getElementById("inlineAssignee");
  const inlineDeadline = document.getElementById("inlineDeadline");
  if (state.taskView === "active") {
    let isAddingInlineTask = false;

    const addInlineTask = async () => {
      const description = inlineTask.value.trim();
      if (!description || isAddingInlineTask) return;

      isAddingInlineTask = true;
      await sendTaskAction(
        {
          action: "create_task",
          description: await ensureEnglishText(description),
          comment: "",
          priority: "normal",
          deadline: inlineDeadline.value,
          assigned_to: inlineAssignee?.value ? [inlineAssignee.value] : [],
          project_id: currentTaskProjectId(),
        },
        inlineTask,
      );
      isAddingInlineTask = false;
    };

    inlineTask?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addInlineTask();
      }
    });

    inlineTask?.addEventListener("blur", () => {
      addInlineTask();
    });
  }

  taskList.querySelectorAll(".details-button").forEach((button) => {
    button.addEventListener("click", () => {
      openTaskDetails(
        state.tasks.find((item) => item.id === button.dataset.taskId),
      );
    });
  });

  taskList.querySelectorAll(".priority-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const select = button.parentElement.querySelector(".priority-select");
      if (!select || select.disabled) return;

      const nextPriority = select.value === "urgent" ? "normal" : "urgent";
      const confirmed = window.confirm(
        `Change task priority to ${nextPriority === "urgent" ? t("Urgent") : t("Normal")}?`,
      );
      if (!confirmed) return;

      await sendTaskAction(
        {
          action: "update_priority",
          task_id: select.dataset.taskId,
          priority: nextPriority,
        },
        button,
      );
    });
  });
}

function defaultProjectId() {
  const mineco = state.projects.find((project) => project.slug === "mineco");
  return mineco?.id || state.projects[0]?.id || "";
}

function currentTaskProjectId() {
  const isManager = state.currentUser?.role === "manager";
  if (isManager && state.projectFilter) {
    return state.projectFilter;
  }
  return defaultProjectId();
}

function setTaskView(view) {
  if (view !== "active" && view !== "completed") return;

  state.taskView = view;
  if (taskViewSelector) {
    taskViewSelector.value = view;
  }
  renderTasks();
}

function isTaskEditorActive() {
  const activeElement = document.activeElement;
  return Boolean(
    activeElement &&
    taskList?.contains(activeElement) &&
    (activeElement.matches("input, textarea, select") ||
      activeElement.matches("[contenteditable='true']")),
  );
}

async function loadTaskData(scrollToTop = false) {
  if (!navigator.onLine) {
    showConnectionBanner(t("No internet connection"), false);
    return;
  }

  refreshingIndicator?.classList.remove("hidden");
  const startedAt = Date.now();

  // Warn without aborting the request if the server is slow to respond.
  const slowConnectionTimer = setTimeout(() => {
    showConnectionBanner(t("Slow connection… still refreshing"), true);
  }, 4000);

  try {
    const response = await fetch("php/api/tasks.php");
    const result = await response.json();

    if (!result.success) {
      window.location.href = "index.php";
      return;
    }

    state.tasks = result.tasks || [];
    state.currentUser = result.current_user || currentUser;
    state.users = users || [];
    state.projects = result.projects || state.projects;
    if (!isTaskEditorActive()) {
      renderTasks();
    }
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    hideConnectionBanner();
  } catch (error) {
    console.error(error);
    showConnectionBanner(t("Unable to reach the server"), false);
  } finally {
    clearTimeout(slowConnectionTimer);
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, 1500 - elapsed);
    setTimeout(() => refreshingIndicator?.classList.add("hidden"), remaining);
  }
}

async function sendTaskAction(payload, triggerEl) {
  if (!navigator.onLine) {
    alert(t("No internet connection. Please reconnect and try again."));
    return;
  }

  if (triggerEl) {
    triggerEl.disabled = true;
    triggerEl.style.opacity = "0.6";
  }

  const slowConnectionTimer = setTimeout(() => {
    showConnectionBanner(t("Slow connection… still working"), true);
  }, 4000);

  try {
    const response = await fetch("php/api/tasks.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!result.success) {
      alert(result.error || t("Action failed"));
      return;
    }

    state.tasks = result.tasks || state.tasks;
    renderTasks();
    hideConnectionBanner();
  } catch (error) {
    console.error(error);
    alert(t("Unable to reach the server. Please check your connection."));
  } finally {
    clearTimeout(slowConnectionTimer);
    if (triggerEl) {
      triggerEl.disabled = false;
      triggerEl.style.opacity = "";
    }
  }
}

function openCreateModal() {
  populateAssignToOptions();
  taskModal.classList.remove("hidden");
  taskModal.setAttribute("aria-hidden", "false");
}

function populateAssignToOptions() {
  if (!taskAssignTo) return;

  const sortedUsers = [...state.users].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  taskAssignTo.innerHTML =
    `<option style="font-size: 13px;" value="">${t("Select person")}</option>` +
    sortedUsers
      .map(
        (u) =>
          `<option style="font-size: 13px;" value="${u.id}" ${u.id === state.currentUser?.id ? "selected" : ""}>${escapeHtml(u.name)}</option>`,
      )
      .join("");
}

function closeCreateModal() {
  taskModal.classList.add("hidden");
  taskModal.setAttribute("aria-hidden", "true");
  taskForm.reset();
}

function formatDateOnly(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(
    getCurrentLang() === "bn" ? "bn-BD" : undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function closeTaskDetails() {
  clearTimeout(detailCommentSaveTimer);
  taskDetailsModal?.classList.add("hidden");
  taskDetailsModal?.setAttribute("aria-hidden", "true");
  detailTaskId = null;
}

function openTaskDetails(task) {
  if (!task) return;

  window.getSelection()?.removeAllRanges();

  const isManager = state.currentUser?.role === "manager";
  // Delete remains manager-only; everything else is available to whoever can see the task.
  const canDeleteTask = isManager;

  detailTaskId = task.id;

  const taskDetailsTitleEl = document.getElementById("taskDetailsTitle");
  taskDetailsTitleEl.textContent = task.description;
  taskDetailsTitleEl.dataset.original = task.description;
  translateElementText(taskDetailsTitleEl, task.description);

  const assignedToElement = document.getElementById("taskDetailsAssignedTo");
  if (assignedToElement) {
    assignedToElement.textContent =
      getUserById(task.assigned_to?.[0])?.name || t("Unassigned");
  }

  const priorityElement = document.getElementById("taskDetailsPriority");

  priorityElement.textContent =
    task.priority === "urgent" ? t("Urgent") : t("Normal");

  priorityElement.classList.toggle("urgent", task.priority === "urgent");

  priorityElement.classList.toggle("normal", task.priority !== "urgent");

  const createdByElement = document.getElementById("taskDetailsCreatedBy");
  if (createdByElement) {
    createdByElement.textContent =
      getUserById(task.created_by)?.name || t("Unknown");
  }

  const createdOnElement = document.getElementById("taskDetailsCreatedOn");
  if (createdOnElement) {
    createdOnElement.textContent = formatDateOnly(
      task.created_at,
      t("Unknown"),
    );
  }

  const completedOnLabel = document.getElementById(
    "taskDetailsCompletedOnLabel",
  );
  const completedOnElement = document.getElementById("taskDetailsCompletedOn");
  if (completedOnLabel && completedOnElement) {
    const hasCompletedAt = Boolean(task.completed && task.completed_at);
    completedOnLabel.classList.toggle("hidden", !hasCompletedAt);
    completedOnElement.classList.toggle("hidden", !hasCompletedAt);
    completedOnElement.textContent = hasCompletedAt
      ? formatDateOnly(task.completed_at, t("Unknown"))
      : "";
  }

  const deadlineElement = document.getElementById("taskDetailsDeadline");
  deadlineElement.textContent = formatDateOnly(task.deadline, t("No deadline"));
  deadlineElement.classList.toggle("has-deadline", Boolean(task.deadline));
  const isReadOnlyTask = Boolean(task.completed);
  detailRemoveDeadlineBtn.disabled =
    !task.deadline || isReadOnlyTask || !isManager;
  detailRemoveDeadlineBtn.classList.toggle(
    "hidden",
    isReadOnlyTask || !isManager,
  );
  detailCompleteBtn.classList.toggle("hidden", isReadOnlyTask && !isManager);
  const completeIcon = detailCompleteBtn.querySelector(
    ".material-symbols-outlined",
  );
  if (completeIcon)
    completeIcon.textContent = isReadOnlyTask ? "undo" : "check";
  detailCompleteBtn.title = isReadOnlyTask
    ? t("Revert to active")
    : t("Mark as done");
  detailCompleteBtn.setAttribute(
    "aria-label",
    isReadOnlyTask ? t("Revert to active") : t("Mark as done"),
  );
  detailDeleteBtn.classList.toggle("hidden", isReadOnlyTask || !canDeleteTask);

  taskDetailsComment.value = task.comment || "";
  taskDetailsComment.dataset.original = task.comment || "";
  taskDetailsComment.readOnly = isReadOnlyTask;
  taskDetailsComment.disabled = isReadOnlyTask;
  taskDetailsCommentCount.textContent = `${taskDetailsComment.value.length}/200`;
  taskDetailsCommentStatus.textContent = "";
  taskDetailsCommentStatus.className = "";
  translateFieldValue(taskDetailsComment, task.comment || "");
  taskPhotoStatus.textContent = "";
  taskDetailsPhoto.classList.toggle("hidden", !task.photo_url);
  taskDetailsPhotoPreview.src = task.photo_url || "";
  const photoControls = document.querySelector(".task-photo-controls");
  if (photoControls) {
    photoControls.classList.toggle("hidden", isReadOnlyTask);
  }
  taskPhotoRemoveBtn.classList.toggle(
    "hidden",
    !task.photo_url || isReadOnlyTask,
  );

  taskDetailsModal.classList.remove("hidden");

  taskDetailsModal.setAttribute("aria-hidden", "false");
}

function getFirebaseStorage() {
  if (!window.firebase || !window.firebaseConfig) return null;
  if (!window.firebase.apps.length)
    window.firebase.initializeApp(window.firebaseConfig);
  return window.firebase.storage();
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read image"));
    image.src = dataUrl;
  });
}

async function compressImageToTarget(file, maxBytes = 150 * 1024) {
  if (!file || !file.type.startsWith("image/")) return file;
  if (file.size <= maxBytes) return file;

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });

  const originalImage = await loadImageFromDataUrl(dataUrl);
  const maxDimension = 1600;
  let width = originalImage.naturalWidth;
  let height = originalImage.naturalHeight;

  if (width > maxDimension || height > maxDimension) {
    const scale = Math.min(maxDimension / width, maxDimension / height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  let outputBlob = null;
  const outputType = file.type === "image/png" ? "image/jpeg" : file.type;
  let quality = 0.82;
  let scale = 1;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    outputBlob = await new Promise((resolve) => {
      canvas.toBlob(resolve, outputType, quality);
    });

    if (!outputBlob) break;
    if (outputBlob.size <= maxBytes) break;

    if (quality > 0.4) {
      quality = Math.max(0.3, quality - 0.1);
    } else {
      scale *= 0.85;
      if (scale < 0.2) break;
    }
  }

  if (!outputBlob || outputBlob.size > maxBytes) {
    return file;
  }

  const safeName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([outputBlob], `${safeName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function persistTaskPhoto(photoUrl, photoPath) {
  const response = await fetch("php/api/tasks.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "update_photo",
      task_id: detailTaskId,
      photo_url: photoUrl,
      photo_path: photoPath,
    }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Photo update failed");
  state.tasks = result.tasks || state.tasks;
}

async function uploadTaskPhoto(file) {
  const task = state.tasks.find((item) => item.id === detailTaskId);
  const storage = getFirebaseStorage();
  if (!task || !storage) {
    taskPhotoStatus.textContent = t("Add Firebase config first");
    return;
  }

  taskPhotoStatus.textContent = t("Compressing...");
  try {
    const optimizedFile = await compressImageToTarget(file, 150 * 1024);
    taskPhotoStatus.textContent = t("Uploading...");

    if (task.photo_path)
      await storage
        .ref(task.photo_path)
        .delete()
        .catch(() => {});
    const safeName = optimizedFile.name.replace(/[^a-z0-9._-]/gi, "_");
    const photoPath = `bgss_todo/${task.id}/${Date.now()}-${safeName}`;
    const snapshot = await storage.ref(photoPath).put(optimizedFile);
    const photoUrl = await snapshot.ref.getDownloadURL();
    await persistTaskPhoto(photoUrl, photoPath);
    openTaskDetails(state.tasks.find((item) => item.id === detailTaskId));
    taskPhotoStatus.textContent = t("Saved ✓");
  } catch (error) {
    console.error(error);
    taskPhotoStatus.textContent = t("Could not upload photo");
  } finally {
    taskPhotoInput.value = "";
  }
}

async function removeTaskPhoto() {
  const task = state.tasks.find((item) => item.id === detailTaskId);
  if (!task || !task.photo_url || !window.confirm(t("Remove this photo?")))
    return;
  const storage = getFirebaseStorage();
  taskPhotoStatus.textContent = t("Removing...");
  try {
    if (storage && task.photo_path)
      await storage
        .ref(task.photo_path)
        .delete()
        .catch(() => {});
    await persistTaskPhoto("", "");
    openTaskDetails(state.tasks.find((item) => item.id === detailTaskId));
    taskPhotoStatus.textContent = t("Removed ✓");
  } catch (error) {
    console.error(error);
    taskPhotoStatus.textContent = t("Could not remove photo");
  }
}

function scheduleCommentSave() {
  clearTimeout(detailCommentSaveTimer);
  taskDetailsCommentCount.textContent = `${taskDetailsComment.value.length}/200`;
  taskDetailsCommentStatus.textContent = t("Saving...");
  taskDetailsCommentStatus.className = "saving";
  detailCommentSaveTimer = setTimeout(saveDetailComment, 500);
}

async function saveDetailComment() {
  const task = state.tasks.find((item) => item.id === detailTaskId);
  if (!task) return;

  try {
    const comment = await ensureEnglishText(
      taskDetailsComment.value.slice(0, 200),
    );
    const response = await fetch("php/api/tasks.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_comment",
        task_id: task.id,
        comment,
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Comment save failed");

    state.tasks = result.tasks || state.tasks;
    taskDetailsCommentStatus.textContent = t("Saved ✓");
    taskDetailsCommentStatus.className = "saved";
  } catch (error) {
    console.error(error);
    taskDetailsCommentStatus.textContent = t("Could not save");
    taskDetailsCommentStatus.className = "error";
  }
}

async function handleTaskDetailsAction(action) {
  const task = state.tasks.find((item) => item.id === detailTaskId);
  if (!task) return;

  const message =
    action === "delete"
      ? t("Delete this task? This action cannot be undone.")
      : task.completed
        ? t("Move this task back to active tasks?")
        : t(
            "Mark this task as completed? It will be removed from the task list.",
          );
  if (!window.confirm(message)) return;

  if (action === "delete") {
    const storage = getFirebaseStorage();
    if (storage && task.photo_path) {
      try {
        await storage
          .ref(task.photo_path)
          .delete()
          .catch(() => {});
      } catch (error) {
        console.error("Failed to remove task photo from storage:", error);
      }
    }
  }

  await sendTaskAction(
    {
      action: action === "delete" ? "delete_task" : "toggle_complete",
      task_id: task.id,
    },
    action === "delete" ? detailDeleteBtn : detailCompleteBtn,
  );
  closeTaskDetails();
}

createTaskBtn?.addEventListener("click", () => {
  document.getElementById("inlineTask")?.focus();
});
closeModalBtn?.addEventListener("click", closeCreateModal);
cancelTaskBtn?.addEventListener("click", closeCreateModal);
closeTaskDetailsBtn?.addEventListener("click", closeTaskDetails);
detailCompleteBtn?.addEventListener("click", () =>
  handleTaskDetailsAction("complete"),
);
detailRemoveDeadlineBtn?.addEventListener("click", async () => {
  const task = state.tasks.find((item) => item.id === detailTaskId);
  if (!task || !task.deadline) return;
  if (!window.confirm(t("Remove this task's deadline?"))) return;

  await sendTaskAction(
    { action: "update_deadline", task_id: task.id, deadline: "" },
    detailRemoveDeadlineBtn,
  );
  closeTaskDetails();
});
detailDeleteBtn?.addEventListener("click", () =>
  handleTaskDetailsAction("delete"),
);
taskDetailsComment?.addEventListener("input", scheduleCommentSave);
taskDetailsPhotoPreview?.setAttribute("role", "button");
taskDetailsPhotoPreview?.setAttribute("tabindex", "0");
taskDetailsPhotoPreview?.setAttribute(
  "aria-label",
  "Preview photo in full size",
);
taskDetailsPhotoPreview?.addEventListener("click", () => {
  if (!taskDetailsPhotoPreview.src) return;
  window.open(taskDetailsPhotoPreview.src, "_blank", "noopener,noreferrer");
});
taskDetailsPhotoPreview?.addEventListener("keydown", (event) => {
  if (
    (event.key === "Enter" || event.key === " ") &&
    taskDetailsPhotoPreview.src
  ) {
    event.preventDefault();
    window.open(taskDetailsPhotoPreview.src, "_blank", "noopener,noreferrer");
  }
});
taskPhotoInput?.addEventListener("change", () => {
  if (taskPhotoInput.files?.[0]) uploadTaskPhoto(taskPhotoInput.files[0]);
});
taskPhotoRemoveBtn?.addEventListener("click", removeTaskPhoto);

taskViewSelector?.addEventListener("change", (event) => {
  setTaskView(event.target.value);
});

projectFilterSelector?.addEventListener("change", (event) => {
  state.projectFilter = event.target.value;
  renderTasks();
});

assigneeFilterSelector?.addEventListener("change", (event) => {
  state.assigneeFilter = event.target.value;
  renderTasks();
});

personalTaskFilterSelector?.addEventListener("change", (event) => {
  state.personalTaskFilter = event.target.value;
  renderTasks();
});

taskForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const description = document.getElementById("taskDescription").value.trim();
  const comment = document.getElementById("taskComment").value.trim();
  const priority = document.getElementById("taskPriority").value;
  const deadlineDate = document.getElementById("taskDeadlineDate").value;
  const deadlineTime = document.getElementById("taskDeadlineTime").value;
  const deadline = deadlineDate
    ? `${deadlineDate}${deadlineTime ? `T${deadlineTime}` : ""}`
    : "";
  const assignedTo = taskAssignTo?.value || "";

  if (!description) {
    alert(t("Please provide a description."));
    return;
  }

  await sendTaskAction(
    {
      action: "create_task",
      description: await ensureEnglishText(description),
      comment: await ensureEnglishText(comment),
      priority,
      deadline,
      assigned_to: assignedTo ? [assignedTo] : [],
      project_id: currentTaskProjectId(),
    },
    taskForm.querySelector(".primary-btn"),
  );

  closeCreateModal();
  await loadTaskData();
});

taskList?.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  const action = target.dataset.action;
  const taskId = target.dataset.taskId;

  if (!taskId) return;

  if (action === "toggle") {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task || task.completed) return;

    const confirmed = window.confirm(
      t("Mark this task as completed? It will be removed from the task list."),
    );
    if (!confirmed) return;

    await sendTaskAction(
      {
        action: "toggle_complete",
        task_id: taskId,
        user_id: state.currentUser.id,
      },
      target,
    );
  }
});

taskList?.addEventListener("input", (event) => {
  const field = event.target.closest("[contenteditable='true'][data-field]");
  if (field) field.dataset.dirty = "true";
});

taskList?.addEventListener(
  "blur",
  async (event) => {
    const field = event.target.closest("[contenteditable='true'][data-field]");
    if (!field || !field.dataset.dirty) return;

    const row = field.closest("[data-task-id]");
    if (!row) return;

    const task = state.tasks.find((item) => item.id === row.dataset.taskId);
    if (!task || task[field.dataset.field] === field.textContent.trim()) return;

    const editedText = await ensureEnglishText(field.textContent.trim());

    await sendTaskAction(
      {
        action: "update_task",
        task_id: row.dataset.taskId,
        description:
          field.dataset.field === "description" ? editedText : task.description,
        comment:
          field.dataset.field === "comment" ? editedText : task.comment || "",
      },
      field,
    );
  },
  true,
);

taskList?.addEventListener("change", async (event) => {
  const target = event.target;

  if (target.matches(".status-select")) {
    const taskId = target.dataset.taskId;
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task || Boolean(target.value === "done") === Boolean(task.completed))
      return;
    await sendTaskAction(
      { action: "toggle_complete", task_id: taskId },
      target,
    );
    return;
  }

  if (target.matches(".priority-select")) {
    const taskId = target.dataset.taskId;
    const priority = target.value;
    if (!taskId || !priority) return;

    await sendTaskAction(
      {
        action: "update_priority",
        task_id: taskId,
        priority,
      },
      target,
    );
    return;
  }

  if (target.matches(".assigned-select")) {
    const taskId = target.dataset.taskId;
    if (!taskId) return;

    const assignedTo = target.value;

    await sendTaskAction(
      {
        action: "update_assigned",
        task_id: taskId,
        assigned_to: assignedTo ? [assignedTo] : [],
      },
      target,
    );
    return;
  }

  if (target.matches(".deadline-input")) {
    const taskId = target.dataset.taskId;
    if (!taskId) return;

    await sendTaskAction(
      { action: "update_deadline", task_id: taskId, deadline: target.value },
      target,
    );
  }
});

taskModal?.addEventListener("click", (event) => {
  if (event.target === taskModal) closeCreateModal();
});

taskDetailsModal?.addEventListener("click", (event) => {
  if (event.target === taskDetailsModal) closeTaskDetails();
});

refreshBtn?.addEventListener("click", () => {
  loadTaskData(true);
});

// Updates all static (non task-derived) labels/placeholders for the active language.
function applyStaticUI() {
  const lang = getCurrentLang();

  document
    .querySelectorAll("#personalTaskFilterSelector option")
    .forEach((opt) => {
      if (opt.value === "assigned") opt.textContent = t("Assigned to me");
      if (opt.value === "created") opt.textContent = t("Task created by me");
    });
  document.querySelectorAll("#taskViewSelector option").forEach((opt) => {
    if (opt.value === "active") opt.textContent = t("Active Tasks");
    if (opt.value === "completed") opt.textContent = t("Completed Tasks");
  });
  const allPeopleOption = document.querySelector(
    '#assigneeFilterSelector option[value=""]',
  );
  if (allPeopleOption) allPeopleOption.textContent = t("All People");

  const commentLabel = document.getElementById("taskCommentLabel");
  if (commentLabel) commentLabel.textContent = t("Comment");

  if (cancelTaskBtn) cancelTaskBtn.textContent = t("Cancel");
  const saveTaskBtn = document.getElementById("saveTaskBtn");
  if (saveTaskBtn) saveTaskBtn.textContent = t("Save");

  document.querySelectorAll("#taskPriority option").forEach((opt) => {
    if (opt.value === "normal") opt.textContent = t("Normal");
    if (opt.value === "urgent") opt.textContent = t("Urgent");
  });

  const deadlineLabel = document.getElementById("taskDeadlineLabel");
  if (deadlineLabel) deadlineLabel.textContent = t("Deadline date & time");

  const urgencyLabel = document.getElementById("taskDetailsUrgencyLabel");
  if (urgencyLabel) urgencyLabel.textContent = t("Urgency");
  const deadlineDt = document.getElementById("taskDetailsDeadlineLabel");
  if (deadlineDt) deadlineDt.textContent = t("Deadline");
  const commentDt = document.getElementById("taskDetailsCommentLabel");
  if (commentDt) commentDt.textContent = t("Comment");
  const photoDt = document.getElementById("taskDetailsPhotoLabel");
  if (photoDt) photoDt.textContent = t("Photo");

  if (taskDetailsComment)
    taskDetailsComment.placeholder = t("Add a comment...");

  const photoAddLabel = document.querySelector('label[for="taskPhotoInput"]');
  if (photoAddLabel) {
    photoAddLabel.title = t("Add photo");
    photoAddLabel.setAttribute("aria-label", t("Add photo"));
  }
  if (taskPhotoRemoveBtn) {
    taskPhotoRemoveBtn.title = t("Remove photo");
    taskPhotoRemoveBtn.setAttribute("aria-label", t("Remove photo"));
  }
  if (detailRemoveDeadlineBtn) {
    detailRemoveDeadlineBtn.title = t("Remove deadline");
    detailRemoveDeadlineBtn.setAttribute("aria-label", t("Remove deadline"));
  }
  if (detailDeleteBtn) {
    detailDeleteBtn.title = t("Delete task");
    detailDeleteBtn.setAttribute("aria-label", t("Delete task"));
  }
  if (refreshBtn) refreshBtn.title = t("Refresh");
  const logoutBtn = document.querySelector('.logout-btn[href$="logout.php"]');
  if (logoutBtn) logoutBtn.title = t("Logout");

  const langToggleBtn = document.getElementById("langToggleBtn");
  if (langToggleBtn) {
    langToggleBtn.title = lang === "bn" ? "Switch to English" : "বাংলায় পড়ুন";
  }

  renderTasks();
}

document.getElementById("langToggleBtn")?.addEventListener("click", () => {
  setCurrentLang(getCurrentLang() === "bn" ? "en" : "bn");
  applyStaticUI();
});

applyStaticUI();

window.addEventListener("load", () => {
  loadTaskData();
  state.refreshTimer = setInterval(() => {
    loadTaskData();
  }, 20000);
});
