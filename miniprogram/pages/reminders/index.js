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

const TYPE_LABELS = {
  follow_up: "复查",
  material: "资料",
  consultation: "咨询",
  record: "整理"
};

const TYPE_TONES = {
  follow_up: "primary",
  material: "info",
  consultation: "warning",
  record: "success"
};

const TYPE_FILTERS = [
  { value: "all", label: "全部" },
  { value: "follow_up", label: "复查" },
  { value: "material", label: "资料" },
  { value: "consultation", label: "咨询" }
];

function buildReminderView(reminder) {
  const dateText = String(reminder.date || "");
  const type = String(reminder.type || "follow_up");
  return {
    ...reminder,
    dateMonthDay: formatShortDate(dateText),
    dateYear: dateText.length >= 4 ? dateText.slice(0, 4) : "",
    statusText: reminder.done ? "已完成" : "待处理",
    typeLabel: TYPE_LABELS[type] || "",
    typeTone: TYPE_TONES[type] || "primary",
    priority: reminder.priority || "medium",
    notes: reminder.notes || "",
    canNotify: hasReminderSubscriptionTemplate()
  };
}

function resolveReminderListStatus(allReminders, filteredReminders, keyword) {
  if (String(keyword || "").trim() && allReminders.length) return PAGE_STATUS.READY;
  return resolveListStatus(filteredReminders);
}

function filterByType(reminders, typeValue) {
  if (!typeValue || typeValue === "all") return reminders;
  return reminders.filter((item) => String(item.type || "follow_up") === typeValue);
}

function buildTypeTabs(reminders, activeFilter) {
  const counts = { all: reminders.length };
  reminders.forEach((item) => {
    const t = String(item.type || "follow_up");
    counts[t] = (counts[t] || 0) + 1;
  });
  return TYPE_FILTERS.map((tab) => ({
    ...tab,
    count: counts[tab.value] || 0,
    active: tab.value === activeFilter
  }));
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
    typeFilter: "all",
    typeTabs: buildTypeTabs([], "all"),
    loadingMore: false,
    hasMore: false,
    confirmDialog: {
      show: false,
      id: "",
      title: "",
      content: ""
    }
  },

  _page: 1,
  _hasMore: false,

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
    const hasCachedReminders = !!(cachedReminders && cachedReminders.data);

    if (hasCachedReminders) {
      const cacheData = cachedReminders.data;
      const items = Array.isArray(cacheData) ? cacheData : (cacheData.items || []);
      this._page = (cacheData && cacheData.page) || 1;
      this._hasMore = !!(cacheData && cacheData.hasMore);
      this.applyReminders(items);
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
    const typeFiltered = filterByType(nextReminders, this.data.typeFilter);
    const filteredReminders = filterReminders(typeFiltered, this.data.searchKeyword);
    const searchEmpty = !!String(this.data.searchKeyword || "").trim() && nextReminders.length > 0 && !filteredReminders.length;
    this.setData({
      reminders: filteredReminders,
      allReminders: nextReminders,
      summary: buildReminderSummary(nextReminders),
      typeTabs: buildTypeTabs(nextReminders, this.data.typeFilter),
      pageStatus: resolveReminderListStatus(nextReminders, filteredReminders, this.data.searchKeyword),
      searchEmpty,
      hasMore: this._hasMore,
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
      const data = res.data || {};
      const items = Array.isArray(data) ? data : (data.items || []);
      this._page = data.page || 1;
      this._hasMore = !!data.hasMore;
      this.applyReminders(items);
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
    await this.loadReminders({ silent: true });
    wx.stopPullDownRefresh();
  },

  async onReachBottom() {
    if (!this._hasMore || this.data.loadingMore || !isLoggedIn()) return;
    this.setData({ loadingMore: true });
    try {
      const nextPage = this._page + 1;
      const res = await request(`/reminders?page=${nextPage}&pageSize=20`);
      const data = res.data || {};
      const newItems = data.items || [];
      this._page = data.page || nextPage;
      this._hasMore = !!data.hasMore;
      if (newItems.length) {
        const merged = [...this.data.allReminders, ...newItems.map(buildReminderView)];
        this.applyReminders(merged.map((item) => ({
          id: item.id,
          title: item.title,
          date: item.date,
          desc: item.desc,
          type: item.type,
          priority: item.priority,
          linkedRecordId: item.linkedRecordId,
          notes: item.notes,
          done: item.done
        })));
        this.setData({ loadingMore: false });
      } else {
        this.setData({ hasMore: false, loadingMore: false });
      }
    } catch (error) {
      this.setData({ loadingMore: false });
    }
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

  onSearchInput(event) {
    const searchKeyword = event.detail.value || "";
    const typeFiltered = filterByType(this.data.allReminders, this.data.typeFilter);
    const reminders = filterReminders(typeFiltered, searchKeyword);
    const searchEmpty = !!String(searchKeyword || "").trim() && this.data.allReminders.length > 0 && !reminders.length;
    this.setData({
      searchKeyword,
      reminders,
      pageStatus: resolveReminderListStatus(this.data.allReminders, reminders, searchKeyword),
      searchEmpty
    });
  },

  onSearchClear() {
    this.onSearchInput({ detail: { value: "" } });
  },

  onTypeFilterChange(event) {
    const value = event.currentTarget.dataset.value || "all";
    this.setData({ typeFilter: value });
    this.applyReminders(this.data.allReminders);
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
