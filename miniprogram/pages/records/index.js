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

const STATUS_FILTERS = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待关注" },
  { value: "done", label: "已完成" }
];

function isPendingStatus(record) {
  const status = String(record.status || "");
  return status.indexOf("待") > -1 || status.indexOf("复查") > -1;
}

function isDoneStatus(record) {
  return String(record.status || "") === "已完成";
}

function filterByStatus(records, filterValue) {
  if (!filterValue || filterValue === "all") return records;
  if (filterValue === "pending") return records.filter(isPendingStatus);
  if (filterValue === "done") return records.filter(isDoneStatus);
  return records;
}

function buildFilterTabs(allRecords, activeFilter) {
  const pendingCount = allRecords.filter(isPendingStatus).length;
  const doneCount = allRecords.filter(isDoneStatus).length;
  const counts = { all: allRecords.length, pending: pendingCount, done: doneCount };
  return STATUS_FILTERS.map((tab) => ({
    ...tab,
    count: counts[tab.value] || 0,
    active: tab.value === activeFilter
  }));
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
    statusFilter: "all",
    filterTabs: buildFilterTabs([], "all"),
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
        records: [],
        allRecords: [],
        summary: buildRecordSummary([]),
        pageStatus: PAGE_STATUS.EMPTY,
        errorMessage: ""
      });
      return;
    }

    const cachedRecords = getCachedData(CACHE_KEYS.records);
    const hasCachedRecords = !!(cachedRecords && cachedRecords.data);

    if (hasCachedRecords) {
      const cacheData = cachedRecords.data;
      const items = Array.isArray(cacheData) ? cacheData : (cacheData.items || []);
      this._page = (cacheData && cacheData.page) || 1;
      this._hasMore = !!(cacheData && cacheData.hasMore);
      this.applyRecords(items);
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
    const statusFiltered = filterByStatus(allRecords, this.data.statusFilter);
    const filteredRecords = filterRecords(statusFiltered, this.data.searchKeyword);
    const searchEmpty = !!String(this.data.searchKeyword || "").trim() && allRecords.length > 0 && !filteredRecords.length;
    this.setData({
      records: filteredRecords,
      allRecords,
      summary: buildRecordSummary(allRecords),
      filterTabs: buildFilterTabs(allRecords, this.data.statusFilter),
      pageStatus: resolveRecordListStatus(allRecords, filteredRecords, this.data.searchKeyword),
      searchEmpty,
      hasMore: this._hasMore,
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
      const data = res.data || {};
      const items = Array.isArray(data) ? data : (data.items || []);
      this._page = data.page || 1;
      this._hasMore = !!data.hasMore;
      this.applyRecords(items);
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

  async onReachBottom() {
    if (!this._hasMore || this.data.loadingMore || !isLoggedIn()) return;
    this.setData({ loadingMore: true });
    try {
      const nextPage = this._page + 1;
      const res = await request(`/records?page=${nextPage}&pageSize=20`);
      const data = res.data || {};
      const newItems = data.items || [];
      this._page = data.page || nextPage;
      this._hasMore = !!data.hasMore;
      if (newItems.length) {
        const merged = [...this.data.allRecords, ...newItems.map(buildRecordView)];
        this.applyRecords(merged.map((item) => ({
          id: item.id,
          date: item.date,
          title: item.title,
          project: item.project,
          summary: item.summary,
          suggestion: item.suggestion,
          status: item.status,
          hospital: item.hospital,
          doctorName: item.doctorName,
          conclusion: item.conclusion,
          attachments: item.attachments
        })));
        this.setData({ loadingMore: false });
      } else {
        this.setData({ hasMore: false, loadingMore: false });
      }
    } catch (error) {
      this.setData({ loadingMore: false });
    }
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
    const statusFiltered = filterByStatus(this.data.allRecords, this.data.statusFilter);
    const records = filterRecords(statusFiltered, searchKeyword);
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

  onFilterChange(event) {
    const value = event.currentTarget.dataset.value || "all";
    this.setData({ statusFilter: value });
    this.applyRecords(this.data.allRecords);
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
