const {
  request,
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  upsertCachedListItem,
  markCacheDirty,
  isLoggedIn
} = require("../../../utils/request");
const { withPageLoading } = require("../../../utils/form");
const { showErrorToast, showSuccessToast, showErrorModal } = require("../../../utils/feedback");
const { ROUTES, openRoute, navigateBackLater } = require("../../../utils/navigation");
const {
  hasReminderSubscriptionTemplate,
  requestReminderSubscription
} = require("../utils/subscription");

function getTodayDate() {
  return getOffsetDate(0);
}

function getOffsetDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const defaultForm = {
  title: "",
  date: "",
  desc: "",
  done: false
};

const titleOptions = ["复查提醒", "资料准备", "记录整理", "线下咨询准备"];
const reminderTemplates = [
  {
    name: "复查",
    desc: "到期前安排复查",
    form: {
      title: "复查提醒",
      desc: "建议在计划时间前完成复查安排，并提前确认需要携带的资料。"
    },
    offsetDays: 90
  },
  {
    name: "资料",
    desc: "整理摘要和历史记录",
    form: {
      title: "资料准备",
      desc: "咨询前准备近期检查摘要、历史记录和想确认的问题。"
    },
    offsetDays: 7
  },
  {
    name: "问题",
    desc: "咨询前整理问题",
    form: {
      title: "线下咨询准备",
      desc: "提前整理需要咨询的问题，并把近期变化和个人备忘一起记录。"
    },
    offsetDays: 3
  }
];
const quickDateOptions = [
  { label: "今天", offsetDays: 0 },
  { label: "3天后", offsetDays: 3 },
  { label: "1周后", offsetDays: 7 },
  { label: "1个月后", offsetDays: 30 }
];

function findTitleIndex(title) {
  const index = titleOptions.indexOf(title);
  return index > -1 ? index : 0;
}

Page({
  data: {
    id: "",
    form: { ...defaultForm },
    reminderTemplates,
    quickDateOptions,
    titleOptions,
    titleIndex: 0,
    errorMessage: "",
    subscriptionEnabled: false,
    subscriptionAccepted: false,
    subscriptionMessage: "开启微信服务通知后，可在后续安排临近时收到提醒。",
    loading: false
  },

  async onLoad(query) {
    if (!isLoggedIn()) {
      await showErrorModal("登录后可保存个人复查提醒。");
      openRoute(ROUTES.login, {}, { redirect: true });
      return;
    }

    this.setData({
      subscriptionEnabled: hasReminderSubscriptionTemplate()
    });

    if (query.id) {
      this.setData({ id: query.id });
      const cachedDetail = getCachedData(CACHE_KEYS.reminderDetail(query.id));
      if (cachedDetail && cachedDetail.data) {
        this.setData({
          form: cachedDetail.data,
          titleIndex: findTitleIndex(cachedDetail.data.title)
        });
      }
      this.loadReminder(query.id);
      return;
    }
    this.setData({ form: { ...defaultForm, date: getTodayDate() } });
  },

  async loadReminder(id) {
    try {
      const res = await request(`/reminders/${id}`, {
        cacheKey: CACHE_KEYS.reminderDetail(id)
      });
      if (res.data) {
        this.setData({
          form: res.data,
          titleIndex: findTitleIndex(res.data.title)
        });
      }
    } catch (error) {
      showErrorToast(error, "加载失败");
    }
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value,
      errorMessage: ""
    });
  },

  onDateChange(event) {
    this.setData({
      "form.date": event.detail.value,
      errorMessage: ""
    });
  },

  onTitleTemplateChange(event) {
    const index = Number(event.detail.value || 0);
    this.setData({
      titleIndex: index,
      "form.title": titleOptions[index] || titleOptions[0],
      errorMessage: ""
    });
  },

  applyTemplate(event) {
    const index = Number(event.currentTarget.dataset.index || 0);
    const template = reminderTemplates[index];
    if (!template) return;
    const nextForm = {
      ...this.data.form,
      ...template.form,
      date: this.data.form.date || getOffsetDate(template.offsetDays)
    };
    this.setData({
      form: nextForm,
      titleIndex: findTitleIndex(nextForm.title),
      errorMessage: ""
    });
  },

  selectQuickDate(event) {
    const offsetDays = Number(event.currentTarget.dataset.offset || 0);
    this.setData({
      "form.date": getOffsetDate(offsetDays),
      errorMessage: ""
    });
  },

  onDoneChange(event) {
    this.setData({ "form.done": event.detail.value });
  },

  async requestSubscription() {
    try {
      const res = await requestReminderSubscription();
      this.setData({
        subscriptionAccepted: !!res.accepted,
        subscriptionMessage: res.message
      });
      wx.showToast({
        title: res.message,
        icon: "none"
      });
    } catch (error) {
      showErrorToast(error, "服务通知授权失败");
    }
  },

  validateForm() {
    const form = this.data.form;
    if (!String(form.title || "").trim()) {
      this.setData({ errorMessage: "请选择或填写提醒标题" });
      return false;
    }
    if (!form.date) {
      this.setData({ errorMessage: "请选择提醒日期" });
      return false;
    }
    if (!String(form.desc || "").trim()) {
      this.setData({ errorMessage: "请填写提醒内容" });
      return false;
    }
    this.setData({ errorMessage: "" });
    return true;
  },

  async submitForm() {
    if (!this.validateForm()) return;

    const method = this.data.id ? "PUT" : "POST";
    const path = this.data.id ? `/reminders/${this.data.id}` : "/reminders";

    await withPageLoading(this, async () => {
      const res = await request(path, {
        method,
        data: this.data.form
      });
      const savedReminder = res.data;
      setCachedData(CACHE_KEYS.reminderDetail(savedReminder.id), res);
      upsertCachedListItem(CACHE_KEYS.reminders, savedReminder, { prepend: !this.data.id });
      markCacheDirty(CACHE_KEYS.home);
      showSuccessToast("已保存");
      navigateBackLater();
    }).catch((error) => {
      showErrorToast(error, "保存失败");
    });
  }
});
