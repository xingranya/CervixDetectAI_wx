const config = require("../../../config/app");

function getReportTemplateIds() {
  const id = config.subscriptionTemplateIds && config.subscriptionTemplateIds.report;
  return id ? [id] : [];
}

function hasReportSubscriptionTemplate() {
  return getReportTemplateIds().length > 0;
}

function requestReportSubscription() {
  const tmplIds = getReportTemplateIds();
  if (!tmplIds.length || !wx.requestSubscribeMessage) {
    return Promise.resolve({
      accepted: false,
      available: false,
      message: "报告提醒模板配置后，可在这里开启微信提醒。"
    });
  }

  return new Promise((resolve, reject) => {
    wx.requestSubscribeMessage({
      tmplIds,
      success: (res) => {
        const accepted = tmplIds.some((id) => res[id] === "accept");
        resolve({
          accepted,
          available: true,
          message: accepted ? "已开启报告查看提醒" : "未开启报告查看提醒"
        });
      },
      fail: () => reject(new Error("报告提醒授权失败，请稍后重试"))
    });
  });
}

module.exports = {
  hasReportSubscriptionTemplate,
  requestReportSubscription
};
