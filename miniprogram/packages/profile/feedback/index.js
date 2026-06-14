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

function normalizeAttachmentItem(item) {
  if (!item) return null;
  if (typeof item === "string") {
    const url = String(item).trim();
    return url ? { url } : null;
  }

  const url = String(
    item.url
    || item.tempFilePath
    || item.path
    || item.thumbTempFilePath
    || item.thumb
    || ""
  ).trim();

  return url ? { ...item, url } : null;
}

function normalizeAttachmentFiles(detail) {
  const source = detail || {};
  const rawList = [];

  if (Array.isArray(source.tempFilePaths)) rawList.push(...source.tempFilePaths);
  if (Array.isArray(source.tempFiles)) rawList.push(...source.tempFiles);
  if (Array.isArray(source.files)) rawList.push(...source.files);
  if (Array.isArray(source.urls)) rawList.push(...source.urls);

  return rawList
    .map(normalizeAttachmentItem)
    .filter(Boolean);
}

function buildGalleryUrls(files) {
  return (Array.isArray(files) ? files : [])
    .map((item) => String(item && item.url || "").trim())
    .filter(Boolean);
}

Page({
  data: {
    form: { ...DEFAULT_FORM },
    formRules,
    attachmentFiles: [],
    galleryShow: false,
    galleryCurrent: 0,
    galleryUrls: [],
    showOfficialActions: false,
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
    const nextFiles = normalizeAttachmentFiles(event.detail);
    const files = this.data.attachmentFiles.concat(nextFiles).slice(0, 3);
    this.setData({
      attachmentFiles: files,
      galleryUrls: buildGalleryUrls(files)
    });
  },

  onAttachmentDelete(event) {
    const index = Number(event.detail && event.detail.index);
    const attachmentFiles = this.data.attachmentFiles.filter((_, fileIndex) => fileIndex !== index);
    this.setData({
      attachmentFiles,
      galleryUrls: buildGalleryUrls(attachmentFiles)
    });
  },

  previewAttachment(event) {
    const index = Number(event.currentTarget.dataset.index || 0);
    if (!this.data.attachmentFiles.length) return;
    this.setData({
      galleryShow: true,
      galleryCurrent: index,
      galleryUrls: buildGalleryUrls(this.data.attachmentFiles)
    });
  },

  hideGallery() {
    this.setData({ galleryShow: false });
  },

  onGalleryChange(event) {
    this.setData({ galleryCurrent: event.detail.current || 0 });
  },

  onGalleryDelete(event) {
    const index = Number(event.detail && event.detail.index);
    const attachmentFiles = this.data.attachmentFiles.filter((_, fileIndex) => fileIndex !== index);
    this.setData({
      attachmentFiles,
      galleryUrls: buildGalleryUrls(attachmentFiles),
      galleryShow: attachmentFiles.length > 0
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

  noop() {
    return undefined;
  }
});
