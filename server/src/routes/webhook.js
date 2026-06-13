const express = require("express");
const miniappService = require("../services/miniapp.service");

const router = express.Router();

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
}

/* ---- Webhook 预留 ---- */

/**
 * POST /webhook/notification
 * 预留外部系统推送通知接口
 * 需要验证 secret 参数
 */
router.post("/notification", asyncRoute(async (req, res) => {
  const { secret, userId, type, title, content, extra } = req.body || {};
  const env = require("../config/env");

  // 验证 webhook secret
  const webhookSecret = env.webhook?.secret;
  if (!webhookSecret || secret !== webhookSecret) {
    return res.status(403).json({ success: false, message: "Invalid webhook secret" });
  }

  if (!userId || !title || !content) {
    return res.status(400).json({ success: false, message: "Missing required fields: userId, title, content" });
  }

  const notification = await miniappService.createNotification(userId, {
    type: type || "system",
    title,
    content,
    extra: extra || null
  });

  res.json({ success: true, data: notification });
}));

module.exports = router;
