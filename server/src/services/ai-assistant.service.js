const env = require("../config/env");

const DISCLAIMER = "以上信息仅供参考，不构成医疗诊断、治疗或处方建议，请尽快咨询线下正规医疗机构或专业医生。";

const SYSTEM_PROMPT = `你是一个部署在微信小程序“云端智诊”中的女性健康科普助手。你的唯一职责是提供合规、克制、通俗的健康知识说明与记录整理帮助。

你必须始终遵守以下边界：
1. 只提供一般性健康科普、术语释义、检查记录阅读辅助、复查准备建议、线下就诊前资料整理建议。
2. 明确告知自己不是医生，不代表医院，不提供医疗服务，不替代线下正规医疗机构。
3. 不得输出任何诊断、分诊、病情判断、病变识别、严重程度判定、治疗方案、用药建议、处方建议、检查结论确认、急救指导、线上问诊引导。
4. 不得根据用户描述、数值、图片、历史记录推断疾病、病变、癌前状态、是否感染、是否需要立即治疗。
5. 不得使用“建议你患有…/考虑是…/大概率是…/基本可以判断…/属于…级别病变/先吃什么药/应该做什么治疗”等表述。
6. 对任何涉及诊断、治疗、用药、病情判断、报告结论确认、紧急情况的问题，统一拒答，并明确引导用户尽快前往线下正规医疗机构。
7. 如果用户问题涉及隐私、投诉、账号、功能使用故障，只能建议使用小程序内已有功能或联系客服/反馈入口，不要延展到医疗建议。
8. 回答必须简洁、克制、可直接给普通用户阅读，不使用夸张营销、承诺性、吓唬性话术。
9. 每条回答末尾必须附带固定免责声明：“以上信息仅供参考，不构成医疗诊断、治疗或处方建议，请尽快咨询线下正规医疗机构或专业医生。”

当用户请求超出边界时，你只允许输出：
- 简短拒答
- 可提供的安全范围
- 线下就医或咨询正规医疗机构的建议
- 固定免责声明

禁止输出 markdown 表格、夸张承诺、医疗结论、处方、药名剂量、诊疗路径。`;

const PROHIBITED_TERMS = [
  "AI诊断", "辅助诊断", "在线诊断", "在线问诊",
  "诊疗建议", "治疗方案", "处方代开", "疾病预测",
  "病变识别", "挂号缴费", "用药建议", "处方建议",
  "药物治疗", "推荐用药", "病情判断", "分诊建议",
  "检查结论", "报告解读后下结论", "癌前病变判断", "严重程度判断"
];

const HIGH_RISK_PATTERNS = [
  /是不是(得了|感染了|患了)/,
  /我(这|现在)?算(不算|是)?(什么病|严重吗|癌前病变)/,
  /帮我判断/,
  /给我开药/,
  /吃什么药/,
  /怎么治疗/,
  /需不需要治疗/,
  /要不要手术/,
  /是不是癌/,
  /报告(说明|代表|提示)什么病/,
  /根据.*结果.*判断/,
  /紧急处理/,
  /急救/
];

const SAFE_REFUSAL = "抱歉，这类问题涉及诊断、治疗、用药或病情判断，超出本助手在微信小程序中的合规服务范围。我只能提供一般健康科普、术语解释和线下就诊前准备建议。请尽快咨询线下正规医疗机构或专业医生。";

function checkCompliance(text) {
  const value = String(text || "").trim();
  const matched = PROHIBITED_TERMS.find((term) => value.indexOf(term) > -1);
  if (matched) {
    return SAFE_REFUSAL;
  }
  const matchedPattern = HIGH_RISK_PATTERNS.find((pattern) => pattern.test(value));
  if (matchedPattern) {
    return SAFE_REFUSAL;
  }
  return null;
}

function sanitizeOutput(text) {
  let result = String(text || "");
  PROHIBITED_TERMS.forEach((term) => {
    result = result.split(term).join("");
  });

  result = result
    .replace(/(你(这|现在)?(大概率|多半|基本|应该|考虑|属于)|我判断|可以判断|初步判断)/g, "")
    .replace(/(建议你(立刻)?用药|先吃.*药|服用.*药|开药|处方)/g, "")
    .replace(/(在线问诊|线上问诊|远程问诊|诊断结果|治疗结论)/g, "")
    .trim();

  return result;
}

function ensureDisclaimer(text) {
  const value = String(text || "").trim();
  if (!value) {
    return SAFE_REFUSAL + "\n\n" + DISCLAIMER;
  }
  if (value.indexOf(DISCLAIMER) > -1) {
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
      content: delta.content || delta.text || "",
      reasoning: delta.reasoning_content || delta.reasoning || delta.reasoningContent || delta.thinking_content || delta.thinking || ""
    };
  }
  const msg = data?.output?.choices?.[0]?.message || {};
  return {
    content: msg.content || "",
    reasoning: msg.reasoning_content || msg.reasoning || msg.reasoningContent || msg.thinking_content || msg.thinking || ""
  };
}

function writeStreamEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  if (typeof res.flush === "function") {
    res.flush();
  }
}

function writeStreamComment(res, text) {
  res.write(`: ${text || ""}\n\n`);
  if (typeof res.flush === "function") {
    res.flush();
  }
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
  if (res.socket && typeof res.socket.setNoDelay === "function") {
    res.socket.setNoDelay(true);
  }
  writeStreamComment(res, "stream-open");
  const heartbeat = setInterval(() => {
    writeStreamComment(res, "stream-waiting");
  }, 1000);

  const lastMessage = Array.isArray(userMessages) && userMessages.length > 0
    ? userMessages[userMessages.length - 1]
    : null;

  const complianceError = checkCompliance(lastMessage?.content);
  if (complianceError) {
    clearInterval(heartbeat);
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
    clearInterval(heartbeat);
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
    clearInterval(heartbeat);
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
    clearInterval(heartbeat);
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
    clearInterval(heartbeat);
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
            clearInterval(heartbeat);
            writeStreamEvent(res, { reasoning: delta.reasoning, done: false });
          }
          if (delta.content) {
            clearInterval(heartbeat);
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
          clearInterval(heartbeat);
          writeStreamEvent(res, { reasoning: delta.reasoning, done: false });
        }
        if (delta.content) {
          clearInterval(heartbeat);
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
    clearInterval(heartbeat);
    writeStreamEvent(res, { text: "", done: true, disclaimer: DISCLAIMER });
    res.end();
  } catch (error) {
    clearTimeout(timeout);
    clearInterval(heartbeat);
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
