async function withPageLoading(page, task) {
  if (page.data.loading) return false;
  page.setData({ loading: true });
  try {
    await task();
    return true;
  } finally {
    page.setData({ loading: false });
  }
}

module.exports = {
  withPageLoading
};
