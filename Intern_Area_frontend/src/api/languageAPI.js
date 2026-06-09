import axiosInstance from "./axiosInstance";

/**
 * Request OTP for French language verification.
 * Requires user to be logged in (uses Bearer token from axiosInstance).
 */
export const requestFrenchOTP = async () => {
  const { data } = await axiosInstance.post("/language/request-french-otp");
  return data; // { message, email (masked) }
};

/**
 * Verify the OTP to activate French language.
 * @param {string} otp - 6-digit OTP entered by the user
 */
export const verifyFrenchOTP = async ({ otp }) => {
  const { data } = await axiosInstance.post("/language/verify-french-otp", { otp });
  return data; // { success: true, message, preferredLanguage: 'fr' }
};

/**
 * Update preferred language for non-French languages.
 * @param {string} language - Language code: 'en' | 'es' | 'hi' | 'pt' | 'zh'
 */
export const updateLanguagePreference = async ({ language }) => {
  const { data } = await axiosInstance.put("/language/preference", { language });
  return data; // { success: true, preferredLanguage }
};
