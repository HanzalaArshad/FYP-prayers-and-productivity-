import mongoose from "mongoose";

const challengeParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentDay: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);


const ChallengeParticipant = mongoose.model("ChallengeParticipant", challengeParticipantSchema);

export default ChallengeParticipant;