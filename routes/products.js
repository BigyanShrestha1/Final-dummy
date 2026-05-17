const express = require("express");
const {
  decorateProduct,
  decorateProducts,
  isValidString,
  normalizeString,
} = require("../utils/helpers");

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function isValidPrice(value) {
  return !Number.isNaN(Number(value)) && Number(value) >= 0;
}

function isValidStock(value) {
  return Number.isInteger(Number(value)) && Number(value) >= 0;
}

function isValidProduct(product) {
  return (
    product &&
    isValidString(product.id) &&
    isValidString(product.name) &&
    isValidString(product.theme) &&
    isValidPrice(product.price) &&
    isValidStock(product.stock) &&
    isValidString(product.image) &&
    isValidString(product.description)
  );
}

function normalizeProduct(product) {
  return {
    id: normalizeString(product.id),
    name: String(product.name).trim(),
    theme: String(product.theme).trim(),
    price: Number(product.price),
    stock: Number(product.stock),
    image: String(product.image || "/images/box-generic.svg").trim(),
    description: String(product.description || "A fun mystery box.").trim(),
    keywords: String(product.keywords || "mystery box gift").trim(),
  };
}

async function findProductByIdentifier(db, identifier) {
  const normalized = normalizeString(identifier);

  return db.get(
    "SELECT * FROM products WHERE LOWER(id) = ? OR LOWER(name) = ?",
    [normalized, normalized]
  );
}

async function searchProducts(db, query = {}, includeAll = false) {
  const q = isValidString(query.q) ? normalizeString(query.q) : "";
  const theme = isValidString(query.theme) ? normalizeString(query.theme) : "";
  const filters = [];
  const params = [];

  if (q) {
    const like = `%${q}%`;
    filters.push(
      "(LOWER(id) LIKE ? OR LOWER(name) LIKE ? OR LOWER(theme) LIKE ? OR LOWER(description) LIKE ? OR LOWER(keywords) LIKE ?)"
    );
    params.push(like, like, like, like, like);
  }

  if (theme) {
    filters.push("LOWER(theme) = ?");
    params.push(theme);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const sql = `SELECT * FROM products ${whereClause} ORDER BY price ASC, name ASC`;
  const products = await db.all(sql, params);

  return { products, q, theme, includeAll };
}

module.exports = function productsRoutes(db) {
  const router = express.Router();

  router.get(
    "/products",
    asyncHandler(async (req, res) => {
      const { products, q, theme } = await searchProducts(db, req.query);
      const themes = await db.all("SELECT DISTINCT theme FROM products ORDER BY theme ASC");

      res.render("products", {
        title: "Products",
        products: decorateProducts(products),
        themes: themes.map((row) => row.theme),
        q,
        theme,
      });
    })
  );

  router.get(
    "/products/:identifier",
    asyncHandler(async (req, res) => {
      const product = await findProductByIdentifier(db, req.params.identifier);

      if (!product) {
        return res.status(404).render("404", {
          title: "404 - Not Found",
          identifier: req.params.identifier,
        });
      }

      return res.render("product-detail", {
        title: product.name,
        product: decorateProduct(product),
      });
    })
  );

  router.head(
    "/api/products",
    asyncHandler(async (req, res) => {
      const result = await db.get("SELECT COUNT(*) AS count FROM products");
      res.set("X-Mystery-Box-Count", String(result.count));
      res.status(200).end();
    })
  );

  router.get(
    "/api/products",
    asyncHandler(async (req, res) => {
      const { products } = await searchProducts(db, req.query, true);
      res.status(200).json(products);
    })
  );

  router.get(
    "/api/products/:identifier",
    asyncHandler(async (req, res) => {
      const product = await findProductByIdentifier(db, req.params.identifier);

      if (!product) {
        return res.status(404).json({ error: "not found" });
      }

      return res.status(200).json(product);
    })
  );

  router.post(
    ["/api/products", "/api/products/add"],
    asyncHandler(async (req, res) => {
      if (!isValidProduct(req.body)) {
        return res.status(400).json({ error: "invalid product data" });
      }

      const product = normalizeProduct(req.body);

      try {
        await db.run(
          `INSERT INTO products
            (id, name, theme, price, stock, image, description, keywords)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.id,
            product.name,
            product.theme,
            product.price,
            product.stock,
            product.image,
            product.description,
            product.keywords,
          ]
        );

        return res.status(201).json(product);
      } catch (error) {
        return res.status(409).json({ error: "duplicate product" });
      }
    })
  );

  router.put(
    "/api/products/:identifier",
    asyncHandler(async (req, res) => {
      const existingProduct = await findProductByIdentifier(db, req.params.identifier);

      if (!existingProduct) {
        return res.status(404).json({ error: "not found" });
      }

      const updatedProduct = normalizeProduct({
        ...existingProduct,
        ...req.body,
        id: existingProduct.id,
      });

      if (!isValidProduct(updatedProduct)) {
        return res.status(400).json({ error: "invalid product data" });
      }

      try {
        await db.run(
          `UPDATE products
           SET name = ?, theme = ?, price = ?, stock = ?, image = ?, description = ?, keywords = ?
           WHERE id = ?`,
          [
            updatedProduct.name,
            updatedProduct.theme,
            updatedProduct.price,
            updatedProduct.stock,
            updatedProduct.image,
            updatedProduct.description,
            updatedProduct.keywords,
            existingProduct.id,
          ]
        );

        return res.status(200).json(updatedProduct);
      } catch (error) {
        return res.status(409).json({ error: "duplicate product name" });
      }
    })
  );

  router.delete(
    "/api/products/:identifier",
    asyncHandler(async (req, res) => {
      const identifier = normalizeString(req.params.identifier);
      const result = await db.run(
        "DELETE FROM products WHERE LOWER(id) = ? OR LOWER(name) = ?",
        [identifier, identifier]
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: "not found" });
      }

      return res.sendStatus(204);
    })
  );

  return router;
};
