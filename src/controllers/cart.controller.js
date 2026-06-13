import cartModel from '../models/cart.model.js'
import productModel from '../models/product.model.js'
import { stockOfVariant } from '../dao/product.dao.js'
import mongoose from "mongoose";
import { createOrder } from "../services/payment.service.js";
import { getCartDetails } from "../dao/cart.dao.js";
import paymentModel from "../models/payment.model.js";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import { config } from "../config/config.js";

export const addToCart = async (req, res) => {

    const { productId, variantId } = req.params

    const { quantity } = req.body

    // If variantId is provided, find product with that variant
    let product, stock, priceToUse

    if (variantId && variantId !== 'null' && variantId !== 'undefined') {
        product = await productModel.findOne({ _id: productId, "variants._id": variantId })

        if (!product) {
            return res.status(404).json({
                message: "Product or variant not found",
                success: false
            })
        }

        stock = await stockOfVariant(productId, variantId)
        
        const variant = product.variants.find(v => v._id.toString() === variantId)
        priceToUse = variant?.price || product.price
    } else {
        // No variant - use product directly
        product = await productModel.findById(productId)

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false
            })
        }

        stock = product.quantity
        priceToUse = product.price
    }

    const cart = (await cartModel.findOne({ user: req.user._id })) || await cartModel.create({ user: req.user._id })

    const isProductAlreadyInCart = cart.items.some(
        item => item.product.toString() === productId && 
        (item.variant?.toString() === variantId || (!item.variant && !variantId))
    )

    if (isProductAlreadyInCart) {
        const existingItem = cart.items.find(
            item => item.product.toString() === productId && 
            (item.variant?.toString() === variantId || (!item.variant && !variantId))
        )

        if (existingItem.quantity + quantity > stock) {
            return res.status(400).json({
                message: `Only ${stock - existingItem.quantity} items left in stock and you already have ${existingItem.quantity} items in your cart`,
                success: false
            })
        }

        const updatedCart = await cartModel.findOneAndUpdate(
            { 
                _id: cart._id, 
                "items.product": productId,
                ...(variantId && variantId !== 'null' ? { "items.variant": variantId } : { "items.variant": { $exists: false } })
            }, 
            { $inc: { "items.$.quantity": quantity } }, 
            { new: true }
        ).populate("items.product")

        return res.status(200).json({
            message: "Product quantity updated in cart",
            success: true,
            cart: updatedCart
        })
    }

    if (quantity > stock) {
        return res.status(400).json({
            message: `Only ${stock} items left in stock`,
            success: false
        })
    }

    const newItem = {
        product: productId,
        quantity,
        price: priceToUse
    }

    // Only add variant if it's provided and valid
    if (variantId && variantId !== 'null' && variantId !== 'undefined') {
        newItem.variant = variantId
    }

    cart.items.push(newItem)

    await cart.save()
    
    // Populate the cart before returning
    await cart.populate("items.product")

    return res.status(200).json({
        message: "Product added to cart",
        success: true,
        cart
    })

}


export const getCart = async (req, res) => {

    const user = req.user

    const cart = await getCartDetails(user._id)

    if (!cart) {
        return res.status(200).json({
            message: "Cart is empty",
            success: true,
            cart: { items: [], totalPrice: 0, currency: "INR" }
        })
    }

    return res.status(200).json({
        message: "Cart fetched successfully",
        success: true,
        cart
    })
}


export const increamentCartItemQuantity = async (req, res) => {
    const { productId, variantId } = req.params

    let stock

    if (variantId && variantId !== 'null' && variantId !== 'undefined') {
        const product = await productModel.findOne({
            _id: productId,
            "variants._id": variantId
        })
        if (!product) {
            return res.status(404).json({
                message: "Product or variant is not found",
                success: false
            })
        }
        stock = await stockOfVariant(productId, variantId)
    } else {
        const product = await productModel.findById(productId)
        if (!product) {
            return res.status(404).json({
                message: "Product is not found",
                success: false
            })
        }
        stock = product.quantity
    }

    const cart = await cartModel.findOne({ user: req.user._id })

    if (!cart) {
        return res.status(404).json({
            message: "Cart not found",
            success: false
        })
    }

    const itemQuantityInCart = cart.items.find(
        item => item.product.toString() === productId && 
        (item.variant?.toString() === variantId || (!item.variant && !variantId))
    )?.quantity || 0

    if (itemQuantityInCart + 1 > stock) {
        return res.status(400).json({
            message: `Only ${stock - itemQuantityInCart} items left in stock and you already have ${itemQuantityInCart} items in your cart`,
            success: false
        })
    }

    const updateQuery = {
        _id: cart._id,
        "items.product": productId
    }
    if (variantId && variantId !== 'null' && variantId !== 'undefined') {
        updateQuery["items.variant"] = variantId
    } else {
        updateQuery["items.variant"] = { $exists: false }
    }

    await cartModel.findOneAndUpdate(updateQuery, {
        $inc: { "items.$.quantity": 1 }
    }, { new: true })

    return res.status(200).json({
        message: "Cart item quantity increased",
        success: true 
    })

}


export const decrementCartItemQuantity = async (req, res) => {
    const { productId, variantId } = req.params

    if (variantId && variantId !== 'null' && variantId !== 'undefined') {
        const product = await productModel.findOne({
            _id: productId,
            "variants._id": variantId
        })
        if (!product) {
            return res.status(404).json({
                message: "Product or variant is not found",
                success: false
            })
        }
    } else {
        const product = await productModel.findById(productId)
        if (!product) {
            return res.status(404).json({
                message: "Product is not found",
                success: false
            })
        }
    }

    const cart = await cartModel.findOne({ user: req.user._id })
    if (!cart) {
        return res.status(404).json({
            message: "Cart not found",
            success: false
        })
    }

    let stock
    if (variantId && variantId !== 'null' && variantId !== 'undefined') {
        stock = await stockOfVariant(productId, variantId)
    } else {
        const product = await productModel.findById(productId)
        stock = product.quantity
    }

    const itemQuantityInCart = cart.items.find(
        item => item.product.toString() === productId && 
        (item.variant?.toString() === variantId || (!item.variant && !variantId))
    )?.quantity || 0

    if (itemQuantityInCart - 1 < 0) {
        return res.status(400).json({
            message: `You have only ${itemQuantityInCart} items in your cart`,
            success: false
        })
    }

    const updateQuery = {
        _id: cart._id,
        "items.product": productId
    }
    if (variantId && variantId !== 'null' && variantId !== 'undefined') {
        updateQuery["items.variant"] = variantId
    } else {
        updateQuery["items.variant"] = { $exists: false }
    }

    await cartModel.findOneAndUpdate(updateQuery, {
        $inc: { "items.$.quantity": -1 }
    }, { new: true })

    return res.status(200).json({
        message: "Cart item quantity decreased",
        success: true
    })
}

export const removeCartItem = async (req, res) => {
    const { productId, variantId } = req.params

    const product = await productModel.findById(productId)
    if (!product) {
        return res.status(404).json({
            message: "Product is not found",
            success: false
        })
    }

    const pullQuery = {
        product: productId
    }
    if (variantId && variantId !== 'null' && variantId !== 'undefined') {
        pullQuery.variant = variantId
    }

    await cartModel.findOneAndUpdate({ user: req.user._id }, {
        $pull: {
            items: pullQuery
        }
    })

    return res.status(200).json({
        message: "Item removed from cart",
        success: true
    })

}


export const createOrderController = async (req, res) => {

   

   const cart = await getCartDetails(req.user._id)

    if (!cart) {
        return res.status(400).json({
            message: "Cart is empty",
            success: false
        })
    }

    const order = await createOrder({ amount: cart.totalPrice, currency: cart.currency })

    const payment = await paymentModel.create({
        user: req.user._id,
        razorpay: {
            orderId: order.id,
        },
        price: {
            amount: cart.totalPrice,
            currency: cart.currency
        },
        orderItems: cart.items.map(item => {
            const matchedVariant = item.product.variants?.[0]
            return {
                title: item.product.title,
                productId: item.product._id,
                variantId: item.variant,
                quantity: item.quantity,
                images: matchedVariant?.images || item.product.images,
                description: item.product.description,
                price: {
                    amount: matchedVariant?.price?.amount || item.product.price?.amount,
                    currency: matchedVariant?.price?.currency || item.product.price?.currency
                }
            }
        })
    })

    return res.status(200).json({
        message: "Order created successfully",
        success: true,
        order
    })
}

export const verifyOrderController = async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = req.body

    const payment = await paymentModel.findOne({
        "razorpay.orderId": razorpay_order_id,
        status: "pending"
    })

    if (!payment) {
        return res.status(400).json({
            message: "Payment not found",
            success: false
        })
    }

    const isPaymentValid = validatePaymentVerification({
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
    }, razorpay_signature, config.RAZORPAY_KEY_SECRET)

    if (!isPaymentValid) {
        payment.status = "failed"
        await payment.save()

        return res.status(400).json({
            message: "Payment verification failed",
            success: false
        })
    }

    payment.status = "paid"

    payment.razorpay.paymentId = razorpay_payment_id
    payment.razorpay.signature = razorpay_signature

    await payment.save()

    return res.status(200).json({
        message: "Payment verified successfully",
        success: true
    })
}