const express = require("express");
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
} = require("../controllers/jobController");
const { protect, authorizeRoles } = require("../middleware/auth");

// Public routes
router.get("/", getJobs);
router.get("/:id", getJobById);

// Protected routes
router.get("/employer/my-jobs", protect, authorizeRoles("employer", "admin"), getMyJobs);
router.post("/", protect, authorizeRoles("employer", "admin"), createJob);
router.put("/:id", protect, authorizeRoles("employer", "admin"), updateJob);
router.delete("/:id", protect, authorizeRoles("employer", "admin"), deleteJob);

module.exports = router;
