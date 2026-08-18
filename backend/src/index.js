import express from "express"
import "dotenv/config" 
import User from "./models/user.model.js"
import {connectDB } from "./lib/db.js"
import { clerkMiddleware } from '@clerk/express'
import cors from "cors";
import fs from "fs"
import path from "path"
import clerkWebhook from "./webhooks/clerk.webhook.js"
import authRoutes from "./routes/auth.route.js" 

const app = express()
const PORT = process.env.PORT || 3000
const FRONTEND_URL = process.env.FRONTEND_URL ?? process.env.FRONT_END_URL

const publicDir = path.join(process.cwd(), "public");

app.use(cors({origin : FRONTEND_URL, credentials : true}))
app.use(clerkMiddleware())
app.use("/api/webhooks/clerk",express.raw({type : "application/json"}),clerkWebhook)
app.use(express.json())


app.get("/health",(req, res)=>{
    res.status(200).json({
        message : "your backend is working fine!"
    })
})
// app.use("/api/auth", authRoutes)
if(fs.existsSync(publicDir)){
    app.use(express.static(publicDir))
    app.get("/{*any}", (req, res,next)=>{
        res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
    })
}

async function startServer() {
    await connectDB();

    app.listen(PORT, () => {
        console.log("Server is runnign in the port", PORT);
    });
}

startServer();
