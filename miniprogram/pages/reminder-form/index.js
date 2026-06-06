const { request } = require("../../utils/request");

const defaultForm = {
  title: "",
  date: "",
  desc: "",
  done: false
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
      this.loadReminder(query.id);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    this.setData({ form: { ...defaultForm, date: today } });
  },

  async loadReminder(id) {
    try {
      const res = await request("/reminders");
      const reminder = (res.data || []).find((item) => item.id === id);
      if (reminder) this.setData({ form: reminder });
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

  onDoneChange(event) {
    this.setData({ "form.done": event.detail.value });
  },

  validateForm() {
    const form = this.data.form;
    if (!form.title || !form.date || !form.desc) {
      wx.showToast({ title: "请补全提醒内容", icon: "none" });
      return false;
    }
    return true;
  },

  async submitForm() {
    if (!this.validateForm() || this.data.loading) return;

    const method = this.data.id ? "PUT" : "POST";
    const path = this.data.id ? `/reminders/${this.data.id}` : "/reminders";

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
