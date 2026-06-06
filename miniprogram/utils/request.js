const mock = require("./mock-data");
const config = require("../config/app");

function getMock(path) {
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
  wx.navigateTo({ url: "/pages/login/index" });
}

function request(path, options = {}) {
  const app = getApp();
  const baseUrl = app.globalData.apiBaseUrl || config.apiBaseUrl;

  if (app.globalData.useMock || config.useMock) {
    return getMock(path);
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${path}`,
      method: options.method || "GET",
      data: options.data || {},
      header: {
        "content-type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(options.header || {})
      },
      success: (res) => {
        const body = res.data || {};
        if (res.statusCode === 401) {
          redirectLogin();
          reject(new Error(body.message || "请先登录"));
          return;
        }
        if (res.statusCode >= 400 || body.success === false) {
          reject(new Error(body.message || "请求失败，请稍后再试"));
          return;
        }
        resolve(body);
      },
      fail: reject
    });
  });
}

function login(payload) {
  return request("/auth/login", {
    method: "POST",
    data: payload
  });
}

module.exports = {
  request,
  login,
  getToken
};
