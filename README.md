# Mystery Crate Co.

Mystery Crate Co. is a complete beginner-friendly e-commerce website for a fake mystery box store. Users can browse products, search by keyword, view product details, register/login, add items to a cart, complete a mock checkout, and view purchase history from their profile.

## Tech Stack

- Backend: Node.js + Express.js
- Database: SQLite stored locally in `data/database.sqlite`
- Frontend: Pug templates, HTML, CSS, and browser JavaScript
- Authentication: email/password registration and login with hashed passwords using `bcryptjs`
- Cart: browser `localStorage`
- Checkout: mocked payment flow; no real payment gateway

## Core Features

- Home storefront page showing all 12 mystery box products
- Product detail pages with title, product image, description, stock, and price
- Product search by name, ID, theme, description, or keyword
- Login and registration pages
- Password hashing before saving users to SQLite
- Profile page with user information and purchase history
- Navigation bar on every page with Home, Products, About, FAQ, Login/Profile, and Cart
- About page and FAQ page
- Shopping cart and mock payment/checkout page
- Orders and order items saved to SQLite
- Product stock decreases after checkout
- REST API for product CRUD actions

## Install and Run Locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

For development with auto-restart:

```bash
npm run dev
```

## Reset the Database

```bash
npm run reset-db
npm start
```

The app will recreate `data/database.sqlite` and seed the 12 products when it starts.

## Mock Checkout Instructions

Use any name, email, and shipping address. For the payment field, enter any 4 or more digits such as:

```text
1234
```

Do not enter real card information.

## Product API Examples

Get all products:

```bash
curl http://localhost:3000/api/products
```

Search products:

```bash
curl "http://localhost:3000/api/products?q=gaming"
```

Get one product by ID:

```bash
curl http://localhost:3000/api/products/box-001
```

Add a product:

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"id":"box-013","name":"Movie Night","theme":"Movies","price":26.99,"stock":11,"image":"/images/box-generic.svg","description":"A movie-themed mystery box.","keywords":"movie cinema popcorn film"}'
```

Update a product:

```bash
curl -X PUT http://localhost:3000/api/products/box-013 \
  -H "Content-Type: application/json" \
  -d '{"price":31.99,"stock":8}'
```

Delete a product:

```bash
curl -X DELETE http://localhost:3000/api/products/box-013
```

## Deploy to Glitch

1. Create a new Glitch project.
2. Import this GitHub repository or upload these files.
3. Make sure Glitch runs `npm install`.
4. The start command is already set in `package.json`:

```bash
node app.js
```

5. Open the Glitch preview URL and test registration, search, cart, and checkout.

## Team Members and Contributions

Replace this section with your real team information before submitting.

- Sushil Sapkota: Backend routes, SQLite database, product API
- Team Member 2: Frontend pages and CSS styling
- Team Member 3: Authentication, profile, and purchase history
- Team Member 4: Cart, checkout, testing, and deployment

## Project Structure

```text
my-ecommerce-site/
├── public/
│   ├── css/
│   ├── js/
│   └── images/
├── routes/
│   ├── auth.js
│   ├── products.js
│   ├── users.js
│   ├── cart.js
│   └── pages.js
├── views/
├── data/
│   ├── database.js
│   └── database.sqlite
├── middleware/
├── utils/
├── scripts/
├── app.js
├── package.json
└── README.md
```
