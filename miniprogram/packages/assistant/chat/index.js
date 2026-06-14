const { request } = require("../../../utils/request");

let messageCounter = 0;
function createMessageId() {
  return `msg_${Date.now()}_${++messageCounter}`;
}

const DEFAULT_SUGGESTIONS = [
  { icon: "🔬", text: "什么是 HPV？" },
  { icon: "📋", text: "ASC-US 是什么意思？" },
  { icon: "🏥", text: "TCT 检查需要注意什么？" },
  { icon: "📅", text: "多久应该做一次筛查？" },
  { icon: "📊", text: "LSIL 和 HSIL 有什么区别？" },
  { icon: "⏰", text: "如何管理复查提醒？" }
];

Page({
  data: {
    messages: [],
    inputValue: "",
    isSending: false,
    scrollToId: "",
    suggestions: DEFAULT_SUGGESTIONS,
    // 深度思考面板折叠状态，key = messageId
    thinkCollapsed: {}
  },

  onSend() {
    const text = (this.data.inputValue || "").trim();
    if (!text || this.data.isSending) return;

    const userMsg = {
      id: createMessageId(),
      role: "user",
      content: text,
      time: this._formatTime()
    };

    const assistantMsg = {
      id: createMessageId(),
      role: "assistant",
      content: "",
      reasoning: "",
      disclaimer: "",
      loading: true,
      time: this._formatTime()
    };

    const messages = [...this.data.messages, userMsg, assistantMsg];
    this.setData({
      messages,
      inputValue: "",
      isSending: true
    });

    this.scrollToBottom();
    this.sendChatRequest(messages, assistantMsg.id);
  },

  onSuggestionTap(event) {
    const text = event.currentTarget.dataset.text;
    this.setData({ inputValue: text });
    this.onSend();
  },

  onInput(event) {
    this.setData({ inputValue: event.detail.value || "" });
  },

  toggleThinkPanel(event) {
    const msgId = event.currentTarget.dataset.id;
    const key = `thinkCollapsed.${msgId}`;
    this.setData({ [key]: !this.data.thinkCollapsed[msgId] });
  },

  async sendChatRequest(messages, assistantMsgId) {
    const apiMessages = messages
      .filter((m) => !m.loading)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await request("/assistant/chat", {
        method: "POST",
        data: { messages: apiMessages, stream: false },
        timeout: 90000
      });

      const data = res.data || {};
      this._updateAssistantMessage(assistantMsgId, {
        content: data.reply || "抱歉，暂时无法生成回复，请稍后重试。",
        reasoning: data.reasoning || "",
        disclaimer: data.disclaimer || "",
        loading: false
      });
    } catch (_error) {
      this._updateAssistantMessage(assistantMsgId, {
        content: "网络异常，请稍后重试。本助手仅提供健康科普信息。",
        reasoning: "",
        disclaimer: "以上信息仅供参考，请以线下医疗机构意见为准。",
        loading: false
      });
    }
  },

  _updateAssistantMessage(msgId, updates) {
    const messages = this.data.messages.map((m) => {
      if (m.id === msgId) return { ...m, ...updates };
      return m;
    });
    this.setData({ messages, isSending: false });
    this.scrollToBottom();
  },

  scrollToBottom() {
    if (typeof wx.nextTick === "function") {
      wx.nextTick(() => {
        this.setData({ scrollToId: "msg-bottom" });
      });
    } else {
      setTimeout(() => {
        this.setData({ scrollToId: "msg-bottom" });
      }, 50);
    }
  },

  _formatTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }
});
