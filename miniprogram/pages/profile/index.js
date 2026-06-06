Page({
  data: {
    appName: "CervixDetectAI云端智诊",
    user: null
  },

  onShow() {
    this.setData({
      user: wx.getStorageSync("user") || null
    });
  },

  openPrivacy() {
    wx.navigateTo({ url: "/pages/privacy/index" });
  },

  openQuestions() {
    wx.navigateTo({ url: "/pages/questions/index" });
  },

  logout() {
    wx.showModal({
      title: "退出登录",
      content: "退出后可重新登录继续管理自己的记录。",
      success: (res) => {
        if (!res.confirm) return;
        wx.removeStorageSync("token");
        wx.removeStorageSync("user");
        wx.reLaunch({ url: "/pages/login/index" });
      }
    });
  }
});
