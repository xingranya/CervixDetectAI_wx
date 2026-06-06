const miniappService = require("../services/miniapp.service");

function getBearerToken(req) {
  const value = req.headers.authorization || "";
  if (!value.startsWith("Bearer ")) return "";
  return value.slice("Bearer ".length).trim();
}

async function authenticate(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "请先登录" });
    }

    const session = await miniappService.getSessionByToken(token);
    if (!session) {
      return res.status(401).json({ success: false, message: "登录状态已失效" });
    }

    req.user = {
      id: session.user_id,
      token
    };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate
};
