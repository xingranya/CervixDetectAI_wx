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
  persistAvatarFile,
  readFileBase64,
  resolveAvatarFileType
} = require("../../utils/avatar");
const { showErrorModal } = require("../../utils/feedback");

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

const PROFILE_ICON_MAP = {
  info_circle: "info",
  waiting: "info",
  time: "info",
  lock: "info",
  note: "info",
  comment: "info",
  calendar: "info",
  bell: "info",
  "safe-success": "success"
};

function normalizeMenuWeuiIcon(icon) {
  const key = String(icon || "").trim();
  return PROFILE_ICON_MAP[key] || key;
}

function buildProfileMenus() {
  return [
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
      title: "用户服务协议",
      desc: "查看登录与使用规则",
      icon: "/assets/icons/detail-active.png",
      path: ROUTES.serviceAgreement
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
      icon: "/assets/icons/articles-active.png",
      path: ROUTES.feedback
    }
  ];
}

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

function formatShortDate(value) {
  const text = String(value || "");
  if (text.length >= 10) return text.slice(5, 10);
  return text || "暂无";
}

function readCachedList(cacheKey) {
  const cached = getCachedData(cacheKey);
  return cached && Array.isArray(cached.data) ? cached.data : null;
}

function buildMetricsFromListCache() {
  const records = readCachedList(CACHE_KEYS.records);
  const reminders = readCachedList(CACHE_KEYS.reminders);
  if (!records && !reminders) return null;

  const recordList = records || [];
  const reminderList = reminders || [];
  const pendingRecords = recordList.filter((item) => {
    const status = String(item.status || "");
    return status.indexOf("待") > -1 || status.indexOf("复查") > -1;
  }).length;
  const pendingReminders = reminderList
    .filter((item) => !item.done)
    .sort((left, right) => String(left.date || "").localeCompare(String(right.date || "")));
  const pendingCount = pendingRecords + pendingReminders.length;

  return [
    { label: "检查记录", value: `${recordList.length}次` },
    { label: "待关注", value: `${pendingCount}项` },
    { label: "下次提醒", value: pendingReminders.length ? formatShortDate(pendingReminders[0].date) : "暂无" }
  ];
}

Page({
  data: {
    appName: "云端智诊",
    isGuest: !isLoggedIn(),
    user: DEFAULT_USER,
    activeAvatarUrl: "",
    metrics: DEFAULT_METRICS,
    menus: buildProfileMenus(),
    confirmDialog: {
      show: false
    },
    deleteConfirm: {
      show: false
    },
    setupSheetVisible: false
  },

  onLoad() {
    this.refreshLoginState();
    this.renderProfileCache();
    this.scheduleSummaryRefresh();
    this.syncProfile();
    this._maybeOpenSetupSheet();
  },

  onShow() {
    this.refreshLoginState();
    this.renderStoredUser();
    this.renderListCacheMetrics();
    this.syncProfile();
    consumeCacheDirty(CACHE_KEYS.home);
    this.scheduleSummaryRefresh();
    this._maybeOpenSetupSheet();
  },

  // 当用户已登录但尚未完成资料设置时，自动弹起完善资料弹窗。
  // 使用 _setupSheetAutoShown 避免同一次会话内反复弹出。
  _maybeOpenSetupSheet() {
    if (this.data.setupSheetVisible) return;
    if (!isLoggedIn()) return;
    if (this._setupSheetAutoShown) return;
    const setupTouched = !!wx.getStorageSync("profileSettingsConsent")
      || !!wx.getStorageSync("profileNicknameReady")
      || !!wx.getStorageSync("profileAvatarReady");
    if (setupTouched) return;
    this._setupSheetAutoShown = true;
    this.setData({ setupSheetVisible: true });
  },

  openSetupSheet() {
    this.setData({ setupSheetVisible: true });
  },

  onSetupSheetClosed() {
    this.setData({ setupSheetVisible: false });
    // 弹窗关闭后同步最新资料状态，避免页面展示过期。
    this.renderStoredUser();
    this.syncProfile();
  },

  refreshLoginState() {
    this.setData({ isGuest: !isLoggedIn() });
  },

  hasNicknamePermission() {
    return !!wx.getStorageSync("profileNicknameReady");
  },

  hasAvatarPermission() {
    return !!wx.getStorageSync("profileAvatarReady");
  },

  renderStoredUser() {
    const storedUser = normalizeUser(wx.getStorageSync("user"));
    const nextUser = {
      ...storedUser,
      nickname: this.hasNicknamePermission() ? storedUser.nickname : "微信用户",
      avatarUrl: this.hasAvatarPermission() ? storedUser.avatarUrl : "",
      avatarLocalPath: this.hasAvatarPermission() ? storedUser.avatarLocalPath : ""
    };
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
    if (this.renderListCacheMetrics()) return;
    const cachedHome = getCachedData(CACHE_KEYS.home);
    if (cachedHome && cachedHome.data && Array.isArray(cachedHome.data.metrics)) {
      this.setData({ metrics: normalizeMetrics(cachedHome.data.metrics) });
    }
  },

  renderListCacheMetrics() {
    if (!isLoggedIn()) {
      this.setData({ metrics: DEFAULT_METRICS });
      return true;
    }
    const metrics = buildMetricsFromListCache();
    if (!metrics) return false;
    this.setData({ metrics: normalizeMetrics(metrics) });
    return true;
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
    run();
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
        ...(this.hasNicknamePermission() ? { nickname: res.data?.nickname || localUser.nickname } : { nickname: "微信用户" }),
        ...(this.hasAvatarPermission() ? { avatarUrl: res.data?.avatarUrl || localUser.avatarUrl } : { avatarUrl: "" }),
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
      // 如果 avatarLocalPath 是开发者工具的 HTTP 临时 URL，尝试先持久化
      let localPath = currentUser.avatarLocalPath;
      if (/^http:\/\/(127\.0\.0\.1|localhost):\d+\/__tmp__\//i.test(localPath)) {
        const persisted = await persistAvatarFile(localPath);
        if (persisted) {
          localPath = persisted;
          const updatedUser = normalizeUser({ ...currentUser, avatarLocalPath: persisted });
          wx.setStorageSync("user", updatedUser);
        }
      }

      const avatarBase64 = await readFileBase64(localPath);
      const avatarRes = await uploadAvatar({
        avatarBase64,
        fileType: resolveAvatarFileType(localPath, avatarBase64)
      });
      const nextUser = normalizeUser({
        ...currentUser,
        ...(avatarRes.data || {}),
        avatarLocalPath
      });
      wx.setStorageSync("user", nextUser);
      this.renderStoredUser();
    } catch (_error) {
      // 上传重试失败时继续保留本地头像兜底，不阻断页面展示。
      // 如果 avatarLocalPath 是已失效的临时 URL，清除它避免反复失败。
      if (/^http:\/\/(127\.0\.0\.1|localhost):\d+\/__tmp__\//i.test(currentUser.avatarLocalPath)) {
        const cleanedUser = normalizeUser({ ...currentUser, avatarLocalPath: "" });
        wx.setStorageSync("user", cleanedUser);
        this.renderStoredUser();
      }
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

  goProfileSetup() {
    // 不再跳转到独立页面，改为在当前 profile 页弹起完善资料弹窗。
    this.openSetupSheet();
  },

  logout() {
    if (!isLoggedIn()) {
      openRoute(ROUTES.login);
      return;
    }

    this.setData({
      confirmDialog: {
        show: true
      }
    });
  },

  closeConfirmDialog() {
    this.setData({ "confirmDialog.show": false });
  },

  confirmLogout() {
    this.closeConfirmDialog();
    this._clearLocalData();
    openRoute(ROUTES.login, {}, { reLaunch: true });
  },

  requestDeleteAccount() {
    if (!isLoggedIn()) return;
    this.setData({ "deleteConfirm.show": true });
  },

  closeDeleteConfirm() {
    this.setData({ "deleteConfirm.show": false });
  },

  async confirmDeleteAccount() {
    this.closeDeleteConfirm();
    try {
      await request("/me/account", { method: "DELETE" });
      this._clearLocalData();
      openRoute(ROUTES.login, {}, { reLaunch: true });
    } catch (error) {
      await showErrorModal(error, "注销失败，请稍后再试");
    }
  },

  _clearLocalData() {
    wx.removeStorageSync("token");
    wx.removeStorageSync("user");
    wx.removeStorageSync("profileSettingsConsent");
    wx.removeStorageSync("profileNicknameReady");
    wx.removeStorageSync("profileAvatarReady");
    clearAllCaches();
  }
});
