const mongoose = require("mongoose");

const timelineEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  date: { type: String, default: "Just now" },
  note: { type: String, default: "" },
});

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: {
      type: String,
      default: "",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    customResumeName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Applied", "Reviewed", "Shortlisted", "Interview", "Hired", "Rejected"],
      default: "Applied",
    },
    timeline: [timelineEntrySchema],
    appliedDate: {
      type: String,
      default: () =>
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
  },
  { timestamps: true }
);

// Prevent duplicate applications (one per candidate per job)
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
