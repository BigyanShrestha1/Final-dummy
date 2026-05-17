const express = require("express");
const bcrypt = require("bcryptjs");
const { destroySession } = require("../middleware/session");
const { isValidEmail, isValidString, normalizeString } = require("../utils/helpers");

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = function authRoutes(db) {
  const router = express.Router();

  router.get("/login", (req, res) => {
    res.render("login", {
      title: "Login",
      values: {},
    });
  });

  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const email = normalizeString(req.body.email || "");
      const password = req.body.password || "";
      const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);

      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).render("login", {
          title: "Login",
          error: "Invalid email or password.",
          values: { email },
        });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
      };

      return res.redirect("/profile");
    })
  );

  router.get("/register", (req, res) => {
    res.render("register", {
      title: "Register",
      values: {},
    });
  });

  router.post(
    "/register",
    asyncHandler(async (req, res) => {
      const name = String(req.body.name || "").trim();
      const email = normalizeString(req.body.email || "");
      const password = req.body.password || "";
      const confirmPassword = req.body.confirmPassword || "";

      if (!isValidString(name) || name.length < 2) {
        return res.status(400).render("register", {
          title: "Register",
          error: "Name must be at least 2 characters.",
          values: { name, email },
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).render("register", {
          title: "Register",
          error: "Please enter a valid email address.",
          values: { name, email },
        });
      }

      if (password.length < 6) {
        return res.status(400).render("register", {
          title: "Register",
          error: "Password must be at least 6 characters.",
          values: { name, email },
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).render("register", {
          title: "Register",
          error: "Passwords do not match.",
          values: { name, email },
        });
      }

      const passwordHash = bcrypt.hashSync(password, 10);

      try {
        const result = await db.run(
          "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
          [name, email, passwordHash]
        );

        req.session.user = {
          id: result.lastID,
          name,
          email,
        };

        return res.redirect("/profile");
      } catch (error) {
        return res.status(409).render("register", {
          title: "Register",
          error: "That email address is already registered.",
          values: { name, email },
        });
      }
    })
  );

  router.post("/logout", (req, res) => {
    destroySession(req, res);
    res.redirect("/");
  });

  return router;
};
