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

module.exports = {
  getErrorMessage,
  showErrorToast,
  showSuccessToast
};
