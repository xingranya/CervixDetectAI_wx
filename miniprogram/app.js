const config = require("./config/app");

function createDeviceId() {
  return `wx-device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

App({
  globalData: {
    apiBaseUrl: config.apiBaseUrl,
    devtoolsApiBaseUrl: config.devtoolsApiBaseUrl,
    deviceApiBaseUrl: config.deviceApiBaseUrl,
    productionApiBaseUrl: config.productionApiBaseUrl,
    appName: config.appName,
    shortName: config.shortName,
    useMock: config.useMock
  },

  onLaunch() {
    if (!wx.getStorageSync("deviceId")) {
      wx.setStorageSync("deviceId", createDeviceId());
    }
  }
});
