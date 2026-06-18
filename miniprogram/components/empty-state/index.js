const ICON_MAP = {
  info: "info-circle",
  success: "check-circle",
  info_circle: "info-circle",
  waiting: "time",
  time: "time",
  "safe-success": "check-circle",
  lock: "lock-on",
  note: "file",
  comment: "chat",
  calendar: "calendar",
  bell: "notification",
  search: "search",
  // 页面语义图标
  home: "home",
  records: "file",
  record: "file",
  reminders: "notification",
  reminder: "notification",
  articles: "book-open",
  article: "book-open",
  questions: "chat-bubble-help",
  question: "chat-bubble-help",
  feedback: "chat",
  service: "file",
  compliance: "lock-on",
  privacy: "lock-on",
  setup: "setting",
  profile: "user",
  login: "login",
  user: "user",
  delete: "delete",
  edit: "edit-1",
  check: "check",
  add: "add"
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
