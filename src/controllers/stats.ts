import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage, getInventories } from "../utils/features.js";

export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats = {};
  if (myCache.has("admin-stats"))
    stats = JSON.parse(myCache.get("admin-stats") as string);
  else {
    const today = new Date();
    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start, // >
        $lte: thisMonth.end, /// <
      },
    });

    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start, // >
        $lte: lastMonth.end, /// <
      },
    });

    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start, // >
        $lte: thisMonth.end, /// <
      },
    });

    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start, // >
        $lte: lastMonth.end, /// <
      },
    });

    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start, // >
        $lte: thisMonth.end, /// <
      },
    });

    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start, // >
        $lte: lastMonth.end, /// <
      },
    });

    const lastSixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthAgo, // >
        $lte: today, /// <
      },
    });

    const latestTransactionsPromise = Order.find({})
      .select(["orderItems", "discount", "total", "status"])
      .limit(4);

    const [
      thisMonthProducts,
      thisMonthUsers,
      thisMonthOrders,
      lastMonthProducts,
      lastMonthUsers,
      lastMonthOrders,
      productCount,
      userCount,
      allOrders,
      lastSixMonthOrders,
      categories,
      femaleUserCount,
      latestTransactions,
    ] = await Promise.all([
      thisMonthProductsPromise,
      thisMonthUsersPromise,
      thisMonthOrdersPromise,
      lastMonthProductsPromise,
      lastMonthUsersPromise,
      lastMonthOrdersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total"),
      lastSixMonthOrdersPromise,
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestTransactionsPromise,
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const ChangePercent = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
      product: calculatePercentage(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),
      user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
      order: calculatePercentage(
        thisMonthOrders.length,
        lastMonthOrders.length
      ),
    };

    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const count = {
      revenue,
      product: productCount,
      user: userCount,
      order: allOrders.length,
    };

    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthyRevenue = new Array(6).fill(0);

    lastSixMonthOrders.forEach((Order) => {
      const creationDate = Order.createdAt;
      const monthDiff = today.getMonth() - creationDate.getMonth();

      if (monthDiff < 6) {
        orderMonthCounts[6 - monthDiff - 1] += 1;
        orderMonthyRevenue[6 - monthDiff - 1] += Order.total;
      }
    });

    // const categoriesCountPromise = categories.map((category) =>
    //   Product.countDocuments({ category })
    // );

    // const categoriesCount = await Promise.all(categoriesCountPromise);

    // const categoryCount: Record<string, number>[] = [];
    const categoryCount = await getInventories({
      categories,
      productCount,
    });

    // categories.forEach((category, i) => {
    //   categoryCount.push({
    //     [category]: Math.round((categoriesCount[i] / productCount) * 100),
    //   });
    // });
    /// A Code Feachrs File ma add karyo che 

    const modifiedLatestTransaction = latestTransactions.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      stats: i.status,
    }));

    const userRatio = {
      male: userCount - femaleUserCount,
      female: femaleUserCount,
    };

    stats = {
      categoryCount,
      ChangePercent,
      count,
      chart: {
        order: orderMonthCounts,
        revenue: orderMonthyRevenue,
      },
      userRatio,
      latestTransactions: modifiedLatestTransaction,
    };

    myCache.set("admin-stats", JSON.stringify(stats));
  }
  return res.status(200).json({
    success: true,
    stats,
  });
});

export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts;

  if (myCache.has("admin-pie-charts"))
    charts = JSON.parse(myCache.get("admin-pie-charts") as string);
  else {


    const allOrderPromise = Order.find({}).select([
      "total", 
      "discount",
      "subtotal", 
      "tax",
      "shippingChages"
    ])

    const [
      processingOrder, 
      shippedOrder, 
      deliveredOrder, 
      categories, 
      productCount,
      OutOfstock,
      allOrders,
      allUsers,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({stock:0}),
      allOrderPromise,
      User.find({}).select(["dob"]),
      User.countDocuments({role:"admin"}),
      User.countDocuments({role:"user"}),
    ]);

    const orderFullfillment = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };

    const productCategory = await getInventories({
      categories,
      productCount,
    });

    const stockAvailablity = {
      inStock: productCount - OutOfstock,
      OutOfstock,
    };

    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );

    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingChages || 0),
      0
    );

    const burnt = allOrders.reduce(
      (prev, order) => prev + (order.tax || 0),
      0
    );

    const marktingCost = Math.round(grossIncome * (30/100));

    const netMargin = grossIncome-discount-productionCost-burnt-marktingCost

    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marktingCost ,
    };

    const usersAgeGroup = {
      "teen" : allUsers.filter((i) => i.age < 20).length,
      "adult" :allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
      "old" :allUsers.filter((i) => i.age >= 40).length
    };

    const adminCustomer = {
      admin: adminUsers,
      customer:customerUsers
    };

    charts = {
      orderFullfillment,
      productCategory,
      stockAvailablity,
      revenueDistribution,
      usersAgeGroup,
      adminCustomer,
    };

    myCache.set("admin-pie-chats", JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts,
  });

});

export const getbarCharts = TryCatch(async () => {});

export const getLineCharts = TryCatch(async () => {});
