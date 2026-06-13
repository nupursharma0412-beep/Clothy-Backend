import cartModel from "../models/cart.model.js";
import mongoose from "mongoose";

export async function getCartDetails(userId) {
    let cart = (await cartModel.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId)
            }
        },
        { $unwind: { path: '$items' } },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'items.product'
            }
        },
        { $unwind: { path: '$items.product' } },
        {
            // Find the matching variant using $filter instead of $unwind
            // so variants stays as an array
            $addFields: {
                matchedVariant: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: '$items.product.variants',
                                as: 'variant',
                                cond: { $eq: ['$$variant._id', '$items.variant'] }
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $addFields: {
                itemPrice: {
                    price: {
                        $multiply: [
                            '$items.quantity',
                            '$matchedVariant.price.amount'
                        ]
                    },
                    currency: '$matchedVariant.price.currency'
                },
                // Keep only the matched variant in the array
                'items.product.variants': ['$matchedVariant']
            }
        },
        {
            $group: {
                _id: '$_id',
                totalPrice: { $sum: '$itemPrice.price' },
                currency: {
                    $first: '$itemPrice.currency'
                },
                items: { $push: '$items' }
            }
        }
    ]))[0]

    return cart
}
