const {
  request,
  CACHE_KEYS,
  getCachedData,
  consumeCacheDirty,
  clearAllCaches
} = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");

const DEFAULT_USER = {
  nickname: "微信用户",
  avatarUrl: ""
};

const DEFAULT_METRICS = [
  { label: "检查记录", value: "--" },
  { label: "待关注", value: "--" },
  { label: "下次提醒", value: "--" }
];

function normalizeUser(user) {
  const source = user || {};
  return {
    nickname: source.nickname || "微信用户",
    avatarUrl: source.avatarUrl || ""
  };
}

function normalizeMetric(metric, fallback) {
  const source = metric || {};
  const value = source.value === undefined || source.value === null || source.value === ""
    ? fallback.value
    : source.value;
  return {
    label: source.label || fallback.label,
    value
  };
}

function normalizeMetrics(metrics) {
  const list = Array.isArray(metrics) ? metrics : [];
  return DEFAULT_METRICS.map((fallback, index) => normalizeMetric(list[index], fallback));
}

Page({
  data: {
    appName: "云端智诊",
    user: DEFAULT_USER,
    metrics: DEFAULT_METRICS,
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
      },
      {
        title: "合规与服务边界",
        desc: "确认健康记录工具的使用范围",
        icon: "/assets/icons/check-active.png",
        path: ROUTES.compliance
      },
      {
        title: "意见反馈",
        desc: "提交使用问题和改进建议",
        icon: "/assets/icons/questions-active.png",
        path: ROUTES.feedback
      }
    ]
  },

  onLoad() {
    this.renderProfileCache();
    this.scheduleSummaryRefresh();
  },

  onShow() {
    this.renderStoredUser();
    if (consumeCacheDirty(CACHE_KEYS.home)) {
      this.scheduleSummaryRefresh();
    }
  },

  renderStoredUser() {
    const nextUser = normalizeUser(wx.getStorageSync("user"));
    if (
      nextUser.nickname === this.data.user.nickname
      && nextUser.avatarUrl === this.data.user.avatarUrl
    ) {
      return;
    }
    this.setData({ user: nextUser });
  },

  renderProfileCache() {
    this.renderStoredUser();
    const cachedHome = getCachedData(CACHE_KEYS.home);
    if (cachedHome && cachedHome.data && Array.isArray(cachedHome.data.metrics)) {
      this.setData({ metrics: normalizeMetrics(cachedHome.data.metrics) });
    }
  },

  scheduleSummaryRefresh() {
    const run = () => this.loadSummary();

    if (typeof wx.nextTick === "function") {
      wx.nextTick(run);
      return;
    }
    setTimeout(run, 0);
  },

  async loadSummary() {
    try {
      const res = await request("/home", {
        cacheKey: CACHE_KEYS.home,
        maxAge: 60 * 1000
      });
      if (res.data && res.data.metrics) {
        this.setData({ metrics: normalizeMetrics(res.data.metrics) });
      }
    } catch (_error) {
      // 首页概览加载失败时保留默认占位，不影响个人中心操作。
    }
  },

  async onPullDownRefresh() {
    await this.loadSummary();
    wx.stopPullDownRefresh();
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
