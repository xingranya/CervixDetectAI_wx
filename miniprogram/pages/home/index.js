const { request } = require("../../utils/request");

Page({
  data: {
    home: null,
    actions: [
      { label: "检查记录", desc: "按时间保存摘要", path: "/pages/records/index", tone: "green", tab: true },
      { label: "复查提醒", desc: "管理下一步安排", path: "/pages/reminders/index", tone: "blue", tab: true },
      { label: "问题整理", desc: "提前列出重点", path: "/pages/questions/index", tone: "gold" },
      { label: "健康知识", desc: "查看管理建议", path: "/pages/articles/index", tone: "mint" }
    ]
  },

  onShow() {
    this.loadHome();
  },

  async loadHome() {
    try {
      const res = await request("/home");
      this.setData({ home: res.data });
    } catch (_error) {
      this.setData({ home: null });
    }
  },

  goPage(event) {
    const { path, tab } = event.currentTarget.dataset;
    if (tab) {
      wx.switchTab({ url: path });
      return;
    }
    wx.navigateTo({ url: path });
  }
});
