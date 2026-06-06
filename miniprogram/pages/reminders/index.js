const { request } = require("../../utils/request");

Page({
  data: {
    reminders: []
  },

  onShow() {
    this.loadReminders();
  },

  async loadReminders() {
    try {
      const res = await request("/reminders");
      this.setData({ reminders: res.data || [] });
    } catch (_error) {
      this.setData({ reminders: [] });
    }
  },

  createReminder() {
    wx.navigateTo({ url: "/pages/reminder-form/index" });
  },

  editReminder(event) {
    wx.navigateTo({ url: `/pages/reminder-form/index?id=${event.currentTarget.dataset.id}` });
  },

  async markDone(event) {
    const id = event.currentTarget.dataset.id;
    try {
      await request(`/reminders/${id}/done`, { method: "PATCH" });
      wx.showToast({ title: "已完成", icon: "success" });
      if (wx.vibrateShort) wx.vibrateShort({ type: "light" });
      const index = this.data.reminders.findIndex((item) => item.id === id);
      if (index > -1) {
        this.setData({ [`reminders[${index}].done`]: true });
      }
    } catch (error) {
      wx.showToast({ title: error.message || "操作失败", icon: "none" });
    }
  },

  deleteReminder(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除提醒",
      content: "确认删除这条复查提醒吗？",
      confirmColor: "#d32f2f",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request(`/reminders/${id}`, { method: "DELETE" });
          wx.showToast({ title: "已删除", icon: "success" });
          this.setData({
            reminders: this.data.reminders.filter((item) => item.id !== id)
          });
        } catch (error) {
          wx.showToast({ title: error.message || "删除失败", icon: "none" });
        }
      }
    });
  }
});
