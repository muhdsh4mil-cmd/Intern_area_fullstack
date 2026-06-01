import api from "./axiosInstance";

export const getPosts = async () => {
  const response = await api.get("/posts");
  return response.data;
};

export const getPostQuota = async () => {
  const response = await api.get("/posts/quota");
  return response.data;
};

export const createPost = async (content, mediaUrl = "", mediaType = "") => {
  const response = await api.post("/posts", { content, mediaUrl, mediaType });
  return response.data;
};

export const toggleLikePost = async (postId) => {
  const response = await api.post(`/posts/${postId}/like`);
  return response.data;
};

export const commentPost = async (postId, content) => {
  const response = await api.post(`/posts/${postId}/comment`, { content });
  return response.data;
};

export const sharePost = async (postId) => {
  const response = await api.post(`/posts/${postId}/share`);
  return response.data;
};

export const deletePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};
