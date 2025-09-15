import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors"
import userRouter from "./routes/user.routes.js"
import taskRouter from "./routes/task.routes.js"
import prayerRoutes from "./routes/prayer.routes.js"
import challengeRouter from "./routes/challenge.routes.js"
import groupRouter from "./routes/group.routes.js"




const app=express()

app.use(cors({
  origin:process.env.CORS_ORIGIN,
  credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/user",userRouter)
app.use("/api/v1/task",taskRouter)
app.use("/api/v1/prayer",prayerRoutes)
app.use("/api/v1/challenge",challengeRouter)
app.use("/api/v1/group",groupRouter)
export {app}