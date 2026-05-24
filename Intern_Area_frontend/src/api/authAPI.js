import axiosInstance from "./axiosInstance";

// Register new user
export const registerUser = async ({ name, email, password, role, company }) => {
  const { data } = await axiosInstance.post("/auth/register", {
    name, email, password, role, company,
  });
  return data; // { _id, name, email, role, company, avatar, token }
};

// Login user
export const loginUser = async ({ email, password }) => {
  const { data } = await axiosInstance.post("/auth/login", { email, password });
  return data;
};

// Google Login
export const googleLogin = async ({ email, name, avatar }) => {
  const { data } = await axiosInstance.post("/auth/google", { email, name, avatar });
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
