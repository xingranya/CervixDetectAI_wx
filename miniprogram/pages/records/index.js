const { request } = require("../../utils/request");

Page({
  data: {
    records: []
  },

  onShow() {
    this.loadRecords();
  },

  async loadRecords() {
    try {
      const res = await request("/records");
      this.setData({ records: res.data || [] });
    } catch (_error) {
      this.setData({ records: [] });
    }
  },

  openDetail(event) {
    wx.navigateTo({ url: `/pages/record-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  createRecord() {
    wx.navigateTo({ url: "/pages/record-form/index" });
  },

  editRecord(event) {
    wx.navigateTo({ url: `/pages/record-form/index?id=${event.currentTarget.dataset.id}` });
  },

  deleteRecord(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除记录",
      content: "删除后无法恢复，确认删除这条检查记录吗？",
      confirmColor: "#d32f2f",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request(`/records/${id}`, { method: "DELETE" });
          wx.showToast({ title: "已删除", icon: "success" });
          this.loadRecords();
        } catch (error) {
          wx.showToast({ title: error.message || "删除失败", icon: "none" });
        }
      }
    });
  }
});
