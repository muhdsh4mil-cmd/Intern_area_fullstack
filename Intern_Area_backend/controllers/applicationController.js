const asyncHandler = require("express-async-handler");
const Application = require("../models/Application");
const Job = require("../models/Job");

// @desc    Submit a job application
// @route   POST /api/applications
// @access  Private (candidate)
const applyForJob = asyncHandler(async (req, res) => {
  const { jobId, coverLetter, resumeUrl, customResumeName } = req.body;

  if (!jobId) {
    res.status(400);
    throw new Error("Job ID is required");
  }

  // Check job exists
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if already applied
  const alreadyApplied = await Application.findOne({
    job: jobId,
    candidate: req.user._id,
  });

  if (alreadyApplied) {
    res.status(400);
    throw new Error("You have already applied for this job");
  }

  const application = await Application.create({
    job: jobId,
    candidate: req.user._id,
    coverLetter: coverLetter || "",
    resumeUrl: resumeUrl || "",
    customResumeName: customResumeName || "",
    timeline: [{ status: "Applied", date: "Just now", note: "Application submitted." }],
  });

  // Increment job applications count
  await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

  await application.populate("job", "title company location");
  await application.populate("candidate", "name email");

  res.status(201).json(application);
});

// @desc    Get my applications (candidate)
// @route   GET /api/applications/me
// @access  Private (candidate)
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ candidate: req.user._id })
    .populate("job", "title company location type salary category")
    .sort({ createdAt: -1 });

  res.json(applications);
});

// @desc    Get all applications (admin) OR applications for employer's jobs
// @route   GET /api/applications
// @access  Private (admin, employer)
const getAllApplications = asyncHandler(async (req, res) => {
  let applications;

  if (req.user.role === "admin") {
    // Admin sees everything
    applications = await Application.find()
      .populate("job", "title company location type")
      .populate("candidate", "name email avatar")
      .sort({ createdAt: -1 });
  } else if (req.user.role === "employer") {
    // Employer sees applications for their jobs only
    const myJobs = await Job.find({ postedBy: req.user._id }).select("_id");
    const myJobIds = myJobs.map((j) => j._id);
    applications = await Application.find({ job: { $in: myJobIds } })
      .populate("job", "title company location type")
      .populate("candidate", "name email avatar")
      .sort({ createdAt: -1 });
  } else {
    res.status(403);
    throw new Error("Not authorized to view all applications");
  }

  res.json(applications);
});

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (employer, admin)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const validStatuses = ["Applied", "Reviewed", "Shortlisted", "Interview", "Hired", "Rejected"];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid status value");
  }

  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  application.status = status;
  application.timeline.push({
    status,
    date: new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }),
    note: note || `Status updated to ${status}.`,
  });

  const updated = await application.save();
  await updated.populate("job", "title company");
  await updated.populate("candidate", "name email");

  res.json(updated);
});

// @desc    Delete an application
// @route   DELETE /api/applications/:id
// @access  Private (admin, or candidate who owns it)
const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  // Only admin or the candidate themselves can delete
  if (
    req.user.role !== "admin" &&
    application.candidate.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to delete this application");
  }

  await application.deleteOne();

  // Decrement job applications count
  await Job.findByIdAndUpdate(application.job, {
    $inc: { applicationsCount: -1 },
  });

  res.json({ message: "Application deleted successfully" });
});

module.exports = {
  applyForJob,
  getMyApplications,
  getAllApplications,
  updateApplicationStatus,
  deleteApplication,
};
