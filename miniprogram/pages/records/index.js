const { request } = require("../../utils/request");

Page({
  data: {
    records: []
  },

  onLoad() {
    this.loadRecords();
  },

  async loadRecords() {
    const res = await request("/records");
    this.setData({ records: res.data || [] });
  },

  openDetail(event) {
    wx.navigateTo({ url: `/pages/record-detail/index?id=${event.currentTarget.dataset.id}` });
  }
});

