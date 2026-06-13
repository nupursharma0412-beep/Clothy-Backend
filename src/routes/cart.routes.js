import express from 'express'
import {authenticateUser } from '../middlewares/auth.middleware.js'
import { validateAddToCart, validateIncrementCartItemQuantity , validateDecrementCartItemQuantity , validateRemoveCartItem} from '../validators/cart.validator.js'
import { addToCart, getCart, increamentCartItemQuantity, decrementCartItemQuantity, removeCartItem, createOrderController, verifyOrderController } from '../controllers/cart.controller.js'

const router = express.Router()



router.post("/add/:productId/:variantId", authenticateUser, validateAddToCart , addToCart)

router.get("/" , authenticateUser, getCart)

router.patch("/quantity/increament/:productId/:variantId", authenticateUser, validateIncrementCartItemQuantity,increamentCartItemQuantity)


router.patch("/quantity/decreament/:productId/:variantId", authenticateUser , validateDecrementCartItemQuantity,decrementCartItemQuantity) 

router.delete("/remove/:productId/:variantId", authenticateUser ,validateRemoveCartItem,removeCartItem)

router.post("/payment/create/order", authenticateUser, createOrderController)

router.post("/payment/verify/order", authenticateUser, verifyOrderController)

export default router
