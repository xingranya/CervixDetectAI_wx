const { login, getToken } = require("../../utils/request");

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
      wx.switchTab({ url: "/pages/home/index" });
    }
  },

  onNicknameInput(event) {
    this.setData({ nickname: event.detail.value });
  },

  onChooseAvatar(event) {
    this.setData({ avatarUrl: event.detail.avatarUrl || "" });
  },

  async submitLogin() {
    if (this.data.loading) return;

    this.setData({ loading: true });
    try {
      const code = await wxLoginCode();
      const deviceId = wx.getStorageSync("deviceId");
      const res = await login({
        code,
        deviceId,
        nickname: this.data.nickname || "微信用户",
        avatarUrl: this.data.avatarUrl
      });

      wx.setStorageSync("token", res.data.token);
      wx.setStorageSync("user", res.data.user);
      wx.showToast({ title: "已登录", icon: "success" });
      wx.switchTab({ url: "/pages/home/index" });
    } catch (error) {
      wx.showToast({
        title: error.message || "登录失败",
        icon: "none"
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  openPrivacy() {
    wx.navigateTo({ url: "/pages/privacy/index" });
  }
});
