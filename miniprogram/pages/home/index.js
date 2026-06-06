const { request } = require("../../utils/request");

Page({
  data: {
    home: null,
    loading: true,
    errorMessage: "",
    actions: [
      { label: "检查记录", desc: "按时间保存摘要", path: "/pages/records/index", tone: "green", tab: true, icon: "/assets/icons/records-active.png" },
      { label: "复查提醒", desc: "管理下一步安排", path: "/pages/reminders/index", tone: "blue", tab: true, icon: "/assets/icons/reminders-active.png" },
      { label: "问题整理", desc: "提前列出重点", path: "/pages/questions/index", tone: "gold", icon: "/assets/icons/questions-active.png" },
      { label: "健康知识", desc: "查看管理建议", path: "/pages/articles/index", tone: "mint", icon: "/assets/icons/articles-active.png" }
    ]
  },

  onShow() {
    this.loadHome();
  },

  async loadHome() {
    try {
      const res = await request("/home");
      this.setData({
        home: res.data,
        errorMessage: ""
      });
    } catch (error) {
      this.setData({
        home: null,
        errorMessage: error.message || "首页加载失败，请稍后重试"
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  goPage(event) {
    const path = event.currentTarget.dataset.path;
    if (path === "/pages/records/index" || path === "/pages/reminders/index") {
      wx.switchTab({ url: path });
      return;
    }
    wx.navigateTo({ url: path });
  }
});
