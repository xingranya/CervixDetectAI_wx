const {
  request,
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  upsertCachedListItem,
  markCacheDirty
} = require("../../../utils/request");
const { getTodayDate } = require("../../../utils/date");
const { withPageLoading } = require("../../../utils/form");
const { showErrorToast, showSuccessToast } = require("../../../utils/feedback");
const { navigateBackLater } = require("../../../utils/navigation");

const defaultForm = {
  date: "",
  title: "",
  project: "",
  summary: "",
  suggestion: "",
  status: "已记录"
};

Page({
  data: {
    id: "",
    form: { ...defaultForm },
    loading: false
  },

  onLoad(query) {
    if (query.id) {
      this.setData({ id: query.id });
      const cachedDetail = getCachedData(CACHE_KEYS.recordDetail(query.id));
      if (cachedDetail && cachedDetail.data) {
        this.setData({ form: cachedDetail.data });
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
      this.setData({ form: res.data });
    } catch (error) {
      showErrorToast(error, "加载失败");
    }
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  onDateChange(event) {
    this.setData({ "form.date": event.detail.value });
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
      showErrorToast(missing[1], "请补全表单内容");
      return false;
    }
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
