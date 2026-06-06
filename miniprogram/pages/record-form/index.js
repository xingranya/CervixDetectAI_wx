const { request } = require("../../utils/request");

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

Page({
  data: {
    id: "",
    form: { ...defaultForm },
    loading: false
  },

  onLoad(query) {
    if (query.id) {
      this.setData({ id: query.id });
      this.loadRecord(query.id);
      return;
    }
    this.setData({ form: { ...defaultForm, date: getTodayDate() } });
  },

  async loadRecord(id) {
    try {
      const res = await request(`/records/${id}`);
      this.setData({ form: res.data });
    } catch (error) {
      wx.showToast({ title: error.message || "加载失败", icon: "none" });
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
      wx.showToast({ title: missing[1], icon: "none" });
      return false;
    }
    return true;
  },

  async submitForm() {
    if (!this.validateForm() || this.data.loading) return;

    const method = this.data.id ? "PUT" : "POST";
    const path = this.data.id ? `/records/${this.data.id}` : "/records";

    this.setData({ loading: true });
    try {
      await request(path, {
        method,
        data: this.data.form
      });
      wx.showToast({ title: "已保存", icon: "success" });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  }
});
