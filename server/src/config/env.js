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
  }
};
