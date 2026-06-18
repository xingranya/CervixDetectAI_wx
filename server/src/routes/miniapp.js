const express = require("express");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const miniappService = require("../services/miniapp.service");
const aiAssistant = require("../services/ai-assistant.service");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: { success: false, message: "登录尝试过于频繁，请15分钟后再试" }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ? String(req.user.id) : ipKeyGenerator(req.ip),
  message: { success: false, message: "AI助手请求过于频繁，请稍后再试" }
});

function ok(res, data) {
  res.json({ success: true, data });
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

router.post("/auth/login", loginLimiter, asyncRoute(async (req, res) => {
  ok(res, await miniappService.login(req.body || {}));
}));

router.get("/question-templates", asyncRoute(async (req, res) => {
  ok(res, await miniappService.listQuestionTemplates());
}));

router.get("/articles", asyncRoute(async (req, res) => {
  ok(res, await miniappService.listArticles());
}));

router.use(authenticate);

router.delete("/me/session", asyncRoute(async (req, res) => {
  ok(res, await miniappService.logout(req.user.token));
}));

router.delete("/me/account", asyncRoute(async (req, res) => {
  ok(res, await miniappService.deleteAccount(req.user.id));
}));

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
  ok(res, await miniappService.listRecords(req.user.id, {
    status: req.query.status,
    page: req.query.page,
    pageSize: req.query.pageSize
  }));
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

router.post("/records/:id/report-subscription", asyncRoute(async (req, res) => {
  const result = await miniappService.sendRecordReportSubscription(req.user.id, req.params.id);
  if (!result) return res.status(404).json({ success: false, message: "未找到该记录" });
  ok(res, result);
}));

router.get("/reminders", asyncRoute(async (req, res) => {
  ok(res, await miniappService.listReminders(req.user.id, {
    type: req.query.type,
    page: req.query.page,
    pageSize: req.query.pageSize
  }));
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

router.post("/reminders/:id/subscription", asyncRoute(async (req, res) => {
  const result = await miniappService.sendReminderSubscription(req.user.id, req.params.id);
  if (!result) return res.status(404).json({ success: false, message: "未找到该提醒" });
  ok(res, result);
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

/* ---- AI 健康助手 ---- */
router.post("/assistant/chat", aiLimiter, asyncRoute(async (req, res) => {
  const stream = req.body?.stream === true;
  if (stream) {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    await aiAssistant.chatStream(req.user.id, req.body?.messages || [], res);
  } else {
    const result = await aiAssistant.chat(req.user.id, req.body?.messages || []);
    ok(res, result);
  }
}));

router.post("/assistant/explain", aiLimiter, asyncRoute(async (req, res) => {
  const term = String(req.body?.term || "").trim();
  if (!term) return res.status(400).json({ success: false, message: "请输入需要解释的术语" });
  const result = await aiAssistant.explainTerm(term);
  ok(res, result);
}));

/* ---- 通知中心 ---- */
router.get("/notifications", asyncRoute(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;
  const notifications = await miniappService.listNotifications(req.user.id, { limit, offset });
  ok(res, notifications);
}));

router.get("/notifications/unread-count", asyncRoute(async (req, res) => {
  const count = await miniappService.getUnreadCount(req.user.id);
  ok(res, { count });
}));

router.patch("/notifications/:id/read", asyncRoute(async (req, res) => {
  const result = await miniappService.markNotificationRead(req.user.id, req.params.id);
  ok(res, result);
}));

router.patch("/notifications/read-all", asyncRoute(async (req, res) => {
  const result = await miniappService.markAllNotificationsRead(req.user.id);
  ok(res, result);
}));

module.exports = router;
