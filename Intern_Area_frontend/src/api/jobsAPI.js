import axiosInstance from "./axiosInstance";

// Get all jobs with optional filters
export const fetchJobs = async ({ search, category, type, location, page, limit } = {}) => {
  const params = {};
  if (search) params.search = search;
  if (category) params.category = category;
  if (type) params.type = type;
  if (location) params.location = location;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await axiosInstance.get("/jobs", { params });
  return data; // { jobs, totalPages, currentPage, total }
};

// Get single job
export const fetchJobById = async (id) => {
  const { data } = await axiosInstance.get(`/jobs/${id}`);
  return data;
};

// Create a job (employer/admin)
export const createJob = async (jobData) => {
  const { data } = await axiosInstance.post("/jobs", jobData);
  return data;
};

// Update a job
export const updateJob = async (id, jobData) => {
  const { data } = await axiosInstance.put(`/jobs/${id}`, jobData);
  return data;
};

// Delete a job
export const deleteJob = async (id) => {
  const { data } = await axiosInstance.delete(`/jobs/${id}`);
  return data;
};

// Get employer's own jobs
export const fetchMyJobs = async () => {
  const { data } = await axiosInstance.get("/jobs/employer/my-jobs");
  return data;
};
