const {
  request,
  CACHE_KEYS,
  getCachedData,
  isCacheFresh,
  consumeCacheDirty,
  removeCachedListItem,
  markCacheDirty
} = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");
const { PAGE_STATUS, resolveListStatus } = require("../../utils/page-state");
const { showErrorToast, showSuccessToast, getErrorMessage } = require("../../utils/feedback");

function buildRecordSummary(records) {
  const latest = records[0] || null;
  const pendingCount = records.filter((item) => {
    const status = String(item.status || "");
    return status.indexOf("待") > -1 || status.indexOf("复查") > -1;
  }).length;

  return {
    total: records.length,
    pending: pendingCount,
    latestDate: latest ? latest.date : "暂无",
    trendText: records.length ? "记录持续更新" : "等待建立记录"
  };
}

Page({
  data: {
    records: [],
    summary: buildRecordSummary([]),
    pageStatus: PAGE_STATUS.LOADING,
    errorMessage: ""
  },

  onShow() {
    const cachedRecords = getCachedData(CACHE_KEYS.records);
    const hasCachedRecords = !!(cachedRecords && Array.isArray(cachedRecords.data));

    if (hasCachedRecords) {
      this.applyRecords(cachedRecords.data);
    }

    const shouldRefresh = !hasCachedRecords
      || consumeCacheDirty(CACHE_KEYS.records)
      || !isCacheFresh(CACHE_KEYS.records);

    if (shouldRefresh) {
      this.loadRecords({ silent: hasCachedRecords });
    }
  },

  applyRecords(records) {
    this.setData({
      records,
      summary: buildRecordSummary(records),
      pageStatus: resolveListStatus(records),
      errorMessage: ""
    });
  },

  async loadRecords(options = {}) {
    const { silent = false } = options;
    if (!silent) {
      this.setData({
        pageStatus: PAGE_STATUS.LOADING,
        errorMessage: ""
      });
    }

    try {
      const res = await request("/records", {
        cacheKey: CACHE_KEYS.records
      });
      this.applyRecords(res.data || []);
    } catch (error) {
      if (this.data.records.length) return;
      this.setData({
        records: [],
        summary: buildRecordSummary([]),
        pageStatus: PAGE_STATUS.ERROR,
        errorMessage: getErrorMessage(error, "检查记录加载失败，请稍后重试")
      });
    }
  },

  async onPullDownRefresh() {
    await this.loadRecords({ silent: true });
    wx.stopPullDownRefresh();
  },

  openDetail(event) {
    openRoute(ROUTES.recordDetail, { id: event.currentTarget.dataset.id });
  },

  createRecord() {
    openRoute(ROUTES.recordForm);
  },

  editRecord(event) {
    openRoute(ROUTES.recordForm, { id: event.currentTarget.dataset.id });
  },

  deleteRecord(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除记录",
      content: "删除后无法恢复，确认删除这条检查记录吗？",
      confirmColor: "#d32f2f",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request(`/records/${id}`, { method: "DELETE" });
          removeCachedListItem(CACHE_KEYS.records, id);
          markCacheDirty(CACHE_KEYS.home);
          const records = this.data.records.filter((item) => item.id !== id);
          showSuccessToast("已删除");
          this.applyRecords(records);
        } catch (error) {
          showErrorToast(error, "删除失败");
        }
      }
    });
  }
});
