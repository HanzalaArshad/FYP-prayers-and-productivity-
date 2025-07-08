//require('dotenv').config({path:'./env'})


import dotenv from  "dotenv"
import { connect } from "mongoose"
import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
  path:'./env'
})

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000;

    app.listen(PORT, () => {
      console.log(`Server is Listening at port : ${PORT}`);
    });

    app.on("error", (error) => {
      console.error("Express app encountered an error: ", error);
      process.exit(1); 
    });
  })
  .catch((err) => {
    console.log('MONGODB CONNECTION FAILED !!!', err);
  });


