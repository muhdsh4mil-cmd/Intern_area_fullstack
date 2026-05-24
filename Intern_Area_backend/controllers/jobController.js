const asyncHandler = require("express-async-handler");
const Job = require("../models/Job");

// @desc    Get all jobs (with optional filters)
// @route   GET /api/jobs
// @access  Public
const getJobs = asyncHandler(async (req, res) => {
  const { search, category, type, location, page = 1, limit = 20 } = req.query;

  const query = { isActive: true };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  if (category) query.category = { $regex: category, $options: "i" };
  if (type) query.type = type;
  if (location) query.location = { $regex: location, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Job.countDocuments(query);
  const jobs = await Job.find(query)
    .populate("postedBy", "name email company")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({
    jobs,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    total,
  });
});

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate(
    "postedBy",
    "name email company"
  );

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  res.json(job);
});

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (employer, admin)
const createJob = asyncHandler(async (req, res) => {
  const {
    title, company, location, type, category,
    salary, description, requirements, skills,
    experience, openings, deadline,
  } = req.body;

  if (!title || !company || !description || !category) {
    res.status(400);
    throw new Error("Please provide title, company, category and description");
  }

  const job = await Job.create({
    title,
    company: company || req.user.company,
    location: location || "Remote",
    type: type || "Full-time",
    category,
    salary: salary || "Not disclosed",
    description,
    requirements: requirements || [],
    skills: skills || [],
    experience: experience || "0-1 years",
    openings: openings || 1,
    deadline,
    postedBy: req.user._id,
  });

  res.status(201).json(job);
});

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (employer who posted it, admin)
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Only the employer who posted or admin can edit
  if (
    job.postedBy.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to update this job");
  }

  const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json(updatedJob);
});

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private (employer who posted it, admin)
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (
    job.postedBy.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to delete this job");
  }

  await job.deleteOne();
  res.json({ message: "Job deleted successfully" });
});

// @desc    Get jobs posted by logged-in employer
// @route   GET /api/jobs/my-jobs
// @access  Private (employer)
const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(jobs);
});

module.exports = { getJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs };
