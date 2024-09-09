import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { InvalidateCache } from "../utils/features.js";
// import {faker} from '@faker-js/faker';
// Revalidate on New,Upadte,Delete Product & on New Order
export const getlatestProduct = TryCatch(async (req, res, next) => {
    let product;
    if (myCache.has("latest-product"))
        product = JSON.parse(myCache.get("latest-product"));
    else {
        /// 1 => Assending -1 => Decending
        product = await Product.find({}).sort({ createdAt: -1 }).limit(5);
        myCache.set("latest-product", JSON.stringify(product));
    }
    return res.status(200).json({
        success: true,
        product,
    });
});
// Revalidate on New,Upadte,Delete Product & on New Order
export const getAllCategories = TryCatch(async (req, res, next) => {
    let categories;
    if (myCache.has("categories"))
        categories = JSON.parse(myCache.get("categories"));
    else {
        // Ama 2 Rete Tay Map use kari sakay Pan Am jo 5 lepyop hoy to 5 batave  Atale ano anther Opation che set use karvo
        /// Pan am apne ak Onther use karsu distinct
        categories = await Product.distinct("category");
        myCache.set("categories", JSON.stringify(categories));
    }
    return res.status(200).json({
        success: true,
        categories,
    });
});
// Revalidate on New,Upadte,Delete Product & on New Order
export const getAdminProducts = TryCatch(async (req, res, next) => {
    let product;
    if (myCache.has("all-product"))
        product = JSON.parse(myCache.get("all-product"));
    else {
        product = await Product.find({});
        myCache.set("all-product", JSON.stringify(product));
    }
    return res.status(200).json({
        success: true,
        product,
    });
});
export const getSingleProduct = TryCatch(async (req, res, next) => {
    let product;
    const id = req.params.id;
    if (myCache.has(`product-${id}`))
        product = JSON.parse(myCache.get(`product-${id}`));
    else {
        product = await Product.findById(req.params.id);
        if (!product)
            return next(new ErrorHandler("Product Not Found", 404));
        myCache.set(`product-${id}`, JSON.stringify(product));
    }
    return res.status(200).json({
        success: true,
        product,
    });
});
export const newProduct = TryCatch(async (req, res, next) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    if (!photo)
        return next(new ErrorHandler("Please Add Photo", 400));
    if (!name || !price || !stock || !category) {
        rm(photo.path, () => {
            console.log("Deleted");
        });
        return next(new ErrorHandler("Please Add All Fileds", 400));
    }
    await Product.create({
        name,
        price,
        stock,
        category: category.toLowerCase(),
        photo: photo.path,
    });
    InvalidateCache({ product: true, admin: true });
    return res.status(201).json({
        success: true,
        message: "Product Created Successfully",
    });
});
export const updateProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    const product = await Product.findById(id);
    if (!product)
        return next(new ErrorHandler("Invalid Product Id", 404));
    // if(!photo) return next(new ErrorHandler("Please Add Photo", 400));
    if (photo) {
        await rm(product.photo, () => {
            console.log("Old Photo Deleted");
        });
        product.photo = photo.path;
    }
    if (name)
        product.name = name;
    if (price)
        product.price = price;
    if (stock)
        product.stock = stock;
    if (category)
        product.name = category;
    await product.save();
    // console.log("Dh")
    InvalidateCache({ product: true, admin: true, productId: product._id.toString() });
    return res.status(200).json({
        success: true,
        message: "Product Upadated Successfully",
    });
});
export const deleteProduct = TryCatch(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product)
        return next(new ErrorHandler("Invalid Product Id", 404));
    await rm(product.photo, () => {
        console.log("Product Photo Deleted");
    });
    await Product.deleteOne();
    InvalidateCache({ product: true, admin: true, productId: String(product._id) });
    return res.status(200).json({
        success: true,
        message: "Product Deleted Successfully",
    });
});
export const getAllProducts = TryCatch(async (req, res, next) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;
    //  Ak Page ma 8 product ave 1,2,3,4,5,6,7,8
    //  Jo Page 2 ma ave tayare (2-1)*limit   => 1*8
    //  8 Product Skip tase
    //  9.10,11,12,13,14,15,16
    //  17,18,19,20,21,22,23,24
    const limit = Number(process.env.PRODUCT_PER_PAGE || 8);
    const skip = (page - 1) * limit;
    const baseQuery = {};
    // category,
    if (search)
        baseQuery.name = {
            $regex: search,
            $options: "i",
        };
    if (price)
        baseQuery.price = {
            $lte: Number(price),
        };
    // if(category) baseQuery.category = category;
    if (typeof category === "string")
        baseQuery.category = category;
    const productPromise = Product.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip);
    const [product, filteredOnlyProduct] = await Promise.all([
        productPromise,
        Product.find(baseQuery),
    ]);
    // Math ma fllor and round 10.1 => 10 kare
    // Per ceil 11 kare
    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);
    return res.status(200).json({
        success: true,
        product,
        totalPage,
    });
});
// const generateRandomProducts = async(count : number = 10 )=>{
//   const products = [];
//   for(let i =0 ; i< count ; i++){
//     const product = {
//       name : faker.commerce.productName(),
//       photo:"uploads\d6e15d60-4c21-4d26-9777-26d190890f30.png",
//       price:faker.commerce.price({ min : 1500 , max:8000 , dec : 0}),
//       stock : faker.commerce.price({ min:0 , max : 100 , dec : 0 }),
//       category: faker.commerce.department(),
//       createdAt : new Date(faker.date.past()),
//       updatedAt : new Date(faker.date.recent()),
//       __v :0,
//     }
//     products.push(product);
//   }
//   await Product.create(products);
//   console.log({ succecss : true});
// }
// const deleteRendomsProduct = async (count : number = 10 ) =>{
//   const products = await Product.find({}).skip(2);
//   for(let i=0 ; i< products.length; i++){
//     const product = products[i];
//     await product.deleteOne();
//   }
//   console.log({succecss : true});
// };
// //
// deleteRendomsProduct(38)
