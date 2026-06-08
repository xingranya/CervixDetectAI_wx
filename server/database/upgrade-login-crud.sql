USE cervixdetectai_wx;

CREATE TABLE IF NOT EXISTS wx_sessions (
  token CHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token),
  KEY idx_wx_sessions_user_expires (user_id, expires_at),
  CONSTRAINT fk_wx_sessions_user
    FOREIGN KEY (user_id) REFERENCES wx_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序登录会话';

DELIMITER $$

DROP PROCEDURE IF EXISTS upgrade_cervixdetectai_wx_login_crud $$
CREATE PROCEDURE upgrade_cervixdetectai_wx_login_crud()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wx_users'
      AND COLUMN_NAME = 'avatar_url'
  ) THEN
    ALTER TABLE wx_users
      ADD COLUMN avatar_url VARCHAR(500) NULL AFTER nickname;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wx_user_questions'
      AND COLUMN_NAME = 'answer_text'
  ) THEN
    ALTER TABLE wx_user_questions
      ADD COLUMN answer_text TEXT NULL AFTER question_text;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wx_user_questions'
      AND COLUMN_NAME = 'updated_at'
  ) THEN
    ALTER TABLE wx_user_questions
      ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wx_user_questions'
      AND INDEX_NAME = 'idx_wx_user_questions_user_updated'
      AND COLUMN_NAME = 'updated_at'
  ) THEN
    ALTER TABLE wx_user_questions
      ADD INDEX idx_wx_user_questions_user_updated (user_id, updated_at, created_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wx_feedback'
      AND COLUMN_NAME = 'feedback_type'
  ) THEN
    ALTER TABLE wx_feedback
      ADD COLUMN feedback_type VARCHAR(40) NOT NULL DEFAULT '其他反馈' AFTER user_id;
  END IF;
END $$

CALL upgrade_cervixdetectai_wx_login_crud() $$
DROP PROCEDURE IF EXISTS upgrade_cervixdetectai_wx_login_crud $$

DELIMITER ;

INSERT INTO wx_health_records (id, user_id, record_date, title, project, summary, suggestion, status)
SELECT 'r20260520', 1, '2026-05-20', '年度健康检查摘要', '妇科常规检查摘要', '已完成年度健康检查摘要记录，后续可结合历史记录观察变化。', '建议把本次摘要、既往记录和想确认的问题整理到同一处，便于线下咨询时查看。', '已记录'
WHERE EXISTS (SELECT 1 FROM wx_users WHERE id = 1)
ON DUPLICATE KEY UPDATE
  record_date = VALUES(record_date),
  title = VALUES(title),
  project = VALUES(project),
  summary = VALUES(summary),
  suggestion = VALUES(suggestion),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO wx_health_records (id, user_id, record_date, title, project, summary, suggestion, status)
SELECT 'r20260602', 1, '2026-06-02', '复查前资料整理', '历史检查资料整理', '已整理近期检查日期、项目和摘要，方便复查前快速回顾。', '建议复查前再次确认资料是否齐全，并提前列出需要咨询的问题。', '待关注'
WHERE EXISTS (SELECT 1 FROM wx_users WHERE id = 1)
ON DUPLICATE KEY UPDATE
  record_date = VALUES(record_date),
  title = VALUES(title),
  project = VALUES(project),
  summary = VALUES(summary),
  suggestion = VALUES(suggestion),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO wx_reminders (id, user_id, title, remind_date, description, done)
SELECT 'm3', 1, '记录整理', '2026-07-05', '把近期检查摘要、复查时间和已保存问题统一整理一遍。', 0
WHERE EXISTS (SELECT 1 FROM wx_users WHERE id = 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  remind_date = VALUES(remind_date),
  description = VALUES(description),
  done = VALUES(done),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO wx_reminders (id, user_id, title, remind_date, description, done)
SELECT 'm4', 1, '线下咨询准备', '2026-07-12', '咨询前确认需要携带的历史记录、检查摘要和个人备忘。', 0
WHERE EXISTS (SELECT 1 FROM wx_users WHERE id = 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  remind_date = VALUES(remind_date),
  description = VALUES(description),
  done = VALUES(done),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO wx_question_templates (id, content, sort_order, is_active)
VALUES
  (5, '下次复查时间建议如何安排和记录？', 50, 1),
  (6, '哪些生活习惯和近期变化需要一并说明？', 60, 1),
  (7, '这次记录中有哪些内容需要后续持续关注？', 70, 1)
ON DUPLICATE KEY UPDATE
  content = VALUES(content),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO wx_articles (id, title, summary, content, sort_order, is_active)
VALUES
  (
    'a4',
    '如何把复查安排放进日常计划',
    '把复查日期、资料准备和想确认的问题拆成几个小提醒，更容易按时完成。',
    '可以先记录计划日期，再提前一到两周设置资料准备提醒。复查前把近期检查摘要、历史记录和问题清单集中整理，线下沟通时更清楚。',
    40,
    1
  ),
  (
    'a5',
    '填写健康记录时注意什么',
    '记录事实摘要、时间和个人提醒，避免把不确定内容写成结论。',
    '建议按“日期、检查项目、摘要、后续安排”填写。遇到不确定的内容，可以写成待确认问题，在线下咨询时再向专业人员确认。',
    50,
    1
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  content = VALUES(content),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;
