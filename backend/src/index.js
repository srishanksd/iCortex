import express from "express"
import "dotenv/config" 
import User from "./models/user.model.js"
import {connectDB } from "./lib/db.js"
import { clerkMiddleware } from '@clerk/express'
import cors from "cors";
import fs from "fs"
import path from "path"


const app = express()
const PORT = process.env.PORT || 3000
const FRONTEND_URL = process.env.FRONTEND_URL

const publicDir = path.join(process.cwd(), "public");


app.use(express.json())
app.use(cors({origin : FRONTEND_URL, credentials : true}))
app.use(clerkMiddleware())


app.get("/health",(req, res)=>{
    res.status(200).json({
        ok : true
    })
})

if(fs.existsSync(publicDir)){
    app.use(express.static(publicDir))
    app.get("/{*any}", (req, res)=>{
        res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
    })
}

app.listen(PORT, ()=>{
    connectDB();
    console.log("Server is runnign in the port", PORT)
})