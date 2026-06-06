const PAGE_STATUS = {
  LOADING: "loading",
  READY: "ready",
  EMPTY: "empty",
  ERROR: "error"
};

function resolveListStatus(items) {
  return Array.isArray(items) && items.length ? PAGE_STATUS.READY : PAGE_STATUS.EMPTY;
}

function resolveDetailStatus(item) {
  return item ? PAGE_STATUS.READY : PAGE_STATUS.EMPTY;
}

module.exports = {
  PAGE_STATUS,
  resolveListStatus,
  resolveDetailStatus
};
