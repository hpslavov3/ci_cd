"use strict";

/**
 * Pure logic functions extracted from DataService and App.controller.
 * These have zero dependencies on UI5, fetch, or any browser API,
 * so they can be tested in plain Node.js with QUnit.
 */

// ── DataService logic ─────────────────────────────────────────────────────

/**
 * Build the URL for fetching all books.
 */
function buildBooksUrl(base) {
  return base + "/Books";
}

/**
 * Build the URL for fetching a single book.
 */
function buildBookUrl(base, id) {
  return base + "/Books(" + id + ")";
}

/**
 * Build the URL for the totalStock() function.
 */
function buildTotalStockUrl(base) {
  return base + "/totalStock()";
}

/**
 * Build the URL for fetching all products.
 */
function buildProductsUrl(base) {
  return base + "/Products";
}

/**
 * Build the URL for the lowStock() function.
 */
function buildLowStockUrl(base, threshold) {
  return base + "/lowStock(threshold=" + threshold + ")";
}

/**
 * Build the URL for the restock() action.
 */
function buildRestockUrl(base) {
  return base + "/restock";
}

/**
 * Build the POST body for the restock() action.
 */
function buildRestockBody(productId, qty) {
  return JSON.stringify({ productId: productId, qty: qty });
}

/**
 * Extract the value array from an OData response payload.
 */
function extractODataList(data) {
  return data.value;
}

/**
 * Extract a scalar value from an OData function response.
 */
function extractODataValue(data) {
  return data.value;
}

/**
 * Parse an error response into an Error object.
 */
function parseErrorResponse(data, status) {
  var message = (data && data.error && data.error.message)
    ? data.error.message
    : "HTTP " + status;
  return new Error(message);
}

// ── Controller logic ──────────────────────────────────────────────────────

/**
 * Count how many products have quantity below the given threshold.
 */
function countLowStock(products, threshold) {
  return products.filter(function (p) {
    return p.quantity < threshold;
  }).length;
}

/**
 * Determine which loader to call based on the selected tab key.
 * Returns the key itself so the caller can switch on it.
 */
function resolveTabAction(key) {
  if (key === "books")    { return "loadBooks"; }
  if (key === "products") { return "loadProducts"; }
  return null;
}

/**
 * Build the view model status properties for an error state.
 */
function buildErrorStatus(message) {
  return { statusMessage: message, statusType: "Warning" };
}

/**
 * Determine the stock state string for UI display.
 */
function resolveStockState(quantity) {
  if (quantity < 5)  { return "Error"; }
  if (quantity < 10) { return "Warning"; }
  return "Success";
}

/**
 * Determine the stock label for UI display.
 */
function resolveStockLabel(quantity) {
  if (quantity < 5)  { return "Critical"; }
  if (quantity < 10) { return "Low"; }
  return "OK";
}

module.exports = {
  buildBooksUrl:      buildBooksUrl,
  buildBookUrl:       buildBookUrl,
  buildTotalStockUrl: buildTotalStockUrl,
  buildProductsUrl:   buildProductsUrl,
  buildLowStockUrl:   buildLowStockUrl,
  buildRestockUrl:    buildRestockUrl,
  buildRestockBody:   buildRestockBody,
  extractODataList:   extractODataList,
  extractODataValue:  extractODataValue,
  parseErrorResponse: parseErrorResponse,
  countLowStock:      countLowStock,
  resolveTabAction:   resolveTabAction,
  buildErrorStatus:   buildErrorStatus,
  resolveStockState:  resolveStockState,
  resolveStockLabel:  resolveStockLabel
};
