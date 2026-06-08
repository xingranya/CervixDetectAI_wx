const {
  request,
  CACHE_KEYS,
  getCachedData,
  isCacheFresh,
  consumeCacheDirty,
  removeCachedListItem,
  updateCachedListItem,
  setCachedData,
  clearCachedData,
  markCacheDirty,
  isLoggedIn
} = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");
const { PAGE_STATUS, resolveListStatus } = require("../../utils/page-state");
const { showErrorToast, showSuccessToast, getErrorMessage, showErrorModal } = require("../../utils/feedback");
const {
  hasReminderSubscriptionTemplate,
  requestReminderSubscription
} = require("../../utils/reminder-subscription");

function buildReminderSummary(reminders) {
  const pending = reminders.filter((item) => !item.done);
  return {
    total: reminders.length,
    pending: pending.length,
    nextDate: pending.length ? pending[0].date : "暂无",
    title: pending.length ? "按计划推进复查安排" : "当前没有待处理提醒"
  };
}

function sortReminders(reminders) {
  return reminders.slice().sort((left, right) => {
    if (left.done !== right.done) {
      return left.done ? 1 : -1;
    }
    return String(left.date).localeCompare(String(right.date));
  });
}

function buildReminderView(reminder) {
  const dateText = String(reminder.date || "");
  return {
    ...reminder,
    dateMonthDay: dateText.length >= 10 ? dateText.slice(5, 10) : dateText,
    dateYear: dateText.length >= 4 ? dateText.slice(0, 4) : "",
    statusText: reminder.done ? "已完成" : "待处理",
    canNotify: hasReminderSubscriptionTemplate()
  };
}

Page({
  data: {
    reminders: [],
    summary: buildReminderSummary([]),
    pageStatus: PAGE_STATUS.LOADING,
    errorMessage: "",
    isGuest: !isLoggedIn(),
    canSubscribeReminder: hasReminderSubscriptionTemplate(),
    sendingReminderId: ""
  },

  onShow() {
    const guest = !isLoggedIn();
    this.setData({ isGuest: guest });
    if (guest) {
      this.setData({
        reminders: [],
        summary: buildReminderSummary([]),
        pageStatus: PAGE_STATUS.EMPTY,
        errorMessage: ""
      });
      return;
    }

    const cachedReminders = getCachedData(CACHE_KEYS.reminders);
    const hasCachedReminders = !!(cachedReminders && Array.isArray(cachedReminders.data));

    if (hasCachedReminders) {
      this.applyReminders(cachedReminders.data);
    }

    const shouldRefresh = !hasCachedReminders
      || consumeCacheDirty(CACHE_KEYS.reminders)
      || !isCacheFresh(CACHE_KEYS.reminders);

    if (shouldRefresh) {
      this.loadReminders({ silent: hasCachedReminders });
    }
  },

  applyReminders(reminders) {
    const nextReminders = sortReminders(reminders).map(buildReminderView);
    this.setData({
      reminders: nextReminders,
      summary: buildReminderSummary(nextReminders),
      pageStatus: resolveListStatus(nextReminders),
      errorMessage: ""
    });
  },

  async loadReminders(options = {}) {
    const { silent = false } = options;
    if (!silent) {
      this.setData({
        pageStatus: PAGE_STATUS.LOADING,
        errorMessage: ""
      });
    }

    try {
      const res = await request("/reminders", {
        cacheKey: CACHE_KEYS.reminders
      });
      this.applyReminders(res.data || []);
    } catch (error) {
      if (this.data.reminders.length) return;
      this.setData({
        reminders: [],
        summary: buildReminderSummary([]),
        pageStatus: PAGE_STATUS.ERROR,
        errorMessage: getErrorMessage(error, "复查提醒加载失败，请稍后重试")
      });
    }
  },

  async onPullDownRefresh() {
    await this.loadReminders({ silent: true });
    wx.stopPullDownRefresh();
  },

  createReminder() {
    if (!isLoggedIn()) {
      openRoute(ROUTES.login);
      return;
    }
    openRoute(ROUTES.reminderForm);
  },

  editReminder(event) {
    if (!isLoggedIn()) {
      showErrorModal("登录后可编辑个人复查提醒。");
      return;
    }
    openRoute(ROUTES.reminderForm, { id: event.currentTarget.dataset.id });
  },

  async markDone(event) {
    const id = event.currentTarget.dataset.id;
    try {
      const res = await request(`/reminders/${id}/done`, { method: "PATCH" });
      const reminder = res.data;
      updateCachedListItem(CACHE_KEYS.reminders, id, reminder);
      setCachedData(CACHE_KEYS.reminderDetail(id), res);
      markCacheDirty(CACHE_KEYS.home);
      showSuccessToast("已完成");
      if (wx.vibrateShort) wx.vibrateShort({ type: "light" });
      const reminders = this.data.reminders.map((item) => (
        item.id === id ? reminder : item
      ));
      this.applyReminders(reminders);
    } catch (error) {
      showErrorToast(error, "操作失败");
    }
  },

  async subscribeReminder(event) {
    const id = event.currentTarget.dataset.id;
    if (!id || this.data.sendingReminderId) return;

    this.setData({ sendingReminderId: id });
    try {
      const subscription = await requestReminderSubscription();
      if (!subscription.available) {
        wx.showToast({ title: subscription.message, icon: "none" });
        return;
      }
      if (!subscription.accepted) {
        wx.showToast({ title: subscription.message, icon: "none" });
        return;
      }

      const res = await request(`/reminders/${id}/subscription`, {
        method: "POST"
      });
      showSuccessToast(res.data?.message || "复查提醒已发送");
    } catch (error) {
      showErrorToast(error, "微信提醒发送失败");
    } finally {
      this.setData({ sendingReminderId: "" });
    }
  },

  deleteReminder(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除提醒",
      content: "确认删除这条复查提醒吗？",
      confirmColor: "#d32f2f",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request(`/reminders/${id}`, { method: "DELETE" });
          removeCachedListItem(CACHE_KEYS.reminders, id);
          clearCachedData(CACHE_KEYS.reminderDetail(id));
          markCacheDirty(CACHE_KEYS.home);
          const reminders = this.data.reminders.filter((item) => item.id !== id);
          showSuccessToast("已删除");
          this.applyReminders(reminders);
        } catch (error) {
          showErrorToast(error, "删除失败");
        }
      }
    });
  }
});
