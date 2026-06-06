const crypto = require("crypto");
const store = require("../data/demoStore");

const sessions = new Map();
const questions = [];

function createId() {
  return crypto.randomUUID().replace(/-/g, "");
}

async function login(payload = {}) {
  const token = crypto.randomBytes(32).toString("hex");
  const user = {
    id: 1,
    nickname: payload.nickname || "微信用户",
    avatarUrl: payload.avatarUrl || "",
    phone: payload.phone || "",
    gender: ""
  };
  sessions.set(token, {
    token,
    user_id: user.id,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  return { token, user };
}

async function getSessionByToken(token) {
  return sessions.get(token) || null;
}

async function getMe() {
  return {
    id: 1,
    nickname: "微信用户",
    avatarUrl: "",
    phone: "",
    gender: ""
  };
}

async function updateProfile(_userId, payload = {}) {
  return {
    id: 1,
    nickname: payload.nickname || "微信用户",
    avatarUrl: payload.avatarUrl || "",
    phone: "",
    gender: ""
  };
}

async function getHome() {
  return store.home;
}

async function listRecords() {
  return store.records;
}

async function getRecordById(_userId, id) {
  return store.getRecordById(id);
}

async function createRecord(_userId, payload) {
  const record = { id: createId(), ...payload };
  store.records.unshift(record);
  return record;
}

async function updateRecord(_userId, id, payload) {
  const index = store.records.findIndex((item) => item.id === id);
  if (index === -1) return null;
  store.records[index] = { ...store.records[index], ...payload };
  return store.records[index];
}

async function deleteRecord(_userId, id) {
  const index = store.records.findIndex((item) => item.id === id);
  if (index > -1) store.records.splice(index, 1);
  return { deleted: true };
}

async function listReminders() {
  return store.reminders();
}

async function getReminderById(_userId, id) {
  return store.getReminderById(id);
}

async function createReminder(_userId, payload) {
  const reminder = { id: createId(), ...payload };
  return store.createReminder(reminder);
}

async function updateReminder(_userId, id, payload) {
  return store.updateReminder(id, payload);
}

async function completeReminder(_userId, id) {
  return store.completeReminder(id);
}

async function deleteReminder(_userId, id) {
  return store.deleteReminder(id);
}

async function listQuestionTemplates() {
  return store.questionTemplates;
}

async function listQuestions() {
  return questions;
}

async function saveQuestions(_userId, items) {
  const createdQuestions = [];
  items.forEach((questionText) => {
    const question = {
      id: createId(),
      questionText,
      answerText: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    questions.unshift(question);
    createdQuestions.push(question);
  });
  return { questions: createdQuestions };
}

async function createQuestion(_userId, payload) {
  const question = {
    id: createId(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  questions.unshift(question);
  return question;
}

async function updateQuestion(_userId, id, payload) {
  const index = questions.findIndex((item) => item.id === id);
  if (index === -1) return null;
  questions[index] = { ...questions[index], ...payload, updatedAt: new Date().toISOString() };
  return questions[index];
}

async function deleteQuestion(_userId, id) {
  const index = questions.findIndex((item) => item.id === id);
  if (index > -1) questions.splice(index, 1);
  return { deleted: true };
}

async function listArticles() {
  return store.articles;
}

async function createFeedback() {
  return {
    received: true,
    message: "反馈已收到"
  };
}

module.exports = {
  login,
  getSessionByToken,
  getMe,
  updateProfile,
  getHome,
  listRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  listReminders,
  getReminderById,
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
