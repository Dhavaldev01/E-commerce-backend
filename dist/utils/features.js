import mongoose from "mongoose";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
// import { Order } from "../models/order.js";
export const connectDB = async (uri) => {
    await mongoose
        // .connect("mongodb://localhost:27017", {
        .connect(uri, {
        dbName: "Ecommerce_24",
    })
        .then((c) => console.log(`DB Connected to ${c.connection.host}`))
        .catch((e) => console.log(e));
};
export const InvalidateCache = async ({ product, order, admin, userId, orderId }) => {
    try {
        if (product) {
            const productKeys = [
                "latest-product",
                "categories",
                "all-product",
            ];
            const products = await Product.find({}).select("_id");
            products.forEach(element => {
                /// const id  =  element._id
                //    const id =  `product-${element._id}`
                productKeys.push(`product-${element._id}`);
            });
            myCache.del(productKeys);
        }
        if (order) {
            const orderskey = [
                'all-orders',
                `my-orders-${userId}`,
                `order-${orderId}`
            ];
            // upadate karyu ap pan chale 
            // const Orders = await Order.find({}).select("_id");
            // Orders.forEach(element => {
            //     /// const id  =  element._id
            //     //    const id =  `Orders-${element._id}`
            //     orderskey.push()
            // });
            myCache.del(orderskey);
        }
        if (admin) {
        }
    }
    catch (error) {
        console.error('Error invalidating cache:', error);
    }
};
export const reduceStock = async (orderItems) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product)
            throw new Error("Product Not Found");
        product.stock -= order.quantity;
        await product.save();
    }
};
