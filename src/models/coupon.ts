import mongoose from "mongoose";



const schema = new mongoose.Schema({
    code:{
        type: String,
        required:[true, "Please Enter the Coupen Code"],
        unique : true,
    },
    amount:{
        type: Number,
        required:[true, "Please Enter the Discount Amount "],
        unique : true,
    }
})

export const Coupon = mongoose.model("Coupon" , schema)