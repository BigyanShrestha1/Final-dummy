const express = require("express");
const { decorateProducts } = require("../utils/helpers");

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = function pagesRoutes(db) {
  const router = express.Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const products = await db.all("SELECT * FROM products ORDER BY id ASC");

      res.render("home", {
        title: "Home",
        products: decorateProducts(products),
        productCount: products.length,
      });
    })
  );

  router.get("/about", (req, res) => {
    res.render("about", {
      title: "About",
    });
  });

  router.get("/faq", (req, res) => {
    res.render("faq", {
      title: "FAQ",
    });
  });

  return router;
};
