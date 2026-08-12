import { Schema, model, models } from "mongoose";
const cartItem = new Schema({ productId: { type: String, required: true }, quantity: { type: Number, min: 1, required: true }, variantId: String }, { _id: false });
const cart = new Schema({ token: { type: String, required: true, unique: true, index: true }, items: { type: [cartItem], default: [] } }, { timestamps: true });
export const Cart = models.Cart || model("Cart", cart);