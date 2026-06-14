const env = require("../config/env");

const DISCLAIMER = "以上信息仅供参考，不作为医疗诊断依据，请以线下医疗机构意见为准。";

const SYSTEM_PROMPT = `你是一个女性健康科普助手，名为"云端智诊健康助手"。你的职责是：
1. 提供一般性健康知识科普（如宫颈癌筛查常识、HPV知识、常见妇科术语解释）
2. 帮助用户理解检查记录中的专业术语（如 ASC-US、LSIL、HSIL、TCT、HPV 等）
3. 提供健康记录管理和复查提醒的建议

你绝对不提供以下内容：
- 医疗诊断或诊断结论
- 治疗方案或处方建议
- 在线问诊服务
- 疾病预测或病变识别
- 任何替代专业医疗机构意见的建议

每条回答必须以免责声明结尾："以上信息仅供参考，请以线下医疗机构意见为准。"
回答应简洁、友好、易懂，适合普通用户阅读。`;

const PROHIBITED_TERMS = [
  "AI诊断", "辅助诊断", "在线诊断", "在线问诊",
  "诊疗建议", "治疗方案", "处方代开", "疾病预测",
  "病变识别", "挂号缴费"
];

function checkCompliance(text) {
  const value = String(text || "");
  const matched = PROHIBITED_TERMS.find((term) => value.indexOf(term) > -1);
  if (matched) {
    return `抱歉，我无法提供${matched}相关服务。本助手仅提供健康科普和术语解释。`;
  }
  return null;
}

function sanitizeOutput(text) {
  let result = String(text || "");
  PROHIBITED_TERMS.forEach((term) => {
    result = result.split(term).join("");
  });
  return result.trim();
}

function ensureDisclaimer(text) {
  const value = String(text || "").trim();
  if (value.indexOf("以线下医疗机构意见为准") > -1 || value.indexOf("仅供参考") > -1) {
    return value;
  }
  return value + "\n\n" + DISCLAIMER;
}

function buildChatMessages(userMessages) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];
  const history = Array.isArray(userMessages) ? userMessages : [];
  history.slice(-10).forEach((msg) => {
    const role = msg.role === "assistant" ? "assistant" : "user";
    const content = String(msg.content || "").trim();
    if (content) {
      messages.push({ role, content });
    }
  });
  return messages;
}

function isOpenAiCompatibleProvider() {
  return env.ai.provider === "openai";
}

function isDeepSeekOpenAiMode() {
  if (!isOpenAiCompatibleProvider()) return false;
  const endpoint = String(env.ai.endpoint || "").toLowerCase();
  const model = String(env.ai.model || "").toLowerCase();
  return endpoint.indexOf("deepseek") > -1 || model.indexOf("deepseek") > -1;
}

function shouldUseThinkingMode() {
  return isDeepSeekOpenAiMode() && env.ai.enableThinking;
}

function resolveAiEndpoint() {
  const { provider, endpoint, baseUrl } = env.ai;
  if (provider === "openai" && endpoint) {
    return endpoint;
  }
  return `${baseUrl}/services/aigc/text-generation/generation`;
}

function resolveAiHeaders() {
  const { apiKey, provider } = env.ai;
  if (provider === "openai") {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "X-DashScope-SSE": "enable"
  };
}

function buildAiRequestBody(messages, options = {}) {
  const { provider, model, maxTokens, temperature } = env.ai;
  if (provider === "openai") {
    const body = {
      model,
      messages,
      max_tokens: options.maxTokens || maxTokens,
      stream: !!options.stream
    };

    if (shouldUseThinkingMode()) {
      body.thinking = {
        type: env.ai.enableThinking ? "enabled" : "disabled"
      };
      body.reasoning_effort = options.reasoningEffort || env.ai.reasoningEffort || "high";
    } else {
      body.temperature = options.temperature || temperature;
      if (isDeepSeekOpenAiMode()) {
        body.thinking = { type: "disabled" };
      }
    }

    return body;
  }

  return {
    model,
    input: { messages },
    parameters: {
      max_tokens: options.maxTokens || maxTokens,
      temperature: options.temperature || temperature,
      result_format: "message",
      ...(options.stream ? { incremental_output: true } : {})
    }
  };
}

function extractReplyFromResponse(data) {
  const { provider } = env.ai;
  if (provider === "openai") {
    const msg = data?.choices?.[0]?.message || {};
    return {
      content: msg.content || "",
      reasoning: msg.reasoning_content || ""
    };
  }
  const outMsg = data?.output?.choices?.[0]?.message || {};
  return {
    content: outMsg.content || data?.output?.text || "",
    reasoning: outMsg.reasoning_content || ""
  };
}

function extractStreamDelta(jsonStr) {
  const { provider } = env.ai;
  const data = JSON.parse(jsonStr);
  if (provider === "openai") {
    const delta = data?.choices?.[0]?.delta || {};
    return {
      content: delta.content || "",
      reasoning: delta.reasoning_content || ""
    };
  }
  const msg = data?.output?.choices?.[0]?.message || {};
  return {
    content: msg.content || "",
    reasoning: msg.reasoning_content || ""
  };
}

function writeStreamEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function parseSseFrame(frame) {
  const payload = String(frame || "")
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("\n")
    .trim();

  if (!payload || payload === "[DONE]") {
    return "";
  }

  return payload;
}

function consumeSseBuffer(buffer, onPayload, flush = false) {
  const normalized = String(buffer || "").replace(/\r\n/g, "\n");
  if (!normalized) return "";

  const frames = normalized.split("\n\n");
  const rest = flush ? "" : frames.pop();
  const consumable = flush && rest ? [...frames, rest] : frames;

  consumable.forEach((frame) => {
    const payload = parseSseFrame(frame);
    if (payload) {
      onPayload(payload);
    }
  });

  return rest || "";
}

async function readResponseStream(body, onTextChunk) {
  if (body && typeof body.getReader === "function") {
    const reader = body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        onTextChunk(decoder.decode(value, { stream: true }));
      }
    }

    const tail = decoder.decode();
    if (tail) {
      onTextChunk(tail);
    }
    return;
  }

  if (body && typeof body[Symbol.asyncIterator] === "function") {
    for await (const chunk of body) {
      onTextChunk(Buffer.isBuffer(chunk) ? chunk.toString("utf-8") : String(chunk || ""));
    }
    return;
  }

  throw new Error("当前运行环境不支持流式读取");
}

async function callAiApi(messages, options = {}) {
  const { apiKey } = env.ai;
  if (!apiKey) {
    throw new Error("AI服务未配置，请联系管理员设置 AI_API_KEY");
  }

  const url = resolveAiEndpoint();
  const headers = resolveAiHeaders();
  const body = buildAiRequestBody(messages, options);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`AI服务调用失败 (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return extractReplyFromResponse(data);
}

async function chat(userId, userMessages) {
  const lastMessage = Array.isArray(userMessages) && userMessages.length > 0
    ? userMessages[userMessages.length - 1]
    : null;

  const complianceError = checkCompliance(lastMessage?.content);
  if (complianceError) {
    return {
      reply: ensureDisclaimer(complianceError),
      disclaimer: DISCLAIMER
    };
  }

  const messages = buildChatMessages(userMessages);
  const extracted = await callAiApi(messages, {
    reasoningEffort: env.ai.reasoningEffort
  });
  const sanitized = sanitizeOutput(extracted.content);
  const reply = ensureDisclaimer(sanitized || "抱歉，暂时无法生成回复，请稍后重试。");

  return {
    reply,
    disclaimer: DISCLAIMER,
    reasoning: extracted.reasoning || ""
  };
}

async function chatStream(userId, userMessages, res) {
  const lastMessage = Array.isArray(userMessages) && userMessages.length > 0
    ? userMessages[userMessages.length - 1]
    : null;

  const complianceError = checkCompliance(lastMessage?.content);
  if (complianceError) {
    writeStreamEvent(res, {
      text: ensureDisclaimer(complianceError),
      done: true,
      disclaimer: DISCLAIMER
    });
    res.end();
    return;
  }

  const { apiKey } = env.ai;
  if (!apiKey) {
    writeStreamEvent(res, {
      text: "AI服务未配置，请联系管理员。",
      done: true,
      disclaimer: DISCLAIMER
    });
    res.end();
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  res.on("close", () => {
    controller.abort();
    clearTimeout(timeout);
  });

  let response;
  try {
    response = await fetch(resolveAiEndpoint(), {
      method: "POST",
      headers: resolveAiHeaders(),
      body: JSON.stringify(buildAiRequestBody(buildChatMessages(userMessages), {
        maxTokens: env.ai.maxTokens,
        temperature: env.ai.temperature,
        reasoningEffort: env.ai.reasoningEffort,
        stream: true
      })),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeout);
    writeStreamEvent(res, {
      text: error && error.name === "AbortError"
        ? "AI响应超时，请稍后重试。"
        : "AI服务调用异常，请稍后重试。",
      done: true,
      disclaimer: DISCLAIMER
    });
    res.end();
    return;
  }

  if (!response.ok || !response.body) {
    clearTimeout(timeout);
    writeStreamEvent(res, {
      text: "AI服务暂时不可用，请稍后重试。",
      done: true,
      disclaimer: DISCLAIMER
    });
    res.end();
    return;
  }

  let buffer = "";
  let accumulated = "";

  try {
    await readResponseStream(response.body, (chunkText) => {
      buffer += chunkText;
      buffer = consumeSseBuffer(buffer, (payload) => {
        try {
          const delta = extractStreamDelta(payload);
          if (delta.reasoning) {
            writeStreamEvent(res, { reasoning: delta.reasoning, done: false });
          }
          if (delta.content) {
            accumulated += delta.content;
            const sanitized = sanitizeOutput(delta.content);
            if (sanitized) {
              writeStreamEvent(res, { text: sanitized, done: false });
            }
          }
        } catch {
          // 忽略单个坏分片，保持后续分片继续输出
        }
      });
    });

    consumeSseBuffer(buffer, (payload) => {
      try {
        const delta = extractStreamDelta(payload);
        if (delta.reasoning) {
          writeStreamEvent(res, { reasoning: delta.reasoning, done: false });
        }
        if (delta.content) {
          accumulated += delta.content;
          const sanitized = sanitizeOutput(delta.content);
          if (sanitized) {
            writeStreamEvent(res, { text: sanitized, done: false });
          }
        }
      } catch {
        // 忽略尾部分片解析异常
      }
    }, true);

    clearTimeout(timeout);
    writeStreamEvent(res, { text: "", done: true, disclaimer: DISCLAIMER });
    res.end();
  } catch (error) {
    clearTimeout(timeout);
    writeStreamEvent(res, {
      text: accumulated ? "" : "AI响应中断，请稍后重试。",
      done: true,
      disclaimer: DISCLAIMER
    });
    res.end();
  }
}

async function explainTerm(term) {
  const complianceError = checkCompliance(term);
  if (complianceError) {
    return { explanation: ensureDisclaimer(complianceError), disclaimer: DISCLAIMER };
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `请用通俗易懂的语言解释以下医学/健康术语，包括它的含义、可能的原因和一般建议（不提供诊断结论）：\n\n${term}` }
  ];

  const extracted = await callAiApi(messages, {
    reasoningEffort: env.ai.reasoningEffort
  });
  const sanitized = sanitizeOutput(extracted.content);
  const explanation = ensureDisclaimer(sanitized || "暂无该术语的解释，建议咨询线下专业医疗机构。");

  return {
    explanation,
    disclaimer: DISCLAIMER,
    reasoning: extracted.reasoning || ""
  };
}

module.exports = {
  chat,
  chatStream,
  explainTerm,
  DISCLAIMER
};