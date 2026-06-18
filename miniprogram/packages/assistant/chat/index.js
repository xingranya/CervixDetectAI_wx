const {
  request,
  requestStream,
  isLoggedIn
} = require("../../../utils/request");
const { normalizeStoredUser } = require("../../../utils/avatar");
const { ROUTES, openRoute } = require("../../../utils/navigation");
const { showErrorModal } = require("../../../utils/feedback");

const DEFAULT_DISCLAIMER = "以上信息仅供参考，请以线下医疗机构意见为准。";
const BOT_AVATAR = "https://img1.tucang.cc/api/image/show/45b4f4864a1e97681b52b7a1e1f5cc31";
const THINKING_PLACEHOLDER = "正在理解你的问题，先梳理健康科普边界、关键信息和适合继续追问的方向。";
const STREAM_FLUSH_INTERVAL = 24;

let messageCounter = 0;
function createMessageId() {
  return `msg_${Date.now()}_${++messageCounter}`;
}

const DEFAULT_SUGGESTIONS = [
  { icon: "chat", text: "什么是 HPV？" },
  { icon: "help-circle", text: "ASC-US 是什么意思？" },
  { icon: "file", text: "TCT 检查需要注意什么？" },
  { icon: "time", text: "多久应该做一次筛查？" },
  { icon: "chart-bubble", text: "LSIL 和 HSIL 有什么区别？" },
  { icon: "notification", text: "如何管理复查提醒？" }
];

function normalizeChatFile(item) {
  if (!item) return null;
  const url = String(item.url || item.path || item.tempFilePath || "").trim();
  if (!url) return null;
  const name = String(item.name || url.split("/").pop() || "附件").trim();
  const extension = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  const fileTypeMap = {
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    pdf: "pdf",
    doc: "doc",
    docx: "doc",
    ppt: "ppt",
    pptx: "ppt",
    xls: "excel",
    xlsx: "excel",
    mp4: "video",
    mov: "video",
    mp3: "audio",
    wav: "audio"
  };
  return {
    ...item,
    url,
    name,
    size: item.size || 0,
    fileType: item.fileType || fileTypeMap[extension] || item.type || "file"
  };
}

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
      index += 1;
      continue;
    }

    if (needed === 2 && codePoint < 0x80) {
      index += 1;
      continue;
    }
    if (needed === 3 && codePoint < 0x800) {
      index += 1;
      continue;
    }
    if (needed === 4 && codePoint < 0x10000) {
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

function buildThinkingTitle(item) {
  const reasoningText = String(item.reasoning || "");
  const charCount = reasoningText === THINKING_PLACEHOLDER ? 0 : reasoningText.length;
  let elapsedText = "";
  if (item.thinkingEndAt && item.thinkingStartAt) {
    elapsedText = `${((item.thinkingEndAt - item.thinkingStartAt) / 1000).toFixed(1)}s`;
  } else if (item.thinkingStartAt) {
    elapsedText = `${((Date.now() - item.thinkingStartAt) / 1000).toFixed(1)}s`;
  }
  const titleParts = ["深度思考"];
  if (elapsedText) titleParts.push(elapsedText);
  titleParts.push(`${charCount}字`);
  return titleParts.join(" · ");
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
    chatData: [],
    inputValue: "",
    isSending: false,
    suggestions: DEFAULT_SUGGESTIONS,
    botAvatar: BOT_AVATAR,
    userAvatarUrl: "",
    userAvatarLocalPath: "",
    senderPresets: [
      { name: "upload", presets: ["uploadCamera", "uploadImage", "uploadAttachment"], type: "bottom", status: "" },
      { name: "send", type: "icon" }
    ],
    textareaProps: { autosize: { maxHeight: 264, minHeight: 48 } },
    senderVisible: false,
    senderFiles: [],
    senderAttachmentsProps: {
      items: [],
      removable: true,
      imageViewer: true
    },
    deepThinkActive: true,
    netSearchActive: false,
    actionBarItems: ["replay", "copy", "good", "bad", "share"],
    popoverActionBarItems: ["quote", "copy", "share"],
    activePopoverId: "",
    longPressPosition: null,
    emptyContent: [],
    skeletonRowCol: [1, 1, { width: "60%" }]
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
    if (this._streamFlushTimer) {
      clearTimeout(this._streamFlushTimer);
      this._streamFlushTimer = null;
    }
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
    if (this.data.messages.length > 0) {
      this._syncChatData();
    }
  },

  onUserAvatarError() {
    const fallback = this.data.userAvatarLocalPath || "";
    if (fallback && fallback !== this.data.userAvatarUrl) {
      this.setData({ userAvatarUrl: fallback });
      if (this.data.messages.length > 0) {
        this._syncChatData();
      }
      return;
    }
    if (this.data.userAvatarUrl) {
      this.setData({ userAvatarUrl: "" });
      if (this.data.messages.length > 0) {
        this._syncChatData();
      }
    }
  },

  // ===== 输入与发送事件（适配 TDesign chat-sender） =====

  onInputChange(event) {
    this.setData({
      inputValue: (event && event.detail && event.detail.value) || ""
    });
  },

  onSend(event) {
    const text = ((event && event.detail && event.detail.value) || this.data.inputValue || "").trim();
    this._performSend(text);
  },

  onSuggestionTap(event) {
    const text = event.currentTarget.dataset.text;
    if (!text) return;
    this.setData({ inputValue: text });
    this._performSend(text);
  },

  onSenderFileChange(event) {
    const files = ((event && event.detail && event.detail.files) || [])
      .map(normalizeChatFile)
      .filter(Boolean)
      .slice(0, 5);
    this.setData({
      senderFiles: files,
      "senderAttachmentsProps.items": files
    });
  },

  onSenderFileSelect(event) {
    const selected = ((event && event.detail && event.detail.files) || [])
      .map(normalizeChatFile)
      .filter(Boolean);
    if (!selected.length) return;
    const files = [...this.data.senderFiles, ...selected].slice(0, 5);
    this.setData({
      senderFiles: files,
      "senderAttachmentsProps.items": files
    });
  },

  onSenderFileDelete(event) {
    const deleted = event && event.detail && event.detail.file;
    const files = this.data.senderFiles.filter((item) => {
      if (!deleted) return true;
      return item !== deleted && item.url !== deleted.url && item.name !== deleted.name;
    });
    this.setData({
      senderFiles: files,
      "senderAttachmentsProps.items": files
    });
  },

  onSenderVisibleChange(event) {
    this.setData({ senderVisible: !!(event && event.detail) });
  },

  onDeepThinkTap() {
    this.setData({ deepThinkActive: !this.data.deepThinkActive });
  },

  onNetSearchTap() {
    this.setData({ netSearchActive: !this.data.netSearchActive });
  },

  onMessageLongPress(event) {
    const detail = event.detail || {};
    this.setData({
      activePopoverId: detail.id || "",
      longPressPosition: detail.longPressPosition || null
    });
  },

  onMessageAction(event) {
    const detail = event.detail || {};
    const name = detail.name;
    const chatId = detail.chatId || this.data.activePopoverId;
    if (name === "replay") {
      this._replayAssistantMessage(chatId);
      return;
    }
    if (name === "quote") {
      const msg = this.data.messages.find((item) => item.id === chatId);
      if (msg && msg.content) {
        this.setData({ inputValue: `关于“${String(msg.content).slice(0, 40)}”，我还想了解：` });
      }
      return;
    }
    if (name === "copy" && detail.data) {
      wx.setClipboardData({ data: detail.data });
    }
  },

  onStopStream() {
    this._abortActiveStream();
    const lastMsg = this.data.messages[this.data.messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant" && lastMsg.streaming) {
      this._finishAssistantMessage(lastMsg.id, {
        loading: false,
        streaming: false,
        disclaimer: DEFAULT_DISCLAIMER
      });
    }
  },

  _performSend(text) {
    if (!text || this.data.isSending) return;

    const userMsg = {
      id: createMessageId(),
      role: "user",
      content: text,
      attachments: this.data.senderFiles,
      time: this._formatTime()
    };

    const assistantMsg = {
      id: createMessageId(),
      role: "assistant",
      content: "",
      reasoning: this.data.deepThinkActive ? THINKING_PLACEHOLDER : "",
      disclaimer: "",
      loading: true,
      streaming: true,
      thinkingStartAt: Date.now(),
      time: this._formatTime()
    };

    const messages = [...this.data.messages, userMsg, assistantMsg];
    this.setData({
      messages,
      inputValue: "",
      senderFiles: [],
      "senderAttachmentsProps.items": [],
      isSending: true
    });
    this._syncChatData();

    this.sendChatRequest(messages, assistantMsg.id);
  },

  // ===== 数据转换层：内部 messages → TDesign chat-list data =====

  transformMessages() {
    const botAvatar = this.data.botAvatar;
    const userAvatar = this.data.userAvatarUrl || "";
    return this.data.messages.map((item) => {
      const content = [];

      // 深度思考 → chat-thinking 项；标题中展示耗时与字数
      if (item.reasoning) {
        content.push({
          type: "thinking",
          data: {
            title: buildThinkingTitle(item),
            text: item.reasoning
          }
        });
      }

      // 正文 → markdown（助手）/ text（用户）
      if (item.content) {
        const isAssistant = item.role === "assistant";
        const mdItem = {
          type: isAssistant ? "markdown" : "text",
          data: item.content
        };
        // 流式输出中给 markdown 启用 TDesign 闪烁光标，强化“正在生成”的感知
        if (isAssistant && item.streaming) {
          mdItem.markdownProps = {
            streaming: { hasNextChunk: true, tail: true }
          };
        }
        content.push(mdItem);
      }
      if (item.role === "user" && Array.isArray(item.attachments) && item.attachments.length) {
        content.push({
          type: "attachment",
          data: item.attachments
        });
      }

      // loading 态显示 chat-loading 动画；streaming 有内容时正常渲染 markdown
      let status = "complete";
      if (item.loading && !item.content) status = "pending";
      if (item.streaming && item.content) status = "streaming";

      return {
        id: item.id,
        avatar: item.role === "assistant" ? botAvatar : userAvatar,
        name: item.role === "assistant" ? "健康科普助手" : "我",
        datetime: item.time,
        role: item.role,
        status: status,
        placement: item.role === "user" ? "right" : "left",
        streaming: !!item.streaming,
        reasoning: item.reasoning || "",
        text: item.content || "",
        attachments: Array.isArray(item.attachments) ? item.attachments : [],
        thinkingContent: {
          title: buildThinkingTitle(item),
          text: item.reasoning || ""
        },
        contentItem: {
          type: item.role === "assistant" ? "markdown" : "text",
          data: item.content || ""
        },
        markdownProps: item.streaming
          ? { streaming: { hasNextChunk: true, tail: true } }
          : {},
        disclaimer: item.disclaimer || "",
        content: content,
        chatContentProps: {
          thinking: {
            layout: "border",
            collapsed: false,
            maxHeight: 220,
            animation: "gradient"
          }
        }
      };
    });
  },

  _syncChatData() {
    this.setData({ chatData: this.transformMessages() });
    this._scheduleScrollToBottom();
  },

  _scrollChatToBottom() {
    const chatList = this.selectComponent("#chatList");
    if (chatList && typeof chatList.scrollToBottom === "function") {
      chatList.scrollToBottom();
    }
  },

  // ===== 流式请求逻辑 =====

  async sendChatRequest(messages, assistantMsgId) {
    const apiMessages = messages
      .filter((item) => !item.loading)
      .map((item) => ({ role: item.role, content: item.content }));

    this._streamDone = false;
    this._streamHasChunk = false;
    this._streamHasPayload = false;
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
      const finalBody = await streamHandle.promise;
      this._activeStream = null;

      if (!this._streamHasChunk && finalBody) {
        this._handleStreamChunk(assistantMsgId, finalBody);
      }
      this._flushStreamBuffer(assistantMsgId);

      if (this._pageUnmounted) return;

      if (!this._streamHasPayload) {
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
      if (!this._streamHasPayload) {
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
    this._flushStreamDelta();
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
      this._streamHasPayload = true;
      this._appendAssistantDelta(msgId, { reasoning: packet.reasoning });
    }
    if (packet.text) {
      this._streamHasPayload = true;
      this._appendAssistantDelta(msgId, { content: packet.text });
    }
    if (packet.done) {
      this._streamHasPayload = true;
      this._streamDone = true;
      this._finishAssistantMessage(msgId, {
        loading: false,
        streaming: false,
        disclaimer: packet.disclaimer || DEFAULT_DISCLAIMER
      });
    }
  },

  _appendAssistantDelta(msgId, delta) {
    // 累积 delta 并节流刷新，避免流式输出时每个 chunk 都全量 setData
    if (!this._pendingDelta) this._pendingDelta = {};
    const entry = this._pendingDelta[msgId] || { content: "", reasoning: "", contentTouched: false };
    if (delta.content) {
      entry.content += delta.content;
      entry.contentTouched = true;
    }
    if (delta.reasoning) {
      entry.reasoning += delta.reasoning;
    }
    this._pendingDelta[msgId] = entry;
    this._scheduleStreamFlush();
  },

  _scheduleStreamFlush() {
    if (this._streamFlushTimer || this._pageUnmounted) return;
    this._streamFlushTimer = setTimeout(() => {
      this._streamFlushTimer = null;
      this._flushStreamDelta();
    }, STREAM_FLUSH_INTERVAL);
  },

  _flushStreamDelta() {
    if (this._streamFlushTimer) {
      clearTimeout(this._streamFlushTimer);
      this._streamFlushTimer = null;
    }
    const pending = this._pendingDelta;
    if (!pending) return;
    this._pendingDelta = null;

    const messages = this.data.messages.map((item) => {
      const entry = pending[item.id];
      if (!entry) return item;
      const nextReasoning = entry.reasoning
        ? (item.reasoning === THINKING_PLACEHOLDER ? entry.reasoning : `${item.reasoning || ""}${entry.reasoning}`)
        : item.reasoning;
      return {
        ...item,
        content: entry.contentTouched ? `${item.content || ""}${entry.content}` : item.content,
        reasoning: nextReasoning,
        loading: entry.contentTouched ? false : item.loading,
        streaming: true
      };
    });

    this.setData({ messages });
    this._syncChatData();
  },

  _finishAssistantMessage(msgId, updates) {
    this._flushStreamDelta();
    const fallbackContent = updates && updates.loading === false
      ? "抱歉，暂时无法生成回复，请稍后重试。"
      : "";
    const messages = this.data.messages.map((item) => {
      if (item.id !== msgId) return item;
      const nextUpdates = { ...updates };
      // 流式结束时记录思考耗时
      if (nextUpdates.loading === false && item.thinkingStartAt && !item.thinkingEndAt) {
        nextUpdates.thinkingEndAt = Date.now();
      }
      return {
        ...item,
        ...nextUpdates,
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
    this._syncChatData();
  },

  _getAssistantMessage(msgId) {
    return this.data.messages.find((item) => item.id === msgId) || null;
  },

  _replayAssistantMessage(chatId) {
    if (this.data.isSending) return;
    const index = this.data.messages.findIndex((item) => item.id === chatId);
    if (index <= 0) return;
    const previousUser = [...this.data.messages]
      .slice(0, index)
      .reverse()
      .find((item) => item.role === "user");
    if (!previousUser || !previousUser.content) return;
    const messages = this.data.messages.slice(0, index - 1);
    this.setData({ messages }, () => {
      this._performSend(previousUser.content);
    });
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
      this._scrollChatToBottom();
    }, 48);
  },

  _formatTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }
});
