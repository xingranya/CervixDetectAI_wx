-- ============================================================
-- 003: 新增通知中心
-- 执行时间: 2026-06-12
-- 说明: 创建应用内通知表，支持已读/未读状态
-- ============================================================

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
