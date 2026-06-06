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

Page({
  data: {
    id: "",
    form: { ...defaultForm },
    loading: false
  },

  onLoad(query) {
    if (query.id) {
      this.setData({ id: query.id });
      const cachedDetail = getCachedData(CACHE_KEYS.reminderDetail(query.id));
      if (cachedDetail && cachedDetail.data) {
        this.setData({ form: cachedDetail.data });
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
        this.setData({ form: res.data });
      }
    } catch (error) {
      showErrorToast(error, "加载失败");
    }
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  onDateChange(event) {
    this.setData({ "form.date": event.detail.value });
  },

  onDoneChange(event) {
    this.setData({ "form.done": event.detail.value });
  },

  validateForm() {
    const form = this.data.form;
    if (!String(form.title || "").trim() || !form.date || !String(form.desc || "").trim()) {
      showErrorToast("请补全提醒内容", "请补全提醒内容");
      return false;
    }
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
