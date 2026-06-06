const mock = require("./mock-data");

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

function request(path, options = {}) {
  const app = getApp();
  const baseUrl = app.globalData.apiBaseUrl;

  if (!baseUrl || baseUrl.includes("localhost")) {
    return getMock(path);
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${path}`,
      method: options.method || "GET",
      data: options.data || {},
      header: {
        "content-type": "application/json",
        ...(options.header || {})
      },
      success: (res) => resolve(res.data),
      fail: reject
    });
  });
}

module.exports = {
  request
};

