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

Page({
  data: {
    loading: false,
    profileForm: { nickname: "" },
    avatarPreviewUrl: "",
    avatarLocalPath: "",
    avatarBase64Cache: "",
    avatarUploadPending: false,
    setupEnabled: false,
    consentPopupVisible: false
  },

  onLoad() {
    if (getToken()) {
      openRoute(ROUTES.home);
    }
  },

  // 昵称输入
  onNicknameInput(event) {
    this.setData({ "profileForm.nickname": event.detail.value });
  },

  // 选择头像：仅做本地持久化 + base64 预览，绝不把 __tmp__ URL 作为 image src
  async onChooseAvatar(event) {
    const avatarUrl = (event.detail && event.detail.avatarUrl) || "";
    if (!avatarUrl) return;

    if (!this.data.setupEnabled) {
      this.setData({ consentPopupVisible: true });
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
  async submitLogin() {
    await withPageLoading(this, async () => {
      await this._performLogin({ uploadProfile: true });
    }).catch((error) => {
      showErrorToast(error, "登录失败");
    });
  },

  // 跳过资料设置直接登录
  async skipSetupAndLogin() {
    await withPageLoading(this, async () => {
      await this._performLogin({ uploadProfile: false });
    }).catch((error) => {
      showErrorToast(error, "登录失败");
    });
  },

  async _performLogin({ uploadProfile }) {
    // 若用户想上传资料但还没同意隐私说明，先弹窗
    if (uploadProfile && (this.data.avatarUploadPending || String(this.data.profileForm.nickname || "").trim()) && !this.data.setupEnabled) {
      this.setData({ consentPopupVisible: true });
      throw new Error("请先同意资料设置说明");
    }

    await this.requirePrivacyAuthorization();

    const code = await wxLoginCode();
    const loginRes = await login({ code });

    let user = avatarUtil.normalizeStoredUser({
      ...(loginRes.data.user || {}),
      nickname: "微信用户",
      avatarUrl: "",
      avatarLocalPath: ""
    });

    clearAllCaches();
    wx.removeStorageSync("profileNicknameReady");
    wx.removeStorageSync("profileAvatarReady");
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

    // 如果资料已经保存完毕（nickname + avatar 都 ready），直接跳到首页；
    // 否则跳到 setup 弹窗页（或 home 让用户后续通过弹窗补填）。
    const nicknameReady = !!wx.getStorageSync("profileNicknameReady");
    const avatarReady = !!wx.getStorageSync("profileAvatarReady");
    showSuccessToast(profileSaved ? "已登录，资料已保存" : "已登录");

    if (nicknameReady && avatarReady) {
      openRoute(ROUTES.home);
    } else {
      // 保持与旧逻辑一致：跳到 profileSetup（setup-sheet）继续引导
      openRoute(ROUTES.home);
    }
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

  requirePrivacyAuthorization() {
    if (!wx.getPrivacySetting) {
      return Promise.reject(new Error("当前基础库不支持隐私授权调试，请升级微信开发者工具基础库后重试"));
    }

    return new Promise((resolve, reject) => {
      wx.getPrivacySetting({
        success: (res) => {
          if (!res.needAuthorization) {
            resolve();
            return;
          }

          if (!wx.requirePrivacyAuthorize) {
            reject(new Error("当前环境未启用官方隐私授权弹窗，请升级基础库到 2.32.3 以上并清除授权数据后重试"));
            return;
          }

          wx.requirePrivacyAuthorize({
            success: () => resolve(),
            fail: (error) => {
              const errno = error && error.errno;
              if (errno === 103 || errno === 104) {
                reject(new Error("你暂未同意微信隐私保护指引"));
                return;
              }
              reject(new Error("官方隐私授权弹窗未触发，请清除授权数据并确认开发者工具基础库版本后重试"));
            }
          });
        },
        fail: () => {
          reject(new Error("当前环境无法读取隐私授权状态，请在微信开发者工具中升级基础库后重试"));
        }
      });
    });
  },

  openPrivacy() {
    openRoute(ROUTES.privacy);
  },

  openServiceAgreement() {
    openRoute(ROUTES.serviceAgreement);
  }
});
