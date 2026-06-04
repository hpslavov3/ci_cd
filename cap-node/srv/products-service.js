"use strict";

const cds = require("@sap/cds");

/**
 * ProductsService – custom event handlers.
 *
 * The CRUD operations on Products are handled automatically by CAP's
 * generic service layer. We only add logic for the custom function/action.
 */
module.exports = cds.service.impl(async function () {
  const { Products } = this.entities;

  // ─── lowStock function ──────────────────────────────────────────────────
  /**
   * Returns all products whose quantity is below the given threshold.
   * @param {number} threshold - stock level to compare against (default: 5)
   */
  this.on("lowStock", async (req) => {
    const threshold = req.data.threshold ?? 5;

    const products = await SELECT.from(Products).where(
      `quantity < ${threshold}`
    );

    return products;
  });

  // ─── restock action ─────────────────────────────────────────────────────
  /**
   * Adds qty units to the product's current stock and returns the
   * updated record.
   */
  this.on("restock", async (req) => {
    const { productId, qty } = req.data;

    if (!productId || qty == null) {
      return req.error(400, "productId and qty are required");
    }
    if (qty <= 0) {
      return req.error(400, "qty must be a positive number");
    }

    // Fetch current product
    const [product] = await SELECT.from(Products).where({ ID: productId });
    if (!product) {
      return req.error(404, `Product with ID ${productId} not found`);
    }

    // Increment quantity
    const newQty = (product.quantity ?? 0) + qty;
    await UPDATE(Products).set({ quantity: newQty }).where({ ID: productId });

    // Return updated record
    const [updated] = await SELECT.from(Products).where({ ID: productId });
    return updated;
  });

  // ─── Before create – simple validation ──────────────────────────────────
  this.before("CREATE", Products, (req) => {
    const { name, price } = req.data;
    if (!name || name.trim().length === 0) {
      return req.error(400, "Product name is required");
    }
    if (price != null && price < 0) {
      return req.error(400, "Price cannot be negative");
    }
  });
});
