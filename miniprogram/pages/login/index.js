const { login, uploadAvatar, getToken, clearAllCaches } = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");
const { showErrorToast, showSuccessToast } = require("../../utils/feedback");
const { withPageLoading } = require("../../utils/form");
const {
  normalizeStoredUser,
  persistAvatarFile,
  readFileBase64,
  resolveAvatarFileType
} = require("../../utils/avatar");

function wxLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code);
          return;
        }
        reject(new Error("未获取到微信登录凭证，请稍后重试"));
      },
      fail: () => reject(new Error("微信登录授权失败，请稍后重试"))
    });
  });
}

Page({
  data: {
    nickname: "",
    avatarUrl: "",
    avatarPreviewFailed: false,
    loading: false
  },

  onLoad() {
    if (getToken()) {
      openRoute(ROUTES.home);
    }
  },

  requirePrivacyAuthorization() {
    const privacyPopup = this.selectComponent("#privacyPopup");
    if (!privacyPopup || !privacyPopup.requireAuthorization) {
      return Promise.resolve();
    }
    return privacyPopup.requireAuthorization();
  },

  onNicknameInput(event) {
    this.setData({ nickname: event.detail.value });
  },

  onChooseAvatar(event) {
    const avatarUrl = event.detail.avatarUrl || "";
    if (!avatarUrl) {
      showErrorToast("微信头像获取失败，请先确认隐私协议中的头像用途声明");
      return;
    }
    this.setData({
      avatarUrl,
      avatarPreviewFailed: false
    });
  },

  onAvatarLoadError() {
    this.setData({ avatarPreviewFailed: true });
  },

  async submitLogin(event) {
    await withPageLoading(this, async () => {
      await this.requirePrivacyAuthorization();

      const nickname = String(event?.detail?.value?.nickname || this.data.nickname || "").trim() || "微信用户";
      const avatarTempPath = this.data.avatarUrl || "";
      const avatarLocalPath = avatarTempPath ? await persistAvatarFile(avatarTempPath) : "";

      const code = await wxLoginCode();
      const res = await login({
        code,
        nickname
      });

      let user = normalizeStoredUser({
        ...(res.data.user || {}),
        nickname,
        avatarLocalPath
      });

      clearAllCaches();
      wx.setStorageSync("token", res.data.token);
      wx.setStorageSync("user", user);

      if (avatarLocalPath) {
        try {
          const avatarBase64 = await readFileBase64(avatarLocalPath);
          const avatarRes = await uploadAvatar({
            avatarBase64,
            fileType: resolveAvatarFileType(avatarLocalPath)
          });
          user = normalizeStoredUser({
            ...user,
            ...(avatarRes.data || user),
            nickname,
            avatarLocalPath
          });
          wx.setStorageSync("user", user);
        } catch (_error) {
          // 头像同步失败不影响用户登录，后续可重新选择头像更新资料。
        }
      }

      showSuccessToast("已登录");
      openRoute(ROUTES.home);
    }).catch((error) => {
      showErrorToast(error, "登录失败");
    });
  },

  openPrivacy() {
    openRoute(ROUTES.privacy);
  }
});
