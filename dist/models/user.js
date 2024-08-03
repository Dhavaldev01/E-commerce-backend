import mongoose from "mongoose";
import validator from "validator";
const schema = new mongoose.Schema({
    _id: {
        type: String,
        required: [true, "please Enter Id"],
    },
    name: {
        type: String,
        required: [true, "Please Enter name"],
    },
    photo: {
        type: String,
        required: [true, "please Add Photo"],
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },
    email: {
        type: String,
        unique: [true, "Email already Exist"],
        required: [true, "please Enter Name"],
        validate: validator.default.isEmail,
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: [true, "Please Enter Gender"],
    },
    dob: {
        type: Date,
        required: [true, "please Enter Date of Birth"],
    },
}, { timestamps: true });
schema.virtual("age").get(function () {
    const today = new Date();
    const dob = this.dob;
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()))
        age--;
    return age;
});
export const User = mongoose.model("User", schema);
/// Genaric Sintex
