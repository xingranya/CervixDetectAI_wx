const {
  request,
  uploadAvatar,
  CACHE_KEYS,
  getCachedData,
  consumeCacheDirty,
  clearAllCaches,
  isLoggedIn
} = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");
const {
  normalizeStoredUser,
  readFileBase64,
  resolveAvatarFileType
} = require("../../utils/avatar");

const DEFAULT_USER = normalizeStoredUser({
  nickname: "微信用户",
  avatarUrl: "",
  avatarLocalPath: ""
});

const DEFAULT_METRICS = [
  { label: "检查记录", value: "--" },
  { label: "待关注", value: "--" },
  { label: "下次提醒", value: "--" }
];

function normalizeUser(user) {
  return normalizeStoredUser(user);
}

function resolveActiveAvatarUrl(user, failedUrl) {
  const normalizedFailedUrl = String(failedUrl || "").trim();
  if (user.avatarUrl && user.avatarUrl !== normalizedFailedUrl) {
    return user.avatarUrl;
  }
  if (user.avatarLocalPath && user.avatarLocalPath !== normalizedFailedUrl) {
    return user.avatarLocalPath;
  }
  return "";
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
    isGuest: !isLoggedIn(),
    user: DEFAULT_USER,
    activeAvatarUrl: "",
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
    this.refreshLoginState();
    this.renderProfileCache();
    this.scheduleSummaryRefresh();
    this.syncProfile();
  },

  onShow() {
    this.refreshLoginState();
    this.renderStoredUser();
    this.syncProfile();
    if (consumeCacheDirty(CACHE_KEYS.home)) {
      this.scheduleSummaryRefresh();
    }
  },

  refreshLoginState() {
    this.setData({ isGuest: !isLoggedIn() });
  },

  renderStoredUser() {
    const nextUser = normalizeUser(wx.getStorageSync("user"));
    const avatarLoadFailedUrl = nextUser.avatarUrl === this.data.user.avatarUrl
      && nextUser.avatarLocalPath === this.data.user.avatarLocalPath
      ? this.avatarLoadFailedUrl || ""
      : "";
    const activeAvatarUrl = resolveActiveAvatarUrl(nextUser, avatarLoadFailedUrl);
    if (
      nextUser.nickname === this.data.user.nickname
      && nextUser.avatarUrl === this.data.user.avatarUrl
      && nextUser.avatarLocalPath === this.data.user.avatarLocalPath
      && activeAvatarUrl === this.data.activeAvatarUrl
      && avatarLoadFailedUrl === (this.avatarLoadFailedUrl || "")
    ) {
      return;
    }
    this.avatarLoadFailedUrl = avatarLoadFailedUrl;
    this.setData({
      user: nextUser,
      activeAvatarUrl
    });
  },

  onAvatarLoadError(event) {
    const failedUrl = event.currentTarget.dataset.url || "";
    this.avatarLoadFailedUrl = failedUrl;
    this.setData({
      activeAvatarUrl: resolveActiveAvatarUrl(this.data.user, failedUrl)
    });
  },

  renderProfileCache() {
    this.renderStoredUser();
    const cachedHome = getCachedData(CACHE_KEYS.home);
    if (cachedHome && cachedHome.data && Array.isArray(cachedHome.data.metrics)) {
      this.setData({ metrics: normalizeMetrics(cachedHome.data.metrics) });
    }
  },

  scheduleSummaryRefresh() {
    if (!isLoggedIn()) {
      this.setData({ metrics: DEFAULT_METRICS });
      return;
    }

    const run = () => this.loadSummary();

    if (typeof wx.nextTick === "function") {
      wx.nextTick(run);
      return;
    }
    setTimeout(run, 0);
  },

  async loadSummary() {
    if (!isLoggedIn()) {
      this.setData({ metrics: DEFAULT_METRICS });
      return;
    }

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
    await this.syncProfile();
    await this.loadSummary();
    wx.stopPullDownRefresh();
  },

  async syncProfile() {
    if (!isLoggedIn()) {
      this.renderStoredUser();
      return;
    }

    if (this.profileSyncing) return;
    this.profileSyncing = true;
    try {
      const localUser = normalizeUser(wx.getStorageSync("user"));
      const res = await request("/me");
      const nextUser = normalizeUser({
        ...localUser,
        ...(res.data || {}),
        avatarLocalPath: localUser.avatarLocalPath
      });
      wx.setStorageSync("user", nextUser);
      this.renderStoredUser();
      await this.syncPendingAvatar(nextUser);
    } catch (_error) {
      await this.syncPendingAvatar();
    } finally {
      this.profileSyncing = false;
    }
  },

  async syncPendingAvatar(sourceUser) {
    if (this.avatarUploading) return;

    const currentUser = normalizeUser(sourceUser || wx.getStorageSync("user"));
    if (!currentUser.avatarLocalPath || currentUser.avatarUrl) {
      return;
    }

    this.avatarUploading = true;
    try {
      const avatarBase64 = await readFileBase64(currentUser.avatarLocalPath);
      const avatarRes = await uploadAvatar({
        avatarBase64,
        fileType: resolveAvatarFileType(currentUser.avatarLocalPath)
      });
      const nextUser = normalizeUser({
        ...currentUser,
        ...(avatarRes.data || {}),
        avatarLocalPath: currentUser.avatarLocalPath
      });
      wx.setStorageSync("user", nextUser);
      this.renderStoredUser();
    } catch (_error) {
      // 上传重试失败时继续保留本地头像兜底，不阻断页面展示。
    } finally {
      this.avatarUploading = false;
    }
  },

  openMenu(event) {
    const { path } = event.currentTarget.dataset;
    openRoute(path);
  },

  goLogin() {
    openRoute(ROUTES.login);
  },

  logout() {
    if (!isLoggedIn()) {
      openRoute(ROUTES.login);
      return;
    }

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
