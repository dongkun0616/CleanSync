// SettingsUtils.js
export const API_BASE_URL = "http://13.124.252.181:3000";

export const defaultSettings = {
  emailAlert: true,
  pushAlert: false,
  dailyReport: true,
  weeklyReport: false,
  co2: 1000,
  noise: 55,
  temp: 27,
  dust: 35,
};

export const defaultProfile = {
  name: "123",
  email: "123@gmail.com",
  space: "101호",
};

export const getTheme = (score) => {
  if (score >= 80) return { color: "#10B981", bg: "linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)", rgb: "16, 185, 129" };
  if (score >= 60) return { color: "#F59E0B", bg: "linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)", rgb: "245, 158, 11" };
  return { color: "#EF4444", bg: "linear-gradient(135deg, #FEE2E2 0%, #FFF5F5 100%)", rgb: "239, 68, 68" };
};

export const getStatusText = (score) => {
  if (score >= 80) return "쾌적";
  if (score >= 60) return "보통";
  return "혼잡";
};

export const normalizeSettingsFromApi = (data) => ({
  emailAlert: Boolean(data.emailAlert ?? data.EMAIL_ALERT ?? data.emailAlertEnabled ?? data.email_alert ?? defaultSettings.emailAlert),
  pushAlert: Boolean(data.pushAlert ?? data.PUSH_ALERT ?? data.pushAlertEnabled ?? data.push_alert ?? defaultSettings.pushAlert),
  dailyReport: Boolean(data.dailyReport ?? data.DAILY_REPORT ?? data.dailyReportEnabled ?? data.daily_report ?? defaultSettings.dailyReport),
  weeklyReport: Boolean(data.weeklyReport ?? data.WEEKLY_REPORT ?? data.weeklyReportEnabled ?? data.weekly_report ?? defaultSettings.weeklyReport),
  co2: Number(data.co2 ?? data.CO2_THRESHOLD ?? data.co2Threshold ?? defaultSettings.co2),
  noise: Number(data.noise ?? data.NOS_THRESHOLD ?? data.noiseThreshold ?? data.nosThreshold ?? defaultSettings.noise),
  temp: Number(data.temp ?? data.TEMP_THRESHOLD ?? data.tempThreshold ?? defaultSettings.temp),
  dust: Number(data.dust ?? data.DUST_THRESHOLD ?? data.dustThreshold ?? defaultSettings.dust),
});

export const normalizeProfileFromApi = (data) => ({
  name: data.name ?? data.USER_NAME ?? data.userName ?? defaultProfile.name,
  email: data.email ?? data.USER_EMAIL ?? data.userEmail ?? defaultProfile.email,
  space: data.space ?? data.USER_SPACE ?? data.userSpace ?? defaultProfile.space,
});

export const createSettingsPayload = (settings) => ({
  ...settings,
  EMAIL_ALERT: settings.emailAlert,
  PUSH_ALERT: settings.pushAlert,
  DAILY_REPORT: settings.dailyReport,
  WEEKLY_REPORT: settings.weeklyReport,
  CO2_THRESHOLD: settings.co2,
  NOS_THRESHOLD: settings.noise,
  TEMP_THRESHOLD: settings.temp,
  DUST_THRESHOLD: settings.dust,
});

export const createProfilePayload = (profile) => ({
  ...profile,
  USER_NAME: profile.name,
  USER_EMAIL: profile.email,
  USER_SPACE: profile.space,
  userName: profile.name,
  userEmail: profile.email,
  userSpace: profile.space,
});