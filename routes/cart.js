const crypto = require("crypto");
const express = require("express");
const {
  calculateTotals,
  decorateProduct,
  formatMoney,
  isValidEmail,
  isValidString,
  parseCartInput,
  titleCase,
} = require("../utils/helpers");

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

async function loadCartLineItems(db, cartItems) {
  const lineItems = [];

  for (const item of cartItems) {
    const product = await db.get("SELECT * FROM products WHERE id = ?", [item.id]);

    if (product) {
      lineItems.push({
        product,
        quantity: item.quantity,
        subtotal: Number((product.price * item.quantity).toFixed(2)),
      });
    }
  }

  return lineItems;
}

function checkoutValues(body = {}, user = null) {
  return {
    customerName: body.customerName || (user ? user.name : ""),
    email: body.email || (user ? user.email : ""),
    address: body.address || "",
    city: body.city || "",
    state: body.state || "",
    zip: body.zip || "",
    paymentCode: body.paymentCode || "",
  };
}

function isValidCheckout(values) {
  return (
    isValidString(values.customerName) &&
    isValidEmail(values.email) &&
    isValidString(values.address) &&
    isValidString(values.city) &&
    isValidString(values.state) &&
    isValidString(values.zip) &&
    /^\d{4,}$/.test(String(values.paymentCode).trim())
  );
}

module.exports = function cartRoutes(db) {
  const router = express.Router();

  router.get("/cart", (req, res) => {
    res.render("cart", {
      title: "Cart",
      error: req.query.error || "",
    });
  });

  router.get("/checkout", (req, res) => {
    res.render("checkout", {
      title: "Checkout",
      values: checkoutValues({}, req.session.user || null),
    });
  });

  router.post(
    "/checkout",
    asyncHandler(async (req, res) => {
      const cartItems = parseCartInput(req.body.cartJson);
      const values = checkoutValues(req.body, req.session.user || null);

      if (cartItems.length === 0) {
        return res.status(400).render("checkout", {
          title: "Checkout",
          error: "Your cart is empty. Add at least one mystery box before checking out.",
          values,
        });
      }

      if (!isValidCheckout(values)) {
        return res.status(400).render("checkout", {
          title: "Checkout",
          error: "Please complete all checkout fields. The mock payment code can be any 4 or more digits.",
          values,
        });
      }

      const lineItems = await loadCartLineItems(db, cartItems);

      if (lineItems.length !== cartItems.length) {
        return res.status(400).render("checkout", {
          title: "Checkout",
          error: "One or more products in your cart no longer exists.",
          values,
        });
      }

      const stockProblem = lineItems.find((item) => item.quantity > item.product.stock);

      if (stockProblem) {
        return res.status(409).render("checkout", {
          title: "Checkout",
          error: `${titleCase(stockProblem.product.name)} only has ${stockProblem.product.stock} left in stock.`,
          values,
        });
      }

      const totals = calculateTotals(lineItems);
      const orderId = `ord-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
      const userId = req.session.user ? req.session.user.id : null;

      try {
        await db.exec("BEGIN IMMEDIATE TRANSACTION");

        await db.run(
          `INSERT INTO orders
            (id, user_id, customer_name, email, address, city, state, zip, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            userId,
            values.customerName.trim(),
            values.email.trim().toLowerCase(),
            values.address.trim(),
            values.city.trim(),
            values.state.trim(),
            values.zip.trim(),
            totals.total,
          ]
        );

        for (const item of lineItems) {
          const updateResult = await db.run(
            "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
            [item.quantity, item.product.id, item.quantity]
          );

          if (updateResult.changes !== 1) {
            throw new Error(`${titleCase(item.product.name)} is no longer available in that quantity.`);
          }

          await db.run(
            `INSERT INTO order_items
              (order_id, product_id, product_name, product_image, price, quantity)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              orderId,
              item.product.id,
              item.product.name,
              item.product.image,
              item.product.price,
              item.quantity,
            ]
          );
        }

        await db.exec("COMMIT");
      } catch (error) {
        await db.exec("ROLLBACK").catch(() => {});

        return res.status(409).render("checkout", {
          title: "Checkout",
          error: error.message || "Checkout failed. Please review your cart and try again.",
          values,
        });
      }

      return res.status(201).render("order-success", {
        title: "Order Confirmation",
        order: {
          id: orderId,
          customerName: values.customerName,
          email: values.email,
          address: values.address,
          city: values.city,
          state: values.state,
          zip: values.zip,
          subtotal: formatMoney(totals.subtotal),
          tax: formatMoney(totals.tax),
          total: formatMoney(totals.total),
        },
        items: lineItems.map((item) => ({
          product: decorateProduct(item.product),
          quantity: item.quantity,
          subtotal: formatMoney(item.subtotal),
        })),
      });
    })
  );

  return router;
};
