CREATE DATABASE IF NOT EXISTS cervixdetectai_wx
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cervixdetectai_wx;

CREATE TABLE IF NOT EXISTS wx_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  openid VARCHAR(128) NULL,
  nickname VARCHAR(80) NOT NULL DEFAULT '微信用户',
  phone VARCHAR(32) NULL,
  gender VARCHAR(16) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_wx_users_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序用户表';

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

CREATE TABLE IF NOT EXISTS wx_health_records (
  id VARCHAR(32) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  record_date DATE NOT NULL,
  title VARCHAR(120) NOT NULL,
  project VARCHAR(120) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  suggestion VARCHAR(500) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT '已记录',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wx_health_records_user_date (user_id, record_date),
  CONSTRAINT fk_wx_health_records_user
    FOREIGN KEY (user_id) REFERENCES wx_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='健康检查摘要记录';

CREATE TABLE IF NOT EXISTS wx_reminders (
  id VARCHAR(32) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  remind_date DATE NOT NULL,
  description VARCHAR(500) NOT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wx_reminders_user_done_date (user_id, done, remind_date),
  CONSTRAINT fk_wx_reminders_user
    FOREIGN KEY (user_id) REFERENCES wx_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='复查提醒';

CREATE TABLE IF NOT EXISTS wx_question_templates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  content VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wx_question_templates_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='就诊前问题模板';

CREATE TABLE IF NOT EXISTS wx_user_questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  question_text VARCHAR(255) NOT NULL,
  answer_text TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wx_user_questions_user_time (user_id, updated_at, created_at),
  CONSTRAINT fk_wx_user_questions_user
    FOREIGN KEY (user_id) REFERENCES wx_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户整理的问题清单';

CREATE TABLE IF NOT EXISTS wx_articles (
  id VARCHAR(32) NOT NULL,
  title VARCHAR(120) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  content TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wx_articles_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='健康管理知识';

CREATE TABLE IF NOT EXISTS wx_feedback (
  id CHAR(36) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  contact VARCHAR(120) NULL,
  content VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wx_feedback_user_time (user_id, created_at),
  CONSTRAINT fk_wx_feedback_user
    FOREIGN KEY (user_id) REFERENCES wx_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈';

INSERT INTO wx_users (id, openid, nickname, phone, gender)
VALUES (1, 'demo-openid-001', '张女士', NULL, 'female')
ON DUPLICATE KEY UPDATE
  nickname = VALUES(nickname),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO wx_health_records (id, user_id, record_date, title, project, summary, suggestion, status)
VALUES
  (
    'r20260318',
    1,
    '2026-03-18',
    '女性健康筛查记录',
    'TCT / HPV 摘要记录',
    '本次记录提示需要持续关注后续复查安排。',
    '建议按原记录中的时间管理复查安排。',
    '待复查'
  ),
  (
    'r20260115',
    1,
    '2026-01-15',
    '健康检查记录',
    'HPV 摘要记录',
    '已记录检查摘要，便于后续咨询时查看。',
    '建议保留历史记录，后续咨询时一并出示。',
    '已记录'
  )
ON DUPLICATE KEY UPDATE
  record_date = VALUES(record_date),
  title = VALUES(title),
  project = VALUES(project),
  summary = VALUES(summary),
  suggestion = VALUES(suggestion),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO wx_reminders (id, user_id, title, remind_date, description, done)
VALUES
  ('m1', 1, '复查提醒', '2026-09-18', '建议在计划时间前完成复查安排。', 0),
  ('m2', 1, '资料准备', '2026-09-10', '咨询前准备近期检查摘要和想确认的问题。', 0)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  remind_date = VALUES(remind_date),
  description = VALUES(description),
  done = VALUES(done),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO wx_question_templates (id, content, sort_order, is_active)
VALUES
  (1, '这次检查摘要里，我需要重点留意哪些信息？', 10, 1),
  (2, '复查前需要准备哪些资料？', 20, 1),
  (3, '历史记录需要一起带去吗？', 30, 1),
  (4, '如果近期身体不适，我应该如何安排线下咨询？', 40, 1)
ON DUPLICATE KEY UPDATE
  content = VALUES(content),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO wx_articles (id, title, summary, content, sort_order, is_active)
VALUES
  (
    'a1',
    '如何整理一次健康检查记录',
    '把日期、项目、摘要、提醒和问题清单放在一起，复查时更容易沟通。',
    '建议每次完成健康检查后，及时记录日期、项目、摘要、提醒时间和想进一步确认的问题。',
    10,
    1
  ),
  (
    'a2',
    '复查提醒为什么重要',
    '固定提醒可以减少遗忘，帮助自己按计划完成健康管理。',
    '复查提醒可以帮助用户把后续安排放进日常计划，避免因为时间间隔较长而遗漏。',
    20,
    1
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  content = VALUES(content),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;
