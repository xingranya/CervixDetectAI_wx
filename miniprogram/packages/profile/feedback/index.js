const { createFeedback } = require("../../../utils/request");
const { withPageLoading } = require("../../../utils/form");
const { showErrorToast, showSuccessToast } = require("../../../utils/feedback");

const DEFAULT_FORM = {
  type: "功能建议",
  contact: "",
  content: ""
};

Page({
  data: {
    form: { ...DEFAULT_FORM },
    feedbackTypes: ["功能建议", "使用问题", "隐私与数据", "其他反馈"],
    feedbackTypeIndex: 0,
    errorMessage: "",
    loading: false
  },

  onTypeChange(event) {
    const index = Number(event.detail.value || 0);
    this.setData({
      feedbackTypeIndex: index,
      "form.type": this.data.feedbackTypes[index] || this.data.feedbackTypes[0],
      errorMessage: ""
    });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value,
      errorMessage: ""
    });
  },

  validateForm() {
    const content = String(this.data.form.content || "").trim();
    if (content.length < 8) {
      this.setData({ errorMessage: "请至少填写 8 个字，帮助我们更准确地理解问题。" });
      return false;
    }
    return true;
  },

  async submitFeedback() {
    if (!this.validateForm()) return;

    await withPageLoading(this, async () => {
      await createFeedback({
        contact: this.data.form.contact,
        content: `【${this.data.form.type}】${this.data.form.content}`
      });
      this.setData({
        form: { ...DEFAULT_FORM },
        feedbackTypeIndex: 0,
        errorMessage: ""
      });
      showSuccessToast("已收到");
    }).catch((error) => {
      showErrorToast(error, "反馈提交失败");
    });
  }
});
