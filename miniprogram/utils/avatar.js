function normalizeText(value) {
  return String(value || "").trim();
}

function isRemoteAvatarUrl(value) {
  return /^https?:\/\//i.test(normalizeText(value));
}

function isLocalAvatarPath(value, options) {
  const path = normalizeText(value);
  const allowDevToolsTemp = options && options.allowDevToolsTemp;
  const baseMatch = /^wxfile:\/\//i.test(path)
    || /^file:\/\//i.test(path)
    || /^http:\/\/tmp\//i.test(path)
    || /^https:\/\/tmp\//i.test(path)
    || /^\/tmp\//i.test(path)
    || (!!wx.env && !!wx.env.USER_DATA_PATH && path.indexOf(wx.env.USER_DATA_PATH) === 0);
  if (baseMatch) return true;
  // 开发者工具的 http://127.0.0.1:PORT/__tmp__/ 临时 URL 是渲染层内部服务器提供的，
  // 仅逻辑层持久化阶段可临时接受；作为存储态或显示态的 src 时，其生命周期不可靠
  // 且渲染层服务器可能返回 500，因此默认应被过滤掉。
  if (allowDevToolsTemp && /^http:\/\/(127\.0\.0\.1|localhost):\d+\/__tmp__\//i.test(path)) return true;
  return false;
}

function normalizeRemoteAvatarUrl(value) {
  const url = normalizeText(value);
  if (/^http:\/\/xcx\.hpvsc\.icu(?::443)?\//i.test(url)) {
    return url.replace(/^http:\/\/xcx\.hpvsc\.icu(?::443)?\//i, "https://xcx.hpvsc.icu/");
  }
  return isRemoteAvatarUrl(url) ? url : "";
}

function normalizeLocalAvatarPath(value, options) {
  const path = normalizeText(value);
  return isLocalAvatarPath(path, options) ? path : "";
}

function isDevToolsTempUrl(value) {
  return /^http:\/\/(127\.0\.0\.1|localhost):\d+\/__tmp__\//i.test(normalizeText(value));
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

/**
 * 从 URL 中提取文件扩展名，用于生成持久化文件路径。
 */
function extractExtFromUrl(url) {
  const lower = normalizeText(url).toLowerCase();
  if (/\.png/i.test(lower)) return ".png";
  if (/\.webp/i.test(lower)) return ".webp";
  return ".jpg";
}

/**
 * 将开发者工具返回的 http://127.0.0.1:PORT/__tmp__/xxx 临时 URL 持久化到本地。
 * 
 * 策略优先级：
 * 1. readFile + writeFile：直接通过文件系统读取临时文件再写入永久路径
 * 2. downloadFile + saveFile：通过 HTTP 下载到临时文件再保存
 * 3. getImageInfo 获取本地缓存路径再 saveFile
 * 
 * 开发者工具的 __tmp__ URL 是渲染层内部服务器提供的，逻辑层 API（如 saveFile、
 * downloadFile）通常无法直接访问。readFile 在部分环境下可以读取这些临时文件。
 */
function persistDevToolsTempFile(url) {
  return new Promise((resolve) => {
    const ext = extractExtFromUrl(url);
    const permanentPath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}${ext}`;

    // 策略1: readFile 直接读取 → writeFile 写入永久路径
    wx.getFileSystemManager().readFile({
      filePath: url,
      success: (readRes) => {
        if (!readRes.data) {
          tryDownloadStrategy(url, ext, resolve);
          return;
        }
        wx.getFileSystemManager().writeFile({
          filePath: permanentPath,
          data: readRes.data,
          success: () => resolve(normalizeLocalAvatarPath(permanentPath) || permanentPath),
          fail: () => tryDownloadStrategy(url, ext, resolve)
        });
      },
      fail: () => tryDownloadStrategy(url, ext, resolve)
    });
  });
}

function tryDownloadStrategy(url, ext, resolve) {
  // 策略2: downloadFile → saveFile
  wx.downloadFile({
    url,
    success: (downloadRes) => {
      if (downloadRes.statusCode !== 200) {
        tryImageInfoStrategy(url, ext, resolve);
        return;
      }
      const tempPath = downloadRes.tempFilePath;
      wx.getFileSystemManager().saveFile({
        tempFilePath: tempPath,
        success: (saveRes) => resolve(normalizeLocalAvatarPath(saveRes.savedFilePath) || tempPath),
        fail: () => resolve(normalizeLocalAvatarPath(tempPath) || "")
      });
    },
    fail: () => tryImageInfoStrategy(url, ext, resolve)
  });
}

function tryImageInfoStrategy(url, ext, resolve) {
  // 策略3: getImageInfo 获取本地缓存路径 → saveFile
  wx.getImageInfo({
    src: url,
    success: (infoRes) => {
      const localSrc = infoRes.path || "";
      if (!localSrc) {
        resolve("");
        return;
      }
      wx.getFileSystemManager().saveFile({
        tempFilePath: localSrc,
        success: (saveRes) => resolve(normalizeLocalAvatarPath(saveRes.savedFilePath) || localSrc),
        fail: () => resolve(normalizeLocalAvatarPath(localSrc) || "")
      });
    },
    fail: () => resolve("")
  });
}

function persistAvatarFile(filePath) {
  // 持久化入口允许 __tmp__ 临时 URL 进入，因为这是它唯一被消费的地方：
  // 内部会 readFile + writeFile 落到 USER_DATA_PATH。
  const inputPath = normalizeText(filePath);
  if (!inputPath) return Promise.resolve("");

  const isTemp = isDevToolsTempUrl(inputPath);
  const localPath = isTemp ? inputPath : normalizeLocalAvatarPath(inputPath);
  if (!localPath && !isTemp) {
    return Promise.resolve("");
  }

  const effectivePath = localPath || inputPath;

  // 开发者工具返回 http://127.0.0.1:PORT/__tmp__/xxx 之类的临时 URL，
  // 需要通过 readFile+writeFile 或 downloadFile+saveFile 持久化。
  if (isDevToolsTempUrl(effectivePath)) {
    return persistDevToolsTempFile(effectivePath);
  }

  return new Promise((resolve) => {
    wx.getFileSystemManager().saveFile({
      tempFilePath: effectivePath,
      success: (res) => resolve(normalizeLocalAvatarPath(res.savedFilePath) || effectivePath),
      fail: () => resolve(effectivePath)
    });
  });
}

function resolveAvatarFileType(filePath, base64Data) {
  // 优先从 base64 数据的文件头魔术字节检测真实类型，避免扩展名与内容不一致导致服务端校验失败。
  if (base64Data) {
    try {
      const buffer = wx.base64ToArrayBuffer(base64Data);
      const header = new Uint8Array(buffer);
      if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
        return "image/jpeg";
      }
      if (header.length >= 8 && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
        return "image/png";
      }
      if (header.length >= 12) {
        const riff = String.fromCharCode(header[0], header[1], header[2], header[3]);
        const webp = String.fromCharCode(header[8], header[9], header[10], header[11]);
        if (riff === "RIFF" && webp === "WEBP") {
          return "image/webp";
        }
      }
    } catch (_e) {
      // 检测失败时回退到扩展名判断
    }
  }

  const lowerPath = normalizeText(filePath).toLowerCase();
  if (lowerPath.endsWith(".png")) return "image/png";
  if (lowerPath.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

module.exports = {
  isRemoteAvatarUrl,
  isDevToolsTempUrl,
  normalizeRemoteAvatarUrl,
  normalizeLocalAvatarPath,
  normalizeStoredUser,
  readFileBase64,
  persistAvatarFile,
  resolveAvatarFileType
};
