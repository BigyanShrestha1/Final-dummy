const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const DATA_DIR = __dirname;
const DB_FILE = path.join(DATA_DIR, "database.sqlite");

const seedProducts = [
  {
    id: "box-001",
    name: "Starter Surprise",
    theme: "Gaming",
    price: 24.99,
    stock: 10,
    image: "/images/box-001.svg",
    description:
      "A budget-friendly gaming mystery box with desk accessories, controller-themed collectibles, stickers, and a bonus surprise.",
    keywords: "gaming controller desk console starter beginner gift",
  },
  {
    id: "box-002",
    name: "Collector Chaos",
    theme: "Anime",
    price: 39.99,
    stock: 6,
    image: "/images/box-002.svg",
    description:
      "A colorful anime-inspired mystery box with character goods, display pieces, charms, and poster cards.",
    keywords: "anime manga collector charm poster figure cute",
  },
  {
    id: "box-003",
    name: "Cozy Mystery",
    theme: "Self-Care",
    price: 29.99,
    stock: 14,
    image: "/images/box-003.svg",
    description:
      "A relaxing self-care box for cozy nights, dorm rooms, journaling, and gift giving.",
    keywords: "self care cozy candle journal relaxing gift wellness",
  },
  {
    id: "box-004",
    name: "Tech Treasure",
    theme: "Gadgets",
    price: 49.99,
    stock: 8,
    image: "/images/box-004.svg",
    description:
      "A gadget-focused box packed with useful everyday tech accessories, cable helpers, and desk upgrades.",
    keywords: "tech gadget cable desk accessory electronics useful",
  },
  {
    id: "box-005",
    name: "Snack Attack",
    theme: "International Snacks",
    price: 19.99,
    stock: 20,
    image: "/images/box-005.svg",
    description:
      "A tasty surprise mix of international snacks, sweet treats, savory bites, and bold flavors.",
    keywords: "snacks candy food international sweet savory treat",
  },
  {
    id: "box-006",
    name: "Art Supply Drop",
    theme: "Art",
    price: 27.99,
    stock: 12,
    image: "/images/box-006.svg",
    description:
      "A creative box filled with art supplies for sketching, journaling, crafting, and experimenting.",
    keywords: "art drawing sketch craft creative paint journal supplies",
  },
  {
    id: "box-007",
    name: "Bookworm Bundle",
    theme: "Books",
    price: 32.99,
    stock: 9,
    image: "/images/box-007.svg",
    description:
      "A reader-friendly mystery box with bookmarks, bookish accessories, cozy extras, and reading treats.",
    keywords: "books reading bookmark literature cozy bookworm library",
  },
  {
    id: "box-008",
    name: "Fitness Find",
    theme: "Fitness",
    price: 34.99,
    stock: 7,
    image: "/images/box-008.svg",
    description:
      "A fitness-themed box for workouts, hydration, recovery, and motivation.",
    keywords: "fitness workout gym recovery hydration motivation active",
  },
  {
    id: "box-009",
    name: "Pet Pal Surprise",
    theme: "Pets",
    price: 22.99,
    stock: 15,
    image: "/images/box-009.svg",
    description:
      "A pet-friendly box with toys, cute accessories, care items, and surprises for pet owners.",
    keywords: "pet dog cat toy animal care cute owner",
  },
  {
    id: "box-010",
    name: "Retro Rewind",
    theme: "Retro",
    price: 44.99,
    stock: 5,
    image: "/images/box-010.svg",
    description:
      "A nostalgia box filled with retro-inspired collectibles, throwback designs, and classic-style surprises.",
    keywords: "retro vintage nostalgic arcade throwback collectible",
  },
  {
    id: "box-011",
    name: "Study Boost",
    theme: "Stationery",
    price: 18.99,
    stock: 18,
    image: "/images/box-011.svg",
    description:
      "A low-cost student box with stationery, desk supplies, planning tools, and small school-day boosts.",
    keywords: "school study student stationery pencil notebook desk",
  },
  {
    id: "box-012",
    name: "Premium Vault",
    theme: "Deluxe",
    price: 79.99,
    stock: 4,
    image: "/images/box-012.svg",
    description:
      "Our deluxe mystery box with higher-value surprises, premium packaging, and a bigger unboxing experience.",
    keywords: "premium deluxe luxury vault high value exclusive",
  },
];

async function openDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  return open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });
}

async function setupDb() {
  const db = await openDb();

  await db.exec("PRAGMA foreign_keys = ON");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      theme TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      keywords TEXT NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip TEXT NOT NULL,
      total REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      product_image TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `);

  const insertProduct = `
    INSERT OR IGNORE INTO products
      (id, name, theme, price, stock, image, description, keywords)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (const product of seedProducts) {
    await db.run(insertProduct, [
      product.id,
      product.name,
      product.theme,
      product.price,
      product.stock,
      product.image,
      product.description,
      product.keywords,
    ]);
  }

  return db;
}

module.exports = setupDb;
module.exports.openDb = openDb;
module.exports.DB_FILE = DB_FILE;
module.exports.seedProducts = seedProducts;
