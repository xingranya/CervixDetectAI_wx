const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const env = require("../config/env");

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_DIR = path.join(__dirname, "..", "..", "uploads", "avatars");
const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function detectImageType(buffer) {
  if (
    buffer.length >= 3
    && buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
    && buffer[4] === 0x0d
    && buffer[5] === 0x0a
    && buffer[6] === 0x1a
    && buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12
    && buffer.toString("ascii", 0, 4) === "RIFF"
    && buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return "";
}

function createStatusError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function resolvePublicBaseUrl(req) {
  if (env.publicBaseUrl) {
    return env.publicBaseUrl.replace(/\/$/, "");
  }
  return `${req.protocol}://${req.get("host")}`;
}

function decodeAvatar(payload = {}) {
  const fileType = String(payload.fileType || "").toLowerCase();
  const extension = MIME_EXTENSIONS[fileType];
  if (!extension) {
    throw createStatusError("头像格式仅支持 JPG、PNG 或 WebP");
  }

  const avatarBase64 = String(payload.avatarBase64 || "").trim();
  if (!avatarBase64) {
    throw createStatusError("请先选择微信头像");
  }

  const buffer = Buffer.from(avatarBase64, "base64");
  if (!buffer.length) {
    throw createStatusError("头像文件为空，请重新选择");
  }

  if (buffer.length > AVATAR_MAX_BYTES) {
    throw createStatusError("头像不能超过 2MB");
  }

  if (detectImageType(buffer) !== fileType) {
    throw createStatusError("头像文件内容与格式不一致，请重新选择");
  }

  return { buffer, extension };
}

async function saveAvatar(req, payload) {
  const { buffer, extension } = decodeAvatar(payload);
  await fs.mkdir(AVATAR_DIR, { recursive: true });

  const fileName = `${req.user.id}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${extension}`;
  const filePath = path.join(AVATAR_DIR, fileName);
  await fs.writeFile(filePath, buffer);

  const newUrl = `${resolvePublicBaseUrl(req)}/uploads/avatars/${fileName}`;

  // 异步删除旧头像文件，不阻塞当前请求
  const oldAvatarUrl = payload.oldAvatarUrl;
  if (oldAvatarUrl) {
    setImmediate(() => removeOldAvatar(oldAvatarUrl));
  }

  return newUrl;
}

async function removeOldAvatar(avatarUrl) {
  try {
    if (!avatarUrl || typeof avatarUrl !== "string") return;
    const match = avatarUrl.match(/\/uploads\/avatars\/([^/?#]+)/);
    if (!match) return;
    const oldPath = path.join(AVATAR_DIR, match[1]);
    await fs.unlink(oldPath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("[Avatar] Failed to remove old avatar:", err.message);
    }
  }
}

module.exports = {
  saveAvatar,
  removeOldAvatar
};
