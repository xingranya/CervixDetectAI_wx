-- ============================================================
-- 002: 增强检查记录与随访管理
-- 执行时间: 2026-06-12
-- 说明: 扩展健康记录字段(机构/医生/结论/附件)和提醒字段(类型/优先级/关联记录/备注)
-- ============================================================

-- wx_health_records 新增字段
ALTER TABLE wx_health_records
  ADD COLUMN hospital VARCHAR(200) DEFAULT '' COMMENT '检查机构' AFTER status,
  ADD COLUMN doctor_name VARCHAR(80) DEFAULT '' COMMENT '主检医生' AFTER hospital,
  ADD COLUMN conclusion TEXT DEFAULT NULL COMMENT '结论摘要' AFTER doctor_name,
  ADD COLUMN attachments JSON DEFAULT NULL COMMENT '报告图片URL列表' AFTER conclusion;

-- wx_reminders 新增字段
ALTER TABLE wx_reminders
  ADD COLUMN type VARCHAR(40) NOT NULL DEFAULT 'follow_up' COMMENT '类型:follow_up/medication/test/custom' AFTER description,
  ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'medium' COMMENT '优先级:high/medium/low' AFTER type,
  ADD COLUMN linked_record_id VARCHAR(32) DEFAULT NULL COMMENT '关联检查记录ID' AFTER priority,
  ADD COLUMN notes TEXT DEFAULT NULL COMMENT '备注' AFTER linked_record_id;

-- 为 linked_record_id 添加索引
ALTER TABLE wx_reminders
  ADD KEY idx_wx_reminders_linked (linked_record_id);
