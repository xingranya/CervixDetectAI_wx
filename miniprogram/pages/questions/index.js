const { request } = require("../../utils/request");

Page({
  data: {
    templates: [],
    selected: []
  },

  onLoad() {
    this.loadTemplates();
  },

  async loadTemplates() {
    const res = await request("/question-templates");
    this.setData({ templates: res.data || [] });
  },

  toggleQuestion(event) {
    const text = event.currentTarget.dataset.text;
    const selected = this.data.selected.includes(text)
      ? this.data.selected.filter((item) => item !== text)
      : [...this.data.selected, text];
    this.setData({ selected });
  }
});

