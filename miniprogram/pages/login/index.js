const { login, getToken, clearAllCaches, request, uploadAvatar } = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");
const { showErrorToast, showSuccessToast } = require("../../utils/feedback");
const { withPageLoading } = require("../../utils/form");
const avatarUtil = require("../../utils/avatar");

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

function getNicknameFromEvent(event, fallback) {
  const detail = event && event.detail ? event.detail : {};
  const value = detail.value;
  if (value && typeof value === "object" && value.nickname !== undefined) {
    return String(value.nickname || "").trim();
  }
  if (value !== undefined && typeof value !== "object") {
    return String(value || "").trim();
  }
  return String(fallback || "").trim();
}

Page({
  data: {
    loading: false,
    profileForm: { nickname: "" },
    avatarPreviewUrl: "",
    avatarLocalPath: "",
    avatarBase64Cache: "",
    avatarUploadPending: false,
    setupEnabled: false,
    consentPopupVisible: false,
    privacyConsentVisible: false
  },

  onLoad() {
    if (getToken()) {
      openRoute(ROUTES.home);
    }
    // 检查是否已同意隐私协议，未同意则自动弹出
    this._checkPrivacyConsent();
  },

  // 检查隐私协议同意状态：未同意则显示弹窗
  _checkPrivacyConsent() {
    const agreed = !!wx.getStorageSync("privacyConsentAgreed");
    if (!agreed) {
      this.setData({ privacyConsentVisible: true });
    }
  },

  // 用户主动点击“同意并继续”
  onPrivacyAccept() {
    this.setData({ privacyConsentVisible: false });
  },

  // 用户点击“仅浏览”
  onPrivacyDecline() {
    this.setData({ privacyConsentVisible: false });
    wx.showToast({
      title: "已进入浏览模式，登录需先同意协议",
      icon: "none",
      duration: 2000
    });
  },

  // 昵称输入：type=nickname 选择"使用微信昵称"时需配合 value 绑定才能正确填入显示
  onNicknameInput(event) {
    this.setData({ "profileForm.nickname": event.detail.value });
  },

  showConsentPopup() {
    this.setData({ consentPopupVisible: true });
  },

  // 头像点击拦截：未同意资料设置时先弹窗
  onAvatarPickerTap() {
    if (!this.data.setupEnabled) {
      this.showConsentPopup();
    }
  },

  // 选择头像：仅做本地持久化 + base64 预览，绝不把 __tmp__ URL 作为 image src
  async onChooseAvatar(event) {
    const avatarUrl = (event.detail && event.detail.avatarUrl) || "";
    if (!avatarUrl) return;

    if (!this.data.setupEnabled) {
      this.showConsentPopup();
      return;
    }

    this.setData({ avatarUploadPending: true });

    let base64Cache = "";
    try {
      base64Cache = await avatarUtil.readFileBase64(avatarUrl);
    } catch (_e) {
      base64Cache = "";
    }

    const localPath = await avatarUtil.persistAvatarFile(avatarUrl);

    // 预览 URL 只接受本地持久路径或 base64 data URL，绝不接收 __tmp__ URL
    let previewUrl = (localPath && !avatarUtil.isDevToolsTempUrl(localPath)) ? localPath : "";
    if (!previewUrl && base64Cache) {
      const mimeType = avatarUtil.resolveAvatarFileType(avatarUrl, base64Cache);
      previewUrl = `data:${mimeType};base64,${base64Cache}`;
    }

    this.setData({
      avatarLocalPath: localPath || "",
      avatarPreviewUrl: previewUrl,
      avatarBase64Cache: base64Cache,
      avatarUploadPending: false
    });
  },

  onAvatarPreviewError() {
    const base64Cache = this.data.avatarBase64Cache;
    if (base64Cache) {
      const mimeType = avatarUtil.resolveAvatarFileType(this.data.avatarLocalPath || "", base64Cache);
      this.setData({ avatarPreviewUrl: `data:${mimeType};base64,${base64Cache}` });
      return;
    }
    this.setData({ avatarPreviewUrl: "" });
  },

  // 二级隐私同意弹窗
  agreeConsent() {
    wx.setStorageSync("profileSettingsConsent", true);
    this.setData({ setupEnabled: true, consentPopupVisible: false });
  },
  declineConsent() {
    this.setData({ consentPopupVisible: false });
    // 清空已选的头像/昵称，避免误上传
    this.setData({
      profileForm: { nickname: "" },
      avatarPreviewUrl: "",
      avatarLocalPath: "",
      avatarBase64Cache: "",
      avatarUploadPending: false
    });
  },

  // 主按钮：登录 + 资料保存
  async submitLogin(event) {
    // 必须先同意隐私协议才能登录
    if (!wx.getStorageSync("privacyConsentAgreed")) {
      this.setData({ privacyConsentVisible: true });
      showErrorToast("请先阅读并同意隐私协议与服务协议", "登录前提示");
      return;
    }
    const nickname = getNicknameFromEvent(event, this.data.profileForm.nickname);
    this.setData({ "profileForm.nickname": nickname });
    if (nickname && !this.data.setupEnabled) {
      this.showConsentPopup();
      showErrorToast("请先同意资料设置说明", "登录前提示");
      return;
    }
    await withPageLoading(this, async () => {
      await this._performLogin({ uploadProfile: true });
    }).catch((error) => {
      showErrorToast(error, "登录失败");
    });
  },

  // 跳过资料设置直接登录
  async skipSetupAndLogin() {
    // 必须先同意隐私协议才能登录
    if (!wx.getStorageSync("privacyConsentAgreed")) {
      this.setData({ privacyConsentVisible: true });
      showErrorToast("请先阅读并同意隐私协议与服务协议", "登录前提示");
      return;
    }
    await withPageLoading(this, async () => {
      await this._performLogin({ uploadProfile: false });
    }).catch((error) => {
      showErrorToast(error, "登录失败");
    });
  },

  async _performLogin({ uploadProfile }) {
    // 若用户想上传资料但还没同意隐私说明，先弹窗
    if (uploadProfile && (this.data.avatarUploadPending || String(this.data.profileForm.nickname || "").trim()) && !this.data.setupEnabled) {
      this.showConsentPopup();
      throw new Error("请先同意资料设置说明");
    }

    const code = await wxLoginCode();
    const loginRes = await login({ code });

    let user = avatarUtil.normalizeStoredUser({
      ...(loginRes.data.user || {}),
      nickname: "微信用户",
      avatarUrl: "",
      avatarLocalPath: ""
    });

    clearAllCaches();

    // 根据服务端返回的实际用户数据决定资料就绪标记，
    // 避免回头用户（已设过头像/昵称）再次进入个人页时被重复弹出设置弹窗。
    const serverNickname = (loginRes.data.user && loginRes.data.user.nickname) || "";
    const serverAvatarUrl = (loginRes.data.user && loginRes.data.user.avatarUrl) || "";
    if (serverNickname && serverNickname !== "微信用户") {
      wx.setStorageSync("profileNicknameReady", true);
    } else {
      wx.removeStorageSync("profileNicknameReady");
    }
    if (serverAvatarUrl) {
      wx.setStorageSync("profileAvatarReady", true);
    } else {
      wx.removeStorageSync("profileAvatarReady");
    }

    // 保留用户是否已同意资料设置的标识，若未同意则清掉
    if (!this.data.setupEnabled) {
      wx.removeStorageSync("profileSettingsConsent");
    }
    wx.setStorageSync("token", loginRes.data.token);
    wx.setStorageSync("user", user);

    // 登录成功后才尝试保存昵称 + 上传头像（仅在用户有输入/选择时）
    const nickname = String(this.data.profileForm.nickname || "").trim();
    const hasAvatar = this.data.avatarUploadPending && (this.data.avatarBase64Cache || this.data.avatarLocalPath);
    let profileSaved = false;

    if (uploadProfile && (nickname || hasAvatar)) {
      profileSaved = await this._saveProfileAfterLogin({ nickname, hasAvatar });
    }

    showSuccessToast(profileSaved ? "已登录，资料已保存" : "已登录");
    openRoute(ROUTES.home);
  },

  // 登录成功后异步保存资料，失败时不阻塞登录
  async _saveProfileAfterLogin({ nickname, hasAvatar }) {
    try {
      const effectiveNickname = nickname || "微信用户";
      const profileRes = await request("/me/profile", {
        method: "PUT",
        data: { nickname: effectiveNickname }
      });

      let nextUser = avatarUtil.normalizeStoredUser({
        ...wx.getStorageSync("user"),
        ...(profileRes.data || {}),
        nickname: effectiveNickname
      });
      wx.setStorageSync("profileNicknameReady", true);

      if (hasAvatar) {
        let avatarBase64 = this.data.avatarBase64Cache;
        if (!avatarBase64 && this.data.avatarLocalPath) {
          try {
            avatarBase64 = await avatarUtil.readFileBase64(this.data.avatarLocalPath);
          } catch (_e) {
            avatarBase64 = "";
          }
        }
        if (avatarBase64) {
          const avatarRes = await uploadAvatar({
            avatarBase64,
            fileType: avatarUtil.resolveAvatarFileType(this.data.avatarLocalPath || "", avatarBase64)
          });
          nextUser = avatarUtil.normalizeStoredUser({
            ...nextUser,
            ...(avatarRes.data || {}),
            avatarLocalPath: this.data.avatarLocalPath
          });
          wx.setStorageSync("profileAvatarReady", true);
        }
      }

      wx.setStorageSync("user", nextUser);
      return true;
    } catch (err) {
      // 资料保存失败不影响登录成功，只提示一下
      console.warn("资料保存失败：", err);
      return false;
    }
  },

  openPrivacy() {
    openRoute(ROUTES.privacy);
  },

  openServiceAgreement() {
    openRoute(ROUTES.serviceAgreement);
  }
});
