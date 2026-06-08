const crypto = require("crypto");
const db = require("../config/database");
const env = require("../config/env");

const SESSION_DAYS = 30;

function createCompactId() {
  return crypto.randomUUID().replace(/-/g, "");
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function createStatusError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizePersistentAvatarUrl(value) {
  const avatarUrl = String(value || "").trim();
  return /^https?:\/\//i.test(avatarUrl) ? avatarUrl : "";
}

function mapUser(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    avatarUrl: normalizePersistentAvatarUrl(row.avatar_url),
    phone: row.phone || "",
    gender: row.gender || ""
  };
}

function mapRecord(row) {
  return {
    id: row.id,
    date: row.record_date,
    title: row.title,
    project: row.project,
    summary: row.summary,
    suggestion: row.suggestion,
    status: row.status
  };
}

function mapReminder(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.remind_date,
    desc: row.description,
    done: Boolean(row.done)
  };
}

function mapQuestion(row) {
  return {
    id: String(row.id),
    questionText: row.question_text,
    answerText: row.answer_text || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function requestWechatSession(code) {
  if (!code) {
    throw createStatusError("未获取到微信登录凭证，请重新点击登录", 400);
  }

  if (!env.wechat.appId || !env.wechat.appSecret) {
    throw createStatusError("服务端未完成微信登录配置，请补充 AppID 和 AppSecret", 500);
  }

  const params = new URLSearchParams({
    appid: env.wechat.appId,
    secret: env.wechat.appSecret,
    js_code: code,
    grant_type: "authorization_code"
  });

  try {
    const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${params.toString()}`);
    if (!response.ok) {
      throw createStatusError("微信登录服务暂时不可用，请稍后重试", 502);
    }

    const data = await response.json();
    if (data.openid) {
      return {
        openid: data.openid,
        sessionKey: data.session_key || "",
        unionId: data.unionid || ""
      };
    }

    if (data.errcode === 40029 || data.errcode === 40163) {
      throw createStatusError("微信登录凭证已失效，请重新点击登录", 401);
    }

    if (data.errcode === 40125) {
      throw createStatusError("服务端微信登录密钥无效，请检查 AppSecret 配置", 500);
    }

    throw createStatusError("微信登录失败，请稍后重试", 502);
  } catch (error) {
    if (error && error.status) throw error;
    throw createStatusError("连接微信登录服务失败，请稍后重试", 502);
  }
}

async function findUserById(userId) {
  const [row] = await db.query(
    "SELECT id, nickname, avatar_url, phone, gender FROM wx_users WHERE id = ? LIMIT 1",
    [userId]
  );
  return row || null;
}

async function login(payload = {}) {
  const wxSession = await requestWechatSession(payload.code);
  const openid = wxSession.openid;
  const nickname = payload.nickname || "微信用户";
  const avatarUrl = payload.avatarUrl || null;
  const phone = payload.phone || null;

  await db.query(
    `
      INSERT INTO wx_users (openid, nickname, avatar_url, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        nickname = VALUES(nickname),
        avatar_url = COALESCE(VALUES(avatar_url), avatar_url),
        phone = COALESCE(VALUES(phone), phone),
        updated_at = CURRENT_TIMESTAMP
    `,
    [openid, nickname, avatarUrl, phone]
  );

  const [user] = await db.query(
    "SELECT id, nickname, avatar_url, phone, gender FROM wx_users WHERE openid = ? LIMIT 1",
    [openid]
  );

  const token = createToken();
  await db.query(
    `
      INSERT INTO wx_sessions (token, user_id, expires_at, created_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), NOW())
    `,
    [token, user.id, SESSION_DAYS]
  );

  return {
    token,
    user: mapUser(user)
  };
}

async function getSessionByToken(token) {
  const [row] = await db.query(
    `
      SELECT token, user_id, expires_at
      FROM wx_sessions
      WHERE token = ? AND expires_at > NOW()
      LIMIT 1
    `,
    [token]
  );
  return row || null;
}

async function getMe(userId) {
  const user = await findUserById(userId);
  return user ? mapUser(user) : null;
}

async function updateProfile(userId, payload = {}) {
  await db.query(
    `
      UPDATE wx_users
      SET nickname = ?, avatar_url = COALESCE(?, avatar_url), updated_at = NOW()
      WHERE id = ?
    `,
    [payload.nickname || "微信用户", payload.avatarUrl || null, userId]
  );
  return getMe(userId);
}

async function getHome(userId) {
  const [user] = await db.query(
    "SELECT nickname FROM wx_users WHERE id = ? LIMIT 1",
    [userId]
  );

  const [latestRecord] = await db.query(
    `
      SELECT
        id,
        DATE_FORMAT(record_date, '%Y-%m-%d') AS record_date,
        title,
        project,
        summary,
        suggestion,
        status
      FROM wx_health_records
      WHERE user_id = ?
      ORDER BY record_date DESC, created_at DESC
      LIMIT 1
    `,
    [userId]
  );

  const [nextReminder] = await db.query(
    `
      SELECT DATE_FORMAT(remind_date, '%Y-%m-%d') AS remind_date
      FROM wx_reminders
      WHERE user_id = ? AND done = 0
      ORDER BY remind_date ASC
      LIMIT 1
    `,
    [userId]
  );

  const [recordCount] = await db.query(
    "SELECT COUNT(*) AS total FROM wx_health_records WHERE user_id = ?",
    [userId]
  );
  const [pendingCount] = await db.query(
    "SELECT COUNT(*) AS total FROM wx_reminders WHERE user_id = ? AND done = 0",
    [userId]
  );

  const latest = latestRecord ? mapRecord(latestRecord) : null;
  const nextReminderText = nextReminder
    ? `${nextReminder.remind_date} 前完成复查提醒`
    : "暂无待处理提醒";

  return {
    userName: user?.nickname || "微信用户",
    latestTitle: latest?.title || "最近一次健康检查摘要",
    latestDate: latest?.date || "",
    latestSummary: latest?.summary || "暂无检查摘要，可先添加健康记录。",
    nextReminder: nextReminderText,
    disclaimer: "本小程序仅用于健康信息记录与提醒，具体健康问题请前往线下正规机构咨询。",
    metrics: [
      { label: "已记录", value: `${recordCount.total || 0} 次` },
      { label: "待关注", value: `${pendingCount.total || 0} 项` },
      { label: "下次提醒", value: nextReminder?.remind_date ? nextReminder.remind_date.slice(5) : "暂无" }
    ]
  };
}

async function listRecords(userId) {
  const rows = await db.query(
    `
      SELECT
        id,
        DATE_FORMAT(record_date, '%Y-%m-%d') AS record_date,
        title,
        project,
        summary,
        suggestion,
        status
      FROM wx_health_records
      WHERE user_id = ?
      ORDER BY record_date DESC, created_at DESC
    `,
    [userId]
  );
  return rows.map(mapRecord);
}

async function getRecordById(userId, id) {
  const [row] = await db.query(
    `
      SELECT
        id,
        DATE_FORMAT(record_date, '%Y-%m-%d') AS record_date,
        title,
        project,
        summary,
        suggestion,
        status
      FROM wx_health_records
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
    [id, userId]
  );
  return row ? mapRecord(row) : null;
}

async function createRecord(userId, payload) {
  const id = createCompactId();
  await db.query(
    `
      INSERT INTO wx_health_records
        (id, user_id, record_date, title, project, summary, suggestion, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [id, userId, payload.date, payload.title, payload.project, payload.summary, payload.suggestion, payload.status]
  );
  return getRecordById(userId, id);
}

async function updateRecord(userId, id, payload) {
  await db.query(
    `
      UPDATE wx_health_records
      SET record_date = ?, title = ?, project = ?, summary = ?, suggestion = ?, status = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `,
    [payload.date, payload.title, payload.project, payload.summary, payload.suggestion, payload.status, id, userId]
  );
  return getRecordById(userId, id);
}

async function deleteRecord(userId, id) {
  const result = await db.query(
    "DELETE FROM wx_health_records WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return { deleted: result.affectedRows > 0 };
}

async function listReminders(userId) {
  const rows = await db.query(
    `
      SELECT id, title, DATE_FORMAT(remind_date, '%Y-%m-%d') AS remind_date, description, done
      FROM wx_reminders
      WHERE user_id = ?
      ORDER BY done ASC, remind_date ASC, created_at DESC
    `,
    [userId]
  );
  return rows.map(mapReminder);
}

async function getReminderById(userId, id) {
  const [row] = await db.query(
    `
      SELECT id, title, DATE_FORMAT(remind_date, '%Y-%m-%d') AS remind_date, description, done
      FROM wx_reminders
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
    [id, userId]
  );
  return row ? mapReminder(row) : null;
}

async function createReminder(userId, payload) {
  const id = createCompactId();
  await db.query(
    `
      INSERT INTO wx_reminders
        (id, user_id, title, remind_date, description, done, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, IF(? = 1, NOW(), NULL), NOW(), NOW())
    `,
    [id, userId, payload.title, payload.date, payload.desc, payload.done ? 1 : 0, payload.done ? 1 : 0]
  );
  return getReminderById(userId, id);
}

async function updateReminder(userId, id, payload) {
  await db.query(
    `
      UPDATE wx_reminders
      SET title = ?,
          remind_date = ?,
          description = ?,
          done = ?,
          completed_at = IF(? = 1, COALESCE(completed_at, NOW()), NULL),
          updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `,
    [payload.title, payload.date, payload.desc, payload.done ? 1 : 0, payload.done ? 1 : 0, id, userId]
  );
  return getReminderById(userId, id);
}

async function completeReminder(userId, id) {
  await db.query(
    "UPDATE wx_reminders SET done = 1, completed_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return getReminderById(userId, id);
}

async function deleteReminder(userId, id) {
  const result = await db.query(
    "DELETE FROM wx_reminders WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return { deleted: result.affectedRows > 0 };
}

async function listQuestionTemplates() {
  const rows = await db.query(
    `
      SELECT content
      FROM wx_question_templates
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `
  );
  return rows.map((row) => row.content);
}

async function listQuestions(userId) {
  const rows = await db.query(
    `
      SELECT
        id,
        question_text,
        answer_text,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM wx_user_questions
      WHERE user_id = ?
      ORDER BY updated_at DESC, created_at DESC
    `,
    [userId]
  );
  return rows.map(mapQuestion);
}

async function saveQuestions(userId, questions) {
  if (!questions.length) {
    return { questions: [] };
  }
  const createdQuestions = [];
  for (const questionText of questions) {
    createdQuestions.push(await createQuestion(userId, {
      questionText,
      answerText: ""
    }));
  }
  return { questions: createdQuestions };
}

async function getQuestionById(userId, id) {
  const [row] = await db.query(
    `
      SELECT
        id,
        question_text,
        answer_text,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM wx_user_questions
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
    [id, userId]
  );
  return row ? mapQuestion(row) : null;
}

async function createQuestion(userId, payload) {
  const result = await db.query(
    `
      INSERT INTO wx_user_questions (user_id, question_text, answer_text, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `,
    [userId, payload.questionText, payload.answerText]
  );
  return getQuestionById(userId, result.insertId);
}

async function updateQuestion(userId, id, payload) {
  await db.query(
    `
      UPDATE wx_user_questions
      SET question_text = ?, answer_text = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `,
    [payload.questionText, payload.answerText, id, userId]
  );
  return getQuestionById(userId, id);
}

async function deleteQuestion(userId, id) {
  const result = await db.query(
    "DELETE FROM wx_user_questions WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return { deleted: result.affectedRows > 0 };
}

async function listArticles() {
  const rows = await db.query(
    `
      SELECT id, title, summary, content
      FROM wx_articles
      WHERE is_active = 1
      ORDER BY sort_order ASC, created_at DESC
    `
  );
  return rows;
}

async function createFeedback(userId, payload = {}) {
  const id = crypto.randomUUID();
  await db.query(
    `
      INSERT INTO wx_feedback (id, user_id, feedback_type, contact, content, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `,
    [
      id,
      userId,
      payload.type ? String(payload.type).trim().slice(0, 40) : "其他反馈",
      payload.contact ? String(payload.contact).trim().slice(0, 120) : null,
      payload.content ? String(payload.content).trim().slice(0, 1000) : ""
    ]
  );

  return {
    received: true,
    message: "反馈已收到",
    id
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
