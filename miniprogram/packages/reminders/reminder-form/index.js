const {
  request,
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  upsertCachedListItem,
  markCacheDirty,
  isLoggedIn
} = require("../../../utils/request");
const { withPageLoading, DRAFT_KEYS, saveDraft, loadDraft, clearDraft, formHasData, debounce } = require("../../../utils/form");
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
  done: false,
  type: "follow_up",
  priority: "medium",
  notes: ""
};

const titleOptions = ["复查提醒", "资料准备", "记录整理", "线下咨询准备"];

const REM_TYPE_OPTIONS = [
  { value: "follow_up", label: "复查提醒" },
  { value: "material", label: "资料准备" },
  { value: "consultation", label: "线下咨询" },
  { value: "record", label: "记录整理" }
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" }
];

const TITLE_TO_TYPE = {
  "复查提醒": "follow_up",
  "资料准备": "material",
  "记录整理": "record",
  "线下咨询准备": "consultation"
};
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

function buildTitleOptionsView(activeTitle) {
  return titleOptions.map((title, index) => ({
    title,
    label: index === 3 ? "咨询准备" : title,
    className: title === activeTitle ? "choice-chip choice-chip-active" : "choice-chip"
  }));
}

function buildRemTypeOptions(activeType) {
  return REM_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
    className: opt.value === activeType ? "choice-chip choice-chip-active" : "choice-chip"
  }));
}

function buildPriorityOptions(activePriority) {
  return PRIORITY_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
    className: opt.value === activePriority ? "choice-chip choice-chip-active" : "choice-chip"
  }));
}

function normalizeForm(form) {
  const source = form || {};
  return {
    ...defaultForm,
    ...source,
    title: String(source.title || defaultForm.title),
    date: String(source.date || defaultForm.date),
    desc: String(source.desc || defaultForm.desc),
    done: !!source.done,
    type: String(source.type || defaultForm.type),
    priority: String(source.priority || defaultForm.priority),
    notes: String(source.notes || defaultForm.notes)
  };
}

function buildFormState(form) {
  const nextForm = normalizeForm(form);
  const titleIndex = findTitleIndex(nextForm.title);
  const currentTitle = titleOptions[titleIndex] || titleOptions[0];
  return {
    formModel: {
      title: nextForm.title,
      date: nextForm.date,
      desc: nextForm.desc
    },
    today: getTodayDate(),
    pageTitle: "新增复查提醒",
    title: nextForm.title,
    date: nextForm.date,
    dateDisplay: nextForm.date || "请选择日期",
    desc: nextForm.desc,
    done: nextForm.done,
    type: nextForm.type,
    priority: nextForm.priority,
    notes: nextForm.notes,
    titleOptionsView: buildTitleOptionsView(currentTitle),
    remTypeOptions: buildRemTypeOptions(nextForm.type),
    priorityOptions: buildPriorityOptions(nextForm.priority),
    doneItems: [{ label: "标记为已完成", value: "done", checked: nextForm.done }],
    descLength: nextForm.desc.length,
    notesLength: nextForm.notes.length
  };
}

function buildFormPayload(data) {
  return {
    title: String(data.title || ""),
    date: String(data.date || ""),
    desc: String(data.desc || ""),
    done: !!data.done,
    type: String(data.type || "follow_up"),
    priority: String(data.priority || "medium"),
    notes: String(data.notes || "")
  };
}

Page({
  data: {
    id: "",
    ...buildFormState(defaultForm),
    submitText: "保存提醒",
    errorMessage: "",
    loading: false,
    fieldErrors: {}
  },

  async onLoad(query) {
    if (!isLoggedIn()) {
      await showErrorModal("登录后可保存个人复查提醒。");
      openRoute(ROUTES.login, {}, { redirect: true });
      return;
    }

    wx.setNavigationBarTitle({ title: query.id ? "编辑复查提醒" : "新增复查提醒" });

    if (query.id) {
      this.setData({
        id: query.id,
        pageTitle: "编辑复查提醒"
      });
      const cachedDetail = getCachedData(CACHE_KEYS.reminderDetail(query.id));
      if (cachedDetail && cachedDetail.data) {
        this.setData({
          ...buildFormState(cachedDetail.data),
          pageTitle: "编辑复查提醒"
        });
      }
      this.loadReminder(query.id);
      return;
    }

    this._initDraftSave();

    const draft = loadDraft(DRAFT_KEYS.reminder);
    if (draft && draft.data) {
      wx.showModal({
        title: "发现草稿",
        content: "有未保存的提醒草稿，是否恢复？",
        confirmText: "恢复",
        cancelText: "忽略",
        success: (res) => {
          if (res.confirm) {
            this.setData(buildFormState(draft.data));
          } else {
            clearDraft(DRAFT_KEYS.reminder);
            this.setData(buildFormState({ ...defaultForm, date: getTodayDate() }));
          }
        }
      });
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
          ...buildFormState(res.data),
          pageTitle: "编辑复查提醒"
        });
      }
    } catch (error) {
      showErrorToast(error, "加载失败");
    }
  },

  _initDraftSave() {
    this._saveDraft = debounce(() => {
      saveDraft(DRAFT_KEYS.reminder, buildFormPayload(this.data));
    }, 300);
  },

  _triggerDraftSave() {
    if (this._saveDraft) this._saveDraft();
  },

  updateTextField(field, inputValue) {
    const value = String(inputValue || "");
    const updates = {
      [field]: value,
      [`formModel.${field}`]: value,
      errorMessage: ""
    };
    if (field === "desc") {
      updates.descLength = value.length;
    }
    if (field === "notes") {
      updates.notesLength = value.length;
    }
    this.setData(updates);
    this._triggerDraftSave();
  },

  onTitleInput(event) {
    this.updateTextField("title", event.detail.value);
  },

  onDescInput(event) {
    this.updateTextField("desc", event.detail.value);
  },

  onNotesInput(event) {
    this.updateTextField("notes", event.detail.value);
  },

  onDateChange(event) {
    this.setData({
      date: event.detail.value,
      "formModel.date": event.detail.value,
      dateDisplay: event.detail.value || "请选择日期",
      errorMessage: ""
    });
    this._triggerDraftSave();
  },

  onTitleTemplateChange(event) {
    const index = Number(event.detail.value || 0);
    const title = titleOptions[index] || titleOptions[0];
    this.setData({
      title,
      "formModel.title": title,
      titleOptionsView: buildTitleOptionsView(title),
      errorMessage: ""
    });
  },

  selectTitle(event) {
    const title = String(event.currentTarget.dataset.title || titleOptions[0]);
    const index = findTitleIndex(title);
    const currentTitle = titleOptions[index] || titleOptions[0];
    const mappedType = TITLE_TO_TYPE[currentTitle] || "follow_up";
    this.setData({
      title: currentTitle,
      "formModel.title": currentTitle,
      type: mappedType,
      titleOptionsView: buildTitleOptionsView(currentTitle),
      remTypeOptions: buildRemTypeOptions(mappedType),
      errorMessage: ""
    });
  },

  selectRemType(event) {
    const value = String(event.currentTarget.dataset.value || "follow_up");
    this.setData({
      type: value,
      remTypeOptions: buildRemTypeOptions(value),
      errorMessage: ""
    });
  },

  selectPriority(event) {
    const value = String(event.currentTarget.dataset.value || "medium");
    this.setData({
      priority: value,
      priorityOptions: buildPriorityOptions(value),
      errorMessage: ""
    });
  },

  applyTemplate(event) {
    const templateName = String(event.currentTarget.dataset.template || "");
    const index = Number(event.currentTarget.dataset.index || 0);
    const template = templateMap[templateName] || reminderTemplates[index];
    if (!template) return;

    const REMINDER_FIELDS = ["title", "desc", "notes"];
    if (formHasData(this.data, REMINDER_FIELDS)) {
      wx.showModal({
        title: "应用模板",
        content: "当前表单已有内容，应用模板将覆盖现有数据，是否继续？",
        confirmText: "覆盖",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) this._doApplyTemplate(template);
        }
      });
      return;
    }
    this._doApplyTemplate(template);
  },

  _doApplyTemplate(template) {
    const nextForm = {
      ...buildFormPayload(this.data),
      ...template.form,
      date: this.data.date || getOffsetDate(template.offsetDays)
    };
    this.setData({
      ...buildFormState(nextForm),
      errorMessage: ""
    });
    this._triggerDraftSave();
  },

  selectQuickDate(event) {
    const offsetDays = Number(event.currentTarget.dataset.offset || 0);
    const date = getOffsetDate(offsetDays);
    this.setData({
      date,
      dateDisplay: date,
      errorMessage: ""
    });
  },

  onDoneChange(event) {
    const values = Array.isArray(event.detail.value) ? event.detail.value : [];
    const done = values.indexOf("done") > -1 || event.detail.value === true;
    this.setData({
      done,
      doneItems: [{ label: "标记为已完成", value: "done", checked: done }]
    });
  },

  validateField(field) {
    const value = String(this.data[field] || "").trim();
    const labels = {
      title: "请选择或填写提醒标题",
      date: "请选择提醒日期",
      desc: "请填写提醒内容"
    };
    return value ? "" : (labels[field] || "");
  },

  onFieldBlur(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    const error = this.validateField(field);
    this.setData({ [`fieldErrors.${field}`]: error });
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

    this.setData({ submitText: "正在保存" });
    await withPageLoading(this, async () => {
      const res = await request(path, {
        method,
        data: buildFormPayload(this.data)
      });
      const savedReminder = res.data;
      setCachedData(CACHE_KEYS.reminderDetail(savedReminder.id), res);
      upsertCachedListItem(CACHE_KEYS.reminders, savedReminder, { prepend: !this.data.id });
      markCacheDirty(CACHE_KEYS.home);
      clearDraft(DRAFT_KEYS.reminder);
      showSuccessToast("已保存");
      navigateBackLater();
    }).catch((error) => {
      this.setData({ submitText: "保存提醒" });
      showErrorToast(error, "保存失败");
    });
  }
});
