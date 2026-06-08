function normalizeText(value) {
  return String(value || "").trim();
}

function isRemoteAvatarUrl(value) {
  return /^https?:\/\//i.test(normalizeText(value));
}

function isLocalAvatarPath(value) {
  const path = normalizeText(value);
  return /^wxfile:\/\//i.test(path)
    || /^file:\/\//i.test(path)
    || /^http:\/\/tmp\//i.test(path)
    || /^https:\/\/tmp\//i.test(path)
    || /^\/tmp\//i.test(path)
    || (!!wx.env && !!wx.env.USER_DATA_PATH && path.indexOf(wx.env.USER_DATA_PATH) === 0);
}

function normalizeRemoteAvatarUrl(value) {
  const url = normalizeText(value);
  return isRemoteAvatarUrl(url) ? url : "";
}

function normalizeLocalAvatarPath(value) {
  const path = normalizeText(value);
  return isLocalAvatarPath(path) ? path : "";
}

function normalizeStoredUser(user) {
  const source = user || {};
  return {
    ...source,
    nickname: normalizeText(source.nickname) || "微信用户",
    avatarUrl: normalizeRemoteAvatarUrl(source.avatarUrl),
    avatarLocalPath: normalizeLocalAvatarPath(source.avatarLocalPath)
  };
}

function readFileBase64(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: "base64",
      success: (res) => resolve(res.data || ""),
      fail: () => reject(new Error("头像读取失败，请重新选择"))
    });
  });
}

function persistAvatarFile(filePath) {
  const localPath = normalizeLocalAvatarPath(filePath);
  if (!localPath) {
    return Promise.resolve("");
  }

  return new Promise((resolve) => {
    wx.getFileSystemManager().saveFile({
      tempFilePath: localPath,
      success: (res) => resolve(normalizeLocalAvatarPath(res.savedFilePath) || localPath),
      fail: () => resolve(localPath)
    });
  });
}

function resolveAvatarFileType(filePath) {
  const lowerPath = normalizeText(filePath).toLowerCase();
  if (lowerPath.endsWith(".png")) return "image/png";
  if (lowerPath.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

module.exports = {
  isRemoteAvatarUrl,
  normalizeRemoteAvatarUrl,
  normalizeLocalAvatarPath,
  normalizeStoredUser,
  readFileBase64,
  persistAvatarFile,
  resolveAvatarFileType
};
