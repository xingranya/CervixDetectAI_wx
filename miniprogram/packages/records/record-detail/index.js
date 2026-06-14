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

const DIAGNOSIS_KEYWORDS = {
  normal: { keys: ["未见异常", "正常", "阴性", "NILM", "无异常"], label: "正常", tone: "normal" },
  ascus: { keys: ["ASCUS", "ASC-US", "非典型鳞状细胞"], label: "ASCUS", tone: "ascus" },
  lsil: { keys: ["LSIL", "低级别"], label: "LSIL", tone: "lsil" },
  hsil: { keys: ["HSIL", "高级别", "CIN"], label: "HSIL", tone: "hsil" },
  scc: { keys: ["SCC", "鳞状细胞癌", "恶性"], label: "SCC", tone: "scc" }
};

function resolveDiagnosisTone(conclusion) {
  const text = String(conclusion || "").toUpperCase();
  if (!text) return { tone: "", label: "" };
  const order = ["scc", "hsil", "lsil", "ascus", "normal"];
  for (const key of order) {
    const entry = DIAGNOSIS_KEYWORDS[key];
    if (entry.keys.some((k) => text.indexOf(k.toUpperCase()) > -1)) {
      return { tone: entry.tone, label: entry.label };
    }
  }
  return { tone: "", label: "" };
}

function normalizeRecordAttachment(item) {
  if (!item) return null;
  if (typeof item === "string") {
    const url = String(item).trim();
    return url ? { url } : null;
  }

  const url = String(item.url || item.tempFilePath || item.path || "").trim();
  return url ? { ...item, url } : null;
}

function normalizeRecordAttachments(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeRecordAttachment).filter(Boolean);
}

function buildRecordView(record) {
  if (!record) return null;

  const statusText = String(record.status || "已记录");
  const statusTone = statusText.indexOf("待") > -1 || statusText.indexOf("复查") > -1
    ? "attention"
    : "normal";
  const dateParts = String(record.date || "").split("-");
  const dateMonthDay = dateParts.length === 3 ? `${dateParts[1]}-${dateParts[2]}` : record.date;
  const dateYear = dateParts.length === 3 ? dateParts[0] : "";
  const conclusion = String(record.conclusion || "");
  const diagnosis = resolveDiagnosisTone(conclusion);
  const attachments = normalizeRecordAttachments(record.attachments);

  return {
    ...record,
    attachments,
    statusText,
    statusTone,
    dateMonthDay,
    dateYear,
    summaryText: record.summary || "暂无检查摘要",
    suggestionText: record.suggestion || "暂无后续提醒",
    projectText: record.project || "检查摘要记录",
    hospital: record.hospital || "",
    doctorName: record.doctorName || "",
    conclusionText: conclusion || "",
    diagnosisTone: diagnosis.tone,
    diagnosisToneLabel: diagnosis.label
  };
}

Page({
  data: {
    id: "",
    record: null,
    recordView: null,
    pageStatus: PAGE_STATUS.LOADING,
    errorMessage: "",
    canSubscribeReport: hasReportSubscriptionTemplate(),
    subscribingReport: false,
    confirmDialog: {
      show: false
    }
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
        recordView: buildRecordView(cachedDetail.data),
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
          recordView: buildRecordView(record),
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
        recordView: buildRecordView(res.data),
        pageStatus: resolveDetailStatus(res.data),
        errorMessage: ""
      });
    } catch (error) {
      if (this.data.record) return;
      this.setData({
        record: null,
        recordView: null,
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
    this.setData({ "confirmDialog.show": true });
  },

  closeConfirmDialog() {
    this.setData({ "confirmDialog.show": false });
  },

  async confirmDeleteRecord() {
    this.closeConfirmDialog();
    try {
      await request(`/records/${this.data.record.id}`, { method: "DELETE" });
      removeCachedListItem(CACHE_KEYS.records, this.data.record.id);
      clearCachedData(CACHE_KEYS.recordDetail(this.data.record.id));
      markCacheDirty(CACHE_KEYS.home);
      if (wx.vibrateShort) wx.vibrateShort({ type: "medium" });
      showSuccessToast("已删除");
      navigateBackLater();
    } catch (error) {
      showErrorToast(error, "删除失败");
    }
  },

  previewImage(event) {
    const index = Number(event.currentTarget.dataset.index || 0);
    const attachments = this.data.recordView ? this.data.recordView.attachments : [];
    const urls = attachments.map((item) => item.url);
    if (urls.length) {
      wx.previewImage({ current: urls[index], urls });
    }
  }
});
