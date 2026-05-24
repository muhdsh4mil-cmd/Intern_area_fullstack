const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  deleteUser,
  getDashboardStats,
  updateUserRole,
} = require("../controllers/adminController");
const { protect, authorizeRoles } = require("../middleware/auth");

// All admin routes are protected and admin-only
router.use(protect, authorizeRoles("admin"));

router.get("/stats", getDashboardStats);        // GET /api/admin/stats
router.get("/users", getAllUsers);               // GET /api/admin/users
router.get("/users/:id", getUserById);           // GET /api/admin/users/:id
router.put("/users/:id/role", updateUserRole);   // PUT /api/admin/users/:id/role
router.delete("/users/:id", deleteUser);         // DELETE /api/admin/users/:id

module.exports = router;
