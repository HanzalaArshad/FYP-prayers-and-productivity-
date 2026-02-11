import mongoose from "mongoose";

const groupChallengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 500 },
    goal: { type: String, required: true },
    totalDays: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
    },
  },
  { timestamps: true }
);

const GroupChallenge = mongoose.model("GroupChallenge", groupChallengeSchema);
export default GroupChallenge;
