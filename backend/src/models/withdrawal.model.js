import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Optional note from the user (e.g. payment details / bank info)
    note: {
      type: String,
      trim: true,
    },
    // Admin can leave a reason when rejecting
    adminNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

export default Withdrawal;
