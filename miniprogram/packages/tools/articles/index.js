const {
  request,
  CACHE_KEYS,
  getCachedData,
  isCacheFresh
} = require("../../../utils/request");
const { PAGE_STATUS, resolveListStatus } = require("../../../utils/page-state");
const { getErrorMessage } = require("../../../utils/feedback");

Page({
  data: {
    articles: [],
    pageStatus: PAGE_STATUS.LOADING,
    errorMessage: ""
  },

  onShow() {
    const cachedArticles = getCachedData(CACHE_KEYS.articles);
    const hasCachedArticles = !!(cachedArticles && Array.isArray(cachedArticles.data));

    if (hasCachedArticles) {
      this.setData({
        articles: cachedArticles.data,
        pageStatus: resolveListStatus(cachedArticles.data),
        errorMessage: ""
      });
    }

    if (!hasCachedArticles || !isCacheFresh(CACHE_KEYS.articles, 5 * 60 * 1000)) {
      this.loadArticles({ silent: hasCachedArticles });
    }
  },

  async loadArticles(options = {}) {
    const { silent = false } = options;
    if (!silent) {
      this.setData({
        pageStatus: PAGE_STATUS.LOADING,
        errorMessage: ""
      });
    }

    try {
      const res = await request("/articles", {
        cacheKey: CACHE_KEYS.articles,
        maxAge: 5 * 60 * 1000
      });
      const articles = res.data || [];
      this.setData({
        articles,
        pageStatus: resolveListStatus(articles),
        errorMessage: ""
      });
    } catch (error) {
      if (this.data.articles.length) return;
      this.setData({
        articles: [],
        pageStatus: PAGE_STATUS.ERROR,
        errorMessage: getErrorMessage(error, "加载失败")
      });
    }
  }
});
