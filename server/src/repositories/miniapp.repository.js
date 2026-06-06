const crypto = require("crypto");
const db = require("../config/database");
const env = require("../config/env");

const userId = env.demoUserId;

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

async function getHome() {
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
    userName: "张女士",
    latestTitle: latest?.title || "最近一次健康检查摘要",
    latestDate: latest?.date || "",
    latestSummary: latest?.summary || "暂无检查摘要，可先添加健康记录。",
    nextReminder: nextReminderText,
    disclaimer: "本小程序仅用于健康信息记录与提醒，具体健康问题请前往线下正规机构咨询。",
    metrics: [
      { label: "已记录", value: `${recordCount.total || 0} 次` },
      { label: "待关注", value: `${pendingCount.total || 0} 项` },
      { label: "下次提醒", value: nextReminder?.remind_date ? nextReminder.remind_date.slice(5) : "暂无" }
    ],
    steps: [
      { title: "核对摘要", desc: "确认日期、项目和记录内容是否准确。" },
      { title: "设置提醒", desc: "把复查计划放进提醒列表，减少遗忘。" },
      { title: "整理问题", desc: "线下咨询前先列出想确认的重点。" }
    ]
  };
}

async function listRecords() {
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

async function getRecordById(id) {
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

async function listReminders() {
  const rows = await db.query(
    `
      SELECT id, title, DATE_FORMAT(remind_date, '%Y-%m-%d') AS remind_date, description, done
      FROM wx_reminders
      WHERE user_id = ?
      ORDER BY done ASC, remind_date ASC
    `,
    [userId]
  );
  return rows.map(mapReminder);
}

async function completeReminder(id) {
  await db.query(
    "UPDATE wx_reminders SET done = 1, completed_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?",
    [id, userId]
  );

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

async function saveQuestions(questions) {
  const cleanQuestions = questions
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 20);

  if (!cleanQuestions.length) {
    return { questions: [] };
  }

  const values = cleanQuestions.map((question) => [
    userId,
    question,
    new Date()
  ]);

  await db.getPool().query(
    "INSERT INTO wx_user_questions (user_id, question_text, created_at) VALUES ?",
    [values]
  );

  return { questions: cleanQuestions };
}

async function listArticles() {
  const rows = await db.query(
    `
      SELECT id, title, summary
      FROM wx_articles
      WHERE is_active = 1
      ORDER BY sort_order ASC, created_at DESC
    `
  );
  return rows;
}

async function createFeedback(payload = {}) {
  const id = crypto.randomUUID();
  await db.query(
    `
      INSERT INTO wx_feedback (id, user_id, contact, content, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `,
    [
      id,
      userId,
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

