require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT || 3789),
  host: process.env.HOST || "0.0.0.0",
  allowedOrigin: process.env.MINIAPP_ALLOWED_ORIGIN || "*",
  publicBaseUrl: process.env.MINIAPP_PUBLIC_BASE_URL || "",
  wechat: {
    appId: process.env.WECHAT_APP_ID || "",
    appSecret: process.env.WECHAT_APP_SECRET || "",
    reportTemplateId: process.env.WECHAT_REPORT_TEMPLATE_ID || "eZJlyXlekmNOsM1mLn8bcn29P2k-WAXo0XunYj96uSk",
    reminderTemplateId: process.env.WECHAT_REMINDER_TEMPLATE_ID || "Mpn-CisfT0yxvsrkrzSfHbZQY7Vr2rwWesquRE-dgn8",
    miniProgramState: process.env.WECHAT_MINIPROGRAM_STATE || "formal"
  },
  database: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || "cervixdetectai_wx",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    charset: "utf8mb4"
  },
  ai: {
    apiKey: process.env.AI_API_KEY || "",
    // 供应商: "dashscope"(默认，阿里云百炼) 或 "openai"(OpenAI 兼容格式)
    provider: process.env.AI_PROVIDER || "dashscope",
    // OpenAI 兼容模式下的完整端点 URL（包含路径）
    // 例如: https://api.openai.com/v1/chat/completions
    //       https://api.deepseek.com/v1/chat/completions
    endpoint: process.env.AI_ENDPOINT || "",
    // dashscope 模式的 base URL（不含路径）
    baseUrl: process.env.AI_BASE_URL || "https://dashscope.aliyuncs.com/api/v1",
    model: process.env.AI_MODEL || "qwen-turbo",
    maxTokens: Number(process.env.AI_MAX_TOKENS || 1024),
    temperature: Number(process.env.AI_TEMPERATURE || 0.7)
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET || ""
  }
};
