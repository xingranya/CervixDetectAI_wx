const { login, getToken, clearAllCaches } = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");
const { showErrorToast, showSuccessToast } = require("../../utils/feedback");
const { withPageLoading } = require("../../utils/form");

function wxLoginCode() {
  return new Promise((resolve) => {
    wx.login({
      success: (res) => resolve(res.code || ""),
      fail: () => resolve("")
    });
  });
}

Page({
  data: {
    nickname: "微信用户",
    avatarUrl: "",
    loading: false
  },

  onLoad() {
    if (getToken()) {
      openRoute(ROUTES.home);
    }
  },

  onNicknameInput(event) {
    this.setData({ nickname: event.detail.value });
  },

  onChooseAvatar(event) {
    this.setData({ avatarUrl: event.detail.avatarUrl || "" });
  },

  async submitLogin() {
    await withPageLoading(this, async () => {
      const code = await wxLoginCode();
      const deviceId = wx.getStorageSync("deviceId");
      const res = await login({
        code,
        deviceId,
        nickname: this.data.nickname || "微信用户",
        avatarUrl: this.data.avatarUrl
      });

      clearAllCaches();
      wx.setStorageSync("token", res.data.token);
      wx.setStorageSync("user", res.data.user);
      showSuccessToast("已登录");
      openRoute(ROUTES.home);
    }).catch((error) => {
      showErrorToast(error, "登录失败");
    });
  },

  openPrivacy() {
    openRoute(ROUTES.privacy);
  }
});
