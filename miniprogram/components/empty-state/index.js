const ICON_MAP = {
  info_circle: "info",
  waiting: "info",
  time: "info",
  "safe-success": "success",
  lock: "info",
  note: "info",
  comment: "info",
  calendar: "info",
  bell: "info"
};

function normalizeWeuiIcon(icon) {
  const key = String(icon || "").trim();
  return ICON_MAP[key] || key;
}

Component({
  properties: {
    title: {
      type: String,
      value: ""
    },
    desc: {
      type: String,
      value: ""
    },
    icon: {
      type: String,
      value: ""
    },
    weuiIcon: {
      type: String,
      value: ""
    },
    buttonText: {
      type: String,
      value: ""
    }
  },
  data: {
    normalizedWeuiIcon: ""
  },
  observers: {
    weuiIcon(value) {
      this.setData({ normalizedWeuiIcon: normalizeWeuiIcon(value) });
    }
  },
  lifetimes: {
    attached() {
      this.setData({ normalizedWeuiIcon: normalizeWeuiIcon(this.properties.weuiIcon) });
    }
  },
  methods: {
    handleAction() {
      this.triggerEvent("action");
    }
  }
});
