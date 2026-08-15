import express from "express"
import User from "../models/user.model.js"
import { verifyWebhook } from "@clerk/backend/webhooks"
import { clerkClient, clerkMiddleware, getAuth } from "@clerk/express"

const router = express.Router()

function getUserData(clerkUser) {
    const emailAddresses = clerkUser.email_addresses ?? clerkUser.emailAddresses ?? [];
    const primaryEmailAddressId = clerkUser.primary_email_address_id ?? clerkUser.primaryEmailAddressId;
    const primaryEmail = emailAddresses.find((item) => item.id === primaryEmailAddressId);
    const email =
        primaryEmail?.email_address ??
        primaryEmail?.emailAddress ??
        emailAddresses[0]?.email_address ??
        emailAddresses[0]?.emailAddress;

    if (!email) throw new Error(`Clerk user ${clerkUser.id} has no email address`);

    const fullName =
        [clerkUser.first_name ?? clerkUser.firstName, clerkUser.last_name ?? clerkUser.lastName]
            .filter(Boolean)
            .join(" ") ||
        clerkUser.username ||
        email.split("@")[0];

    return {
        clerkId: clerkUser.id,
        email,
        fullName,
        profilePic: clerkUser.image_url ?? clerkUser.imageUrl ?? "",
    };
}

async function syncUser(clerkUser) {
    const userData = getUserData(clerkUser);

    return User.findOneAndUpdate(
        { clerkId: userData.clerkId },
        { $set: userData },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
}

router.post("/sync", clerkMiddleware(), async (req, res) => {
    try {
        const { isAuthenticated, userId } = getAuth(req);
        if (!isAuthenticated || !userId) return res.status(401).json({ message: "Unauthorized" });

        const clerkUser = await clerkClient.users.getUser(userId);
        const user = await syncUser(clerkUser);
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Error syncing signed-in user", error);
        return res.status(500).json({ message: "Could not sync user" });
    }
});

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
            const user = await syncUser(evt.data)
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
