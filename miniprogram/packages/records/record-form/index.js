const {
  request,
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  upsertCachedListItem,
  markCacheDirty,
  isLoggedIn
} = require("../../../utils/request");
const { withPageLoading } = require("../../../utils/form");
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
      status: "已记录"
    }
  }
];

function normalizeStatus(status) {
  return statusOptions.indexOf(status) > -1 ? status : statusOptions[0];
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
    status: normalizeStatus(source.status)
  };
}

function buildFormState(form) {
  const nextForm = normalizeForm(form);
  return {
    date: nextForm.date,
    title: nextForm.title,
    project: nextForm.project,
    summary: nextForm.summary,
    suggestion: nextForm.suggestion,
    status: nextForm.status,
    summaryLength: nextForm.summary.length,
    suggestionLength: nextForm.suggestion.length
  };
}

function buildFormPayload(data) {
  return {
    date: String(data.date || ""),
    title: String(data.title || ""),
    project: String(data.project || ""),
    summary: String(data.summary || ""),
    suggestion: String(data.suggestion || ""),
    status: normalizeStatus(data.status)
  };
}

Page({
  data: {
    id: "",
    ...buildFormState(defaultForm),
    errorMessage: "",
    loading: false
  },

  async onLoad(query) {
    if (!isLoggedIn()) {
      await showErrorModal("登录后可保存个人检查记录。");
      openRoute(ROUTES.login, {}, { redirect: true });
      return;
    }

    if (query.id) {
      this.setData({ id: query.id });
      const cachedDetail = getCachedData(CACHE_KEYS.recordDetail(query.id));
      if (cachedDetail && cachedDetail.data) {
        this.setData({
          ...buildFormState(cachedDetail.data)
        });
      }
      this.loadRecord(query.id);
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
        ...buildFormState(res.data)
      });
    } catch (error) {
      showErrorToast(error, "加载失败");
    }
  },

  updateTextField(field, inputValue) {
    const value = String(inputValue || "");
    const updates = {
      [field]: value,
      errorMessage: ""
    };
    if (field === "summary") {
      updates.summaryLength = value.length;
    }
    if (field === "suggestion") {
      updates.suggestionLength = value.length;
    }
    this.setData(updates);
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

  onDateChange(event) {
    this.setData({
      date: event.detail.value,
      errorMessage: ""
    });
  },

  applyTemplate(event) {
    const index = Number(event.currentTarget.dataset.index || 0);
    const template = recordTemplates[index];
    if (!template) return;
    const nextForm = {
      ...buildFormPayload(this.data),
      ...template.form,
      date: this.data.date || getTodayDate()
    };
    this.setData({
      ...buildFormState(nextForm),
      errorMessage: ""
    });
  },

  selectStatus(event) {
    this.setData({
      status: normalizeStatus(event.currentTarget.dataset.status),
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

  async submitForm() {
    if (!this.validateForm()) return;

    const method = this.data.id ? "PUT" : "POST";
    const path = this.data.id ? `/records/${this.data.id}` : "/records";

    await withPageLoading(this, async () => {
      const res = await request(path, {
        method,
        data: buildFormPayload(this.data)
      });
      const savedRecord = res.data;
      setCachedData(CACHE_KEYS.recordDetail(savedRecord.id), res);
      upsertCachedListItem(CACHE_KEYS.records, savedRecord, { prepend: !this.data.id });
      markCacheDirty(CACHE_KEYS.home);
      showSuccessToast("已保存");
      navigateBackLater();
    }).catch((error) => {
      showErrorToast(error, "保存失败");
    });
  }
});
