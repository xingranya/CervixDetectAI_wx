const {
  request,
  CACHE_KEYS,
  getCachedData,
  isCacheFresh,
  consumeCacheDirty,
  removeCachedListItem,
  markCacheDirty,
  isLoggedIn
} = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");
const { PAGE_STATUS, resolveListStatus } = require("../../utils/page-state");
const { showErrorToast, showSuccessToast, getErrorMessage, showErrorModal } = require("../../utils/feedback");

function formatShortDate(value) {
  const text = String(value || "");
  if (text.length >= 10) return text.slice(5, 10).replace("-", "/");
  return text || "暂无";
}

function buildRecordSummary(records) {
  const latest = records[0] || null;
  const pendingCount = records.filter((item) => {
    const status = String(item.status || "");
    return status.indexOf("待") > -1 || status.indexOf("复查") > -1;
  }).length;

  return {
    total: records.length,
    pending: pendingCount,
    latestDate: latest ? formatShortDate(latest.date) : "暂无",
    trendText: records.length ? "记录持续更新" : "等待建立记录"
  };
}

function filterRecords(records, keyword) {
  const query = String(keyword || "").trim().toLowerCase();
  if (!query) return records;
  return records.filter((item) => {
    const values = [item.title, item.project, item.summary, item.status, item.date];
    return values.some((value) => String(value || "").toLowerCase().indexOf(query) > -1);
  });
}

function buildRecordView(record) {
  return {
    ...record,
    dateText: formatShortDate(record.date)
  };
}

function resolveRecordListStatus(allRecords, filteredRecords, keyword) {
  if (String(keyword || "").trim() && allRecords.length) return PAGE_STATUS.READY;
  return resolveListStatus(filteredRecords);
}

Page({
  data: {
    records: [],
    allRecords: [],
    summary: buildRecordSummary([]),
    pageStatus: PAGE_STATUS.LOADING,
    errorMessage: "",
    isGuest: !isLoggedIn(),
    searchKeyword: "",
    searchEmpty: false,
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
        records: [],
        allRecords: [],
        summary: buildRecordSummary([]),
        pageStatus: PAGE_STATUS.EMPTY,
        errorMessage: ""
      });
      return;
    }

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
    const allRecords = records.map(buildRecordView);
    const filteredRecords = filterRecords(allRecords, this.data.searchKeyword);
    const searchEmpty = !!String(this.data.searchKeyword || "").trim() && allRecords.length > 0 && !filteredRecords.length;
    this.setData({
      records: filteredRecords,
      allRecords,
      summary: buildRecordSummary(allRecords),
      pageStatus: resolveRecordListStatus(allRecords, filteredRecords, this.data.searchKeyword),
      searchEmpty,
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
        allRecords: [],
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
    if (!isLoggedIn()) {
      openRoute(ROUTES.login);
      return;
    }
    openRoute(ROUTES.recordForm);
  },

  searchRecords(keyword) {
    return Promise.resolve(filterRecords(this.data.allRecords, keyword).map((item) => ({
      text: `${item.title} ${item.date}`,
      value: item.id
    })));
  },

  onSearchInput(event) {
    const searchKeyword = event.detail.value || "";
    const records = filterRecords(this.data.allRecords, searchKeyword);
    const searchEmpty = !!String(searchKeyword || "").trim() && this.data.allRecords.length > 0 && !records.length;
    this.setData({
      searchKeyword,
      records,
      pageStatus: resolveRecordListStatus(this.data.allRecords, records, searchKeyword),
      searchEmpty
    });
  },

  onSearchClear() {
    this.onSearchInput({ detail: { value: "" } });
  },

  onSearchSelect(event) {
    const id = event.detail.item && event.detail.item.value;
    if (id) openRoute(ROUTES.recordDetail, { id });
  },

  editRecord(event) {
    if (!isLoggedIn()) {
      showErrorModal("登录后可编辑个人检查记录。");
      return;
    }
    openRoute(ROUTES.recordForm, { id: event.currentTarget.dataset.id });
  },

  deleteRecord(event) {
    this.setData({
      confirmDialog: {
        show: true,
        id: event.currentTarget.dataset.id,
        title: "删除记录",
        content: "删除后无法恢复，确认删除这条检查记录吗？"
      }
    });
  },

  closeConfirmDialog() {
    this.setData({
      "confirmDialog.show": false,
      "confirmDialog.id": ""
    });
  },

  async confirmDeleteRecord() {
    const id = this.data.confirmDialog.id;
    this.closeConfirmDialog();
    if (!id) return;
    try {
      await request(`/records/${id}`, { method: "DELETE" });
      removeCachedListItem(CACHE_KEYS.records, id);
      markCacheDirty(CACHE_KEYS.home);
      const records = this.data.allRecords.filter((item) => item.id !== id);
      showSuccessToast("已删除");
      this.applyRecords(records);
    } catch (error) {
      showErrorToast(error, "删除失败");
    }
  }
});
