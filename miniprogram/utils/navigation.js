const ROUTES = {
  login: "/pages/login/index",
  home: "/pages/home/index",
  records: "/pages/records/index",
  reminders: "/pages/reminders/index",
  profile: "/pages/profile/index",
  recordDetail: "/packages/records/record-detail/index",
  recordForm: "/packages/records/record-form/index",
  reminderForm: "/packages/reminders/reminder-form/index",
  questions: "/packages/tools/questions/index",
  articles: "/packages/tools/articles/index",
  privacy: "/packages/profile/privacy/index"
};

const TAB_ROUTES = [
  ROUTES.home,
  ROUTES.records,
  ROUTES.reminders,
  ROUTES.profile
];

function buildUrl(route, query = {}) {
  const segments = Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== null && query[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`);

  return segments.length ? `${route}?${segments.join("&")}` : route;
}

function openRoute(route, query = {}, options = {}) {
  if (options.reLaunch) {
    return wx.reLaunch({ url: buildUrl(route, query) });
  }
  if (options.redirect) {
    return wx.redirectTo({ url: buildUrl(route, query) });
  }
  if (TAB_ROUTES.indexOf(route) > -1) {
    return wx.switchTab({ url: route });
  }
  return wx.navigateTo({ url: buildUrl(route, query) });
}

function navigateBackLater(delay = 500) {
  setTimeout(() => wx.navigateBack(), delay);
}

module.exports = {
  ROUTES,
  buildUrl,
  openRoute,
  navigateBackLater
};
