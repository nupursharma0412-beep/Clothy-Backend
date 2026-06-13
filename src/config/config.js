import dotenv from "dotenv"
dotenv.config()


if(!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in .env file")
}

if(!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET is not define in environment variables")
}

if(!process.env.GOOGLE_CLIENT_ID){
    throw new Error("GOOGLE CLIENT Id is not define in environment variables")
}

if(!process.env.GOOGLE_CLIENT_SECRET){
    throw new Error("GOOGLE CLIENT SECRET is not define in environment variables")
}

if(!process.env.IMAGEKIT_PRIVITE_KEY){
    throw new Error("IMAGEKIT_PRIVITE_KEY is not define in environment variables")
}

export const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET:process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET,
    IMAGEKIT_PRIVITE_KEY:process.env.IMAGEKIT_PRIVITE_KEY,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET
}