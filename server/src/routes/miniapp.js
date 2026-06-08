const express = require("express");
const miniappService = require("../services/miniapp.service");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function ok(res, data) {
  res.json({ success: true, data });
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

router.post("/auth/login", asyncRoute(async (req, res) => {
  ok(res, await miniappService.login(req.body || {}));
}));

router.get("/question-templates", asyncRoute(async (req, res) => {
  ok(res, await miniappService.listQuestionTemplates());
}));

router.get("/articles", asyncRoute(async (req, res) => {
  ok(res, await miniappService.listArticles());
}));

router.use(authenticate);

router.get("/me", asyncRoute(async (req, res) => {
  ok(res, await miniappService.getMe(req.user.id));
}));

router.put("/me/profile", asyncRoute(async (req, res) => {
  ok(res, await miniappService.updateProfile(req.user.id, req.body || {}));
}));

router.post("/me/avatar", asyncRoute(async (req, res) => {
  ok(res, await miniappService.uploadAvatar(req, req.body || {}));
}));

router.get("/home", asyncRoute(async (req, res) => {
  ok(res, await miniappService.getHome(req.user.id));
}));

router.get("/records", asyncRoute(async (req, res) => {
  ok(res, await miniappService.listRecords(req.user.id));
}));

router.post("/records", asyncRoute(async (req, res) => {
  ok(res, await miniappService.createRecord(req.user.id, req.body));
}));

router.get("/records/:id", asyncRoute(async (req, res) => {
  const record = await miniappService.getRecordById(req.user.id, req.params.id);
  if (!record) return res.status(404).json({ success: false, message: "未找到该记录" });
  ok(res, record);
}));

router.put("/records/:id", asyncRoute(async (req, res) => {
  const record = await miniappService.updateRecord(req.user.id, req.params.id, req.body);
  if (!record) return res.status(404).json({ success: false, message: "未找到该记录" });
  ok(res, record);
}));

router.delete("/records/:id", asyncRoute(async (req, res) => {
  const result = await miniappService.deleteRecord(req.user.id, req.params.id);
  if (!result.deleted) return res.status(404).json({ success: false, message: "未找到该记录" });
  ok(res, result);
}));

router.get("/reminders", asyncRoute(async (req, res) => {
  ok(res, await miniappService.listReminders(req.user.id));
}));

router.get("/reminders/:id", asyncRoute(async (req, res) => {
  const reminder = await miniappService.getReminderById(req.user.id, req.params.id);
  if (!reminder) return res.status(404).json({ success: false, message: "未找到该提醒" });
  ok(res, reminder);
}));

router.post("/reminders", asyncRoute(async (req, res) => {
  ok(res, await miniappService.createReminder(req.user.id, req.body));
}));

router.put("/reminders/:id", asyncRoute(async (req, res) => {
  const reminder = await miniappService.updateReminder(req.user.id, req.params.id, req.body);
  if (!reminder) return res.status(404).json({ success: false, message: "未找到该提醒" });
  ok(res, reminder);
}));

router.patch("/reminders/:id/done", asyncRoute(async (req, res) => {
  const reminder = await miniappService.completeReminder(req.user.id, req.params.id);
  if (!reminder) return res.status(404).json({ success: false, message: "未找到该提醒" });
  ok(res, reminder);
}));

router.delete("/reminders/:id", asyncRoute(async (req, res) => {
  const result = await miniappService.deleteReminder(req.user.id, req.params.id);
  if (!result.deleted) return res.status(404).json({ success: false, message: "未找到该提醒" });
  ok(res, result);
}));

router.get("/questions", asyncRoute(async (req, res) => {
  ok(res, await miniappService.listQuestions(req.user.id));
}));

router.post("/questions/batch", asyncRoute(async (req, res) => {
  ok(res, await miniappService.saveQuestions(req.user.id, req.body.questions));
}));

router.post("/questions", asyncRoute(async (req, res) => {
  ok(res, await miniappService.createQuestion(req.user.id, req.body));
}));

router.put("/questions/:id", asyncRoute(async (req, res) => {
  const question = await miniappService.updateQuestion(req.user.id, req.params.id, req.body);
  if (!question) return res.status(404).json({ success: false, message: "未找到该问题" });
  ok(res, question);
}));

router.delete("/questions/:id", asyncRoute(async (req, res) => {
  const result = await miniappService.deleteQuestion(req.user.id, req.params.id);
  if (!result.deleted) return res.status(404).json({ success: false, message: "未找到该问题" });
  ok(res, result);
}));

router.post("/feedback", asyncRoute(async (req, res) => {
  ok(res, await miniappService.createFeedback(req.user.id, req.body));
}));

module.exports = router;
