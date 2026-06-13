const DRAFT_KEYS = {
  record: "draft:record-form",
  reminder: "draft:reminder-form"
};

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

function saveDraft(key, data) {
  try {
    wx.setStorageSync(key, {
      data,
      savedAt: Date.now()
    });
  } catch (e) {
    // storage full or unavailable, silently ignore
  }
}

function loadDraft(key) {
  try {
    const draft = wx.getStorageSync(key);
    if (draft && draft.data) {
      return draft;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function hasDraft(key) {
  return !!loadDraft(key);
}

function clearDraft(key) {
  try {
    wx.removeStorageSync(key);
  } catch (e) {
    // ignore
  }
}

function formHasData(data, fields) {
  return fields.some((field) => {
    const value = data[field];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value !== false;
    return !!String(value || "").trim();
  });
}

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
  DRAFT_KEYS,
  debounce,
  saveDraft,
  loadDraft,
  hasDraft,
  clearDraft,
  formHasData,
  withPageLoading
};
