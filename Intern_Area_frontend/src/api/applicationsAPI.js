import axiosInstance from "./axiosInstance";

// Submit a job application
export const submitApplication = async ({ jobId, coverLetter, resumeUrl, customResumeName }) => {
  const { data } = await axiosInstance.post("/applications", {
    jobId, coverLetter, resumeUrl, customResumeName,
  });
  return data;
};

// Get my applications (candidate)
export const fetchMyApplications = async () => {
  const { data } = await axiosInstance.get("/applications/me");
  return data;
};

// Get all applications (admin/employer)
export const fetchAllApplications = async () => {
  const { data } = await axiosInstance.get("/applications");
  return data;
};

// Update application status
export const updateApplicationStatus = async (id, status, note = "") => {
  const { data } = await axiosInstance.put(`/applications/${id}/status`, { status, note });
  return data;
};

// Delete application
export const deleteApplication = async (id) => {
  const { data } = await axiosInstance.delete(`/applications/${id}`);
  return data;
};
