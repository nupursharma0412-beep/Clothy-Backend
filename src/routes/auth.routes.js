import {Router} from 'express';
import { validateLogin, validateRegisterUser } from '../validators/auth.validator.js';
import { getMe, googleCallback, login, register , } from '../controllers/auth.controller.js';
import passport from 'passport';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = Router();

router.post("/register" ,validateRegisterUser, register)

router.post('/login',validateLogin, login)

router.get("/google",passport.authenticate("google" , { scope: ["profile" ,"email"]}))

router.get("/google/callback",passport.authenticate("google",{session:false, failureRedirect:"https://clothy-frontend-mu.vercel.app/login"}),

googleCallback)


router.get("/me",authenticateUser,getMe)

export default router;