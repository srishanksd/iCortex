import express from "express"
import User from "../models/user.model"
import { verifyWebhook } from "@clerk/backend/webhooks"

router = express.Router()

router.post("/",async (req, res)=>{
    try{
        const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET
        if(!signingSecret){
            res.status(201).json({
                message : "Webhook secret is not provided"
            })
            return ;
        }

        // clerks verifier expects a web request with the raw body ; express.raw gives a buffer.

        const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
        const request = new Request("http://internal/webhook/clerk",{
            method : "POST",
            headers : new Headers(req.headers),
            body : payload
        })

        // throws if the signature is wrong or the bosy was tampered woth then do we trust evt.
        const evt = await verifyWebhook(request , { signingSecret })
        
        if(evt.type === "user.created" || evt.type === "user.updated"){
            const u = evt.data;

            u.email_adress?.find((e) => e.id === u.primary_email_address_id)?.email_adress ??
            u.email_addresses?.[0].email_address;

            const fullName = 
                [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                u.username ||
                email?.split("@")[0] ||
                "Clerk User";


            await User.findOneAndUpdate(
                {clerkId : u.id},
                {clerkId :u.id, email, fullName, profilePic: u.image_url },
                {new: true, upsert : true ,setDefaultsOnInsert: true },

            )
        }
        if(evt.type === "user.deleted"){
            if(evt.data.id) await User.findOneAndDelete({clerkId : evt.data.id});

        }
        res.status(200).json({recieved : true});
    }catch(err){
        console.error("Error in Clerk webhook", err)
        res.status(400).json({message : "Webhook verification failed!"})
    }

})



export default router