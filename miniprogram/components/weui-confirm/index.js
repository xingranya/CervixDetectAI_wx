Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: "提示"
    },
    content: {
      type: String,
      value: ""
    },
    cancelText: {
      type: String,
      value: "取消"
    },
    confirmText: {
      type: String,
      value: "确定"
    },
    confirmWarn: {
      type: Boolean,
      value: false
    }
  },
  data: {
    buttons: []
  },
  observers: {
    "cancelText, confirmText, confirmWarn": function buildButtons(cancelText, confirmText, confirmWarn) {
      this.setData({
        buttons: [
          { text: cancelText || "取消" },
          {
            text: confirmText || "确定",
            extClass: confirmWarn ? "confirm-button-warn" : ""
          }
        ]
      });
    }
  },
  lifetimes: {
    attached() {
      this.setData({
        buttons: [
          { text: this.data.cancelText || "取消" },
          {
            text: this.data.confirmText || "确定",
            extClass: this.data.confirmWarn ? "confirm-button-warn" : ""
          }
        ]
      });
    }
  },
  methods: {
    handleClose() {
      this.triggerEvent("cancel");
    },
    handleButtonTap(event) {
      if (event.detail.index === 1) {
        this.triggerEvent("confirm");
        return;
      }
      this.triggerEvent("cancel");
    }
  }
});
