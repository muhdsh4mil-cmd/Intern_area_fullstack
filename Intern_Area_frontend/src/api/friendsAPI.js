import api from "./axiosInstance";

export const getFriendsData = async () => {
  const response = await api.get("/friends");
  return response.data;
};

export const getSuggestedFriends = async () => {
  const response = await api.get("/friends/suggested");
  return response.data;
};

export const searchUsers = async (query) => {
  const response = await api.get(`/friends/search?query=${encodeURIComponent(query)}`);
  return response.data;
};

export const sendFriendRequest = async (userId) => {
  const response = await api.post(`/friends/request/${userId}`);
  return response.data;
};

export const acceptFriendRequest = async (userId) => {
  const response = await api.post(`/friends/accept/${userId}`);
  return response.data;
};

export const rejectFriendRequest = async (userId) => {
  const response = await api.post(`/friends/reject/${userId}`);
  return response.data;
};
