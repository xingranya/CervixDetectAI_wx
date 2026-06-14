const {
  request,
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  upsertCachedListItem,
  markCacheDirty,
  isLoggedIn
} = require("../../../utils/request");
const { withPageLoading, DRAFT_KEYS, saveDraft, loadDraft, clearDraft, formHasData, debounce } = require("../../../utils/form");
const { showErrorToast, showSuccessToast, showErrorModal } = require("../../../utils/feedback");
const { ROUTES, openRoute, navigateBackLater } = require("../../../utils/navigation");

function getTodayDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const defaultForm = {
  date: "",
  title: "",
  project: "",
  summary: "",
  suggestion: "",
  conclusion: "",
  hospital: "",
  doctorName: "",
  attachments: [],
  status: "已记录"
};

const statusOptions = ["已记录", "待复查", "待关注", "已完成"];
const recordTemplates = [
  {
    name: "筛查摘要",
    desc: "TCT / HPV 等摘要",
    form: {
      title: "女性健康筛查记录",
      project: "TCT / HPV 摘要记录",
      summary: "已完成本次检查摘要记录，后续可结合历史记录持续关注变化。",
      suggestion: "建议保存本次摘要，并按计划管理后续复查安排。",
      conclusion: "",
      hospital: "",
      doctorName: "",
      status: "待复查"
    }
  },
  {
    name: "复查准备",
    desc: "复查前资料整理",
    form: {
      title: "复查前资料整理",
      project: "历史检查资料整理",
      summary: "已整理近期检查日期、项目和摘要，方便复查前快速回顾。",
      suggestion: "建议复查前再次确认资料是否齐全，并提前列出需要咨询的问题。",
      conclusion: "",
      hospital: "",
      doctorName: "",
      status: "待关注"
    }
  },
  {
    name: "日常记录",
    desc: "补充普通健康记录",
    form: {
      title: "健康检查记录",
      project: "检查摘要记录",
      summary: "已记录本次检查摘要，便于后续咨询或复查时查看。",
      suggestion: "建议保留历史记录，后续咨询时一并出示。",
      conclusion: "",
      hospital: "",
      doctorName: "",
      status: "已记录"
    }
  }
];
const formRules = [
  { name: "date", rules: { required: true, message: "请选择检查日期" } },
  { name: "title", rules: { required: true, message: "请填写记录标题" } },
  { name: "project", rules: { required: true, message: "请填写检查项目" } },
  { name: "summary", rules: { required: true, message: "请填写摘要" } },
  { name: "suggestion", rules: { required: true, message: "请填写提醒建议" } },
  { name: "status", rules: { required: true, message: "请选择记录状态" } }
];

function normalizeStatus(status) {
  return statusOptions.indexOf(status) > -1 ? status : statusOptions[0];
}

function buildStatusItems(activeStatus) {
  return statusOptions.map((status) => ({
    label: status,
    value: status,
    checked: status === activeStatus
  }));
}

function normalizeForm(form) {
  const source = form || {};
  return {
    ...defaultForm,
    ...source,
    date: String(source.date || defaultForm.date),
    title: String(source.title || defaultForm.title),
    project: String(source.project || defaultForm.project),
    summary: String(source.summary || defaultForm.summary),
    suggestion: String(source.suggestion || defaultForm.suggestion),
    conclusion: String(source.conclusion || defaultForm.conclusion),
    hospital: String(source.hospital || defaultForm.hospital),
    doctorName: String(source.doctorName || defaultForm.doctorName),
    attachments: Array.isArray(source.attachments) ? source.attachments : [],
    status: normalizeStatus(source.status)
  };
}

function buildFormState(form) {
  const nextForm = normalizeForm(form);
  return {
    formModel: {
      date: nextForm.date,
      title: nextForm.title,
      project: nextForm.project,
      summary: nextForm.summary,
      suggestion: nextForm.suggestion,
      status: nextForm.status
    },
    today: getTodayDate(),
    pageTitle: "新增检查记录",
    date: nextForm.date,
    dateDisplay: nextForm.date || "请选择日期",
    title: nextForm.title,
    project: nextForm.project,
    summary: nextForm.summary,
    suggestion: nextForm.suggestion,
    conclusion: nextForm.conclusion,
    hospital: nextForm.hospital,
    doctorName: nextForm.doctorName,
    attachments: nextForm.attachments,
    status: nextForm.status,
    statusItems: buildStatusItems(nextForm.status),
    summaryLength: nextForm.summary.length,
    suggestionLength: nextForm.suggestion.length,
    conclusionLength: nextForm.conclusion.length
  };
}

function buildFormPayload(data) {
  return {
    date: String(data.date || ""),
    title: String(data.title || ""),
    project: String(data.project || ""),
    summary: String(data.summary || ""),
    suggestion: String(data.suggestion || ""),
    conclusion: String(data.conclusion || ""),
    hospital: String(data.hospital || ""),
    doctorName: String(data.doctorName || ""),
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    status: normalizeStatus(data.status)
  };
}

Page({
  data: {
    id: "",
    ...buildFormState(defaultForm),
    formRules,
    submitText: "保存记录",
    errorMessage: "",
    loading: false,
    fieldErrors: {}
  },

  async onLoad(query) {
    if (!isLoggedIn()) {
      await showErrorModal("登录后可保存个人检查记录。");
      openRoute(ROUTES.login, {}, { redirect: true });
      return;
    }

    wx.setNavigationBarTitle({ title: query.id ? "编辑检查记录" : "新增检查记录" });

    if (query.id) {
      this.setData({
        id: query.id,
        pageTitle: "编辑检查记录"
      });
      const cachedDetail = getCachedData(CACHE_KEYS.recordDetail(query.id));
      if (cachedDetail && cachedDetail.data) {
        this.setData({
          ...buildFormState(cachedDetail.data),
          pageTitle: "编辑检查记录"
        });
      }
      this.loadRecord(query.id);
      return;
    }

    this._initDraftSave();

    const draft = loadDraft(DRAFT_KEYS.record);
    if (draft && draft.data) {
      wx.showModal({
        title: "发现草稿",
        content: "有未保存的记录草稿，是否恢复？",
        confirmText: "恢复",
        cancelText: "忽略",
        success: (res) => {
          if (res.confirm) {
            this.setData(buildFormState(draft.data));
          } else {
            clearDraft(DRAFT_KEYS.record);
            this.setData(buildFormState({ ...defaultForm, date: getTodayDate() }));
          }
        }
      });
      return;
    }
    this.setData(buildFormState({ ...defaultForm, date: getTodayDate() }));
  },

  async loadRecord(id) {
    try {
      const res = await request(`/records/${id}`, {
        cacheKey: CACHE_KEYS.recordDetail(id)
      });
      this.setData({
        ...buildFormState(res.data),
        pageTitle: "编辑检查记录"
      });
    } catch (error) {
      showErrorToast(error, "加载失败");
    }
  },

  _initDraftSave() {
    this._saveDraft = debounce(() => {
      saveDraft(DRAFT_KEYS.record, buildFormPayload(this.data));
    }, 300);
  },

  _triggerDraftSave() {
    if (this._saveDraft) this._saveDraft();
  },

  updateTextField(field, inputValue) {
    const value = String(inputValue || "");
    const updates = {
      [field]: value,
      [`formModel.${field}`]: value,
      errorMessage: ""
    };
    if (field === "summary") {
      updates.summaryLength = value.length;
    }
    if (field === "suggestion") {
      updates.suggestionLength = value.length;
    }
    if (field === "conclusion") {
      updates.conclusionLength = value.length;
    }
    this.setData(updates);
    this._triggerDraftSave();
  },

  onTitleInput(event) {
    this.updateTextField("title", event.detail.value);
  },

  onProjectInput(event) {
    this.updateTextField("project", event.detail.value);
  },

  onSummaryInput(event) {
    this.updateTextField("summary", event.detail.value);
  },

  onSuggestionInput(event) {
    this.updateTextField("suggestion", event.detail.value);
  },

  onConclusionInput(event) {
    this.updateTextField("conclusion", event.detail.value);
  },

  onHospitalInput(event) {
    this.updateTextField("hospital", event.detail.value);
  },

  onDoctorNameInput(event) {
    this.updateTextField("doctorName", event.detail.value);
  },

  chooseAttachment() {
    const remaining = 9 - this.data.attachments.length;
    if (remaining <= 0) return;
    wx.chooseMedia({
      count: remaining,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const newItems = (res.tempFiles || []).map((file) => ({
          url: file.tempFilePath,
          tempFilePath: file.tempFilePath
        }));
        this.setData({
          attachments: [...this.data.attachments, ...newItems]
        });
      }
    });
  },

  previewAttachment(event) {
    const index = Number(event.currentTarget.dataset.index || 0);
    const urls = this.data.attachments.map((item) => item.url);
    wx.previewImage({ current: urls[index], urls });
  },

  removeAttachment(event) {
    const index = Number(event.currentTarget.dataset.index || 0);
    const attachments = this.data.attachments.filter((_, i) => i !== index);
    this.setData({ attachments });
  },

  onDateChange(event) {
    this.setData({
      date: event.detail.value,
      "formModel.date": event.detail.value,
      dateDisplay: event.detail.value || "请选择日期",
      errorMessage: ""
    });
    this._triggerDraftSave();
  },

  applyTemplate(event) {
    const index = Number(event.currentTarget.dataset.index || 0);
    const template = recordTemplates[index];
    if (!template) return;

    const RECORD_FIELDS = ["title", "project", "summary", "suggestion", "conclusion", "hospital", "doctorName"];
    if (formHasData(this.data, RECORD_FIELDS)) {
      wx.showModal({
        title: "应用模板",
        content: "当前表单已有内容，应用模板将覆盖现有数据，是否继续？",
        confirmText: "覆盖",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) this._doApplyTemplate(template);
        }
      });
      return;
    }
    this._doApplyTemplate(template);
  },

  _doApplyTemplate(template) {
    const nextForm = {
      ...buildFormPayload(this.data),
      ...template.form,
      date: this.data.date || getTodayDate()
    };
    this.setData({
      ...buildFormState(nextForm),
      errorMessage: ""
    });
    this._triggerDraftSave();
  },

  selectStatus(event) {
    const status = normalizeStatus(event.currentTarget.dataset.status);
    this.setData({
      status,
      "formModel.status": status,
      statusItems: buildStatusItems(status),
      errorMessage: ""
    });
  },

  onStatusChange(event) {
    const value = Array.isArray(event.detail.value) ? event.detail.value[0] : event.detail.value;
    const status = normalizeStatus(value);
    this.setData({
      status,
      "formModel.status": status,
      statusItems: buildStatusItems(status),
      errorMessage: ""
    });
  },

  validateForm() {
    const form = buildFormPayload(this.data);
    const requiredFields = [
      ["date", "请选择检查日期"],
      ["title", "请填写记录标题"],
      ["project", "请填写检查项目"],
      ["summary", "请填写摘要"],
      ["suggestion", "请填写提醒建议"]
    ];

    const missing = requiredFields.find(([field]) => !String(form[field] || "").trim());
    if (missing) {
      this.setData({ errorMessage: missing[1] });
      return false;
    }
    this.setData({ errorMessage: "" });
    return true;
  },

  validateField(field) {
    const value = String(this.data[field] || "").trim();
    const labels = {
      date: "请选择检查日期",
      title: "请填写记录标题",
      project: "请填写检查项目",
      summary: "请填写摘要",
      suggestion: "请填写提醒建议"
    };
    return value ? "" : (labels[field] || "");
  },

  onFieldBlur(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    const error = this.validateField(field);
    this.setData({ [`fieldErrors.${field}`]: error });
  },

  onFormFail(event) {
    const errors = event.detail && event.detail.errors;
    const firstError = Array.isArray(errors) && errors[0] ? errors[0] : null;
    this.setData({
      errorMessage: firstError && firstError.message ? firstError.message : "请完善必填信息"
    });
  },

  async submitForm() {
    if (!this.validateForm()) return;

    const method = this.data.id ? "PUT" : "POST";
    const path = this.data.id ? `/records/${this.data.id}` : "/records";

    this.setData({ submitText: "正在保存" });
    await withPageLoading(this, async () => {
      const res = await request(path, {
        method,
        data: buildFormPayload(this.data)
      });
      const savedRecord = res.data;
      setCachedData(CACHE_KEYS.recordDetail(savedRecord.id), res);
      upsertCachedListItem(CACHE_KEYS.records, savedRecord, { prepend: !this.data.id });
      markCacheDirty(CACHE_KEYS.home);
      clearDraft(DRAFT_KEYS.record);
      showSuccessToast("已保存");
      navigateBackLater();
    }).catch((error) => {
      this.setData({ submitText: "保存记录" });
      showErrorToast(error, "保存失败");
    });
  }
});
