//require('dotenv').config({path:'./env'})


import dotenv from  "dotenv"
import { connect } from "mongoose"
import connectDB from "./db/index.js"

dotenv.config({
  path:'./env'
})

connectDB()