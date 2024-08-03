import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  newProduct,
  getlatestProduct,
  getAllCategories,
  getAdminProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
} from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

// // TO Create New Product  - /api/v1/product/new
app.post("/new", adminOnly, singleUpload, newProduct);

// // TO get Last 10 Product  - /api/v1/product/latest
app.get("/latest", getlatestProduct);

// // TO get All Product  with fillter- /api/v1/product/latest
app.get("/all", getAllProducts);

// // To get all unique Categories   - /api/v1/product/categories
app.get("/categories", getAllCategories);

// TO get all Product  - /api/v1/product/admin-products
app.get("/admin-products", adminOnly, getAdminProducts);

app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;
