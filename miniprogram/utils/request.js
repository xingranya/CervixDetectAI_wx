const mock = require("./mock-data");
const config = require("../config/app");

let isRedirectingLogin = false;

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
    return Promise.resolve({ data: mock.records.find((item) => item.id === id) || mock.records[0] });
  }
  if (path === "/reminders") return Promise.resolve({ data: mock.reminders });
  if (path === "/question-templates") return Promise.resolve({ data: mock.questionTemplates });
  if (path === "/articles") return Promise.resolve({ data: mock.articles });
  return Promise.resolve({ data: null });
}

function getToken() {
  return wx.getStorageSync("token") || "";
}

function redirectLogin() {
  wx.removeStorageSync("token");
  wx.removeStorageSync("user");
  if (isRedirectingLogin) return;
  isRedirectingLogin = true;
  wx.reLaunch({ url: "/pages/login/index" });
  setTimeout(() => {
    isRedirectingLogin = false;
  }, 800);
}

function getRuntimeInfo() {
  try {
    return {
      system: wx.getSystemInfoSync(),
      account: wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
    };
  } catch (_error) {
    return { system: {}, account: null };
  }
}

function resolveBaseUrl() {
  const app = getApp();
  const runtime = getRuntimeInfo();
  const account = runtime.account || {};
  const miniProgram = account.miniProgram || {};
  const envVersion = miniProgram.envVersion || "develop";

  if (config.productionApiBaseUrl && envVersion !== "develop") {
    return config.productionApiBaseUrl;
  }

  if (runtime.system.platform === "devtools") {
    return app.globalData.devtoolsApiBaseUrl || config.devtoolsApiBaseUrl || config.apiBaseUrl;
  }

  return app.globalData.deviceApiBaseUrl || config.deviceApiBaseUrl || config.apiBaseUrl;
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

function request(path, options = {}) {
  const app = getApp();
  const baseUrl = resolveBaseUrl();

  if (app.globalData.useMock || config.useMock) {
    return getMock(path);
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${path}`,
      method: options.method || "GET",
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
        resolve(body);
      },
      fail: (error) => reject(normalizeRequestError(error, baseUrl))
    });
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

module.exports = {
  request,
  login,
  updateProfile,
  getToken
};
