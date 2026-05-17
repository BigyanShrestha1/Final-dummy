function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

function titleCase(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isValidString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function decorateProduct(product) {
  if (!product) {
    return null;
  }

  return {
    ...product,
    displayName: titleCase(product.name),
    displayTheme: titleCase(product.theme),
    formattedPrice: formatMoney(product.price),
  };
}

function decorateProducts(products) {
  return products.map(decorateProduct);
}

function parseCartInput(cartJson) {
  if (!cartJson) {
    return [];
  }

  let parsed;

  try {
    parsed = JSON.parse(cartJson);
  } catch (error) {
    return [];
  }

  const entries = Array.isArray(parsed)
    ? parsed.map((item) => [item.id || item.productId, item.quantity])
    : Object.entries(parsed);

  const merged = new Map();

  for (const [rawId, rawQuantity] of entries) {
    const id = normalizeString(rawId);
    const quantity = Number(rawQuantity);

    if (!isValidString(id) || !Number.isInteger(quantity) || quantity <= 0) {
      continue;
    }

    merged.set(id, (merged.get(id) || 0) + quantity);
  }

  return Array.from(merged.entries()).map(([id, quantity]) => ({ id, quantity }));
}

function calculateTotals(lineItems) {
  const subtotal = Number(
    lineItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)
  );
  const tax = Number((subtotal * 0.0825).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return { subtotal, tax, total };
}

module.exports = {
  normalizeString,
  titleCase,
  isValidString,
  isValidEmail,
  formatMoney,
  decorateProduct,
  decorateProducts,
  parseCartInput,
  calculateTotals,
};
