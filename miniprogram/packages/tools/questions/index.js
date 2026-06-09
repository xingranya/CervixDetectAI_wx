const {
  request,
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  isCacheFresh,
  consumeCacheDirty,
  removeCachedListItem,
  updateCachedListItem,
  isLoggedIn
} = require("../../../utils/request");
const { PAGE_STATUS } = require("../../../utils/page-state");
const { showErrorToast, showSuccessToast, getErrorMessage, showErrorModal } = require("../../../utils/feedback");

function resolveQuestionsStatus(templates, questions) {
  return templates.length || questions.length ? PAGE_STATUS.READY : PAGE_STATUS.EMPTY;
}

function buildTemplateOptions(templates, selected) {
  return templates.map((text) => ({
    text,
    label: text,
    value: text,
    selected: selected.indexOf(text) > -1
  }));
}

Page({
  templateTexts: [],

  data: {
    templateOptions: [],
    selected: [],
    questions: [],
    customQuestion: "",
    pageStatus: PAGE_STATUS.LOADING,
    errorMessage: "",
    isGuest: !isLoggedIn(),
    searchKeyword: "",
    confirmDialog: {
      show: false,
      id: ""
    }
  },

  onShow() {
    this.setData({ isGuest: !isLoggedIn() });
    const cachedTemplates = getCachedData(CACHE_KEYS.questionTemplates);
    const cachedQuestions = getCachedData(CACHE_KEYS.questions);
    const hasCachedTemplates = !!(cachedTemplates && Array.isArray(cachedTemplates.data));
    const hasCachedQuestions = isLoggedIn() && !!(cachedQuestions && Array.isArray(cachedQuestions.data));

    const templates = hasCachedTemplates ? cachedTemplates.data : [];
    const questions = hasCachedQuestions ? cachedQuestions.data : [];
    this.templateTexts = templates;

    if (templates.length || questions.length) {
      this.setData({
        templateOptions: buildTemplateOptions(templates, this.data.selected),
        questions,
        pageStatus: resolveQuestionsStatus(templates, questions),
        errorMessage: ""
      });
    }

    const shouldRefresh = !hasCachedTemplates
      || (isLoggedIn() && !hasCachedQuestions)
      || (isLoggedIn() && consumeCacheDirty(CACHE_KEYS.questions))
      || !isCacheFresh(CACHE_KEYS.questionTemplates, 5 * 60 * 1000)
      || (isLoggedIn() && !isCacheFresh(CACHE_KEYS.questions));

    if (shouldRefresh) {
      this.loadData({ silent: templates.length || questions.length });
    }
  },

  async loadData(options = {}) {
    const { silent = false } = options;
    if (!silent) {
      this.setData({
        pageStatus: PAGE_STATUS.LOADING,
        errorMessage: ""
      });
    }

    try {
      const tasks = [
        request("/question-templates", {
          cacheKey: CACHE_KEYS.questionTemplates,
          maxAge: 5 * 60 * 1000
        })
      ];
      if (isLoggedIn()) {
        tasks.push(request("/questions", {
          cacheKey: CACHE_KEYS.questions
        }));
      }

      const [templateRes, questionRes] = await Promise.all(tasks);
      const templates = templateRes.data || [];
      const questions = isLoggedIn() && questionRes ? (questionRes.data || []) : [];
      this.templateTexts = templates;
      this.setData({
        templateOptions: buildTemplateOptions(templates, this.data.selected),
        questions,
        pageStatus: resolveQuestionsStatus(templates, questions),
        errorMessage: ""
      });
    } catch (error) {
      if (this.data.templateOptions.length || this.data.questions.length) return;
      this.setData({
        pageStatus: PAGE_STATUS.ERROR,
        errorMessage: getErrorMessage(error, "加载失败")
      });
    }
  },

  async onPullDownRefresh() {
    await this.loadData({ silent: true });
    wx.stopPullDownRefresh();
  },

  toggleQuestion(event) {
    const text = event.currentTarget.dataset.text;
    const selected = this.data.selected.indexOf(text) > -1
      ? this.data.selected.filter((item) => item !== text)
      : [...this.data.selected, text];
    this.setData({
      selected,
      templateOptions: buildTemplateOptions(this.templateTexts, selected)
    });
  },

  searchQuestions(keyword) {
    const query = String(keyword || "").trim().toLowerCase();
    const source = this.templateTexts.concat(this.data.questions.map((item) => item.questionText));
    const list = query
      ? source.filter((text) => String(text || "").toLowerCase().indexOf(query) > -1)
      : source;
    return Promise.resolve(list.map((text) => ({ text, value: text })));
  },

  onSearchChange(event) {
    this.setData({ searchKeyword: event.detail.value || "" });
  },

  onSearchClear() {
    this.setData({ searchKeyword: "" });
  },

  onTemplateChange(event) {
    const selected = event.detail.value || [];
    this.setData({
      selected,
      templateOptions: buildTemplateOptions(this.templateTexts, selected)
    });
  },

  onCustomInput(event) {
    this.setData({ customQuestion: event.detail.value });
  },

  async saveSelected() {
    if (!isLoggedIn()) {
      showErrorModal("登录后可保存自己的问题清单和线下咨询备忘。");
      return;
    }

    const questions = [...this.data.selected];
    const customQuestion = String(this.data.customQuestion || "").trim();
    if (customQuestion) questions.push(customQuestion);

    if (!questions.length) {
      showErrorToast("请先选择或填写问题", "请先选择或填写问题");
      return;
    }

    try {
      const res = await request("/questions/batch", {
        method: "POST",
        data: { questions }
      });
      const createdQuestions = res.data && Array.isArray(res.data.questions) ? res.data.questions : [];
      const nextQuestions = [...createdQuestions, ...this.data.questions];
      setCachedData(CACHE_KEYS.questions, {
        success: true,
        data: nextQuestions
      });
      this.setData({
        selected: [],
        templateOptions: buildTemplateOptions(this.templateTexts, []),
        customQuestion: "",
        questions: nextQuestions,
        pageStatus: resolveQuestionsStatus(this.templateTexts, nextQuestions),
        errorMessage: ""
      });
      showSuccessToast("已保存");
    } catch (error) {
      showErrorToast(error, "保存失败");
    }
  },

  onAnswerInput(event) {
    const id = event.currentTarget.dataset.id;
    const answerText = event.detail.value;
    const index = this.data.questions.findIndex((item) => item.id === id);
    if (index === -1) return;
    this.setData({ [`questions[${index}].answerText`]: answerText });
  },

  async saveAnswer(event) {
    if (!isLoggedIn()) {
      showErrorModal("登录后可保存个人备忘。");
      return;
    }

    const id = event.currentTarget.dataset.id;
    const question = this.data.questions.find((item) => item.id === id);
    if (!question) return;

    try {
      const res = await request(`/questions/${id}`, {
        method: "PUT",
        data: question
      });
      const savedQuestion = res.data;
      updateCachedListItem(CACHE_KEYS.questions, id, savedQuestion);
      this.setData({
        questions: this.data.questions.map((item) => (item.id === id ? savedQuestion : item))
      });
      showSuccessToast("已保存");
    } catch (error) {
      showErrorToast(error, "保存失败");
    }
  },

  deleteQuestion(event) {
    if (!isLoggedIn()) {
      showErrorModal("登录后可删除自己的问题记录。");
      return;
    }

    const id = event.currentTarget.dataset.id;
    this.setData({
      confirmDialog: {
        show: true,
        id
      }
    });
  },

  closeConfirmDialog() {
    this.setData({
      "confirmDialog.show": false,
      "confirmDialog.id": ""
    });
  },

  async confirmDeleteQuestion() {
    const id = this.data.confirmDialog.id;
    this.closeConfirmDialog();
    if (!id) return;
    try {
      await request(`/questions/${id}`, { method: "DELETE" });
      removeCachedListItem(CACHE_KEYS.questions, id);
      const nextQuestions = this.data.questions.filter((item) => item.id !== id);
      this.setData({
        questions: nextQuestions,
        pageStatus: resolveQuestionsStatus(this.templateTexts, nextQuestions)
      });
      showSuccessToast("已删除");
    } catch (error) {
      showErrorToast(error, "删除失败");
    }
  }
});
