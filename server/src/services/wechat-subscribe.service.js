const env = require("../config/env");

let tokenCache = {
  token: "",
  expiresAt: 0
};

function createStatusError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertWechatConfig() {
  if (!env.wechat.appId || !env.wechat.appSecret) {
    throw createStatusError("服务端未完成微信消息配置，请补充 AppID 和 AppSecret", 500);
  }
}

async function getAccessToken() {
  assertWechatConfig();
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt - now > 60 * 1000) {
    return tokenCache.token;
  }

  const params = new URLSearchParams({
    grant_type: "client_credential",
    appid: env.wechat.appId,
    secret: env.wechat.appSecret
  });

  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/token?${params.toString()}`);
  if (!response.ok) {
    throw createStatusError("微信消息服务暂时不可用，请稍后重试", 502);
  }

  const data = await response.json();
  if (!data.access_token) {
    const knownMessages = {
      "-1": "微信系统繁忙，请稍后重试",
      40001: "服务端微信密钥无效，请检查 AppSecret 配置",
      40002: "微信凭证类型配置错误，请使用 client_credential",
      40013: "服务端微信 AppID 无效，请检查配置",
      40125: "服务端微信密钥无效，请检查 AppSecret 配置",
      40164: "服务器 IP 未加入微信接口 IP 白名单",
      40243: "微信 AppSecret 已被冻结，请先在公众平台解冻",
      41004: "服务端缺少微信 AppSecret 配置",
      50004: "当前小程序禁止使用 token 接口",
      50007: "当前小程序账号已被冻结"
    };
    const message = knownMessages[data.errcode] || `获取微信消息凭证失败：${data.errmsg || "未知错误"}`;
    const status = data.errcode === -1 ? 502 : 500;
    throw createStatusError(message, status);
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: now + Number(data.expires_in || 7200) * 1000
  };
  return tokenCache.token;
}

async function sendSubscribeMessage(payload) {
  const accessToken = await getAccessToken();
  const response = await fetch(
    `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    throw createStatusError("微信消息服务暂时不可用，请稍后重试", 502);
  }

  const data = await response.json();
  if (data.errcode === 0) {
    return data;
  }

  const knownMessages = {
    40003: "接收用户信息无效，请重新登录后再试",
    40037: "订阅消息模板无效，请检查模板 ID",
    43101: "你还没有订阅该提醒，请先在弹窗中允许通知",
    43107: "当前账号的订阅消息能力暂不可用",
    43108: "请勿短时间内重复发送同一条提醒",
    45168: "提醒内容包含不适合发送的词语",
    47003: "报告提醒内容格式不符合微信要求，请精简后再试"
  };
  throw createStatusError(knownMessages[data.errcode] || `微信订阅消息发送失败：${data.errmsg || data.errcode}`, 400);
}

module.exports = {
  sendSubscribeMessage
};
