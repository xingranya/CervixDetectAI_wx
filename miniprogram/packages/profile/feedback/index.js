const { createFeedback, isLoggedIn } = require("../../../utils/request");
const { withPageLoading } = require("../../../utils/form");
const { showErrorToast, showSuccessToast, showErrorModal } = require("../../../utils/feedback");

const DEFAULT_FORM = {
  type: "功能建议",
  contact: "",
  content: ""
};
const formRules = [
  {
    name: "content",
    rules: [
      { required: true, message: "请填写反馈内容" },
      { minlength: 8, message: "请至少填写 8 个字，帮助我们更准确地理解问题。" }
    ]
  }
];

Page({
  data: {
    form: { ...DEFAULT_FORM },
    formRules,
    attachmentFiles: [],
    galleryShow: false,
    galleryCurrent: 0,
    galleryUrls: [],
    showOfficialActions: false,
    officialActions: [
      { text: "可上传截图和运行日志", value: "logs" },
      { text: "文字建议可直接提交站内反馈", value: "text" }
    ],
    feedbackTypes: ["功能建议", "使用问题", "隐私与数据", "其他反馈"],
    feedbackTypeIndex: 0,
    errorMessage: "",
    loading: false,
    isGuest: !isLoggedIn()
  },

  onShow() {
    this.setData({ isGuest: !isLoggedIn() });
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

  onAttachmentSelect(event) {
    const paths = (event.detail && event.detail.tempFilePaths) || [];
    const nextFiles = paths.map((url) => ({ url }));
    const files = this.data.attachmentFiles.concat(nextFiles).slice(0, 3);
    this.setData({
      attachmentFiles: files,
      galleryUrls: files.map((item) => item.url)
    });
  },

  onAttachmentDelete(event) {
    const index = event.detail.index;
    const attachmentFiles = this.data.attachmentFiles.filter((_, fileIndex) => fileIndex !== index);
    this.setData({
      attachmentFiles,
      galleryUrls: attachmentFiles.map((item) => item.url)
    });
  },

  previewAttachment(event) {
    const index = Number(event.currentTarget.dataset.index || 0);
    if (!this.data.attachmentFiles.length) return;
    this.setData({
      galleryShow: true,
      galleryCurrent: index,
      galleryUrls: this.data.attachmentFiles.map((item) => item.url)
    });
  },

  hideGallery() {
    this.setData({ galleryShow: false });
  },

  onGalleryChange(event) {
    this.setData({ galleryCurrent: event.detail.current || 0 });
  },

  onGalleryDelete(event) {
    const index = event.detail.index;
    const attachmentFiles = this.data.attachmentFiles.filter((_, fileIndex) => fileIndex !== index);
    this.setData({
      attachmentFiles,
      galleryUrls: attachmentFiles.map((item) => item.url),
      galleryShow: attachmentFiles.length > 0
    });
  },

  uploadAttachmentPreview() {
    return Promise.resolve({
      urls: this.data.attachmentFiles.map((item) => item.url)
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

  onFormFail(event) {
    const errors = event.detail && event.detail.errors;
    const firstError = Array.isArray(errors) && errors[0] ? errors[0] : null;
    this.setData({
      errorMessage: firstError && firstError.message ? firstError.message : "请完善反馈内容"
    });
  },

  async submitFeedback() {
    if (!this.validateForm()) return;
    if (!isLoggedIn()) {
      showErrorModal("站内反馈会保存到你的账号记录中。当前可先使用下方微信官方反馈入口，或登录后再提交站内反馈。");
      return;
    }

    await withPageLoading(this, async () => {
      await createFeedback({
        type: this.data.form.type,
        contact: this.data.form.contact,
        content: this.data.form.content
      });
      this.setData({
        form: { ...DEFAULT_FORM },
        attachmentFiles: [],
        galleryUrls: [],
        galleryShow: false,
        feedbackTypeIndex: 0,
        errorMessage: ""
      });
      showSuccessToast("已收到");
    }).catch((error) => {
      showErrorToast(error, "反馈提交失败");
    });
  },

  openOfficialActions() {
    this.setData({ showOfficialActions: true });
  },

  closeOfficialActions() {
    this.setData({ showOfficialActions: false });
  },

  onOfficialActionTap(event) {
    const value = event.detail.value;
    if (value) {
      this.setData({ errorMessage: "" });
    }
    this.closeOfficialActions();
  }
});
