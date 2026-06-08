const {
  request,
  CACHE_KEYS,
  getCachedData,
  clearCachedData,
  removeCachedListItem,
  isCacheFresh,
  markCacheDirty,
  isLoggedIn
} = require("../../../utils/request");
const { ROUTES, openRoute, navigateBackLater } = require("../../../utils/navigation");
const { PAGE_STATUS, resolveDetailStatus } = require("../../../utils/page-state");
const { showErrorToast, showSuccessToast, getErrorMessage, showErrorModal } = require("../../../utils/feedback");
const {
  hasReportSubscriptionTemplate,
  requestReportSubscription
} = require("../utils/report-subscription");

Page({
  data: {
    id: "",
    record: null,
    pageStatus: PAGE_STATUS.LOADING,
    errorMessage: "",
    canSubscribeReport: hasReportSubscriptionTemplate(),
    subscribingReport: false
  },

  async onLoad(query) {
    if (!isLoggedIn()) {
      await showErrorModal("登录后可查看个人检查记录详情。");
      openRoute(ROUTES.login, {}, { redirect: true });
      return;
    }

    this.setData({ id: query.id || "" });
    this.hydrateRecord();
  },

  onShow() {
    if (!this.data.id) return;
    const cacheKey = CACHE_KEYS.recordDetail(this.data.id);
    if (!this.data.record || !isCacheFresh(cacheKey)) {
      this.loadDetail(this.data.id, { silent: !!this.data.record });
    }
  },

  reloadDetail() {
    if (!this.data.id) return;
    this.loadDetail(this.data.id);
  },

  hydrateRecord() {
    const cacheKey = CACHE_KEYS.recordDetail(this.data.id);
    const cachedDetail = getCachedData(cacheKey);
    if (cachedDetail && cachedDetail.data) {
      this.setData({
        record: cachedDetail.data,
        pageStatus: resolveDetailStatus(cachedDetail.data),
        errorMessage: ""
      });
      return;
    }

    const cachedRecords = getCachedData(CACHE_KEYS.records);
    if (cachedRecords && Array.isArray(cachedRecords.data)) {
      const record = cachedRecords.data.find((item) => item.id === this.data.id);
      if (record) {
        this.setData({
          record,
          pageStatus: resolveDetailStatus(record),
          errorMessage: ""
        });
      }
    }
  },

  async loadDetail(id, options = {}) {
    const { silent = false } = options;
    if (!silent) {
      this.setData({
        pageStatus: PAGE_STATUS.LOADING,
        errorMessage: ""
      });
    }

    try {
      const res = await request(`/records/${id}`, {
        cacheKey: CACHE_KEYS.recordDetail(id)
      });
      this.setData({
        record: res.data,
        pageStatus: resolveDetailStatus(res.data),
        errorMessage: ""
      });
    } catch (error) {
      if (this.data.record) return;
      this.setData({
        record: null,
        pageStatus: PAGE_STATUS.ERROR,
        errorMessage: getErrorMessage(error, "加载失败")
      });
    }
  },

  editRecord() {
    openRoute(ROUTES.recordForm, { id: this.data.record.id });
  },

  async subscribeReportReminder() {
    if (!this.data.record || this.data.subscribingReport) return;

    this.setData({ subscribingReport: true });
    try {
      const subscription = await requestReportSubscription();
      if (!subscription.available) {
        wx.showToast({ title: subscription.message, icon: "none" });
        return;
      }
      if (!subscription.accepted) {
        wx.showToast({ title: subscription.message, icon: "none" });
        return;
      }

      const res = await request(`/records/${this.data.record.id}/report-subscription`, {
        method: "POST"
      });
      showSuccessToast(res.data?.message || "报告提醒已发送");
    } catch (error) {
      showErrorToast(error, "报告提醒发送失败");
    } finally {
      this.setData({ subscribingReport: false });
    }
  },

  deleteRecord() {
    wx.showModal({
      title: "删除记录",
      content: "删除后无法恢复，确认删除这条检查记录吗？",
      confirmColor: "#d32f2f",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request(`/records/${this.data.record.id}`, { method: "DELETE" });
          removeCachedListItem(CACHE_KEYS.records, this.data.record.id);
          clearCachedData(CACHE_KEYS.recordDetail(this.data.record.id));
          markCacheDirty(CACHE_KEYS.home);
          showSuccessToast("已删除");
          navigateBackLater();
        } catch (error) {
          showErrorToast(error, "删除失败");
        }
      }
    });
  }
});
