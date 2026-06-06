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
END $$

CALL upgrade_cervixdetectai_wx_login_crud() $$
DROP PROCEDURE IF EXISTS upgrade_cervixdetectai_wx_login_crud $$

DELIMITER ;
