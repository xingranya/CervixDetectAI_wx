function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "接口不存在"
  });
}

function errorHandler(error, req, res, next) {
  console.error(error);
  const status = Number(error.status || 500);
  res.status(status).json({
    success: false,
    message: status >= 500 ? "服务暂时不可用，请稍后再试" : error.message
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
