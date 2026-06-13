const {
  request,
  isLoggedIn
} = require("../../../utils/request");
const { openRoute, ROUTES } = require("../../../utils/navigation");
const { showErrorToast, showSuccessToast, getErrorMessage, showErrorModal } = require("../../../utils/feedback");

const PAGE_STATUS = { LOADING: "loading", EMPTY: "empty", READY: "ready", ERROR: "error" };

const TYPE_ICONS = {
  system: "系",
  reminder: "提",
  record: "记",
  ai: "AI"
};

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}-${d}`;
}

function buildNotificationView(item) {
  return {
    ...item,
    typeIcon: TYPE_ICONS[item.type] || "通",
    timeText: formatTime(item.createdAt)
  };
}

Page({
  data: {
    notifications: [],
    pageStatus: PAGE_STATUS.LOADING,
    errorMessage: "",
    unreadCount: 0
  },

  onLoad() {
    if (!isLoggedIn()) {
      showErrorModal("登录后可查看通知。");
      openRoute(ROUTES.login, {}, { redirect: true });
      return;
    }
    this.loadNotifications();
    this.loadUnreadCount();
  },

  onShow() {
    if (!isLoggedIn()) return;
    this.loadNotifications({ silent: true });
    this.loadUnreadCount();
  },

  async loadNotifications(options = {}) {
    const { silent = false } = options;
    if (!silent) {
      this.setData({ pageStatus: PAGE_STATUS.LOADING, errorMessage: "" });
    }

    try {
      const res = await request("/notifications", { method: "GET" });
      const list = (res.data || []).map(buildNotificationView);
      this.setData({
        notifications: list,
        pageStatus: list.length ? PAGE_STATUS.READY : PAGE_STATUS.EMPTY,
        errorMessage: ""
      });
    } catch (error) {
      if (this.data.notifications.length) return;
      this.setData({
        pageStatus: PAGE_STATUS.ERROR,
        errorMessage: getErrorMessage(error, "通知加载失败")
      });
    }
  },

  async loadUnreadCount() {
    try {
      const res = await request("/notifications/unread-count", { method: "GET" });
      this.setData({ unreadCount: res.data?.count || 0 });
    } catch (error) {
      // Silent
    }
  },

  async onNotificationTap(event) {
    const id = event.currentTarget.dataset.id;
    const extra = event.currentTarget.dataset.extra;

    // Mark as read
    try {
      await request(`/notifications/${id}/read`, { method: "PATCH" });
      this.loadUnreadCount();
      // Update local state
      const notifications = this.data.notifications.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      );
      this.setData({ notifications });
    } catch (error) {
      // Silent
    }

    // Navigate if extra has path
    if (extra && extra.path) {
      openRoute(extra.path, extra.params || {});
    }
  },

  async markAllRead() {
    try {
      await request("/notifications/read-all", { method: "PATCH" });
      showSuccessToast("已全部标记为已读");
      const notifications = this.data.notifications.map((item) => ({ ...item, isRead: true }));
      this.setData({ notifications, unreadCount: 0 });
    } catch (error) {
      showErrorToast(error, "操作失败");
    }
  }
});
