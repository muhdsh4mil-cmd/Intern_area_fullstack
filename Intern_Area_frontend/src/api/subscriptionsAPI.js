import axiosInstance from "./axiosInstance";

// Get current user's subscription info (plan, limit, usage)
export const getMySubscription = async () => {
  const { data } = await axiosInstance.get("/subscriptions/me");
  return data;
};

// Get full payment & subscription history
export const getPaymentHistory = async () => {
  const { data } = await axiosInstance.get("/subscriptions/history");
  return data;
};
