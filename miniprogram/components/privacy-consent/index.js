Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true
  },

  properties: {
    visible: { type: Boolean, value: false }
  },

  data: {
    checked: false
  },

  methods: {
    toggleCheckbox() {
      this.setData({ checked: !this.data.checked });
    },

    onConfirm() {
      if (!this.data.checked) return;
      wx.setStorageSync("privacyConsentAgreed", true);
      wx.setStorageSync("privacyConsentTime", Date.now());
      this.setData({ checked: false });
      this.triggerEvent("accept");
    },

    onDecline() {
      this.setData({ checked: false });
      this.triggerEvent("decline");
    },

    openPrivacy() {
      wx.navigateTo({ url: "/packages/profile/privacy/index" });
    },

    openServiceAgreement() {
      wx.navigateTo({ url: "/packages/profile/service/index" });
    }
  }
});
