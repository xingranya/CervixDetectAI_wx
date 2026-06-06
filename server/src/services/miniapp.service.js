const env = require("../config/env");
const mysqlRepository = require("../repositories/miniapp.repository");
const mockRepository = require("../repositories/mock.repository");

const repository = env.dataSource === "mock" ? mockRepository : mysqlRepository;

function cleanText(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function requireText(value, fieldName, maxLength = 500) {
  const text = cleanText(value, maxLength);
  if (!text) {
    const error = new Error(`${fieldName}不能为空`);
    error.status = 400;
    throw error;
  }
  return text;
}

function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeRecordPayload(payload = {}) {
  return {
    date: requireText(payload.date, "检查日期", 20),
    title: requireText(payload.title, "记录标题", 120),
    project: requireText(payload.project, "检查项目", 120),
    summary: requireText(payload.summary, "摘要", 500),
    suggestion: requireText(payload.suggestion, "提醒建议", 500),
    status: cleanText(payload.status || "已记录", 40)
  };
}

function normalizeReminderPayload(payload = {}) {
  return {
    title: requireText(payload.title, "提醒标题", 120),
    date: requireText(payload.date, "提醒日期", 20),
    desc: requireText(payload.desc || payload.description, "提醒内容", 500),
    done: Boolean(payload.done)
  };
}

function normalizeQuestionPayload(payload = {}) {
  return {
    questionText: requireText(payload.questionText || payload.question, "问题内容", 255),
    answerText: cleanText(payload.answerText || payload.answer, 1000)
  };
}

async function login(payload) {
  const code = cleanText(payload.code, 128);
  const deviceId = cleanText(payload.deviceId, 128);
  const openid = cleanText(payload.openid, 128);
  const nickname = cleanText(payload.nickname || "微信用户", 80);
  const phone = cleanText(payload.phone, 32) || null;
  return repository.login({ code, deviceId, openid, nickname, phone });
}

async function getMe(userId) {
  return repository.getMe(userId);
}

async function getHome(userId) {
  return repository.getHome(userId);
}

async function listRecords(userId) {
  return repository.listRecords(userId);
}

async function getRecordById(userId, id) {
  return repository.getRecordById(userId, cleanText(id, 64));
}

async function createRecord(userId, payload) {
  return repository.createRecord(userId, normalizeRecordPayload(payload));
}

async function updateRecord(userId, id, payload) {
  return repository.updateRecord(userId, cleanText(id, 64), normalizeRecordPayload(payload));
}

async function deleteRecord(userId, id) {
  return repository.deleteRecord(userId, cleanText(id, 64));
}

async function listReminders(userId) {
  return repository.listReminders(userId);
}

async function createReminder(userId, payload) {
  return repository.createReminder(userId, normalizeReminderPayload(payload));
}

async function updateReminder(userId, id, payload) {
  return repository.updateReminder(userId, cleanText(id, 64), normalizeReminderPayload(payload));
}

async function completeReminder(userId, id) {
  return repository.completeReminder(userId, cleanText(id, 64));
}

async function deleteReminder(userId, id) {
  return repository.deleteReminder(userId, cleanText(id, 64));
}

async function listQuestionTemplates() {
  return repository.listQuestionTemplates();
}

async function listQuestions(userId) {
  return repository.listQuestions(userId);
}

async function saveQuestions(userId, questions) {
  return repository.saveQuestions(userId, normalizeQuestions(questions));
}

async function createQuestion(userId, payload) {
  return repository.createQuestion(userId, normalizeQuestionPayload(payload));
}

async function updateQuestion(userId, id, payload) {
  return repository.updateQuestion(userId, cleanText(id, 64), normalizeQuestionPayload(payload));
}

async function deleteQuestion(userId, id) {
  return repository.deleteQuestion(userId, cleanText(id, 64));
}

async function listArticles() {
  return repository.listArticles();
}

async function createFeedback(userId, payload) {
  return repository.createFeedback(userId, payload || {});
}

module.exports = {
  login,
  getMe,
  getHome,
  listRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  listReminders,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
  listQuestionTemplates,
  listQuestions,
  saveQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  listArticles,
  createFeedback
};
