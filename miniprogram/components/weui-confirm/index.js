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
  observers: {
    "confirmWarn, confirmText": function (confirmWarn, confirmText) {
      const text = confirmText || "确定";
      this.setData({
        computedConfirmBtn: confirmWarn
          ? { content: text, theme: "danger" }
          : text
      });
    }
  },
  methods: {
    noop() {
      return undefined;
    },
    handleCancel() {
      this.triggerEvent("cancel");
    },
    handleConfirm() {
      this.triggerEvent("confirm");
    }
  }
});
