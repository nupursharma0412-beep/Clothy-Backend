
import userModel from "../models/user.model.js";
import jwt from 'jsonwebtoken'
import { config } from "../config/config.js";

async function sendTokenResponse(user, res, message) {

    const token = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, {
        expiresIn: "7d"
    })

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    res.status(200).json({
        message,
        success: true,
        user: {
            id: user._id,
            email: user.email,
            contact: user.contact,
            fullname: user.fullname,
            role: user.role
        }
    })
}


export const register = async (req, res) => {
    const { email, password, contact, fullname, isSeller } = req.body;


    try {
        const existingUser = await userModel.findOne({
            $or: [
                { email },
                { contact }
            ]
        })

        if (existingUser) {
            return res.status(400).json({
                message: "user with this email or contact already exists"
            })
        }

        const user = await userModel.create({
            email,
            contact,
            password,
            fullname,
            role: isSeller ? "seller" : "buyer"
        })

        await sendTokenResponse(user, res, "user register successfully")


    } catch (error) {
        return res.status(500).json({ message: "server error" })
    }
}

export const login = async (req, res) => {


    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }
        await sendTokenResponse(user, res, "User login successfully")

    } catch (error) {
        console.log(error);

        return res.status(500).json({ message: "server error" })
    }
}


export const googleCallback = async (req, res) => {
    const { id, displayName, emails, photos } = req.user

    const email = emails[0].value;
    const profilePic = photos[0].value

    let user = await userModel.findOne({ email })

    if (!user) {
        user = await userModel.create({
            email,
            fullname: displayName,
            googleId: id,
        })
    }

    const token = jwt.sign({
        id: user._id,

    }, config.JWT_SECRET, {
        expiresIn: '7d'
    })

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.redirect("https://clothy-frontend-mu.vercel.app/")
}



export const getMe = async (req, res) => {
    const user = req.user;
    return res.status(200).json({
        message: "user fatch successfully",
        success: true,
        user: {
            id: user._id,
            email: user.email,
            contact: user.contact,
            fullname: user.fullname,
            role: user.role
        }
    })
}