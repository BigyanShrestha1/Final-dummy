const express = require("express");
const { formatMoney } = require("../utils/helpers");

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = function usersRoutes(db) {
  const router = express.Router();

  router.get(
    "/profile",
    asyncHandler(async (req, res) => {
      if (!req.session.user) {
        return res.render("profile", {
          title: "Profile",
          orders: [],
        });
      }

      const orders = await db.all(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
        [req.session.user.id]
      );

      for (const order of orders) {
        order.items = await db.all(
          "SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC",
          [order.id]
        );
        order.formattedTotal = formatMoney(order.total);
      }

      return res.render("profile", {
        title: "Profile",
        orders,
      });
    })
  );

  return router;
};
