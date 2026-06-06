const {
  request,
  CACHE_KEYS,
  getCachedData,
  isCacheFresh,
  consumeCacheDirty,
  clearAllCaches
} = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");

Page({
  data: {
    appName: "云端智诊",
    user: {
      nickname: "微信用户",
      avatarUrl: ""
    },
    metrics: [
      { label: "检查记录", value: "--" },
      { label: "待关注", value: "--" },
      { label: "下次提醒", value: "--" }
    ],
    menus: [
      {
        title: "检查记录",
        desc: "查看和维护历史摘要",
        icon: "/assets/icons/records-active.png",
        path: ROUTES.records
      },
      {
        title: "复查提醒",
        desc: "管理后续安排",
        icon: "/assets/icons/reminders-active.png",
        path: ROUTES.reminders
      },
      {
        title: "问题整理",
        desc: "保存线下咨询重点",
        icon: "/assets/icons/questions-active.png",
        path: ROUTES.questions
      },
      {
        title: "隐私与服务说明",
        desc: "查看数据用途和边界",
        icon: "/assets/icons/privacy-active.png",
        path: ROUTES.privacy
      }
    ]
  },

  onShow() {
    this.setData({
      user: wx.getStorageSync("user") || {
        nickname: "微信用户",
        avatarUrl: ""
      }
    });
    const cachedHome = getCachedData(CACHE_KEYS.home);
    if (cachedHome && cachedHome.data && Array.isArray(cachedHome.data.metrics)) {
      this.setData({ metrics: cachedHome.data.metrics });
    }

    const shouldRefresh = !cachedHome
      || consumeCacheDirty(CACHE_KEYS.home)
      || !isCacheFresh(CACHE_KEYS.home, 60 * 1000);

    if (shouldRefresh) {
      this.loadSummary();
    }
  },

  async loadSummary() {
    try {
      const res = await request("/home", {
        cacheKey: CACHE_KEYS.home,
        maxAge: 60 * 1000
      });
      if (res.data && res.data.metrics) {
        this.setData({ metrics: res.data.metrics });
      }
    } catch (_error) {
      // 首页概览加载失败时保留默认占位，不影响个人中心操作。
    }
  },

  openMenu(event) {
    const { path } = event.currentTarget.dataset;
    openRoute(path);
  },

  logout() {
    wx.showModal({
      title: "退出登录",
      content: "退出后可重新登录继续管理自己的记录。",
      success: (res) => {
        if (!res.confirm) return;
        wx.removeStorageSync("token");
        wx.removeStorageSync("user");
        clearAllCaches();
        openRoute(ROUTES.login, {}, { reLaunch: true });
      }
    });
  }
});
