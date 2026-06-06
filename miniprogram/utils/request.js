const mock = require("./mock-data");
const config = require("../config/app");

const DEFAULT_CACHE_MAX_AGE = 30 * 1000;

const CACHE_KEYS = {
  home: "home",
  records: "records",
  reminders: "reminders",
  questions: "questions",
  questionTemplates: "questionTemplates",
  articles: "articles",
  recordDetail: (id) => `record-detail:${id}`,
  reminderDetail: (id) => `reminder-detail:${id}`
};

let lastLoginRedirectAt = 0;
let runtimeInfoCache = null;
let baseUrlCache = "";

const responseCache = {};
const inflightRequests = {};

function cloneData(data) {
  if (data === undefined) return undefined;
  return JSON.parse(JSON.stringify(data));
}

function getCacheEntry(key) {
  if (!key) return null;
  return responseCache[String(key)] || null;
}

function getCachedData(key) {
  const entry = getCacheEntry(key);
  return entry ? cloneData(entry.data) : undefined;
}

function setCachedData(key, data) {
  if (!key) return;
  responseCache[String(key)] = {
    data: cloneData(data),
    updatedAt: Date.now(),
    dirty: false
  };
}

function clearCachedData(key) {
  if (!key) return;
  delete responseCache[String(key)];
}

function isCacheFresh(key, maxAge = DEFAULT_CACHE_MAX_AGE) {
  const entry = getCacheEntry(key);
  if (!entry || entry.dirty) return false;
  return Date.now() - entry.updatedAt <= maxAge;
}

function markCacheDirty(key) {
  const cacheKey = String(key);
  const entry = getCacheEntry(cacheKey);
  if (entry) {
    entry.dirty = true;
    return;
  }
  responseCache[cacheKey] = {
    data: undefined,
    updatedAt: 0,
    dirty: true
  };
}

function consumeCacheDirty(key) {
  const entry = getCacheEntry(key);
  if (!entry || !entry.dirty) return false;
  entry.dirty = false;
  return true;
}

function removeCachedListItem(key, id) {
  const cached = getCachedData(key);
  if (!cached || !Array.isArray(cached.data)) return;
  setCachedData(key, {
    ...cached,
    data: cached.data.filter((item) => item.id !== id)
  });
}

function upsertCachedListItem(key, item, options = {}) {
  const cached = getCachedData(key);
  if (!cached || !Array.isArray(cached.data) || !item) return;

  const list = cached.data.slice();
  const index = list.findIndex((current) => current.id === item.id);
  if (index > -1) {
    list[index] = item;
  } else if (options.prepend) {
    list.unshift(item);
  } else {
    list.push(item);
  }

  setCachedData(key, {
    ...cached,
    data: list
  });
}

function updateCachedListItem(key, id, updater) {
  const cached = getCachedData(key);
  if (!cached || !Array.isArray(cached.data)) return;

  const list = cached.data.slice();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return;

  const nextItem = typeof updater === "function"
    ? updater(cloneData(list[index]))
    : { ...list[index], ...updater };

  list[index] = nextItem;
  setCachedData(key, {
    ...cached,
    data: list
  });
}

function getMock(path) {
  if (path === "/auth/login") {
    return Promise.resolve({
      data: {
        token: "mock-token",
        user: {
          id: 1,
          nickname: "微信用户",
          avatarUrl: "",
          phone: "",
          gender: ""
        }
      }
    });
  }
  if (path === "/home") return Promise.resolve({ data: mock.home });
  if (path === "/records") return Promise.resolve({ data: mock.records });
  if (path.startsWith("/records/")) {
    const id = path.split("/").pop();
    return Promise.resolve({ data: mock.records.find((item) => item.id === id) || null });
  }
  if (path === "/reminders") return Promise.resolve({ data: mock.reminders });
  if (path.startsWith("/reminders/") && !path.endsWith("/done")) {
    const id = path.split("/")[2];
    return Promise.resolve({ data: mock.reminders.find((item) => item.id === id) || null });
  }
  if (path === "/question-templates") return Promise.resolve({ data: mock.questionTemplates });
  if (path === "/questions") return Promise.resolve({ data: [] });
  if (path === "/articles") return Promise.resolve({ data: mock.articles });
  return Promise.resolve({ data: null });
}

function getToken() {
  return wx.getStorageSync("token") || "";
}

function redirectLogin() {
  wx.removeStorageSync("token");
  wx.removeStorageSync("user");
  clearAllCaches();
  const now = Date.now();
  if (now - lastLoginRedirectAt < 800) return;
  lastLoginRedirectAt = now;
  wx.reLaunch({ url: "/pages/login/index" });
}

function getRuntimeInfo() {
  if (runtimeInfoCache) return runtimeInfoCache;

  try {
    runtimeInfoCache = {
      system: wx.getSystemInfoSync(),
      account: wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
    };
  } catch (_error) {
    runtimeInfoCache = { system: {}, account: null };
  }

  return runtimeInfoCache;
}

function resolveBaseUrl() {
  if (baseUrlCache) return baseUrlCache;

  const app = getApp();
  const runtime = getRuntimeInfo();
  const account = runtime.account || {};
  const miniProgram = account.miniProgram || {};
  const envVersion = miniProgram.envVersion || "develop";

  if (config.productionApiBaseUrl && envVersion !== "develop") {
    baseUrlCache = config.productionApiBaseUrl;
    return baseUrlCache;
  }

  if (runtime.system.platform === "devtools") {
    baseUrlCache = app.globalData.devtoolsApiBaseUrl || config.devtoolsApiBaseUrl || config.apiBaseUrl;
    return baseUrlCache;
  }

  baseUrlCache = app.globalData.deviceApiBaseUrl || config.deviceApiBaseUrl || config.apiBaseUrl;
  return baseUrlCache;
}

function normalizeRequestError(error, baseUrl) {
  const errMsg = error && error.errMsg ? error.errMsg : "";
  if (errMsg.indexOf("url not in domain list") > -1) {
    return new Error("接口域名未加入微信小程序合法域名，请配置 HTTPS 服务器域名。");
  }
  if (errMsg.indexOf("request:fail") > -1) {
    return new Error(`无法连接后端服务，请确认手机与电脑在同一网络，并检查接口地址：${baseUrl}`);
  }
  return error instanceof Error ? error : new Error("网络请求失败，请稍后再试");
}

function getErrorMessage(body, fallback) {
  if (body && body.message) return body.message;
  if (body && body.error) return body.error;
  return fallback;
}

function buildInflightKey(path, options, baseUrl) {
  const method = (options.method || "GET").toUpperCase();
  return `${method}:${baseUrl}${path}:${options.cacheKey || ""}`;
}

function request(path, options = {}) {
  const app = getApp();
  const baseUrl = resolveBaseUrl();
  const method = (options.method || "GET").toUpperCase();
  const isGetRequest = method === "GET";
  const cacheKey = isGetRequest ? options.cacheKey : "";
  const maxAge = options.maxAge || DEFAULT_CACHE_MAX_AGE;

  if (app.globalData.useMock || config.useMock) {
    return getMock(path);
  }

  if (cacheKey && !options.forceRefresh && isCacheFresh(cacheKey, maxAge)) {
    return Promise.resolve(getCachedData(cacheKey));
  }

  const inflightKey = buildInflightKey(path, options, baseUrl);
  if (isGetRequest && inflightRequests[inflightKey]) {
    return inflightRequests[inflightKey];
  }

  const promise = new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${path}`,
      method,
      data: options.data || {},
      timeout: options.timeout || config.requestTimeout || 12000,
      header: {
        "content-type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(options.header || {})
      },
      success: (res) => {
        const body = res.data || {};
        if (res.statusCode === 401) {
          redirectLogin();
          reject(new Error(getErrorMessage(body, "请先登录")));
          return;
        }
        if (res.statusCode >= 400 || body.success === false) {
          reject(new Error(getErrorMessage(body, "请求失败，请稍后再试")));
          return;
        }
        if (cacheKey) {
          setCachedData(cacheKey, body);
        }
        resolve(body);
      },
      fail: (error) => reject(normalizeRequestError(error, baseUrl))
    });
  }).finally(() => {
    delete inflightRequests[inflightKey];
  });

  if (isGetRequest) {
    inflightRequests[inflightKey] = promise;
  }

  return promise;
}

function clearAllCaches() {
  Object.keys(responseCache).forEach((key) => {
    delete responseCache[key];
  });
  Object.keys(inflightRequests).forEach((key) => {
    delete inflightRequests[key];
  });
}

function login(payload) {
  return request("/auth/login", {
    method: "POST",
    data: payload
  });
}

function updateProfile(payload) {
  return request("/me/profile", {
    method: "PUT",
    data: payload
  });
}

function uploadAvatar(payload) {
  return request("/me/avatar", {
    method: "POST",
    data: payload
  });
}

module.exports = {
  CACHE_KEYS,
  request,
  login,
  updateProfile,
  uploadAvatar,
  getToken,
  getCachedData,
  setCachedData,
  clearCachedData,
  isCacheFresh,
  markCacheDirty,
  consumeCacheDirty,
  removeCachedListItem,
  upsertCachedListItem,
  updateCachedListItem,
  clearAllCaches
};
