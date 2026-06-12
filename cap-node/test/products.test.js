"use strict";

/**
 * Jest integration tests for the ProductsService.
 *
 * CAP's `cds.test()` helper spins up an in-memory server with SQLite
 * and the seed data from db/data/, so no external service is needed.
 */
const cds = require("@sap/cds");

// Bootstrap CAP test environment once for the whole suite
const { GET, POST, axios } = cds.test(".", "--profile", "test");

// Disable axios throwing on non-2xx so we can assert error responses
axios.defaults.validateStatus = () => true;

describe("ProductsService – OData V4 endpoint", () => {
  const BASE = "/odata/v4/products";

  // ─── Basic CRUD ───────────────────────────────────────────────────────

  test("GET /Products returns 200 with a value array", async () => {
    const { status, data } = await GET(`${BASE}/Products`);
    expect(status).toBe(200);
    expect(Array.isArray(data.value)).toBe(true);
  });

  test("GET /Products returns all seeded products", async () => {
    const { data } = await GET(`${BASE}/Products`);
    expect(data.value.length).toBe(5);
  });

  test("GET /Products(1) returns 'Laptop Pro 15'", async () => {
    const { status, data } = await GET(`${BASE}/Products(1)`);
    expect(status).toBe(200);
    expect(data.name).toBe("Laptop Pro 15");
    expect(data.category).toBe("Electronics");
  });

  test("GET /Products(9999) returns 404 for unknown product", async () => {
    const { status } = await GET(`${BASE}/Products(9999)`);
    expect(status).toBe(404);
  });

  // ─── OData query options ──────────────────────────────────────────────

  test("$top=2 returns at most 2 products", async () => {
    const { data } = await GET(`${BASE}/Products?$top=2`);
    expect(data.value.length).toBe(2);
  });

  test("$filter by category returns matching products", async () => {
    const { data } = await GET(
      `${BASE}/Products?$filter=category eq 'Peripherals'`
    );
    expect(data.value.every((p) => p.category === "Peripherals")).toBe(true);
  });

  test("$orderby price desc sorts correctly", async () => {
    const { data } = await GET(
      `${BASE}/Products?$orderby=price desc`
    );
    const prices = data.value.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test("$select returns only requested fields", async () => {
    const { data } = await GET(`${BASE}/Products?$select=name,price`);
    const first = data.value[0];
    expect(first.name).toBeDefined();
    expect(first.price).toBeDefined();
    expect(first.description).toBeUndefined();
  });

  // ─── Custom function: lowStock ────────────────────────────────────────

  test("lowStock(threshold=20) returns products below threshold", async () => {
    const { status, data } = await GET(
      `${BASE}/lowStock(threshold=20)`
    );
    expect(status).toBe(200);
    expect(Array.isArray(data.value)).toBe(true);
    // All returned products must have quantity < 20
    data.value.forEach((p) => {
      expect(p.quantity).toBeLessThan(20);
    });
  });

  test("lowStock(threshold=100) returns all products", async () => {
    const { data: all } = await GET(`${BASE}/Products`);
    const { data: low } = await GET(`${BASE}/lowStock(threshold=100)`);
    expect(low.value.length).toBe(all.value.length);
  });

  // ─── Custom action: restock ───────────────────────────────────────────

  test("restock increases quantity correctly", async () => {
    // Get current stock of product 4 (USB-C Hub, qty=3)
    const { data: before } = await GET(`${BASE}/Products(4)`);
    const originalQty = before.quantity;

    const { status, data } = await POST(`${BASE}/restock`, {
      productId: 4,
      qty: 10,
    });

    expect(status).toBe(200);
    expect(data.quantity).toBe(originalQty + 10);
  });

  test("restock with qty <= 0 returns 400", async () => {
    const { status } = await POST(`${BASE}/restock`, {
      productId: 1,
      qty: -5,
    });
    expect(status).toBe(400);
  });

  test("restock with unknown productId returns 404", async () => {
    const { status } = await POST(`${BASE}/restock`, {
      productId: 9999,
      qty: 5,
    });
    expect(status).toBe(404);
  });

  // ─── Create / validation ──────────────────────────────────────────────

  test("POST /Products with valid data creates a product", async () => {
    const newProduct = {
      ID: 99,
      name: "Test Widget",
      description: "A test product",
      category: "Test",
      price: 9.99,
      quantity: 100,
    };

    const { status, data } = await POST(`${BASE}/Products`, newProduct);
    expect(status).toBe(201);
    expect(data.name).toBe("Test Widget");
  });

  test("POST /Products without name returns 400", async () => {
    const { status } = await POST(`${BASE}/Products`, {
      ID: 100,
      price: 5.0,
      quantity: 1,
    });
    expect(status).toBe(400);
  });
});
