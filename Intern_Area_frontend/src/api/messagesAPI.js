import api from "./axiosInstance";

export const getOrCreateConversation = async (userId) => {
  const response = await api.post(`/messages/conversation/${userId}`);
  return response.data;
};

export const getConversations = async () => {
  const response = await api.get("/messages/conversations");
  return response.data; // { conversations, totalUnread }
};

export const getMessages = async (conversationId, page = 1) => {
  const response = await api.get(`/messages/conversation/${conversationId}/messages?page=${page}&limit=50`);
  return response.data;
};

export const sendMessage = async (conversationId, content) => {
  const response = await api.post(`/messages/conversation/${conversationId}/send`, { content });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get("/messages/unread-count");
  return response.data; // { unreadCount }
};

export const deleteConversation = async (conversationId) => {
  const response = await api.delete(`/messages/conversation/${conversationId}`);
  return response.data;
};

export const deleteMessage = async (messageId) => {
  const response = await api.delete(`/messages/${messageId}`);
  return response.data;
};

