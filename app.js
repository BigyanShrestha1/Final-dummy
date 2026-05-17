const express = require("express");
const path = require("path");
const setupDb = require("./data/database");
const { sessionMiddleware } = require("./middleware/session");
const pagesRoutes = require("./routes/pages");
const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const cartRoutes = require("./routes/cart");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(sessionMiddleware);

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentUser = req.session.user || null;
  res.locals.searchQuery = typeof req.query.q === "string" ? req.query.q : "";
  next();
});

async function startServer() {
  const db = await setupDb();

  app.locals.db = db;

  app.use("/", pagesRoutes(db));
  app.use("/", authRoutes(db));
  app.use("/", productsRoutes(db));
  app.use("/", usersRoutes(db));
  app.use("/", cartRoutes(db));

  app.use((req, res) => {
    res.status(404).render("404", {
      title: "404 - Not Found",
      identifier: req.originalUrl,
    });
  });

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).render("error", {
      title: "Server Error",
      message: "Something went wrong. Please try again.",
    });
  });

  app.listen(PORT, () => {
    console.log(`Mystery Crate Co. running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
