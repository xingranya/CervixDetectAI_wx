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

  return { buffer, extension };
}

async function saveAvatar(req, payload) {
  const { buffer, extension } = decodeAvatar(payload);
  await fs.mkdir(AVATAR_DIR, { recursive: true });

  const fileName = `${req.user.id}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${extension}`;
  const filePath = path.join(AVATAR_DIR, fileName);
  await fs.writeFile(filePath, buffer);

  return `${resolvePublicBaseUrl(req)}/uploads/avatars/${fileName}`;
}

module.exports = {
  saveAvatar
};
