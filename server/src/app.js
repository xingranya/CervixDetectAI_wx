const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const miniappRouter = require("./routes/miniapp");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
const port = env.port;

app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ origin: env.allowedOrigin }));
app.use(express.json({ limit: "3mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"), {
  setHeaders: (res) => {
    // 头像会被小程序渲染层作为跨域图片加载，需允许资源跨域嵌入。
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
}));
app.use("/agreements", express.static(path.join(__dirname, "..", "public", "agreements")));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "cervixdetectai-wx-server",
    mysql: "enabled",
    database: env.database.database
  });
});

app.use("/api/miniapp", miniappRouter);
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, env.host, () => {
    console.log(`CervixDetectAI wx server listening on http://${env.host}:${port}`);
  });
}

module.exports = app;
