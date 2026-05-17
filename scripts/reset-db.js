const fs = require("fs");
const { DB_FILE } = require("../data/database");

if (fs.existsSync(DB_FILE)) {
  fs.unlinkSync(DB_FILE);
  console.log(`Deleted ${DB_FILE}`);
} else {
  console.log("No database file found. A new one will be created on the next start.");
}
