const {
  request,
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  upsertCachedListItem,
  markCacheDirty
} = require("../../../utils/request");
const { withPageLoading } = require("../../../utils/form");
const { showErrorToast, showSuccessToast } = require("../../../utils/feedback");
const { navigateBackLater } = require("../../../utils/navigation");
const {
  hasReminderSubscriptionTemplate,
  requestReminderSubscription
} = require("../utils/subscription");

function getTodayDate() {
  const date = new Date();
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

function findTitleIndex(title) {
  const index = titleOptions.indexOf(title);
  return index > -1 ? index : 0;
}

Page({
  data: {
    id: "",
    form: { ...defaultForm },
    titleOptions,
    titleIndex: 0,
    errorMessage: "",
    subscriptionEnabled: false,
    subscriptionAccepted: false,
    subscriptionMessage: "开启微信服务通知后，可在后续安排临近时收到提醒。",
    loading: false
  },

  onLoad(query) {
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
