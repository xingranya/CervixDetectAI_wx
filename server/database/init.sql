CREATE DATABASE IF NOT EXISTS cervixdetectai_wx
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cervixdetectai_wx;

CREATE TABLE IF NOT EXISTS wx_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  openid VARCHAR(128) NULL,
  nickname VARCHAR(80) NOT NULL DEFAULT '微信用户',
  avatar_url VARCHAR(500) NULL,
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
  hospital VARCHAR(200) DEFAULT '' COMMENT '检查机构',
  doctor_name VARCHAR(80) DEFAULT '' COMMENT '主检医生',
  conclusion TEXT DEFAULT NULL COMMENT '结论摘要',
  attachments JSON DEFAULT NULL COMMENT '报告图片URL列表',
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
  type VARCHAR(40) NOT NULL DEFAULT 'follow_up' COMMENT '类型:follow_up/medication/test/custom',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' COMMENT '优先级:high/medium/low',
  linked_record_id VARCHAR(32) DEFAULT NULL COMMENT '关联检查记录ID',
  notes TEXT DEFAULT NULL COMMENT '备注',
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
  feedback_type VARCHAR(40) NOT NULL DEFAULT '其他反馈',
  contact VARCHAR(120) NULL,
  content VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wx_feedback_user_time (user_id, created_at),
  CONSTRAINT fk_wx_feedback_user
    FOREIGN KEY (user_id) REFERENCES wx_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈';

CREATE TABLE IF NOT EXISTS wx_notifications (
  id VARCHAR(32) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'system' COMMENT '类型: system/reminder/record/ai',
  title VARCHAR(120) NOT NULL,
  content TEXT NOT NULL,
  extra JSON DEFAULT NULL COMMENT '扩展数据(跳转路径等)',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_wx_notifications_user_read (user_id, is_read),
  KEY idx_wx_notifications_user_created (user_id, created_at DESC),
  CONSTRAINT fk_wx_notifications_user
    FOREIGN KEY (user_id) REFERENCES wx_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应用内通知';

INSERT INTO wx_users (id, openid, nickname, avatar_url, phone, gender)
VALUES (1, 'demo-openid-001', '张女士', NULL, NULL, 'female')
ON DUPLICATE KEY UPDATE
  nickname = VALUES(nickname),
  avatar_url = VALUES(avatar_url),
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
  ),
  (
    'r20260520',
    1,
    '2026-05-20',
    '年度健康检查摘要',
    '妇科常规检查摘要',
    '已完成年度健康检查摘要记录，后续可结合历史记录观察变化。',
    '建议把本次摘要、既往记录和想确认的问题整理到同一处，便于线下咨询时查看。',
    '已记录'
  ),
  (
    'r20260602',
    1,
    '2026-06-02',
    '复查前资料整理',
    '历史检查资料整理',
    '已整理近期检查日期、项目和摘要，方便复查前快速回顾。',
    '建议复查前再次确认资料是否齐全，并提前列出需要咨询的问题。',
    '待关注'
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
  ('m2', 1, '资料准备', '2026-09-10', '咨询前准备近期检查摘要和想确认的问题。', 0),
  ('m3', 1, '记录整理', '2026-07-05', '把近期检查摘要、复查时间和已保存问题统一整理一遍。', 0),
  ('m4', 1, '线下咨询准备', '2026-07-12', '咨询前确认需要携带的历史记录、检查摘要和个人备忘。', 0)
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
  (4, '如果近期身体不适，我应该如何安排线下咨询？', 40, 1),
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
  ),
  (
    'a3',
    '就诊前可以准备哪些信息',
    '提前整理历史记录、近期变化和想确认的问题，可以提高线下沟通效率。',
    '线下咨询前可准备检查日期、检查项目、历史摘要、正在关注的变化，以及需要向专业人员确认的问题。请避免把本小程序记录当作医疗结论。',
    30,
    1
  ),
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
