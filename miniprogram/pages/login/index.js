const { login, uploadAvatar, getToken, clearAllCaches } = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");
const { showErrorToast, showSuccessToast } = require("../../utils/feedback");
const { withPageLoading } = require("../../utils/form");

function wxLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code);
          return;
        }
        reject(new Error("未获取到微信登录凭证，请稍后重试"));
      },
      fail: () => reject(new Error("微信登录授权失败，请稍后重试"))
    });
  });
}

function readFileBase64(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: "base64",
      success: (res) => resolve(res.data || ""),
      fail: () => reject(new Error("头像读取失败，请重新选择"))
    });
  });
}

function resolveAvatarFileType(filePath) {
  const lowerPath = String(filePath || "").toLowerCase();
  if (lowerPath.endsWith(".png")) return "image/png";
  if (lowerPath.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

Page({
  data: {
    nickname: "",
    avatarUrl: "",
    loading: false
  },

  onLoad() {
    if (getToken()) {
      openRoute(ROUTES.home);
    }
  },

  onNicknameInput(event) {
    this.setData({ nickname: event.detail.value });
  },

  onChooseAvatar(event) {
    const avatarUrl = event.detail.avatarUrl || "";
    if (!avatarUrl) {
      showErrorToast("微信头像获取失败，请先确认隐私协议中的头像用途声明");
      return;
    }
    this.setData({ avatarUrl });
  },

  async submitLogin(event) {
    await withPageLoading(this, async () => {
      const nickname = String(event?.detail?.value?.nickname || this.data.nickname || "").trim();
      const avatarUrl = this.data.avatarUrl || "";

      if (!nickname) {
        throw new Error("请先填写微信昵称");
      }

      const code = await wxLoginCode();
      const res = await login({
        code,
        nickname,
        avatarUrl
      });

      let user = {
        ...(res.data.user || {}),
        nickname,
        avatarUrl
      };

      clearAllCaches();
      wx.setStorageSync("token", res.data.token);
      wx.setStorageSync("user", user);

      if (avatarUrl) {
        try {
          const avatarBase64 = await readFileBase64(avatarUrl);
          const avatarRes = await uploadAvatar({
            avatarBase64,
            fileType: resolveAvatarFileType(avatarUrl)
          });
          user = {
            ...(avatarRes.data || user),
            nickname
          };
          wx.setStorageSync("user", user);
        } catch (_error) {
          // 头像同步失败不影响用户登录，后续可重新选择头像更新资料。
        }
      }

      showSuccessToast("已登录");
      openRoute(ROUTES.home);
    }).catch((error) => {
      showErrorToast(error, "登录失败");
    });
  },

  openPrivacy() {
    openRoute(ROUTES.privacy);
  }
});
