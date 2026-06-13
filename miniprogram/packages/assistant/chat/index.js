const { request } = require("../../../utils/request");

let messageCounter = 0;
function createMessageId() {
  return `msg_${Date.now()}_${++messageCounter}`;
}

const DEFAULT_SUGGESTIONS = [
  { text: "什么是 HPV？" },
  { text: "ASC-US 是什么意思？" },
  { text: "TCT 检查需要注意什么？" },
  { text: "多久应该做一次筛查？" },
  { text: "LSIL 和 HSIL 有什么区别？" },
  { text: "如何管理复查提醒？" }
];

Page({
  data: {
    brandColor: "#2563eb",
    messages: [],
    inputValue: "",
    isSending: false,
    isTyping: false,
    scrollToId: "",
    suggestions: DEFAULT_SUGGESTIONS
  },

  onSend() {
    const text = (this.data.inputValue || "").trim();
    if (!text || this.data.isSending) return;

    const userMsg = {
      id: createMessageId(),
      role: "user",
      content: text
    };

    const messages = [...this.data.messages, userMsg];
    this.setData({
      messages,
      inputValue: "",
      isSending: true,
      isTyping: true
    });

    this.scrollToBottom();
    this.sendChatRequest(messages);
  },

  onSuggestionTap(event) {
    const text = event.currentTarget.dataset.text;
    this.setData({ inputValue: text });
    this.onSend();
  },

  onInput(event) {
    this.setData({ inputValue: event.detail.value || "" });
  },

  async sendChatRequest(messages) {
    const apiMessages = messages.map((m) => ({
      role: m.role,
      content: m.content
    }));

    try {
      const res = await request("/assistant/chat", {
        method: "POST",
        data: { messages: apiMessages, stream: false }
      });

      const assistantMsg = {
        id: createMessageId(),
        role: "assistant",
        content: res.data?.reply || "抱歉，暂时无法生成回复，请稍后重试。",
        disclaimer: res.data?.disclaimer || ""
      };

      this.setData({
        messages: [...this.data.messages, assistantMsg],
        isTyping: false,
        isSending: false
      });

      this.scrollToBottom();
    } catch (error) {
      const errorMsg = {
        id: createMessageId(),
        role: "assistant",
        content: "网络异常，请稍后重试。本助手仅提供健康科普信息。",
        disclaimer: "以上信息仅供参考，请以线下医疗机构意见为准。"
      };

      this.setData({
        messages: [...this.data.messages, errorMsg],
        isTyping: false,
        isSending: false
      });

      this.scrollToBottom();
    }
  },

  scrollToBottom() {
    const msgs = this.data.messages;
    if (msgs.length > 0) {
      const lastMsg = msgs[msgs.length - 1];
      this.setData({ scrollToId: `msg-${lastMsg.id}` });
    }
    if (typeof wx.nextTick === "function") {
      wx.nextTick(() => {
        this.setData({ scrollToId: "msg-bottom" });
      });
    }
  }
});
