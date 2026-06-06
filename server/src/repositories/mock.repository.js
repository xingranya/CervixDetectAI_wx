const store = require("../data/demoStore");

async function getHome() {
  return store.home;
}

async function listRecords() {
  return store.records;
}

async function getRecordById(id) {
  return store.getRecordById(id);
}

async function listReminders() {
  return store.reminders();
}

async function completeReminder(id) {
  return store.completeReminder(id);
}

async function listQuestionTemplates() {
  return store.questionTemplates;
}

async function saveQuestions(questions) {
  return { questions };
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
  getHome,
  listRecords,
  getRecordById,
  listReminders,
  completeReminder,
  listQuestionTemplates,
  saveQuestions,
  listArticles,
  createFeedback
};

