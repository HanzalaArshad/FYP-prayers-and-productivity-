import mongoose from "mongoose";
import crypto from "crypto";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 1000 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isPrivate: { type: Boolean, default: false },
    joinDeadline: { type: Date, required: true },
    inviteToken: { type: String, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model("Group", groupSchema);
