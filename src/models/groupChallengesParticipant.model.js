import mongoose from "mongoose";

const groupChallengeParticipantSchema = new mongoose.Schema(
    {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    groupChallengeId: { type: mongoose.Schema.Types.ObjectId, ref: "GroupChallenge", required: true, index: true },
    progress: { type: Number, default: 0, min: 0 },
    currentDay: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    dailyProgress: [
      {
        date: { type: Date, required: true }, 
        increment: { type: Number, default: 1, min: 1 }, // Progress added that day
      },
    ],
  },

  { timestamps: true }
);

const GroupChallengeParticipant = mongoose.model("GroupChallengeParticipant", groupChallengeParticipantSchema);

export default GroupChallengeParticipant