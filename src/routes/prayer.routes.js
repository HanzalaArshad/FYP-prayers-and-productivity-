import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getPrayerToday, logPrayer, markPrayerCompleted } from "../controllers/prayer.controller.js";



const prayerRoutes=Router()

prayerRoutes.route("/prayers").post(verifyJwt,logPrayer)
prayerRoutes.route("/prayers/today").get(verifyJwt,getPrayerToday)
prayerRoutes.route("/:prayerId/complete").post(verifyJwt,markPrayerCompleted)

export default prayerRoutes;