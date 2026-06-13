import express from 'express'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import cors from 'cors'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { config } from './config/config.js'
import authRouter from './routes/auth.routes.js'
import cartRouter from './routes/cart.routes.js'
import productRouter from './routes/product.routes.js'
import wishlistRouter from './routes/wishlist.routes.js'

const app = express()

app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors({
  origin: "https://clothy-frontend-mu.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
  credentials: true
}))

app.get("/", (req, res) => {
  res.send("Backend is running")
})

app.use(passport.initialize())
passport.use(new GoogleStrategy({
  clientID: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://clothy-backend-djl7.onrender.com/api/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile)
}))

app.use("/api/auth", authRouter)
app.use("/api/products", productRouter)
app.use("/api/cart", cartRouter)
app.use("/api/wishlist", wishlistRouter)

export default app