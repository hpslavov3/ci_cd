"use strict";

/**
 * QUnit tests for the pure logic functions in webapp/model/logic.js.
 *
 * Run with:  npm test   (uses the qunit npm package, no browser/server needed)
 *
 * These tests are intentionally mechanical – they verify the exact outputs
 * of pure functions given controlled inputs, with zero I/O or UI5 involvement.
 */

const QUnit  = require("qunit");
const logic  = require("../../../model/logic.js");

// ── URL builders ─────────────────────────────────────────────────────────────

QUnit.module("URL builders");

QUnit.test("buildBooksUrl appends /Books to the base", function (assert) {
  assert.equal(
    logic.buildBooksUrl("/java-api/odata/v4/books"),
    "/java-api/odata/v4/books/Books"
  );
});

QUnit.test("buildBookUrl appends /Books(id) to the base", function (assert) {
  assert.equal(
    logic.buildBookUrl("/java-api/odata/v4/books", 42),
    "/java-api/odata/v4/books/Books(42)"
  );
});

QUnit.test("buildTotalStockUrl appends /totalStock()", function (assert) {
  assert.equal(
    logic.buildTotalStockUrl("/java-api/odata/v4/books"),
    "/java-api/odata/v4/books/totalStock()"
  );
});

QUnit.test("buildProductsUrl appends /Products to the base", function (assert) {
  assert.equal(
    logic.buildProductsUrl("/node-api/odata/v4/products"),
    "/node-api/odata/v4/products/Products"
  );
});

QUnit.test("buildLowStockUrl includes threshold parameter", function (assert) {
  assert.equal(
    logic.buildLowStockUrl("/node-api/odata/v4/products", 5),
    "/node-api/odata/v4/products/lowStock(threshold=5)"
  );
});

QUnit.test("buildLowStockUrl works with threshold 0", function (assert) {
  assert.equal(
    logic.buildLowStockUrl("/node-api/odata/v4/products", 0),
    "/node-api/odata/v4/products/lowStock(threshold=0)"
  );
});

QUnit.test("buildRestockUrl appends /restock to the base", function (assert) {
  assert.equal(
    logic.buildRestockUrl("/node-api/odata/v4/products"),
    "/node-api/odata/v4/products/restock"
  );
});

QUnit.test("buildRestockBody serialises productId and qty correctly", function (assert) {
  var sBody = logic.buildRestockBody(4, 10);
  var oBody = JSON.parse(sBody);
  assert.equal(oBody.productId, 4,  "productId is 4");
  assert.equal(oBody.qty,       10, "qty is 10");
});

QUnit.test("buildRestockBody is valid JSON", function (assert) {
  assert.ok(function () {
    JSON.parse(logic.buildRestockBody(1, 1));
    return true;
  }, "Body can be parsed as JSON");
});

// ── OData response parsers ────────────────────────────────────────────────────

QUnit.module("OData response parsers");

QUnit.test("extractODataList returns the value array", function (assert) {
  var aResult = logic.extractODataList({ value: [{ id: 1 }, { id: 2 }] });
  assert.equal(aResult.length, 2);
  assert.equal(aResult[0].id, 1);
});

QUnit.test("extractODataList returns empty array when value is empty", function (assert) {
  var aResult = logic.extractODataList({ value: [] });
  assert.deepEqual(aResult, []);
});

QUnit.test("extractODataValue returns the scalar value", function (assert) {
  assert.equal(logic.extractODataValue({ value: 47 }), 47);
});

QUnit.test("extractODataValue returns 0 correctly", function (assert) {
  assert.equal(logic.extractODataValue({ value: 0 }), 0);
});

QUnit.test("parseErrorResponse uses the error message from payload", function (assert) {
  var oErr = logic.parseErrorResponse({ error: { message: "Not found" } }, 404);
  assert.ok(oErr instanceof Error);
  assert.equal(oErr.message, "Not found");
});

QUnit.test("parseErrorResponse falls back to HTTP status when no message", function (assert) {
  var oErr = logic.parseErrorResponse({}, 500);
  assert.ok(oErr instanceof Error);
  assert.equal(oErr.message, "HTTP 500");
});

QUnit.test("parseErrorResponse falls back to HTTP status when payload is null", function (assert) {
  var oErr = logic.parseErrorResponse(null, 503);
  assert.equal(oErr.message, "HTTP 503");
});

// ── Controller logic ──────────────────────────────────────────────────────────

QUnit.module("Controller logic");

QUnit.test("countLowStock counts products below threshold correctly", function (assert) {
  var aProducts = [
    { quantity: 3  },
    { quantity: 10 },
    { quantity: 1  },
    { quantity: 15 }
  ];
  assert.equal(logic.countLowStock(aProducts, 10), 2, "2 products below 10");
});

QUnit.test("countLowStock returns 0 when all products are above threshold", function (assert) {
  var aProducts = [{ quantity: 20 }, { quantity: 50 }];
  assert.equal(logic.countLowStock(aProducts, 10), 0);
});

QUnit.test("countLowStock returns all when all products are below threshold", function (assert) {
  var aProducts = [{ quantity: 1 }, { quantity: 2 }];
  assert.equal(logic.countLowStock(aProducts, 10), 2);
});

QUnit.test("countLowStock returns 0 for empty list", function (assert) {
  assert.equal(logic.countLowStock([], 10), 0);
});

QUnit.test("countLowStock does NOT count items equal to threshold", function (assert) {
  var aProducts = [{ quantity: 10 }];
  assert.equal(logic.countLowStock(aProducts, 10), 0, "Boundary: equal is not below");
});

QUnit.test("resolveTabAction returns 'loadBooks' for key 'books'", function (assert) {
  assert.equal(logic.resolveTabAction("books"), "loadBooks");
});

QUnit.test("resolveTabAction returns 'loadProducts' for key 'products'", function (assert) {
  assert.equal(logic.resolveTabAction("products"), "loadProducts");
});

QUnit.test("resolveTabAction returns null for unknown key", function (assert) {
  assert.equal(logic.resolveTabAction("unknown"), null);
});

QUnit.test("buildErrorStatus returns correct shape", function (assert) {
  var oStatus = logic.buildErrorStatus("Something went wrong");
  assert.equal(oStatus.statusMessage, "Something went wrong");
  assert.equal(oStatus.statusType,    "Warning");
});

// ── Stock state helpers ───────────────────────────────────────────────────────

QUnit.module("Stock state helpers");

QUnit.test("resolveStockState returns 'Error' for quantity < 5", function (assert) {
  assert.equal(logic.resolveStockState(0), "Error");
  assert.equal(logic.resolveStockState(4), "Error");
});

QUnit.test("resolveStockState returns 'Warning' for quantity 5–9", function (assert) {
  assert.equal(logic.resolveStockState(5), "Warning");
  assert.equal(logic.resolveStockState(9), "Warning");
});

QUnit.test("resolveStockState returns 'Success' for quantity >= 10", function (assert) {
  assert.equal(logic.resolveStockState(10),  "Success");
  assert.equal(logic.resolveStockState(100), "Success");
});

QUnit.test("resolveStockLabel returns 'Critical' for quantity < 5", function (assert) {
  assert.equal(logic.resolveStockLabel(0), "Critical");
  assert.equal(logic.resolveStockLabel(4), "Critical");
});

QUnit.test("resolveStockLabel returns 'Low' for quantity 5–9", function (assert) {
  assert.equal(logic.resolveStockLabel(5), "Low");
  assert.equal(logic.resolveStockLabel(9), "Low");
});

QUnit.test("resolveStockLabel returns 'OK' for quantity >= 10", function (assert) {
  assert.equal(logic.resolveStockLabel(10),  "OK");
  assert.equal(logic.resolveStockLabel(100), "OK");
});
