<?php
    session_start();

    if (! isset($_SESSION['bgss_user'])) {
    header('Location: index.php');
    exit;
    }

    require __DIR__ . '/php/core/data.php';

    $user               = $_SESSION['bgss_user'];
    $allUsers           = getUsers();
    $allProjects        = getProjects();
    $defaultProjectSlug = 'mineco';
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>BGSS Todo Dashboard</title>
  <link rel="stylesheet" href="assets/css/style.css?v=<?php echo time(); ?>" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
</head>

<body>
  <div id="connectionBanner" class="connection-banner hidden">No internet connection</div>

  <div class="app-shell">
    <header class="topbar">
      <div style="display: flex; align-items: center; gap:10px">
        <a id="createTaskBtn"
          style="background-color: var(--primary-strong); border-radius: 50px; padding: 2px 5px; padding-top: 5px; color: white;"><span
            class="material-symbols-outlined">add</span></a>

        <a id="refreshBtn" title="Refresh"
          style="background-color: var(--success); border-radius: 50px; padding: 2px 5px; padding-top: 5px; color: white;">
          <span class="material-symbols-outlined">refresh</span>
        </a>

        <div style="display: flex; flex-direction: column;">
          <strong style="font-size: 0.8rem"><?php echo htmlspecialchars($user['name']); ?></strong>
          <div id="taskSummary" class="task-summary"></div>
        </div>

        <span id="refreshingIndicator" class="refresh-spinner hidden" title="Refreshing..."></span>
      </div>

      <!-- let logout be a materials icons -->
      <a href="php/api/logout.php" class="logout-btn" title="Logout">
        <span class="material-symbols-outlined">logout</span>
      </a>
    </header>

    <div class="topbar-spacer"></div>

    <div class="task-view-bar" style="flex-direction: column; align-items: stretch; gap: 8px;">
      <div style="display: flex;">
        <?php if ($user['role'] === 'manager'): ?>
          <select id="projectFilterSelector"
            style="min-width: 140px; border: 1px solid var(--border); border-radius: 8px; background: white; padding: 6px 8px; color: var(--text); font-size: 0.75rem; margin-right: 8px;">
            <?php foreach ($allProjects as $project): ?>
              <option value="<?php echo htmlspecialchars($project['id']); ?>" <?php echo $project['slug'] === $defaultProjectSlug ? 'selected' : ''; ?>>
                <?php echo htmlspecialchars($project['name']); ?>
              </option>
            <?php endforeach; ?>
          </select>
        <?php endif; ?>
        <?php if ($user['role'] === 'manager'): ?>
        <select id="taskViewSelector"
          style="min-width: 140px; border: 1px solid var(--border); border-radius: 8px; background: white; padding: 6px 8px; color: var(--text); font-size: 0.75rem;">
          <option value="active">Active Tasks</option>
          <option value="completed">Completed Tasks</option>
        </select>
        <?php endif; ?>
        <?php if ($user['role'] !== 'manager'): ?>
        <select id="personalTaskFilterSelector"
          style="min-width: 140px; border: 1px solid var(--border); border-radius: 8px; background: white; padding: 6px 8px; color: var(--text); font-size: 0.75rem;">
          <option value="assigned" selected>Assigned to me</option>
          <option value="created">Task created by me</option>
        </select>
        <?php endif; ?>
      </div>
      <?php if ($user['role'] === 'manager'): ?>
      <div style="display: flex;">
        <select id="assigneeFilterSelector"
          style="min-width: 140px; border: 1px solid var(--border); border-radius: 8px; background: white; padding: 6px 8px; color: var(--text); font-size: 0.75rem;">
          <option value="">All People</option>
          <?php foreach ($allUsers as $person): ?>
            <option value="<?php echo htmlspecialchars($person['id']); ?>">
              <?php echo htmlspecialchars($person['name']); ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>
      <?php endif; ?>
    </div>

    <main class="main-layout">
      <div id="taskList" class="task-list"></div>
    </main>
  </div>

  <div id="taskModal" class="modal hidden" aria-hidden="true">
    <div class="modal-card">
      <form id="taskForm">
        <div class="form-grid">
          <label class="field full">
            <textarea id="taskDescription" name="description" rows="10" required></textarea>
          </label>

          <label class="field full">
            <span>Comment</span>
            <textarea id="taskComment" name="comment" rows="3"></textarea>
          </label>

          <label class="field full">
            <select id="taskAssignTo" name="assigned_to" required></select>
          </label>

          <label class="field">
            <select id="taskPriority" name="priority">
              <option style="font-size: 13px;" value="normal">Normal</option>
              <option style="font-size: 13px;" value="urgent">Urgent</option>
            </select>
          </label>

          <label class="field">
            <span>Deadline date & time</span>
            <input type="date" id="taskDeadlineDate" name="deadline_date" style="width: 70%;" />
          </label>

          <label class="field">
            <input type="time" id="taskDeadlineTime" name="deadline_time" style="width: 70%;" />
          </label>

        </div>

        <div class="modal-actions">
          <button type="button" class="secondary-btn" id="cancelTaskBtn">Cancel</button>
          <button type="submit" class="primary-btn">Save</button>
        </div>
      </form>
    </div>
  </div>

  <div id="taskDetailsModal" class="modal hidden" aria-hidden="true">
    <section class="modal-card task-details-card" role="dialog" aria-modal="true" aria-labelledby="taskDetailsTitle">
      <div class="task-details-header">
        <div id="taskDetailsTitle" style="font-size: 1rem; font-weight: 600;">Task details</div>
        <button type="button" class="task-details-close" id="closeTaskDetailsBtn"
          aria-label="Close details">&times;</button>
      </div>
      <dl class="task-details-list">
        <dt>Assigned to</dt>
        <dd id="taskDetailsAssignedTo"></dd>
        <dt>Urgency</dt>
        <dd id="taskDetailsPriority"></dd>
        <dt>Created by</dt>
        <dd id="taskDetailsCreatedBy"></dd>
        <dt>Created on</dt>
        <dd id="taskDetailsCreatedOn"></dd>
        <dt>Deadline</dt>
        <dd id="taskDetailsDeadline"></dd>
        <dt>Comment</dt>
        <dd>
          <textarea id="taskDetailsComment" class="task-details-comment-input" rows="4" maxlength="200"
            placeholder="Add a comment..."></textarea>
          <div class="task-details-comment-meta">
            <span id="taskDetailsCommentStatus" aria-live="polite"></span>
            <span id="taskDetailsCommentCount">0/200</span>
          </div>
        </dd>
        <dt>Photo</dt>
        <dd>
          <div id="taskDetailsPhoto" class="task-details-photo hidden">
            <img id="taskDetailsPhotoPreview" alt="Task attachment">
          </div>
          <div class="task-photo-controls">
            <label class="task-details-photo-button" for="taskPhotoInput" title="Add photo" aria-label="Add photo">
              <span class="material-symbols-outlined">photo_camera</span>
            </label>
            <input id="taskPhotoInput" class="visually-hidden-file-input" type="file" accept="image/*"
              capture="environment">
            <button type="button" id="taskPhotoRemoveBtn" class="task-details-photo-button danger hidden"
              aria-label="Remove photo" title="Remove photo">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
          <div id="taskPhotoStatus" class="task-details-comment-meta" aria-live="polite"></div>
        </dd>
      </dl>
      <div class="task-details-actions">
        <button type="button" class="task-details-icon danger" id="detailRemoveDeadlineBtn" title="Remove deadline"
          aria-label="Remove deadline"><span class="material-symbols-outlined">event_busy</span></button>
        <button type="button" class="task-details-icon" id="detailCompleteBtn" title="Mark as done"
          aria-label="Mark task as done"><span class="material-symbols-outlined">check</span></button>
        <button type="button" class="task-details-icon danger" id="detailDeleteBtn" title="Delete task"
          aria-label="Delete task"><span class="material-symbols-outlined">delete</span></button>
      </div>
    </section>
  </div>

  <script>
  const currentUser = <?php echo json_encode($user, JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  const users = <?php echo json_encode($allUsers, JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  const projects = <?php echo json_encode($allProjects, JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  </script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js"></script>
  <script src="js/firebase-config.js?v=<?php echo time(); ?>"></script>
  <script src="js/app.js?v=<?php echo time(); ?>"></script>
</body>

</html>