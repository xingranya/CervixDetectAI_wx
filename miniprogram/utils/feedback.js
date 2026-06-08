function getErrorMessage(error, fallback = "操作失败，请稍后再试") {
  if (error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error.trim();
  return fallback;
}

function showErrorToast(error, fallback) {
  wx.showToast({
    title: getErrorMessage(error, fallback),
    icon: "none"
  });
}

function showSuccessToast(title = "操作成功") {
  wx.showToast({
    title,
    icon: "success"
  });
}

function showErrorModal(error, fallback = "暂时无法继续，请稍后再试") {
  wx.showModal({
    title: "提示",
    content: getErrorMessage(error, fallback),
    showCancel: false,
    confirmText: "我知道了"
  });
}

module.exports = {
  getErrorMessage,
  showErrorToast,
  showSuccessToast,
  showErrorModal
};
