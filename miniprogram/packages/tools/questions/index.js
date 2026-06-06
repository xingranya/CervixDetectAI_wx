const {
  request,
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  isCacheFresh,
  consumeCacheDirty,
  removeCachedListItem,
  updateCachedListItem
} = require("../../../utils/request");
const { PAGE_STATUS } = require("../../../utils/page-state");
const { showErrorToast, showSuccessToast, getErrorMessage } = require("../../../utils/feedback");

function resolveQuestionsStatus(templates, questions) {
  return templates.length || questions.length ? PAGE_STATUS.READY : PAGE_STATUS.EMPTY;
}

function buildTemplateOptions(templates, selected) {
  return templates.map((text) => ({
    text,
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
    errorMessage: ""
  },

  onShow() {
    const cachedTemplates = getCachedData(CACHE_KEYS.questionTemplates);
    const cachedQuestions = getCachedData(CACHE_KEYS.questions);
    const hasCachedTemplates = !!(cachedTemplates && Array.isArray(cachedTemplates.data));
    const hasCachedQuestions = !!(cachedQuestions && Array.isArray(cachedQuestions.data));

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
      || !hasCachedQuestions
      || consumeCacheDirty(CACHE_KEYS.questions)
      || !isCacheFresh(CACHE_KEYS.questionTemplates, 5 * 60 * 1000)
      || !isCacheFresh(CACHE_KEYS.questions);

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
      const [templateRes, questionRes] = await Promise.all([
        request("/question-templates", {
          cacheKey: CACHE_KEYS.questionTemplates,
          maxAge: 5 * 60 * 1000
        }),
        request("/questions", {
          cacheKey: CACHE_KEYS.questions
        })
      ]);
      const templates = templateRes.data || [];
      const questions = questionRes.data || [];
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

  onCustomInput(event) {
    this.setData({ customQuestion: event.detail.value });
  },

  async saveSelected() {
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
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除问题",
      content: "确认删除这条问题记录吗？",
      confirmColor: "#d32f2f",
      success: async (res) => {
        if (!res.confirm) return;
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
  }
});
