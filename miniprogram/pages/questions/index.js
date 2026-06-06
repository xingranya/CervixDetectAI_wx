const { request } = require("../../utils/request");

Page({
  data: {
    templates: [],
    selected: [],
    questions: [],
    customQuestion: ""
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      const [templateRes, questionRes] = await Promise.all([
        request("/question-templates"),
        request("/questions")
      ]);
      this.setData({
        templates: templateRes.data || [],
        questions: questionRes.data || []
      });
    } catch (error) {
      wx.showToast({ title: error.message || "加载失败", icon: "none" });
    }
  },

  toggleQuestion(event) {
    const text = event.currentTarget.dataset.text;
    const selected = this.data.selected.indexOf(text) > -1
      ? this.data.selected.filter((item) => item !== text)
      : [...this.data.selected, text];
    this.setData({ selected });
  },

  onCustomInput(event) {
    this.setData({ customQuestion: event.detail.value });
  },

  async saveSelected() {
    const questions = [...this.data.selected];
    const customQuestion = String(this.data.customQuestion || "").trim();
    if (customQuestion) questions.push(customQuestion);

    if (!questions.length) {
      wx.showToast({ title: "请先选择或填写问题", icon: "none" });
      return;
    }

    try {
      await request("/questions/batch", {
        method: "POST",
        data: { questions }
      });
      wx.showToast({ title: "已保存", icon: "success" });
      this.setData({ selected: [], customQuestion: "" });
      this.loadData();
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    }
  },

  onAnswerInput(event) {
    const id = event.currentTarget.dataset.id;
    const answerText = event.detail.value;
    const index = this.data.questions.findIndex((item) => item.id === id);
    if (index === -1) return;
    this.setData({ [`questions[${index}].answerText`]: answerText });
  },

  async saveAnswer(event) {
    const id = event.currentTarget.dataset.id;
    const question = this.data.questions.find((item) => item.id === id);
    if (!question) return;

    try {
      await request(`/questions/${id}`, {
        method: "PUT",
        data: question
      });
      wx.showToast({ title: "已保存", icon: "success" });
      this.loadData();
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    }
  },

  deleteQuestion(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除问题",
      content: "确认删除这条问题记录吗？",
      confirmColor: "#d32f2f",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request(`/questions/${id}`, { method: "DELETE" });
          wx.showToast({ title: "已删除", icon: "success" });
          this.setData({
            questions: this.data.questions.filter((item) => item.id !== id)
          });
        } catch (error) {
          wx.showToast({ title: error.message || "删除失败", icon: "none" });
        }
      }
    });
  }
});
