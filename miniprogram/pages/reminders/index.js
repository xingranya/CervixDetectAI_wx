const { request } = require("../../utils/request");

Page({
  data: {
    reminders: []
  },

  onLoad() {
    this.loadReminders();
  },

  async loadReminders() {
    const res = await request("/reminders");
    this.setData({ reminders: res.data || [] });
  },

  markDone(event) {
    const id = event.currentTarget.dataset.id;
    const reminders = this.data.reminders.map((item) =>
      item.id === id ? { ...item, done: true } : item
    );
    this.setData({ reminders });
  }
});

