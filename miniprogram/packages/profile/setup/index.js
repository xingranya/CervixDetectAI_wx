const { request, uploadAvatar, getToken } = require("../../../utils/request");
const { ROUTES, openRoute } = require("../../../utils/navigation");
const { normalizeStoredUser, persistAvatarFile, readFileBase64, resolveAvatarFileType, isDevToolsTempUrl } = require("../../../utils/avatar");

Page({
  data: {
    profileForm: {
      nickname: ""
    },
    avatarLocalPath: "",
    avatarPreviewUrl: "",
    avatarUploadPending: false,
    // 缓存头像 base64 数据，用于后续上传。
    // 开发者工具的 chooseAvatar 返回 http://127.0.0.1/__tmp__/ 临时 URL，
    // 该 URL 很快失效，必须在回调中立即读取文件内容。
    avatarBase64Cache: "",
    saving: false,
    popupVisible: false,
    setupEnabled: false
  },

  onLoad() {
    if (!getToken()) {
      openRoute(ROUTES.login, {}, { reLaunch: true });
      return;
    }

    const user = normalizeStoredUser(wx.getStorageSync("user"));
    const setupEnabled = !!wx.getStorageSync("profileSettingsConsent");
    const nicknameReady = !!wx.getStorageSync("profileNicknameReady");
    const avatarReady = !!wx.getStorageSync("profileAvatarReady");

    this.setData({
      setupEnabled,
      profileForm: {
        nickname: nicknameReady ? user.nickname : ""
      },
      avatarLocalPath: avatarReady ? user.avatarLocalPath : "",
      avatarPreviewUrl: avatarReady
        ? (user.avatarLocalPath || (!isDevToolsTempUrl(user.avatarUrl) ? user.avatarUrl : ""))
        : ""
    });
  },

  openPrivacy() {
    openRoute(ROUTES.privacy);
  },

  openServiceAgreement() {
    openRoute(ROUTES.serviceAgreement);
  },

  showConsentPopup() {
    this.setData({ popupVisible: true });
  },

  closeConsentPopup() {
    this.setData({ popupVisible: false });
  },

  agreeSetup() {
    wx.setStorageSync("profileSettingsConsent", true);
    this.setData({
      setupEnabled: true,
      popupVisible: false
    });
  },

  skipSetup() {
    this.closeConsentPopup();
    openRoute(ROUTES.home, {}, { reLaunch: true });
  },

  onNicknameInput(event) {
    this.setData({
      "profileForm.nickname": event.detail.value
    });
  },

  async onChooseAvatar(event) {
    if (!this.data.setupEnabled) {
      this.showConsentPopup();
      return;
    }

    const avatarUrl = event.detail.avatarUrl || "";
    if (!avatarUrl) return;

    // 注意：开发者工具返回的 http://127.0.0.1:PORT/__tmp__/xxx 临时 URL
    // 在部分基础库版本下被渲染层服务直接拒绝（HTTP 500），不能作为 <image> 的 src 使用。
    // 因此先持久化到本地永久路径再设置预览，避免触发渲染层 500 错误。
    this.setData({ avatarUploadPending: true });

    // 在临时 URL 尚未失效时，立即读取 base64 数据作为上传兜底
    let base64Cache = "";
    try {
      base64Cache = await readFileBase64(avatarUrl);
    } catch (_e) {
      // 临时 URL 无法直接读取时，后续通过持久化路径读取
    }

    // 尝试将临时文件持久化到本地永久路径（USER_DATA_PATH / wxfile://）
    const avatarLocalPath = await persistAvatarFile(avatarUrl);

    // 预览优先使用持久化后的本地路径；若持久化失败，使用 base64 数据 URL 兜底；
    // 原始临时 URL 绝对不能作为 <image> 的 src，否则会触发渲染层 500 报错。
    let previewUrl = avatarLocalPath && !isDevToolsTempUrl(avatarLocalPath) ? avatarLocalPath : "";
    if (!previewUrl && base64Cache) {
      const mimeType = resolveAvatarFileType(avatarUrl, base64Cache);
      previewUrl = `data:${mimeType};base64,${base64Cache}`;
    }

    this.setData({
      avatarLocalPath,
      avatarPreviewUrl: previewUrl,
      avatarBase64Cache: base64Cache
    });
  },

  onAvatarPreviewError() {
    // 预览图加载失败时，降级到 base64 数据 URL 或清空预览，避免一直显示破图。
    const base64Cache = this.data.avatarBase64Cache;
    if (base64Cache) {
      const mimeType = resolveAvatarFileType(this.data.avatarLocalPath || "", base64Cache);
      this.setData({ avatarPreviewUrl: `data:${mimeType};base64,${base64Cache}` });
      return;
    }
    this.setData({ avatarPreviewUrl: "" });
  },

  async saveProfile() {
    if (!this.data.setupEnabled) {
      this.showConsentPopup();
      return;
    }

    const nickname = String(this.data.profileForm.nickname || "").trim() || "微信用户";
    this.setData({ saving: true });

    try {
      const profileRes = await request("/me/profile", {
        method: "PUT",
        data: { nickname }
      });

      let nextUser = normalizeStoredUser({
        ...wx.getStorageSync("user"),
        ...(profileRes.data || {}),
        nickname
      });

      wx.setStorageSync("profileNicknameReady", true);

      if (this.data.avatarUploadPending) {
        // 优先使用已缓存的 base64，其次从持久化路径读取
        let avatarBase64 = this.data.avatarBase64Cache;
        if (!avatarBase64 && this.data.avatarLocalPath) {
          avatarBase64 = await readFileBase64(this.data.avatarLocalPath);
        }

        if (avatarBase64) {
          const avatarRes = await uploadAvatar({
            avatarBase64,
            fileType: resolveAvatarFileType(this.data.avatarLocalPath || "", avatarBase64)
          });
          nextUser = normalizeStoredUser({
            ...nextUser,
            ...(avatarRes.data || {}),
            avatarLocalPath: this.data.avatarLocalPath
          });
          wx.setStorageSync("profileAvatarReady", true);
          this.setData({
            avatarPreviewUrl: nextUser.avatarUrl || this.data.avatarPreviewUrl,
            avatarUploadPending: false
          });
        }
      }

      wx.setStorageSync("user", nextUser);
      wx.showToast({
        title: "资料已保存",
        icon: "success"
      });
      openRoute(ROUTES.profile, {}, { reLaunch: true });
    } catch (error) {
      wx.showToast({
        title: (error && error.message) || "保存失败，请稍后再试",
        icon: "none"
      });
    } finally {
      this.setData({ saving: false });
    }
  }
});
