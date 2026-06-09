const {
  request,
  CACHE_KEYS,
  getCachedData,
  consumeCacheDirty,
  isLoggedIn
} = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");
const { PAGE_STATUS, resolveDetailStatus } = require("../../utils/page-state");
const { getErrorMessage } = require("../../utils/feedback");
const { normalizeStoredUser } = require("../../utils/avatar");

const DEFAULT_USER = normalizeStoredUser({
  nickname: "微信用户",
  avatarUrl: "",
  avatarLocalPath: ""
});

const GUEST_HOME = {
  userName: "欢迎体验",
  latestTitle: "首页可先浏览主要功能",
  latestDate: "",
  latestSummary: "你可以先查看健康记录、复查提醒、问题整理和知识内容，确认适合后再自愿登录保存个人数据。",
  nextReminder: "登录后可把自己的检查摘要、复查计划和咨询备忘同步到账号中持续管理。",
  nextReminderValue: "登录后可用",
  disclaimer: "产品用于个人健康记录、复查提醒和线下咨询准备，不提供在线诊断、治疗、处方或问诊服务。",
  metrics: [
    { label: "健康记录", value: "可浏览" },
    { label: "知识内容", value: "可查看" },
    { label: "登录方式", value: "自愿选择" }
  ]
};

const DEFAULT_METRICS = [
  { label: "已记录", value: "0次" },
  { label: "待关注", value: "0项" },
  { label: "下次提醒", value: "暂无" }
];

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

function normalizeHome(home) {
  const source = home || {};
  const metrics = normalizeMetrics(source.metrics);
  return {
    userName: source.userName || "微信用户",
    latestTitle: source.latestTitle || "还没有检查记录",
    latestDate: source.latestDate || "",
    latestSummary: source.latestSummary || "可以先添加一次检查摘要，后续复查时更方便查看。",
    nextReminder: source.nextReminder || "添加复查或资料准备提醒，把后续安排放进计划里。",
    nextReminderValue: metrics[2].value,
    disclaimer: source.disclaimer || "记录内容用于个人健康管理和复查准备，不作为诊断、治疗或紧急医疗建议。",
    metrics
  };
}

function resolveActiveAvatarUrl(user) {
  if (user.avatarUrl) return user.avatarUrl;
  if (user.avatarLocalPath) return user.avatarLocalPath;
  return "";
}

Page({
  data: {
    home: null,
    user: DEFAULT_USER,
    activeAvatarUrl: "",
    pageStatus: PAGE_STATUS.LOADING,
    errorMessage: "",
    isGuest: !isLoggedIn(),
    actions: [
      {
        label: "检查记录",
        desc: "按时间保存摘要",
        path: ROUTES.records,
        tone: "blue",
        icon: "/assets/icons/records-active.png"
      },
      {
        label: "复查提醒",
        desc: "管理下一步安排",
        path: ROUTES.reminders,
        tone: "lavender",
        icon: "/assets/icons/reminders-active.png"
      },
      {
        label: "问题整理",
        desc: "提前列出重点",
        path: ROUTES.questions,
        tone: "mint",
        icon: "/assets/icons/questions-active.png"
      },
      {
        label: "健康知识",
        desc: "查看管理建议",
        path: ROUTES.articles,
        tone: "cyan",
        icon: "/assets/icons/articles-active.png"
      }
    ]
  },

  onLoad() {
    this.refreshLoginState();
    this.renderCachedHome();
    this.scheduleHomeRefresh();
  },

  onShow() {
    const wasGuest = this.data.isGuest;
    this.refreshLoginState();
    const isGuest = this.data.isGuest;
    if (wasGuest && !isGuest) {
      this.setData({
        home: null,
        pageStatus: PAGE_STATUS.LOADING,
        errorMessage: ""
      });
      this.scheduleHomeRefresh({ silent: false });
      return;
    }
    if (this.data.home && consumeCacheDirty(CACHE_KEYS.home)) {
      this.scheduleHomeRefresh({ silent: true });
    }
  },

  refreshLoginState() {
    const user = normalizeStoredUser(wx.getStorageSync("user"));
    this.setData({
      isGuest: !isLoggedIn(),
      user,
      activeAvatarUrl: resolveActiveAvatarUrl(user)
    });
  },

  renderCachedHome() {
    if (!isLoggedIn()) {
      this.setData({
        home: GUEST_HOME,
        pageStatus: PAGE_STATUS.READY,
        errorMessage: ""
      });
      return true;
    }

    const cachedHome = getCachedData(CACHE_KEYS.home);
    const hasCachedHome = !!(cachedHome && cachedHome.data);

    if (hasCachedHome) {
      const normalizedHome = normalizeHome(cachedHome.data);
      this.setData({
        home: normalizedHome,
        pageStatus: resolveDetailStatus(normalizedHome),
        errorMessage: ""
      });
    }

    return hasCachedHome;
  },

  scheduleHomeRefresh(options = {}) {
    const hasCachedHome = !!this.data.home;
    const silent = options.silent === undefined ? hasCachedHome : options.silent;
    const run = () => this.loadHome({ silent });

    if (typeof wx.nextTick === "function") {
      wx.nextTick(run);
      return;
    }
    setTimeout(run, 0);
  },

  async loadHome(options = {}) {
    if (!isLoggedIn()) {
      this.setData({
        home: GUEST_HOME,
        pageStatus: PAGE_STATUS.READY,
        errorMessage: "",
        isGuest: true
      });
      return;
    }

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
      const normalizedHome = normalizeHome(res.data);
      this.setData({
        home: normalizedHome,
        errorMessage: "",
        pageStatus: resolveDetailStatus(normalizedHome)
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

  async onPullDownRefresh() {
    await this.loadHome({ silent: true });
    wx.stopPullDownRefresh();
  },

  goPage(event) {
    const path = event.currentTarget.dataset.path;
    openRoute(path);
  },

  goLogin() {
    openRoute(ROUTES.login);
  }
});
