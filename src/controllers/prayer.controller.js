import mongoose from "mongoose";
import Prayer from "../models/prayer.model.js";
import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper: format date to YYYY-MM-DD
const formatDate = (date = new Date()) => date.toISOString().split("T")[0];

// Helper: check if yesterday's date
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDate(yesterday);
};

const logPrayer = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = formatDate();

  const existingPrayers = await Prayer.find({ userId, date: today });
  if (existingPrayers.length > 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, existingPrayers, "Today's prayers already exist"));
  }

  const prayerNames = ["Fajar", "Dhuhr", "Asr", "Maghrib", "Isha", "Tahajjud"];
  const newPrayers = prayerNames.map(name => ({
    userId,
    prayerName: name,
    isCompleted: false,
    date: today,
  }));

  const prayers = await Prayer.insertMany(newPrayers);

  return res
    .status(201)
    .json(new ApiResponse(201, prayers, "Prayers for today created successfully"));
});

const getPrayerToday = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = formatDate();

  const prayers = await Prayer.find({ userId, date: today });
  if (!prayers.length) {
    return res.status(404).json(new ApiError(404, "No prayers found for today"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, prayers, "Today's prayers fetched successfully"));
});

const markPrayerCompleted = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { prayerId } = req.params;
  const today = formatDate();

  // 1️⃣ Mark prayer as completed
  const prayer = await Prayer.findOneAndUpdate(
    { _id: prayerId, userId },
    { isCompleted: true },
    { new: true }
  );

  if (!prayer) {
    throw new ApiError(404, "Prayer not found or not authorized");
  }

  // 2️⃣ Fetch all prayers for today
  const prayers = await Prayer.find({ userId, date: today });
  const mandatoryPrayers = prayers.filter(p => p.prayerName !== "Tahajjud");
  const allMandatoryCompleted = mandatoryPrayers.every(p => p.isCompleted);

  const user = await User.findById(userId);

  // ✅ Reward only if all mandatory prayers completed
  if (allMandatoryCompleted) {
    // Prevent double reward for same day
    if (user.lastRewardDate !== today) {

      // Daily score / XP for mandatory prayers
      user.dailyScore += 10; // you can adjust
      user.xp += 50;

      // Extra for Tahajjud if completed
      const tahajjud = prayers.find(p => p.prayerName === "Tahajjud");
      if (tahajjud && tahajjud.isCompleted) {
        user.dailyScore += 5; // extra points
        user.xp += 20;        // extra XP
      }

      // Level up logic
      if (user.xp >= user.level * 100) {
        user.level += 1;
        user.xp = 0;
      }

      // Streak logic (ignore Tahajjud for streak)
      const yesterday = getYesterdayDate();
      if (user.lastRewardDate === yesterday) {
        user.streakCount += 1;
      } else if (!user.lastRewardDate) {
        user.streakCount = 1;
      } else if (user.lastRewardDate !== yesterday) {
        user.streakCount = 1;
      }

      // Badge assignment
      const badgesToAward = [];
      if (user.streakCount === 7 && !user.badges.includes("Weekly Prayers Streak")) {
        badgesToAward.push("Weekly Prayers Streak");
      }
      if (user.streakCount === 30 && !user.badges.includes("Monthly Prayers Streak")) {
        badgesToAward.push("Monthly Prayers Streak");
      }
      if (user.streakCount === 100 && !user.badges.includes("Legendary Streak")) {
        badgesToAward.push("Legendary Streak");
      }
      if (badgesToAward.length) {
        user.badges.push(...badgesToAward);
      }

      user.lastRewardDate = today;
      user.lastActivity = new Date();

      await user.save();
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, prayer, `${prayer.prayerName} marked complete`));
});


export { logPrayer, getPrayerToday, markPrayerCompleted };
