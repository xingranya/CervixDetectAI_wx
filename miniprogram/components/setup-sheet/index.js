Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true,
    pureDataPattern: /^_/
  },

  properties: {
    visible: { type: Boolean, value: false },
    // 父页面是否已登录（未登录时弹窗不应出现）
    loggedIn: { type: Boolean, value: false }
  },

  data: {
    profileForm: { nickname: "" },
    avatarLocalPath: "",
    avatarPreviewUrl: "",
    avatarUploadPending: false,
    avatarBase64Cache: "",
    saving: false,
    popupVisible: false,
    setupEnabled: false,
    _nicknameReady: false,
    _avatarReady: false,
    _animating: false
  },

  lifetimes: {
    attached() {
      // 将 avatar 相关工具函数缓存到组件实例上，避免在组件里重复 require。
      const avatar = require("../../utils/avatar");
      this._avatarUtils = avatar;
      const request = require("../../utils/request");
      this._requestUtils = request;
      const navigation = require("../../utils/navigation");
      this._navigation = navigation;
    }
  },

  observers: {
    visible(next) {
      if (next) {
        this._loadState();
        this.setData({ _animating: true });
        // 等一帧后再取消 animating，让动画从「关闭态」过渡到「打开态」
        const run = () => this.setData({ _animating: false });
        if (typeof wx.nextTick === "function") {
          wx.nextTick(run);
        } else {
          setTimeout(run, 16);
        }
      }
    }
  },

  methods: {
    _getNicknameFromEvent(event) {
      const detail = event && event.detail ? event.detail : {};
      const value = detail.value;
      if (value && typeof value === "object" && value.nickname !== undefined) {
        return String(value.nickname || "").trim();
      }
      if (value !== undefined && typeof value !== "object") {
        return String(value || "").trim();
      }
      return String(this.data.profileForm.nickname || "").trim();
    },

    _loadState() {
      if (!this.data.loggedIn) return;
      const user = this._avatarUtils.normalizeStoredUser(wx.getStorageSync("user"));
      const nicknameReady = !!wx.getStorageSync("profileNicknameReady");
      const avatarReady = !!wx.getStorageSync("profileAvatarReady");
      const setupEnabled = !!wx.getStorageSync("profileSettingsConsent");
      this.setData({
        setupEnabled,
        _nicknameReady: nicknameReady,
        _avatarReady: avatarReady,
        profileForm: { nickname: nicknameReady ? user.nickname : "" },
        avatarLocalPath: avatarReady ? user.avatarLocalPath : "",
        avatarPreviewUrl: avatarReady
          ? (user.avatarLocalPath || (!this._avatarUtils.isDevToolsTempUrl(user.avatarUrl) ? user.avatarUrl : ""))
          : ""
      });
    },

    // 昵称输入：type=nickname 选择"使用微信昵称"时需配合 value 绑定才能正确填入显示
    onNicknameInput(event) {
      this.setData({ "profileForm.nickname": event.detail.value });
    },

    async onChooseAvatar(event) {
      if (!this.data.setupEnabled) {
        this.showConsentPopup();
        return;
      }
      const avatarUrl = event.detail.avatarUrl || "";
      if (!avatarUrl) return;

      this.setData({ avatarUploadPending: true });

      let base64Cache = "";
      try {
        base64Cache = await this._avatarUtils.readFileBase64(avatarUrl);
      } catch (_e) { /* ignore */ }

      const avatarLocalPath = await this._avatarUtils.persistAvatarFile(avatarUrl);

      let previewUrl = avatarLocalPath && !this._avatarUtils.isDevToolsTempUrl(avatarLocalPath) ? avatarLocalPath : "";
      if (!previewUrl && base64Cache) {
        const mimeType = this._avatarUtils.resolveAvatarFileType(avatarUrl, base64Cache);
        previewUrl = `data:${mimeType};base64,${base64Cache}`;
      }

      this.setData({
        avatarLocalPath,
        avatarPreviewUrl: previewUrl,
        avatarBase64Cache: base64Cache
      });
    },

    onAvatarPreviewError() {
      const base64Cache = this.data.avatarBase64Cache;
      if (base64Cache) {
        const mimeType = this._avatarUtils.resolveAvatarFileType(this.data.avatarLocalPath || "", base64Cache);
        this.setData({ avatarPreviewUrl: `data:${mimeType};base64,${base64Cache}` });
        return;
      }
      this.setData({ avatarPreviewUrl: "" });
    },

    showConsentPopup() {
      this.setData({ popupVisible: true });
    },
    closeConsentPopup() {
      this.setData({ popupVisible: false });
    },
    agreeSetup() {
      wx.setStorageSync("profileSettingsConsent", true);
      this.setData({ setupEnabled: true, popupVisible: false });
    },
    skipSetup() {
      this.setData({ popupVisible: false });
      this._closeSheet();
    },

    openPrivacy() {
      this._navigation.openRoute(this._navigation.ROUTES.privacy);
    },
    openServiceAgreement() {
      this._navigation.openRoute(this._navigation.ROUTES.serviceAgreement);
    },

    async saveProfile(event) {
      if (!this.data.setupEnabled) {
        this.showConsentPopup();
        return;
      }
      const nickname = this._getNicknameFromEvent(event) || "微信用户";
      this.setData({ "profileForm.nickname": nickname });
      this.setData({ saving: true });

      try {
        const profileRes = await this._requestUtils.request("/me/profile", {
          method: "PUT",
          data: { nickname }
        });

        let nextUser = this._avatarUtils.normalizeStoredUser({
          ...wx.getStorageSync("user"),
          ...(profileRes.data || {}),
          nickname
        });
        wx.setStorageSync("profileSettingsConsent", true);
        wx.setStorageSync("profileNicknameReady", true);

        if (this.data.avatarUploadPending) {
          let avatarBase64 = this.data.avatarBase64Cache;
          if (!avatarBase64 && this.data.avatarLocalPath) {
            avatarBase64 = await this._avatarUtils.readFileBase64(this.data.avatarLocalPath);
          }
          if (avatarBase64) {
            const avatarRes = await this._requestUtils.uploadAvatar({
              avatarBase64,
              fileType: this._avatarUtils.resolveAvatarFileType(this.data.avatarLocalPath || "", avatarBase64)
            });
            nextUser = this._avatarUtils.normalizeStoredUser({
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
        wx.showToast({ title: "资料已保存", icon: "success" });
        this._closeSheet();
      } catch (error) {
        wx.showToast({
          title: (error && error.message) || "保存失败，请稍后再试",
          icon: "none"
        });
      } finally {
        this.setData({ saving: false });
      }
    },

    // 关闭弹窗：先播关闭动画，再触发 closed 事件让父页面隐藏
    _closeSheet() {
      this.setData({ _animating: true });
      setTimeout(() => {
        this.triggerEvent("closed");
        // 关闭动画结束后重置状态，下次打开重新拉取
        this._resetState();
      }, 260);
    },

    _resetState() {
      this.setData({
        profileForm: { nickname: "" },
        avatarLocalPath: "",
        avatarPreviewUrl: "",
        avatarUploadPending: false,
        avatarBase64Cache: "",
        saving: false,
        popupVisible: false,
        setupEnabled: false
      });
    },

    onCloseTap() {
      this._closeSheet();
    },

    onMaskTap() {
      // 正在保存时不允许通过点击遮罩关闭，避免中断上传
      if (this.data.saving) return;
      this._closeSheet();
    }
  }
});
