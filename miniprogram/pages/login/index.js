const { login, getToken, clearAllCaches } = require("../../utils/request");
const { ROUTES, openRoute } = require("../../utils/navigation");
const { showErrorToast, showSuccessToast } = require("../../utils/feedback");
const { withPageLoading } = require("../../utils/form");
const { normalizeStoredUser } = require("../../utils/avatar");

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

Page({
  data: {
    loading: false
  },

  onLoad() {
    if (getToken()) {
      openRoute(ROUTES.home);
    }
  },

  requirePrivacyAuthorization() {
    if (!wx.getPrivacySetting) {
      return Promise.reject(new Error("当前基础库不支持隐私授权调试，请升级微信开发者工具基础库后重试"));
    }

    return new Promise((resolve, reject) => {
      wx.getPrivacySetting({
        success: (res) => {
          if (!res.needAuthorization) {
            resolve();
            return;
          }

          if (!wx.requirePrivacyAuthorize) {
            reject(new Error("当前环境未启用官方隐私授权弹窗，请升级基础库到 2.32.3 以上并清除授权数据后重试"));
            return;
          }

          wx.requirePrivacyAuthorize({
            success: () => resolve(),
            fail: (error) => {
              const errno = error && error.errno;
              if (errno === 103 || errno === 104) {
                reject(new Error("你暂未同意微信隐私保护指引"));
                return;
              }
              reject(new Error("官方隐私授权弹窗未触发，请清除授权数据并确认开发者工具基础库版本后重试"));
            }
          });
        },
        fail: () => {
          reject(new Error("当前环境无法读取隐私授权状态，请在微信开发者工具中升级基础库后重试"));
        }
      });
    });
  },

  async submitLogin(event) {
    await withPageLoading(this, async () => {
      await this.requirePrivacyAuthorization();

      const code = await wxLoginCode();
      const res = await login({
        code
      });

      let user = normalizeStoredUser({
        ...(res.data.user || {}),
        nickname: "微信用户",
        avatarUrl: "",
        avatarLocalPath: ""
      });

      clearAllCaches();
      wx.removeStorageSync("profileNicknameReady");
      wx.removeStorageSync("profileAvatarReady");
      wx.removeStorageSync("profileSettingsConsent");
      wx.setStorageSync("token", res.data.token);
      wx.setStorageSync("user", user);

      showSuccessToast("已登录");
      openRoute(ROUTES.profileSetup);
    }).catch((error) => {
      showErrorToast(error, "登录失败");
    });
  },

  openPrivacy() {
    openRoute(ROUTES.privacy);
  },

  openServiceAgreement() {
    openRoute(ROUTES.serviceAgreement);
  }
});
