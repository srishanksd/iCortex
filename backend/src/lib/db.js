import mongoose from "mongoose";

export async function connectDB(){
    try {
        const mongoUri = process.env.MONGO_URI
        
        if(!mongoUri){
            throw new Error("MONGO_URI is required")
        }
        const conn = await mongoose.connect(mongoUri)
        console.log("MOngoDB connected ", conn.connection.host)
    }catch(err){
        console.log("Mongodb coneection error!!",err.message);
        process.exit(1);
    }
}

