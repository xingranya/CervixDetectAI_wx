const config = require("./config/app");

function createDeviceId() {
  return `wx-device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function applyNetworkState(app, network = {}) {
  app.globalData.networkType = network.networkType || "unknown";
  app.globalData.isOnline = network.isConnected !== false;
}

function checkForUpdate() {
  if (!wx.getUpdateManager) return;

  const updateManager = wx.getUpdateManager();
  updateManager.onCheckForUpdate((res) => {
    getApp().globalData.hasNewVersion = !!res.hasUpdate;
  });
  updateManager.onUpdateReady(() => {
    wx.showModal({
      title: "发现新版本",
      content: "新版本已准备好，重新启动后即可使用。",
      confirmText: "立即更新",
      cancelText: "稍后",
      success: (res) => {
        if (res.confirm) {
          updateManager.applyUpdate();
        }
      }
    });
  });
  updateManager.onUpdateFailed(() => {
    wx.showToast({
      title: "更新下载失败，请稍后重试",
      icon: "none"
    });
  });
}

App({
  globalData: {
    apiBaseUrl: config.apiBaseUrl,
    devtoolsApiBaseUrl: config.devtoolsApiBaseUrl,
    deviceApiBaseUrl: config.deviceApiBaseUrl,
    productionApiBaseUrl: config.productionApiBaseUrl,
    appName: config.appName,
    shortName: config.shortName,
    networkType: "unknown",
    isOnline: true,
    hasNewVersion: false,
    privacyConsentAgreed: false
  },

  onLaunch() {
    if (!wx.getStorageSync("deviceId")) {
      wx.setStorageSync("deviceId", createDeviceId());
    }

    // 读取隐私协议同意状态（不会自动设置，仅读取用户之前的主动选择）
    this.globalData.privacyConsentAgreed = !!wx.getStorageSync("privacyConsentAgreed");

    checkForUpdate();

    wx.getNetworkType({
      success: (res) => applyNetworkState(this, {
        networkType: res.networkType,
        isConnected: res.networkType !== "none"
      })
    });

    if (wx.onNetworkStatusChange) {
      wx.onNetworkStatusChange((res) => applyNetworkState(this, res));
    }
  }
});
