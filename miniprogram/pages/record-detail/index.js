const { request } = require("../../utils/request");

Page({
  data: {
    record: null
  },

  onLoad(query) {
    this.setData({ id: query.id });
  },

  onShow() {
    if (this.data.id) this.loadDetail(this.data.id);
  },

  async loadDetail(id) {
    try {
      const res = await request(`/records/${id}`);
      this.setData({ record: res.data });
    } catch (error) {
      wx.showToast({ title: error.message || "加载失败", icon: "none" });
    }
  },

  editRecord() {
    wx.navigateTo({ url: `/pages/record-form/index?id=${this.data.record.id}` });
  },

  deleteRecord() {
    wx.showModal({
      title: "删除记录",
      content: "删除后无法恢复，确认删除这条检查记录吗？",
      confirmColor: "#d32f2f",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request(`/records/${this.data.record.id}`, { method: "DELETE" });
          wx.showToast({ title: "已删除", icon: "success" });
          setTimeout(() => wx.navigateBack(), 500);
        } catch (error) {
          wx.showToast({ title: error.message || "删除失败", icon: "none" });
        }
      }
    });
  }
});
