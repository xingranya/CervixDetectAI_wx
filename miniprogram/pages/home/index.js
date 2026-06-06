const {
  request,
  CACHE_KEYS,
  getCachedData,
  isCacheFresh,
  consumeCacheDirty
} = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");
const { PAGE_STATUS, resolveDetailStatus } = require("../../utils/page-state");
const { getErrorMessage } = require("../../utils/feedback");

Page({
  data: {
    home: null,
    pageStatus: PAGE_STATUS.LOADING,
    errorMessage: "",
    actions: [
      { label: "检查记录", desc: "按时间保存摘要", path: ROUTES.records, tone: "green", icon: "/assets/icons/records-active.png" },
      { label: "复查提醒", desc: "管理下一步安排", path: ROUTES.reminders, tone: "blue", icon: "/assets/icons/reminders-active.png" },
      { label: "问题整理", desc: "提前列出重点", path: ROUTES.questions, tone: "gold", icon: "/assets/icons/questions-active.png" },
      { label: "健康知识", desc: "查看管理建议", path: ROUTES.articles, tone: "mint", icon: "/assets/icons/articles-active.png" }
    ]
  },

  onShow() {
    const cachedHome = getCachedData(CACHE_KEYS.home);
    const hasCachedHome = !!(cachedHome && cachedHome.data);

    if (hasCachedHome) {
      this.setData({
        home: cachedHome.data,
        pageStatus: resolveDetailStatus(cachedHome.data),
        errorMessage: ""
      });
    }

    const shouldRefresh = !hasCachedHome
      || consumeCacheDirty(CACHE_KEYS.home)
      || !isCacheFresh(CACHE_KEYS.home, 60 * 1000);

    if (shouldRefresh) {
      this.loadHome({ silent: hasCachedHome });
    }
  },

  async loadHome(options = {}) {
    const { silent = false } = options;
    if (!silent) {
      this.setData({
        pageStatus: PAGE_STATUS.LOADING,
        errorMessage: ""
      });
    }

    try {
      const res = await request("/home", {
        cacheKey: CACHE_KEYS.home,
        maxAge: 60 * 1000
      });
      this.setData({
        home: res.data,
        errorMessage: "",
        pageStatus: resolveDetailStatus(res.data)
      });
    } catch (error) {
      if (this.data.home) return;
      this.setData({
        home: null,
        errorMessage: getErrorMessage(error, "首页加载失败，请稍后重试"),
        pageStatus: PAGE_STATUS.ERROR
      });
    }
  },

  goPage(event) {
    const path = event.currentTarget.dataset.path;
    openRoute(path);
  }
});
