Component({
  data: {
    visible: false
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
        resolve({ event: "exposureAuthorization" });
      });
    },

    requireAuthorization() {
      if (!wx.requirePrivacyAuthorize) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        this.requireResolve = resolve;
        this.requireReject = reject;
        wx.requirePrivacyAuthorize({
          success: resolve,
          fail: reject
        });
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
