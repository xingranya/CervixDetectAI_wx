const config = require("../config/app");

function getReminderTemplateIds() {
  const ids = config.subscriptionTemplateIds && config.subscriptionTemplateIds.reminder;
  if (Array.isArray(ids)) {
    return ids.filter(Boolean);
  }
  return ids ? [ids] : [];
}

function hasReminderSubscriptionTemplate() {
  return getReminderTemplateIds().length > 0;
}

function requestReminderSubscription() {
  const tmplIds = getReminderTemplateIds();
  if (!tmplIds.length || !wx.requestSubscribeMessage) {
    return Promise.resolve({
      accepted: false,
      available: false,
      message: "服务通知模板配置后，可在这里开启微信提醒。"
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
          message: accepted ? "已开启微信服务通知" : "未开启微信服务通知，提醒仍会保存在小程序内。"
        });
      },
      fail: () => reject(new Error("服务通知授权失败，请稍后重试"))
    });
  });
}

module.exports = {
  hasReminderSubscriptionTemplate,
  requestReminderSubscription
};
