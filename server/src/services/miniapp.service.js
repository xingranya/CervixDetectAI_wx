const mysqlRepository = require("../repositories/miniapp.repository");
const avatarStorage = require("./avatar-storage.service");
const wechatSubscribe = require("./wechat-subscribe.service");
const env = require("../config/env");

const repository = mysqlRepository;
const REPORT_TEMPLATE_ID = "eZJlyXlekmNOsM1mLn8bcn29P2k-WAXo0XunYj96uSk";
const REMINDER_TEMPLATE_ID = "Mpn-CisfT0yxvsrkrzSfHbZQY7Vr2rwWesquRE-dgn8";

const PROHIBITED_SERVICE_TERMS = [
  "AI诊断",
  "辅助诊断",
  "在线诊断",
  "在线问诊",
  "诊疗建议",
  "治疗方案",
  "处方代开",
  "疾病预测",
  "病变识别",
  "挂号缴费"
];

const FEEDBACK_TYPES = ["功能建议", "使用问题", "隐私与数据", "其他反馈"];

function cleanText(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanTemplateText(value, maxLength) {
  return cleanText(value, maxLength).replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function compactMessageText(value, fallback, maxLength) {
  const text = cleanTemplateText(value || fallback, maxLength);
  return text || fallback;
}

function normalizeTemplatePhrase(value) {
  const text = cleanTemplateText(value, 5);
  if (/^[\u4e00-\u9fa5]{1,5}$/.test(text)) {
    return text;
  }
  return "已完成";
}

function normalizeTemplateDate(value) {
  const text = cleanTemplateText(value, 20);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return `${text} 09:00`;
  }
  return text || new Date().toISOString().slice(0, 16).replace("T", " ");
}

function normalizeTemplateTime(value) {
  const text = cleanTemplateText(value, 20);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return `${text} 09:00`;
  }
  return text || new Date().toISOString().slice(0, 16).replace("T", " ");
}

function buildReportMessageData(record) {
  return {
    thing22: { value: compactMessageText(record.summary, "检查记录已更新", 20) },
    phrase4: { value: normalizeTemplatePhrase(record.status) },
    date2: { value: normalizeTemplateDate(record.date) },
    thing1: { value: compactMessageText(record.project, "健康测评", 20) },
    thing18: { value: compactMessageText(record.title, "检查报告", 20) }
  };
}

function buildReminderMessageData(user, reminder) {
  return {
    thing13: { value: compactMessageText(user?.nickname, "微信用户", 20) },
    thing3: { value: "线下医疗机构" },
    thing14: { value: "专业人员" },
    thing6: { value: compactMessageText(reminder.title, "复查提醒", 20) },
    time19: { value: normalizeTemplateTime(reminder.date) }
  };
}

function normalizePersistentAvatarUrl(value) {
  const avatarUrl = cleanText(value, 500);
  return /^https?:\/\//i.test(avatarUrl) ? avatarUrl : null;
}

function assertComplianceText(text, fieldName) {
  const value = String(text || "");
  const matchedTerm = PROHIBITED_SERVICE_TERMS.find((term) => value.indexOf(term) > -1);
  if (!matchedTerm) return;

  const error = new Error(`${fieldName}包含“${matchedTerm}”等本小程序不提供的服务内容，请改为健康记录或线下咨询准备描述`);
  error.status = 400;
  throw error;
}

function requireText(value, fieldName, maxLength = 500) {
  const text = cleanText(value, maxLength);
  if (!text) {
    const error = new Error(`${fieldName}不能为空`);
    error.status = 400;
    throw error;
  }
  assertComplianceText(text, fieldName);
  return text;
}

function requireDate(value, fieldName) {
  const text = requireText(value, fieldName, 20);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const error = new Error(`${fieldName}格式不正确`);
    error.status = 400;
    throw error;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isValid = date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;

  if (!isValid) {
    const error = new Error(`${fieldName}格式不正确`);
    error.status = 400;
    throw error;
  }
  return text;
}

function normalizeDone(value) {
  return value === true || value === 1 || value === "1" || value === "true";
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
    date: requireDate(payload.date, "检查日期"),
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
    date: requireDate(payload.date, "提醒日期"),
    desc: requireText(payload.desc || payload.description, "提醒内容", 500),
    done: normalizeDone(payload.done)
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
  assertComplianceText(nickname, "昵称");
  const avatarUrl = normalizePersistentAvatarUrl(payload.avatarUrl);
  const phone = cleanText(payload.phone, 32) || null;
  return repository.login({ code, deviceId, openid, nickname, avatarUrl, phone });
}

async function getSessionByToken(token) {
  return repository.getSessionByToken(token);
}

async function getMe(userId) {
  return repository.getMe(userId);
}

async function updateProfile(userId, payload = {}) {
  assertComplianceText(payload.nickname, "昵称");
  return repository.updateProfile(userId, {
    nickname: cleanText(payload.nickname || "微信用户", 80),
    avatarUrl: normalizePersistentAvatarUrl(payload.avatarUrl)
  });
}

async function uploadAvatar(req, payload = {}) {
  const user = await getMe(req.user.id);
  const avatarUrl = await avatarStorage.saveAvatar(req, payload);
  return repository.updateProfile(req.user.id, {
    nickname: user?.nickname || "微信用户",
    avatarUrl
  });
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

async function sendRecordReportSubscription(userId, id) {
  const recordId = cleanText(id, 64);
  const record = await getRecordById(userId, recordId);
  if (!record) return null;

  const openid = await repository.getUserOpenid(userId);
  if (!openid) {
    const error = new Error("未找到微信用户标识，请重新登录后再试");
    error.status = 400;
    throw error;
  }

  await wechatSubscribe.sendSubscribeMessage({
    template_id: env.wechat.reportTemplateId || REPORT_TEMPLATE_ID,
    page: `packages/records/record-detail/index?id=${encodeURIComponent(record.id)}`,
    touser: openid,
    data: buildReportMessageData(record),
    miniprogram_state: env.wechat.miniProgramState || "formal",
    lang: "zh_CN"
  });

  return {
    sent: true,
    message: "报告查看提醒已发送"
  };
}

async function listReminders(userId) {
  return repository.listReminders(userId);
}

async function getReminderById(userId, id) {
  return repository.getReminderById(userId, cleanText(id, 64));
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

async function sendReminderSubscription(userId, id) {
  const reminderId = cleanText(id, 64);
  const reminder = await getReminderById(userId, reminderId);
  if (!reminder) return null;

  const openid = await repository.getUserOpenid(userId);
  if (!openid) {
    const error = new Error("未找到微信用户标识，请重新登录后再试");
    error.status = 400;
    throw error;
  }

  const user = await getMe(userId);
  await wechatSubscribe.sendSubscribeMessage({
    template_id: env.wechat.reminderTemplateId || REMINDER_TEMPLATE_ID,
    page: "pages/reminders/index",
    touser: openid,
    data: buildReminderMessageData(user, reminder),
    miniprogram_state: env.wechat.miniProgramState || "formal",
    lang: "zh_CN"
  });

  return {
    sent: true,
    message: "复查提醒已发送"
  };
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
  const type = cleanText(payload?.type, 40);
  const content = requireText(payload?.content, "反馈内容", 1000);
  assertComplianceText(payload?.contact, "联系方式");
  assertComplianceText(type, "反馈类型");
  return repository.createFeedback(userId, {
    type: FEEDBACK_TYPES.indexOf(type) > -1 ? type : "其他反馈",
    contact: cleanText(payload?.contact, 120),
    content
  });
}

module.exports = {
  login,
  getSessionByToken,
  getMe,
  updateProfile,
  uploadAvatar,
  getHome,
  listRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  sendRecordReportSubscription,
  listReminders,
  getReminderById,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
  sendReminderSubscription,
  listQuestionTemplates,
  listQuestions,
  saveQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  listArticles,
  createFeedback
};
