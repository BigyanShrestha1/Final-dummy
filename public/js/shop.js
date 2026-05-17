const CART_KEY = "mysteryBoxCart";
const TAX_RATE = 0.0825;

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "{}");

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch (error) {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

function cartItemCount(cart = readCart()) {
  return Object.values(cart).reduce((sum, quantity) => sum + Number(quantity || 0), 0);
}

function updateCartCount() {
  const countElement = document.getElementById("cart-count");

  if (countElement) {
    countElement.textContent = cartItemCount();
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

function titleCase(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const existingToast = document.querySelector(".toast");

  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 2200);
}

function addToCart(productId, quantity = 1) {
  const id = String(productId || "").trim().toLowerCase();
  const amount = Number(quantity);

  if (!id || !Number.isInteger(amount) || amount <= 0) {
    showToast("Choose a valid quantity.");
    return;
  }

  const cart = readCart();
  cart[id] = Number(cart[id] || 0) + amount;
  saveCart(cart);
  showToast("Added to cart.");
}

async function fetchProducts() {
  const response = await fetch("/api/products");

  if (!response.ok) {
    throw new Error("Could not load products.");
  }

  return response.json();
}

async function getCartRows() {
  const cart = readCart();
  const products = await fetchProducts();
  const productById = new Map(products.map((product) => [product.id, product]));
  const normalizedCart = {};
  const rows = [];

  for (const [id, rawQuantity] of Object.entries(cart)) {
    const product = productById.get(id);
    const requestedQuantity = Number(rawQuantity);

    if (!product || !Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      continue;
    }

    const quantity = Math.min(requestedQuantity, product.stock);

    if (quantity <= 0) {
      continue;
    }

    normalizedCart[id] = quantity;
    rows.push({
      product,
      quantity,
      subtotal: product.price * quantity,
    });
  }

  saveCart(normalizedCart);

  const subtotal = rows.reduce((sum, row) => sum + row.subtotal, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return { rows, subtotal, tax, total, cart: normalizedCart };
}

function updateTotals(subtotal, tax, total) {
  const subtotalElement = document.getElementById("cart-subtotal");
  const taxElement = document.getElementById("cart-tax");
  const totalElement = document.getElementById("cart-total");

  if (subtotalElement) {
    subtotalElement.textContent = formatCurrency(subtotal);
  }

  if (taxElement) {
    taxElement.textContent = formatCurrency(tax);
  }

  if (totalElement) {
    totalElement.textContent = formatCurrency(total);
  }
}

async function renderCartPage() {
  const cartPage = document.getElementById("cart-page");

  if (!cartPage) {
    return;
  }

  const tableBody = document.getElementById("cart-items");
  const checkoutLink = document.getElementById("checkout-link");

  try {
    const { rows, subtotal, tax, total } = await getCartRows();
    updateTotals(subtotal, tax, total);

    if (checkoutLink) {
      checkoutLink.classList.toggle("disabled", rows.length === 0);
      checkoutLink.setAttribute("aria-disabled", rows.length === 0 ? "true" : "false");
    }

    if (rows.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-card">
              <h2>Your cart is empty</h2>
              <p>Add a mystery box to start your order.</p>
              <a class="btn" href="/products">Shop Products</a>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = rows
      .map((row) => {
        const product = row.product;
        const id = escapeHtml(product.id);
        const name = escapeHtml(titleCase(product.name));
        const image = escapeHtml(product.image);

        return `
          <tr>
            <td>
              <a class="cart-product" href="/products/${id}">
                <img class="cart-mini-art" src="${image}" alt="">
                <span>${name}</span>
              </a>
            </td>
            <td>${formatCurrency(product.price)}</td>
            <td>
              <div class="quantity-control">
                <button type="button" data-change-qty="${id}" data-delta="-1">-</button>
                <strong>${row.quantity}</strong>
                <button type="button" data-change-qty="${id}" data-delta="1">+</button>
              </div>
            </td>
            <td>${formatCurrency(row.subtotal)}</td>
            <td><button class="remove-btn" type="button" data-remove-item="${id}">Remove</button></td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">Could not load cart. Please refresh the page.</td>
      </tr>
    `;
  }
}

async function renderCheckoutPage() {
  const checkoutPage = document.getElementById("checkout-page");

  if (!checkoutPage) {
    return;
  }

  const summary = document.getElementById("checkout-summary");
  const cartJsonInput = document.getElementById("cart-json");

  try {
    const { rows, subtotal, tax, total, cart } = await getCartRows();
    updateTotals(subtotal, tax, total);

    if (cartJsonInput) {
      cartJsonInput.value = JSON.stringify(cart);
    }

    if (rows.length === 0) {
      summary.innerHTML = `
        <div class="empty-card small-empty">
          <h2>Your cart is empty</h2>
          <p>Add products before checking out.</p>
          <a class="btn" href="/products">Shop Products</a>
        </div>
      `;
      return;
    }

    summary.innerHTML = rows
      .map((row) => {
        const name = escapeHtml(titleCase(row.product.name));
        return `<div class="summary-row"><span>${name} x ${row.quantity}</span><strong>${formatCurrency(row.subtotal)}</strong></div>`;
      })
      .join("");
  } catch (error) {
    summary.innerHTML = "<p>Could not load cart summary.</p>";
  }
}

function setupCartEvents() {
  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-to-cart]");
    const removeButton = event.target.closest("[data-remove-item]");
    const changeButton = event.target.closest("[data-change-qty]");
    const clearButton = event.target.closest("#clear-cart");
    const navToggle = event.target.closest(".nav-toggle");

    if (addButton) {
      const quantityInput = document.getElementById("quantity");
      const quantity = quantityInput ? Number(quantityInput.value) : 1;
      addToCart(addButton.dataset.addToCart, quantity);
    }

    if (removeButton) {
      const cart = readCart();
      delete cart[removeButton.dataset.removeItem];
      saveCart(cart);
      renderCartPage();
      renderCheckoutPage();
    }

    if (changeButton) {
      const cart = readCart();
      const id = changeButton.dataset.changeQty;
      const delta = Number(changeButton.dataset.delta);
      const nextQuantity = Number(cart[id] || 0) + delta;

      if (nextQuantity <= 0) {
        delete cart[id];
      } else {
        cart[id] = nextQuantity;
      }

      saveCart(cart);
      renderCartPage();
      renderCheckoutPage();
    }

    if (clearButton) {
      clearCart();
      renderCartPage();
      renderCheckoutPage();
    }

    if (navToggle) {
      document.querySelector(".nav-links")?.classList.toggle("open");
    }
  });

  document.addEventListener("submit", (event) => {
    const checkoutForm = event.target.closest("#checkout-form");

    if (!checkoutForm) {
      return;
    }

    const cartJsonInput = document.getElementById("cart-json");

    if (cartJsonInput) {
      cartJsonInput.value = JSON.stringify(readCart());
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  setupCartEvents();
  renderCartPage();
  renderCheckoutPage();
});
