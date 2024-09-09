import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartData, getInventories, } from "../utils/features.js";
export const getDashboardStats = TryCatch(async (req, res, next) => {
    let stats = {};
    const key = "admin-stats";
    if (myCache.has(key))
        stats = JSON.parse(myCache.get(key));
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
        const [thisMonthProducts, thisMonthUsers, thisMonthOrders, lastMonthProducts, lastMonthUsers, lastMonthOrders, productCount, userCount, allOrders, lastSixMonthOrders, categories, femaleUserCount, latestTransactions,] = await Promise.all([
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
        const thisMonthRevenue = thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const ChangePercent = {
            revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
            product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
            user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
            order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
        };
        const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const count = {
            revenue,
            product: productCount,
            user: userCount,
            order: allOrders.length,
        };
        const orderMonthCounts = getChartData({
            length: 6,
            today,
            docArr: lastSixMonthOrders,
        });
        const orderMonthyRevenue = getChartData({
            length: 6,
            today,
            docArr: lastMonthOrders,
            property: "total",
        });
        ////////
        // const orderMonthCounts = new Array(6).fill(0);
        // const orderMonthyRevenue = new Array(6).fill(0);
        // lastSixMonthOrders.forEach((Order) => {
        //   const creationDate = Order.createdAt;
        //   const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
        //   if (monthDiff < 6) {
        //     orderMonthCounts[6 - monthDiff - 1] += 1;
        //     orderMonthyRevenue[6 - monthDiff - 1] += Order.total;
        //   }
        // });
        //Ani jagaya ye uper change karyo che
        ////////
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
        myCache.set(key, JSON.stringify(stats));
    }
    return res.status(200).json({
        success: true,
        stats,
    });
});
export const getPieCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-pie-charts";
    if (myCache.has(key))
        charts = JSON.parse(myCache.get(key));
    else {
        const allOrderPromise = Order.find({}).select([
            "total",
            "discount",
            "subtotal",
            "tax",
            "shippingChages",
        ]);
        const [processingOrder, shippedOrder, deliveredOrder, categories, productCount, OutOfstock, allOrders, allUsers, adminUsers, customerUsers,] = await Promise.all([
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delivered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({ stock: 0 }),
            allOrderPromise,
            User.find({}).select(["dob"]),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "user" }),
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
        const grossIncome = allOrders.reduce((prev, order) => prev + (order.total || 0), 0);
        const discount = allOrders.reduce((prev, order) => prev + (order.discount || 0), 0);
        const productionCost = allOrders.reduce((prev, order) => prev + (order.shippingChages || 0), 0);
        const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);
        const marktingCost = Math.round(grossIncome * (30 / 100));
        const netMargin = grossIncome - discount - productionCost - burnt - marktingCost;
        const revenueDistribution = {
            netMargin,
            discount,
            productionCost,
            burnt,
            marktingCost,
        };
        const usersAgeGroup = {
            teen: allUsers.filter((i) => i.age < 20).length,
            adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
            old: allUsers.filter((i) => i.age >= 40).length,
        };
        const adminCustomer = {
            admin: adminUsers,
            customer: customerUsers,
        };
        charts = {
            orderFullfillment,
            productCategory,
            stockAvailablity,
            revenueDistribution,
            usersAgeGroup,
            adminCustomer,
        };
        myCache.set(key, JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        charts,
    });
});
export const getbarCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-bar-charts";
    if (myCache.has(key))
        charts = JSON.parse(myCache.get(key));
    else {
        const today = new Date();
        const sixMonthAgo = new Date();
        sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);
        const twelveMonthAgo = new Date();
        twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);
        const SixMonthProductPromise = Product.find({
            createdAt: {
                $gte: sixMonthAgo, // >
                $lte: today, /// <
            },
        }).select("createdAt");
        const SixMonthUsersPromise = User.find({
            createdAt: {
                $gte: sixMonthAgo, // >
                $lte: today, /// <
            },
        }).select("createdAt");
        const tweleMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: twelveMonthAgo, // >
                $lte: today, /// <
            },
        }).select("createdAt");
        const [products, users, orders] = await Promise.all([
            SixMonthProductPromise,
            SixMonthUsersPromise,
            tweleMonthOrdersPromise,
        ]);
        const productCounts = getChartData({ length: 6, today, docArr: products });
        const usersCounts = getChartData({ length: 6, today, docArr: users });
        const ordersCounts = getChartData({ length: 12, today, docArr: orders });
        charts = {
            users: usersCounts,
            products: productCounts,
            orders: ordersCounts,
        };
        myCache.set(key, JSON.stringify(charts));
        // console.log('Products:', products);
        // console.log('Users:', users);
        // console.log('Orders:', orders);
    }
    return res.status(200).json({
        success: true,
        charts,
    });
});
export const getLineCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-line-charts";
    if (myCache.has(key))
        charts = JSON.parse(myCache.get(key));
    else {
        const today = new Date();
        const twelveMonthAgo = new Date();
        twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);
        const baseQuery = {
            createdAt: {
                $gte: twelveMonthAgo, // >
                $lte: today, /// <
            },
        };
        // const twelveMonthUsersPromise = User.find(baseQuery).select("createdAt");
        // const twelveMonthProductsPromise = Product.find(baseQuery).select("createdAt");
        // const twelveMonthOrdersPromise = Order.find(baseQuery).select("createdAt");
        const [products, users, orders] = await Promise.all([
            User.find(baseQuery).select("createdAt"),
            Product.find(baseQuery).select("createdAt"),
            Order.find(baseQuery).select(["createdAt", "discount", "total"]),
        ]);
        const productCounts = getChartData({
            length: 12,
            today,
            docArr: products,
        });
        const usersCounts = getChartData({ length: 12, today, docArr: users });
        const discount = getChartData({
            length: 12,
            today,
            docArr: orders,
            property: "discount",
        });
        const revenue = getChartData({
            length: 12,
            today,
            docArr: orders,
            property: "total",
        });
        charts = {
            users: usersCounts,
            products: productCounts,
            discount,
            revenue,
        };
        myCache.set(key, JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        charts,
    });
});
