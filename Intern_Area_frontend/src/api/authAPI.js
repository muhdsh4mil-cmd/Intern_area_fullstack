import axiosInstance from "./axiosInstance";

// Register new user
export const registerUser = async ({ name, email, password, role, company }) => {
  const { data } = await axiosInstance.post("/auth/register", {
    name, email, password, role, company,
  });
  return data; // { _id, name, email, role, company, avatar, token }
};

// Login user
export const loginUser = async ({ email, password, browserInfo }) => {
  const { data } = await axiosInstance.post("/auth/login", { email, password, browserInfo });
  return data;
};

// Google Login
export const googleLogin = async ({ email, name, avatar, browserInfo }) => {
  const { data } = await axiosInstance.post("/auth/google", { email, name, avatar, browserInfo });
  return data;
};

// Get current logged-in user
export const getMe = async () => {
  const { data } = await axiosInstance.get("/auth/me");
  return data;
};

// Update profile
export const updateProfile = async (updates) => {
  const { data } = await axiosInstance.put("/auth/profile", updates);
  return data;
};

// Logout user / mark offline
export const logoutUser = async () => {
  const { data } = await axiosInstance.post("/auth/logout");
  return data;
};

// Forgot password — Step 1: request OTP to be sent to email
export const requestPasswordReset = async ({ email }) => {
  const { data } = await axiosInstance.post("/auth/forgot-password", { email });
  return data; // { message, email }
};

// Forgot password — Step 2: verify OTP and get new generated password
export const verifyResetOTP = async ({ email, otp }) => {
  const { data } = await axiosInstance.post("/auth/verify-reset-otp", { email, otp });
  return data; // { message, newPassword, deliveredTo }
};

// Verify login OTP (Chrome browser flow)
export const verifyLoginOTP = async ({ userId, otp, browserInfo }) => {
  const { data } = await axiosInstance.post("/auth/verify-login-otp", { userId, otp, browserInfo });
  return data;
};

// Get current user's login history
export const getLoginHistory = async () => {
  const { data } = await axiosInstance.get("/auth/login-history");
  return data;
};

// Get all users' login history (Admin only)
export const getAllLoginHistory = async () => {
  const { data } = await axiosInstance.get("/auth/all-login-history");
  return data;
};

// Heuristic to get browser, OS, and device info
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  // Browser detection
  if (ua.indexOf("Firefox") > -1) {
    browser = "Firefox";
  } else if (ua.indexOf("SamsungBrowser") > -1) {
    browser = "Samsung Browser";
  } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
    browser = "Opera";
  } else if (ua.indexOf("Trident") > -1) {
    browser = "Internet Explorer";
  } else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
    browser = "Edge";
  } else if (ua.indexOf("Chrome") > -1) {
    browser = "Chrome";
  } else if (ua.indexOf("Safari") > -1) {
    browser = "Safari";
  }

  // OS detection
  if (ua.indexOf("Windows") > -1) {
    os = "Windows";
  } else if (ua.indexOf("Macintosh") > -1 || ua.indexOf("Mac OS") > -1) {
    os = "macOS";
  } else if (ua.indexOf("Android") > -1) {
    os = "Android";
  } else if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1 || ua.indexOf("iPod") > -1) {
    os = "iOS";
  } else if (ua.indexOf("Linux") > -1) {
    os = "Linux";
  }

  // Device detection
  if (/tablet|ipad|playbook|silk/i.test(ua.toLowerCase())) {
    device = "Tablet";
  } else if (/mobile|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua.toLowerCase())) {
    device = "Mobile";
  } else {
    if (window.screen && window.screen.width <= 1600) {
      device = "Laptop";
    } else {
      device = "Desktop";
    }
  }

  return { browser, os, device };
};
