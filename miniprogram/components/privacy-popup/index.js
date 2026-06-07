Component({
  data: {
    visible: false,
    privacyContractName: "小程序隐私保护指引"
  },

  lifetimes: {
    attached() {
      this.registerPrivacyListener();
    }
  },

  methods: {
    registerPrivacyListener() {
      if (!wx.onNeedPrivacyAuthorization) return;
      wx.onNeedPrivacyAuthorization((resolve) => {
        this.resolvePrivacyAuthorization = resolve;
        this.setData({ visible: true });
      });
    },

    requireAuthorization() {
      if (!wx.getPrivacySetting) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        wx.getPrivacySetting({
          success: (res) => {
            this.setData({
              privacyContractName: res.privacyContractName || "小程序隐私保护指引"
            });

            if (!res.needAuthorization) {
              resolve();
              return;
            }

            this.requireResolve = resolve;
            this.requireReject = reject;
            this.setData({ visible: true });
          },
          fail: () => {
            this.setData({
              privacyContractName: "小程序隐私保护指引"
            });
            resolve();
          }
        });
      });
    },

    openPrivacyContract() {
      if (!wx.openPrivacyContract) {
        wx.showToast({
          title: "当前微信版本暂不支持打开隐私指引，请升级微信后重试",
          icon: "none"
        });
        return;
      }

      wx.openPrivacyContract({
        success: () => {},
        fail: () => {
          wx.showToast({
            title: "暂时无法打开隐私指引，请稍后重试",
            icon: "none"
          });
        }
      });
    },

    handleAgree() {
      this.setData({ visible: false });
      if (this.resolvePrivacyAuthorization) {
        this.resolvePrivacyAuthorization({
          event: "agree",
          buttonId: "agree-btn"
        });
        this.resolvePrivacyAuthorization = null;
      }
      if (this.requireResolve) {
        this.requireResolve();
        this.requireResolve = null;
        this.requireReject = null;
      }
      this.triggerEvent("agree");
    },

    handleDisagree() {
      this.setData({ visible: false });
      if (this.resolvePrivacyAuthorization) {
        this.resolvePrivacyAuthorization({ event: "disagree" });
        this.resolvePrivacyAuthorization = null;
      }
      if (this.requireReject) {
        this.requireReject(new Error("你暂未同意隐私保护指引"));
        this.requireResolve = null;
        this.requireReject = null;
      }
      this.triggerEvent("disagree");
    }
  }
});
