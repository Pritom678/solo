import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    revenue: { type: Number, required: true, min: 0 },
    memberPercentage: { type: Number, default: 0, min: 0, max: 100 },
    deadline: { type: Date, required: true },
    pdfUrl: { type: String }, // Path to the uploaded PDF
    status: {
      type: String,
      enum: ["pending_approval", "active", "completed", "rejected"],
      default: "pending_approval",
    },
    extensionRequest: {
      date: Date,
      reason: String,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
      }
    },
    rejectionNote: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
