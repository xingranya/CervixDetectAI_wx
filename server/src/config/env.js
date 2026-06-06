require("dotenv").config();

const dataSource = (process.env.MINIAPP_DATA_SOURCE || "mysql").toLowerCase();

module.exports = {
  port: Number(process.env.PORT || 3789),
  allowedOrigin: process.env.MINIAPP_ALLOWED_ORIGIN || "*",
  dataSource,
  demoUserId: Number(process.env.DEMO_USER_ID || 1),
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

