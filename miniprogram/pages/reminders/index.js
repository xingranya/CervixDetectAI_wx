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

function formatShortDate(value) {
  const text = String(value || "");
  if (text.length >= 10) return text.slice(5, 10).replace("-", "/");
  return text || "暂无";
}

function buildReminderSummary(reminders) {
  const pending = reminders.filter((item) => !item.done);
  return {
    total: reminders.length,
    pending: pending.length,
    nextDate: pending.length ? formatShortDate(pending[0].date) : "暂无",
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

function filterReminders(reminders, keyword) {
  const query = String(keyword || "").trim().toLowerCase();
  if (!query) return reminders;
  return reminders.filter((item) => {
    const values = [item.title, item.desc, item.statusText, item.date];
    return values.some((value) => String(value || "").toLowerCase().indexOf(query) > -1);
  });
}

function buildReminderView(reminder) {
  const dateText = String(reminder.date || "");
  return {
    ...reminder,
    dateMonthDay: formatShortDate(dateText),
    dateYear: dateText.length >= 4 ? dateText.slice(0, 4) : "",
    statusText: reminder.done ? "已完成" : "待处理",
    canNotify: hasReminderSubscriptionTemplate()
  };
}

function resolveReminderListStatus(allReminders, filteredReminders, keyword) {
  if (String(keyword || "").trim() && allReminders.length) return PAGE_STATUS.READY;
  return resolveListStatus(filteredReminders);
}

Page({
  data: {
    reminders: [],
    allReminders: [],
    summary: buildReminderSummary([]),
    pageStatus: PAGE_STATUS.LOADING,
    errorMessage: "",
    isGuest: !isLoggedIn(),
    canSubscribeReminder: hasReminderSubscriptionTemplate(),
    sendingReminderId: "",
    searchKeyword: "",
    searchEmpty: false,
    refreshing: false,
    confirmDialog: {
      show: false,
      id: "",
      title: "",
      content: ""
    }
  },

  onShow() {
    const guest = !isLoggedIn();
    this.setData({ isGuest: guest });
    if (guest) {
      this.setData({
        reminders: [],
        allReminders: [],
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
    const filteredReminders = filterReminders(nextReminders, this.data.searchKeyword);
    const searchEmpty = !!String(this.data.searchKeyword || "").trim() && nextReminders.length > 0 && !filteredReminders.length;
    this.setData({
      reminders: filteredReminders,
      allReminders: nextReminders,
      summary: buildReminderSummary(nextReminders),
      pageStatus: resolveReminderListStatus(nextReminders, filteredReminders, this.data.searchKeyword),
      searchEmpty,
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
        allReminders: [],
        summary: buildReminderSummary([]),
        pageStatus: PAGE_STATUS.ERROR,
        errorMessage: getErrorMessage(error, "复查提醒加载失败，请稍后重试")
      });
    }
  },

  async onPullDownRefresh() {
    this.setData({ refreshing: true });
    await this.loadReminders({ silent: true });
    this.setData({ refreshing: false });
    wx.stopPullDownRefresh();
  },

  onShareAppMessage() {
    return {
      title: "云端智诊 - 复查提醒",
      path: "/pages/reminders/index"
    };
  },

  onShareTimeline() {
    return {
      title: "云端智诊 - 复查提醒"
    };
  },

  createReminder() {
    if (!isLoggedIn()) {
      openRoute(ROUTES.login);
      return;
    }
    openRoute(ROUTES.reminderForm);
  },

  searchReminders(keyword) {
    return Promise.resolve(filterReminders(this.data.allReminders, keyword).map((item) => ({
      text: `${item.title} ${item.date}`,
      value: item.id
    })));
  },

  onSearchChange(event) {
    const searchKeyword = event.detail.value || "";
    const reminders = filterReminders(this.data.allReminders, searchKeyword);
    const searchEmpty = !!String(searchKeyword || "").trim() && this.data.allReminders.length > 0 && !reminders.length;
    this.setData({
      searchKeyword,
      reminders,
      pageStatus: resolveReminderListStatus(this.data.allReminders, reminders, searchKeyword),
      searchEmpty
    });
  },

  onSearchClear() {
    this.onSearchChange({ detail: { value: "" } });
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
      const reminders = this.data.allReminders.map((item) => (
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
    this.setData({
      confirmDialog: {
        show: true,
        id: event.currentTarget.dataset.id,
        title: "删除提醒",
        content: "确认删除这条复查提醒吗？"
      }
    });
  },

  closeConfirmDialog() {
    this.setData({
      "confirmDialog.show": false,
      "confirmDialog.id": ""
    });
  },

  async confirmDeleteReminder() {
    const id = this.data.confirmDialog.id;
    this.closeConfirmDialog();
    if (!id) return;
    try {
      await request(`/reminders/${id}`, { method: "DELETE" });
      removeCachedListItem(CACHE_KEYS.reminders, id);
      clearCachedData(CACHE_KEYS.reminderDetail(id));
      markCacheDirty(CACHE_KEYS.home);
      const reminders = this.data.allReminders.filter((item) => item.id !== id);
      showSuccessToast("已删除");
      this.applyReminders(reminders);
    } catch (error) {
      showErrorToast(error, "删除失败");
    }
  }
});
