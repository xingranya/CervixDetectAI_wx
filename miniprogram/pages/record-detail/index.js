const { request } = require("../../utils/request");

Page({
  data: {
    record: null
  },

  onLoad(query) {
    this.loadDetail(query.id);
  },

  async loadDetail(id) {
    const res = await request(`/records/${id}`);
    this.setData({ record: res.data });
  }
});

