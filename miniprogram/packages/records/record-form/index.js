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

function findStatusIndex(status) {
  const index = statusOptions.indexOf(status);
  return index > -1 ? index : 0;
}

Page({
  data: {
    id: "",
    form: { ...defaultForm },
    recordTemplates,
    statusOptions,
    statusIndex: findStatusIndex(defaultForm.status),
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
          form: cachedDetail.data,
          statusIndex: findStatusIndex(cachedDetail.data.status)
        });
      }
      this.loadRecord(query.id);
      return;
    }
    this.setData({ form: { ...defaultForm, date: getTodayDate() } });
  },

  async loadRecord(id) {
    try {
      const res = await request(`/records/${id}`, {
        cacheKey: CACHE_KEYS.recordDetail(id)
      });
      this.setData({
        form: res.data,
        statusIndex: findStatusIndex(res.data.status)
      });
    } catch (error) {
      showErrorToast(error, "加载失败");
    }
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value,
      errorMessage: ""
    });
  },

  onDateChange(event) {
    this.setData({
      "form.date": event.detail.value,
      errorMessage: ""
    });
  },

  onStatusChange(event) {
    const index = Number(event.detail.value || 0);
    this.setData({
      statusIndex: index,
      "form.status": statusOptions[index] || statusOptions[0],
      errorMessage: ""
    });
  },

  applyTemplate(event) {
    const index = Number(event.currentTarget.dataset.index || 0);
    const template = recordTemplates[index];
    if (!template) return;
    const nextForm = {
      ...this.data.form,
      ...template.form,
      date: this.data.form.date || getTodayDate()
    };
    this.setData({
      form: nextForm,
      statusIndex: findStatusIndex(nextForm.status),
      errorMessage: ""
    });
  },

  selectStatus(event) {
    const status = event.currentTarget.dataset.status;
    const index = findStatusIndex(status);
    this.setData({
      "form.status": statusOptions[index],
      statusIndex: index,
      errorMessage: ""
    });
  },

  validateForm() {
    const form = this.data.form;
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
        data: this.data.form
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
