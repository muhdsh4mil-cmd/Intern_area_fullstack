const express = require("express");
const router = express.Router();
const {
  applyForJob,
  getMyApplications,
  getAllApplications,
  updateApplicationStatus,
  deleteApplication,
} = require("../controllers/applicationController");
const { protect, authorizeRoles } = require("../middleware/auth");

// Candidate
router.post("/", protect, authorizeRoles("candidate"), applyForJob);
router.get("/me", protect, authorizeRoles("candidate"), getMyApplications);

// Admin & Employer
router.get("/", protect, authorizeRoles("admin", "employer"), getAllApplications);
router.put("/:id/status", protect, authorizeRoles("admin", "employer"), updateApplicationStatus);

// Admin or candidate who owns
router.delete("/:id", protect, deleteApplication);

module.exports = router;
