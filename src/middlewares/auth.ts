// / Middleware to make sure only admin is allowed

import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("First Login", 401));

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Please check id", 401));

  if (user.role !== "admin")
    return next(
      new ErrorHandler("you don't login , Onaly Admin are Loging", 403)
    );

  next(); // Isme pahel chek that Admin or not after thar getAllUsers api heet
});

// / "/api/v1/user/dhfodf"  => that called id
// / "api/v1/user/dhfodf?key=24"  => that called quary paramiter req.query = key=24
