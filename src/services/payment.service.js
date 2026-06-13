import Razorpay from "razorpay";
import { config } from "../config/config.js";

const razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET
});

export async function createOrder({ amount, currency = "INR" }) {
    const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency,
       
    };

    const order = await razorpay.orders.create(options);
    return order;
}



