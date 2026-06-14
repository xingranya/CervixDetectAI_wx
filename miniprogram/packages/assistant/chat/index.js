const {
  request,
  requestStream,
  isLoggedIn
} = require("../../../utils/request");
const { normalizeStoredUser } = require("../../../utils/avatar");
const { ROUTES, openRoute } = require("../../../utils/navigation");
const { showErrorModal } = require("../../../utils/feedback");

const DEFAULT_DISCLAIMER = "以上信息仅供参考，请以线下医疗机构意见为准。";

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

function concatUint8Arrays(left, right) {
  const a = left instanceof Uint8Array ? left : new Uint8Array(0);
  const b = right instanceof Uint8Array ? right : new Uint8Array(0);
  if (!a.length) return b;
  if (!b.length) return a;
  const merged = new Uint8Array(a.length + b.length);
  merged.set(a, 0);
  merged.set(b, a.length);
  return merged;
}

function decodeUtf8Chunk(arrayBuffer, carryBytes) {
  const currentBytes = arrayBuffer instanceof ArrayBuffer
    ? new Uint8Array(arrayBuffer)
    : (arrayBuffer && arrayBuffer.buffer instanceof ArrayBuffer
      ? new Uint8Array(arrayBuffer.buffer, arrayBuffer.byteOffset || 0, arrayBuffer.byteLength || 0)
      : new Uint8Array(0));

  const bytes = concatUint8Arrays(carryBytes, currentBytes);
  let output = "";
  let index = 0;

  while (index < bytes.length) {
    const first = bytes[index];
    let codePoint = 0;
    let needed = 0;

    if (first <= 0x7f) {
      output += String.fromCharCode(first);
      index += 1;
      continue;
    }

    if ((first & 0xe0) === 0xc0) {
      needed = 2;
      codePoint = first & 0x1f;
    } else if ((first & 0xf0) === 0xe0) {
      needed = 3;
      codePoint = first & 0x0f;
    } else if ((first & 0xf8) === 0xf0) {
      needed = 4;
      codePoint = first & 0x07;
    } else {
      output += "�";
      index += 1;
      continue;
    }

    if (index + needed > bytes.length) {
      break;
    }

    let valid = true;
    for (let i = 1; i < needed; i += 1) {
      const next = bytes[index + i];
      if ((next & 0xc0) !== 0x80) {
        valid = false;
        break;
      }
      codePoint = (codePoint << 6) | (next & 0x3f);
    }

    if (!valid) {
      output += "�";
      index += 1;
      continue;
    }

    if (needed === 2 && codePoint < 0x80) {
      output += "�";
      index += 1;
      continue;
    }
    if (needed === 3 && codePoint < 0x800) {
      output += "�";
      index += 1;
      continue;
    }
    if (needed === 4 && codePoint < 0x10000) {
      output += "�";
      index += 1;
      continue;
    }

    if (codePoint <= 0xffff) {
      output += String.fromCharCode(codePoint);
    } else {
      const adjusted = codePoint - 0x10000;
      output += String.fromCharCode(
        0xd800 + (adjusted >> 10),
        0xdc00 + (adjusted & 0x3ff)
      );
    }

    index += needed;
  }

  return {
    text: output,
    carry: bytes.slice(index)
  };
}

function consumeEventBuffer(buffer, onPayload, flush = false) {
  const normalized = String(buffer || "").replace(/\r\n/g, "\n");
  if (!normalized) return "";

  const frames = normalized.split("\n\n");
  const rest = flush ? "" : frames.pop();
  const consumable = flush && rest ? [...frames, rest] : frames;

  consumable.forEach((frame) => {
    const payload = frame
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n")
      .trim();

    if (payload && payload !== "[DONE]") {
      onPayload(payload);
    }
  });

  return rest || "";
}

function resolveUserAvatar() {
  if (!wx.getStorageSync("profileAvatarReady")) {
    return { url: "", localPath: "" };
  }
  const user = normalizeStoredUser(wx.getStorageSync("user"));
  return {
    url: user.avatarUrl || user.avatarLocalPath || "",
    localPath: user.avatarLocalPath || ""
  };
}

Page({
  data: {
    messages: [],
    inputValue: "",
    isSending: false,
    scrollToId: "",
    suggestions: DEFAULT_SUGGESTIONS,
    thinkCollapsed: {},
    userAvatarUrl: "",
    userAvatarLocalPath: ""
  },

  async onLoad() {
    if (!isLoggedIn()) {
      await showErrorModal("登录后可使用健康助手。");
      openRoute(ROUTES.login, {}, { redirect: true });
      return;
    }
    this.renderUserAvatar();
  },

  onShow() {
    this.renderUserAvatar();
  },

  onUnload() {
    this._pageUnmounted = true;
    this._abortActiveStream();
  },

  renderUserAvatar() {
    const avatar = resolveUserAvatar();
    if (
      avatar.url === this.data.userAvatarUrl
      && avatar.localPath === this.data.userAvatarLocalPath
    ) {
      return;
    }
    this.setData({
      userAvatarUrl: avatar.url,
      userAvatarLocalPath: avatar.localPath
    });
  },

  onUserAvatarError() {
    const fallback = this.data.userAvatarLocalPath || "";
    if (fallback && fallback !== this.data.userAvatarUrl) {
      this.setData({ userAvatarUrl: fallback });
      return;
    }
    if (this.data.userAvatarUrl) {
      this.setData({ userAvatarUrl: "" });
    }
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
      streaming: true,
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
      .filter((item) => !item.loading)
      .map((item) => ({ role: item.role, content: item.content }));

    this._streamDone = false;
    this._streamHasChunk = false;
    this._streamBuffer = "";
    this._streamCarryBytes = new Uint8Array(0);
    this._pageUnmounted = false;
    this._abortActiveStream();

    const streamHandle = requestStream("/assistant/chat", {
      method: "POST",
      data: { messages: apiMessages, stream: true },
      timeout: 90000,
      onChunk: (chunk) => this._handleStreamChunk(assistantMsgId, chunk)
    });

    if (!streamHandle.supportsChunked) {
      streamHandle.abort();
      await streamHandle.promise.catch(() => null);
      return this._sendChatRequestFallback(apiMessages, assistantMsgId);
    }

    this._activeStream = streamHandle;

    try {
      await streamHandle.promise;
      this._activeStream = null;

      this._flushStreamBuffer(assistantMsgId);

      if (this._pageUnmounted) return;

      if (!this._streamHasChunk) {
        return this._sendChatRequestFallback(apiMessages, assistantMsgId);
      }

      if (!this._streamDone) {
        this._finishAssistantMessage(assistantMsgId, {
          loading: false,
          streaming: false,
          disclaimer: this._getAssistantMessage(assistantMsgId)?.disclaimer || DEFAULT_DISCLAIMER
        });
      }
    } catch (error) {
      this._activeStream = null;
      if (this._pageUnmounted || (error && error.aborted)) return;
      if (!this._streamHasChunk) {
        return this._sendChatRequestFallback(apiMessages, assistantMsgId);
      }
      this._finishAssistantMessage(assistantMsgId, {
        loading: false,
        streaming: false,
        disclaimer: DEFAULT_DISCLAIMER
      });
    }
  },

  async _sendChatRequestFallback(apiMessages, assistantMsgId) {
    try {
      const res = await request("/assistant/chat", {
        method: "POST",
        data: { messages: apiMessages, stream: false },
        timeout: 90000
      });

      const data = res.data || {};
      this._finishAssistantMessage(assistantMsgId, {
        content: data.reply || "抱歉，暂时无法生成回复，请稍后重试。",
        reasoning: data.reasoning || "",
        disclaimer: data.disclaimer || DEFAULT_DISCLAIMER,
        loading: false,
        streaming: false
      });
    } catch (_error) {
      this._finishAssistantMessage(assistantMsgId, {
        content: "网络异常，请稍后重试。本助手仅提供健康科普信息。",
        reasoning: "",
        disclaimer: DEFAULT_DISCLAIMER,
        loading: false,
        streaming: false
      });
    }
  },

  _handleStreamChunk(msgId, chunk) {
    this._streamHasChunk = true;
    const decoded = decodeUtf8Chunk(chunk, this._streamCarryBytes);
    this._streamCarryBytes = decoded.carry;
    if (!decoded.text) return;

    this._streamBuffer += decoded.text;
    this._streamBuffer = consumeEventBuffer(this._streamBuffer, (payload) => {
      this._handleStreamPayload(msgId, payload);
    });
  },

  _flushStreamBuffer(msgId) {
    const tail = decodeUtf8Chunk(new Uint8Array(0), this._streamCarryBytes);
    this._streamCarryBytes = tail.carry;
    if (tail.text) {
      this._streamBuffer += tail.text;
    }
    this._streamBuffer = consumeEventBuffer(this._streamBuffer, (payload) => {
      this._handleStreamPayload(msgId, payload);
    }, true);
  },

  _handleStreamPayload(msgId, payload) {
    let packet = null;
    try {
      packet = JSON.parse(payload);
    } catch (_error) {
      return;
    }

    if (packet.reasoning) {
      this._appendAssistantDelta(msgId, { reasoning: packet.reasoning });
    }
    if (packet.text) {
      this._appendAssistantDelta(msgId, { content: packet.text });
    }
    if (packet.done) {
      this._streamDone = true;
      this._finishAssistantMessage(msgId, {
        loading: false,
        streaming: false,
        disclaimer: packet.disclaimer || DEFAULT_DISCLAIMER
      });
    }
  },

  _appendAssistantDelta(msgId, delta) {
    const messages = this.data.messages.map((item) => {
      if (item.id !== msgId) return item;
      const nextContent = delta.content ? `${item.content || ""}${delta.content}` : item.content;
      const nextReasoning = delta.reasoning ? `${item.reasoning || ""}${delta.reasoning}` : item.reasoning;
      return {
        ...item,
        content: nextContent,
        reasoning: nextReasoning,
        loading: delta.content ? false : item.loading,
        streaming: true
      };
    });

    this.setData({ messages });
    this._scheduleScrollToBottom();
  },

  _finishAssistantMessage(msgId, updates) {
    const fallbackContent = updates && updates.loading === false
      ? "抱歉，暂时无法生成回复，请稍后重试。"
      : "";
    const messages = this.data.messages.map((item) => {
      if (item.id !== msgId) return item;
      return {
        ...item,
        ...updates,
        content: (updates && updates.content !== undefined)
          ? updates.content
          : (item.content || fallbackContent),
        disclaimer: updates && updates.disclaimer !== undefined
          ? updates.disclaimer
          : (item.disclaimer || DEFAULT_DISCLAIMER)
      };
    });

    this.setData({
      messages,
      isSending: false
    });
    this.scrollToBottom();
  },

  _getAssistantMessage(msgId) {
    return this.data.messages.find((item) => item.id === msgId) || null;
  },

  _abortActiveStream() {
    if (this._activeStream && typeof this._activeStream.abort === "function") {
      this._activeStream.abort();
    }
    this._activeStream = null;
  },

  _scheduleScrollToBottom() {
    if (this._scrollTimer) return;
    this._scrollTimer = setTimeout(() => {
      this._scrollTimer = null;
      this.scrollToBottom();
    }, 48);
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