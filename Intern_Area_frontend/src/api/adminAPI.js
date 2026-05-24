import axiosInstance from "./axiosInstance";

// Fetch all registered users and stats
export const fetchUsers = async () => {
  const { data } = await axiosInstance.get("/admin/users");
  return data; // { stats: { total, candidates, employers, admins }, users }
};

// Update a user's role
export const updateUserRole = async (id, role) => {
  const { data } = await axiosInstance.put(`/admin/users/${id}/role`, { role });
  return data;
};

// Delete a user
export const deleteUser = async (id) => {
  const { data } = await axiosInstance.delete(`/admin/users/${id}`);
  return data;
};
