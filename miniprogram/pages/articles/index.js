const { request } = require("../../utils/request");

Page({
  data: {
    articles: []
  },

  onLoad() {
    this.loadArticles();
  },

  async loadArticles() {
    const res = await request("/articles");
    this.setData({ articles: res.data || [] });
  }
});

