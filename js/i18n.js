// Static UI translations (English -> Bangla). Dynamic user content (task
// descriptions) is translated on the fly via translateDynamicText().
const UI_DICTIONARY = {
  "Assigned to me": "আমাকে বরাদ্দকৃত",
  "Task created by me": "আমার তৈরি করা কাজ",
  "Active Tasks": "চলমান কাজ",
  "Completed Tasks": "সম্পন্ন কাজ",
  "All People": "সকল ব্যক্তি",
  Comment: "মন্তব্য",
  Cancel: "বাতিল",
  Save: "সংরক্ষণ",
  Normal: "সাধারণ",
  Urgent: "জরুরি",
  "Deadline date & time": "সময়সীমার তারিখ ও সময়",
  "Task details": "কাজের বিবরণ",
  "Assigned to": "যাকে দেওয়া হয়েছে",
  Urgency: "গুরুত্ব",
  "Created by": "তৈরি করেছেন",
  "Created on": "তৈরির তারিখ",
  "Completed on": "সম্পন্নের তারিখ",
  Deadline: "সময়সীমা",
  Photo: "ছবি",
  "Add a comment...": "মন্তব্য যোগ করুন...",
  "Add photo": "ছবি যোগ করুন",
  "Remove photo": "ছবি সরান",
  "Remove deadline": "সময়সীমা সরান",
  "Mark as done": "সম্পন্ন হিসেবে চিহ্নিত করুন",
  "Revert to active": "চলমান অবস্থায় ফিরিয়ে দিন",
  "Delete task": "কাজ মুছুন",
  Refresh: "রিফ্রেশ",
  Logout: "লগআউট",
  "No deadline": "কোনো সময়সীমা নেই",
  Unknown: "অজানা",
  Unassigned: "অনির্ধারিত",
  "Select person": "ব্যক্তি নির্বাচন করুন",
  "Click to add task...": "কাজ যোগ করতে ক্লিক করুন...",
  "Entry by": "যিনি তৈরি করেছেন",
  task: "কাজ",
  tasks: "কাজ",
  urgent: "জরুরি",
  urgents: "জরুরি",
  "Change priority": "গুরুত্ব পরিবর্তন করুন",
  "Choose deadline": "সময়সীমা নির্বাচন করুন",
  "Open task details": "কাজের বিবরণ দেখুন",
  "Assign task": "কাজ বরাদ্দ করুন",
  "Task priority": "কাজের গুরুত্ব",
  "Normal priority": "সাধারণ গুরুত্ব",
  "No internet connection": "ইন্টারনেট সংযোগ নেই",
  "No internet connection. Please reconnect and try again.":
    "ইন্টারনেট সংযোগ নেই। অনুগ্রহ করে পুনরায় সংযুক্ত হয়ে আবার চেষ্টা করুন।",
  "Slow connection… still refreshing": "ধীর সংযোগ… এখনও রিফ্রেশ হচ্ছে",
  "Slow connection… still working": "ধীর সংযোগ… এখনও কাজ চলছে",
  "Unable to reach the server": "সার্ভারে পৌঁছানো যাচ্ছে না",
  "Unable to reach the server. Please check your connection.":
    "সার্ভারে পৌঁছানো যাচ্ছে না। অনুগ্রহ করে সংযোগ পরীক্ষা করুন।",
  "Action failed": "কাজটি ব্যর্থ হয়েছে",
  "Please provide a description.": "অনুগ্রহ করে একটি বিবরণ দিন।",
  "Remove this photo?": "এই ছবিটি সরাবেন?",
  "Remove this task's deadline?": "এই কাজের সময়সীমা সরাবেন?",
  "Delete this task? This action cannot be undone.":
    "এই কাজটি মুছবেন? এই পদক্ষেপ পূর্বাবস্থায় ফেরানো যাবে না।",
  "Move this task back to active tasks?":
    "এই কাজটি আবার চলমান তালিকায় ফিরিয়ে নেবেন?",
  "Mark this task as completed? It will be removed from the task list.":
    "এই কাজটি সম্পন্ন হিসেবে চিহ্নিত করবেন? এটি তালিকা থেকে সরিয়ে ফেলা হবে।",
  "Saving...": "সংরক্ষণ হচ্ছে...",
  "Saved ✓": "সংরক্ষিত ✓",
  "Could not save": "সংরক্ষণ করা যায়নি",
  "Compressing...": "সংকুচিত হচ্ছে...",
  "Uploading...": "আপলোড হচ্ছে...",
  "Could not upload photo": "ছবি আপলোড করা যায়নি",
  "Add Firebase config first": "প্রথমে Firebase কনফিগারেশন যোগ করুন",
  "Removing...": "সরানো হচ্ছে...",
  "Removed ✓": "সরানো হয়েছে ✓",
  "Could not remove photo": "ছবি সরানো যায়নি",
};

const LANG_STORAGE_KEY = "bgss_lang";

function getCurrentLang() {
  return localStorage.getItem(LANG_STORAGE_KEY) === "bn" ? "bn" : "en";
}

function setCurrentLang(lang) {
  localStorage.setItem(LANG_STORAGE_KEY, lang === "bn" ? "bn" : "en");
}

// Looks up a static UI string in the current language, falling back to English.
function t(text) {
  if (getCurrentLang() === "bn" && UI_DICTIONARY[text])
    return UI_DICTIONARY[text];
  return text;
}

const dynamicTranslationCache = new Map();

// Translates free-form user text (e.g. task descriptions) via Google's public
// translate endpoint. Falls back to the original text if the request fails.
async function translateDynamicText(text) {
  if (!text || getCurrentLang() !== "bn") return text;

  const cacheKey = `bn:${text}`;
  if (dynamicTranslationCache.has(cacheKey)) {
    return dynamicTranslationCache.get(cacheKey);
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Translation request failed");
    const data = await response.json();
    const translated = (data[0] || []).map((chunk) => chunk[0]).join("");
    const result = translated || text;
    dynamicTranslationCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Translation failed:", error);
    return text;
  }
}

const BANGLA_SCRIPT_REGEX = /[\u0980-\u09FF]/;

function containsBanglaScript(text) {
  return BANGLA_SCRIPT_REGEX.test(text || "");
}

// The DB must only ever store English. If the user typed with a Bangla
// keyboard (e.g. mobile), translate it back to English before saving.
async function ensureEnglishText(text) {
  if (!text || !containsBanglaScript(text)) return text;

  const cacheKey = `en:${text}`;
  if (dynamicTranslationCache.has(cacheKey)) {
    return dynamicTranslationCache.get(cacheKey);
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=bn&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Reverse translation request failed");
    const data = await response.json();
    const translated = (data[0] || []).map((chunk) => chunk[0]).join("");
    const result = translated || text;
    dynamicTranslationCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Reverse translation failed:", error);
    return text;
  }
}
