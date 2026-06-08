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
const templateMap = reminderTemplates.reduce((result, item) => {
  result[item.name] = item;
  return result;
}, {});

function findTitleIndex(title) {
  const index = titleOptions.indexOf(title);
  return index > -1 ? index : 0;
}

function normalizeForm(form) {
  const source = form || {};
  return {
    ...defaultForm,
    ...source,
    title: String(source.title || defaultForm.title),
    date: String(source.date || defaultForm.date),
    desc: String(source.desc || defaultForm.desc),
    done: !!source.done
  };
}

function buildFormState(form) {
  const nextForm = normalizeForm(form);
  const titleIndex = findTitleIndex(nextForm.title);
  return {
    title: nextForm.title,
    date: nextForm.date,
    desc: nextForm.desc,
    done: nextForm.done,
    titleIndex,
    currentTitle: titleOptions[titleIndex] || titleOptions[0],
    descLength: nextForm.desc.length
  };
}

function buildFormPayload(data) {
  return {
    title: String(data.title || ""),
    date: String(data.date || ""),
    desc: String(data.desc || ""),
    done: !!data.done
  };
}

Page({
  data: {
    id: "",
    ...buildFormState(defaultForm),
    errorMessage: "",
    loading: false
  },

  async onLoad(query) {
    if (!isLoggedIn()) {
      await showErrorModal("登录后可保存个人复查提醒。");
      openRoute(ROUTES.login, {}, { redirect: true });
      return;
    }

    if (query.id) {
      this.setData({ id: query.id });
      const cachedDetail = getCachedData(CACHE_KEYS.reminderDetail(query.id));
      if (cachedDetail && cachedDetail.data) {
        this.setData({
          ...buildFormState(cachedDetail.data)
        });
      }
      this.loadReminder(query.id);
      return;
    }
    this.setData(buildFormState({ ...defaultForm, date: getTodayDate() }));
  },

  async loadReminder(id) {
    try {
      const res = await request(`/reminders/${id}`, {
        cacheKey: CACHE_KEYS.reminderDetail(id)
      });
      if (res.data) {
        this.setData({
          ...buildFormState(res.data)
        });
      }
    } catch (error) {
      showErrorToast(error, "加载失败");
    }
  },

  updateTextField(field, inputValue) {
    const value = String(inputValue || "");
    const updates = {
      [field]: value,
      errorMessage: ""
    };
    if (field === "desc") {
      updates.descLength = value.length;
    }
    this.setData(updates);
  },

  onTitleInput(event) {
    this.updateTextField("title", event.detail.value);
  },

  onDescInput(event) {
    this.updateTextField("desc", event.detail.value);
  },

  onDateChange(event) {
    this.setData({
      date: event.detail.value,
      errorMessage: ""
    });
  },

  onTitleTemplateChange(event) {
    const index = Number(event.detail.value || 0);
    this.setData({
      titleIndex: index,
      currentTitle: titleOptions[index] || titleOptions[0],
      title: titleOptions[index] || titleOptions[0],
      errorMessage: ""
    });
  },

  selectTitle(event) {
    const title = String(event.currentTarget.dataset.title || titleOptions[0]);
    const index = findTitleIndex(title);
    this.setData({
      titleIndex: index,
      currentTitle: titleOptions[index] || titleOptions[0],
      title: titleOptions[index] || titleOptions[0],
      errorMessage: ""
    });
  },

  applyTemplate(event) {
    const templateName = String(event.currentTarget.dataset.template || "");
    const index = Number(event.currentTarget.dataset.index || 0);
    const template = templateMap[templateName] || reminderTemplates[index];
    if (!template) return;
    const nextForm = {
      ...buildFormPayload(this.data),
      ...template.form,
      date: this.data.date || getOffsetDate(template.offsetDays)
    };
    this.setData({
      ...buildFormState(nextForm),
      errorMessage: ""
    });
  },

  selectQuickDate(event) {
    const offsetDays = Number(event.currentTarget.dataset.offset || 0);
    this.setData({
      date: getOffsetDate(offsetDays),
      errorMessage: ""
    });
  },

  onDoneChange(event) {
    this.setData({ done: event.detail.value });
  },

  validateForm() {
    const form = buildFormPayload(this.data);
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
        data: buildFormPayload(this.data)
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
