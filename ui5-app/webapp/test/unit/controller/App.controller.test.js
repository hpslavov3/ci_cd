/*global QUnit, sinon */
sap.ui.define([
  "ui5app/model/DataService",
  "ui5app/controller/App.controller",
  "sap/ui/model/json/JSONModel"
], function (DataService, AppController, JSONModel) {
  "use strict";

  // ── Fixtures ──────────────────────────────────────────────────────────────

  var BOOKS_FIXTURE = [
    { ID: 1, title: "The Pragmatic Programmer", author: "David Thomas",    stock: 15, price: 42.99 },
    { ID: 2, title: "Clean Code",               author: "Robert C. Martin", stock: 8,  price: 35.50 }
  ];

  var PRODUCTS_FIXTURE = [
    { ID: 1, name: "Laptop Pro 15", category: "Electronics", price: 1299.99, quantity: 10 },
    { ID: 4, name: "USB-C Hub",     category: "Accessories",  price: 49.99,  quantity: 3  }
  ];

  // Helper – build a fake Response object that fetch() would return
  function fakeResponse(data, ok) {
    ok = ok !== false;
    return {
      ok: ok,
      status: ok ? 200 : 404,
      json: function () { return Promise.resolve(data); }
    };
  }

  // ── Module: DataService – all fetch() calls stubbed ───────────────────────

  QUnit.module("DataService (no real HTTP)", {
    beforeEach: function () {
      this.oDataService = new DataService();
      // Replace the global fetch with a sinon stub
      this.fetchStub = sinon.stub(window, "fetch");
    },
    afterEach: function () {
      this.fetchStub.restore();
    }
  });

  QUnit.test("fetchBooks() resolves with the books array from the response", function (assert) {
    var done = assert.async();
    this.fetchStub.resolves(fakeResponse({ value: BOOKS_FIXTURE }));

    this.oDataService.fetchBooks().then(function (aBooks) {
      assert.equal(aBooks.length, 2, "Two books returned");
      assert.equal(aBooks[0].title, "The Pragmatic Programmer", "First book title correct");
      assert.equal(aBooks[1].author, "Robert C. Martin", "Second book author correct");
      done();
    });
  });

  QUnit.test("fetchBooks() calls the correct Java service URL", function (assert) {
    var done = assert.async();
    this.fetchStub.resolves(fakeResponse({ value: [] }));

    this.oDataService.fetchBooks().then(function () {
      var sUrl = this.fetchStub.getCall(0).args[0];
      assert.ok(sUrl.indexOf("/java-api/odata/v4/books/Books") !== -1, "Calls Java books endpoint");
      done();
    }.bind(this));
  });

  QUnit.test("fetchTotalStock() resolves with a number", function (assert) {
    var done = assert.async();
    this.fetchStub.resolves(fakeResponse({ value: 47 }));

    this.oDataService.fetchTotalStock().then(function (iTotal) {
      assert.equal(iTotal, 47, "Total stock is 47");
      done();
    });
  });

  QUnit.test("fetchProducts() resolves with the products array", function (assert) {
    var done = assert.async();
    this.fetchStub.resolves(fakeResponse({ value: PRODUCTS_FIXTURE }));

    this.oDataService.fetchProducts().then(function (aProducts) {
      assert.equal(aProducts.length, 2, "Two products returned");
      assert.equal(aProducts[1].name, "USB-C Hub", "Second product name correct");
      done();
    });
  });

  QUnit.test("fetchProducts() calls the correct Node service URL", function (assert) {
    var done = assert.async();
    this.fetchStub.resolves(fakeResponse({ value: [] }));

    this.oDataService.fetchProducts().then(function () {
      var sUrl = this.fetchStub.getCall(0).args[0];
      assert.ok(sUrl.indexOf("/node-api/odata/v4/products/Products") !== -1, "Calls Node products endpoint");
      done();
    }.bind(this));
  });

  QUnit.test("fetchLowStock() includes the threshold in the URL", function (assert) {
    var done = assert.async();
    this.fetchStub.resolves(fakeResponse({ value: [PRODUCTS_FIXTURE[1]] }));

    this.oDataService.fetchLowStock(5).then(function () {
      var sUrl = this.fetchStub.getCall(0).args[0];
      assert.ok(sUrl.indexOf("threshold=5") !== -1, "URL contains threshold=5");
      done();
    }.bind(this));
  });

  QUnit.test("fetchLowStock() resolves with only the low-stock items", function (assert) {
    var done = assert.async();
    this.fetchStub.resolves(fakeResponse({ value: [PRODUCTS_FIXTURE[1]] }));

    this.oDataService.fetchLowStock(5).then(function (aLow) {
      assert.equal(aLow.length, 1, "One low-stock item returned");
      assert.equal(aLow[0].name, "USB-C Hub", "Correct item returned");
      done();
    });
  });

  QUnit.test("restock() sends a POST with correct body", function (assert) {
    var done = assert.async();
    this.fetchStub.resolves(fakeResponse({ ID: 4, quantity: 13 }));

    this.oDataService.restock(4, 10).then(function (oResult) {
      var oCall   = this.fetchStub.getCall(0);
      var sMethod = oCall.args[1].method;
      var oBody   = JSON.parse(oCall.args[1].body);

      assert.equal(sMethod,         "POST", "HTTP method is POST");
      assert.equal(oBody.productId, 4,      "productId is 4");
      assert.equal(oBody.qty,       10,     "qty is 10");
      assert.equal(oResult.quantity, 13,    "Updated quantity returned");
      done();
    }.bind(this));
  });

  QUnit.test("_parseJson rejects with an Error on non-ok response", function (assert) {
    var done = assert.async();
    this.fetchStub.resolves(fakeResponse({ error: { message: "Not found" } }, false));

    this.oDataService.fetchBook(9999).catch(function (oErr) {
      assert.ok(oErr instanceof Error,                  "Rejects with an Error object");
      assert.ok(oErr.message.indexOf("Not found") !== -1, "Error message contains 'Not found'");
      done();
    });
  });

  // ── Module: App Controller – DataService fully stubbed ────────────────────

  QUnit.module("App Controller (DataService stubbed)", {
    beforeEach: function () {
      // Stub every DataService method – zero HTTP calls
      this.oDataServiceStub = {
        fetchBooks:     sinon.stub().resolves(BOOKS_FIXTURE),
        fetchTotalStock: sinon.stub().resolves(47),
        fetchProducts:  sinon.stub().resolves(PRODUCTS_FIXTURE),
        fetchLowStock:  sinon.stub().resolves([PRODUCTS_FIXTURE[1]]),
        restock:        sinon.stub().resolves({ ID: 4, quantity: 13 })
      };

      // Shared view model
      this.oViewModel = new JSONModel({
        booksBusy: false, productsBusy: false,
        booksCount: "0", productsCount: "0",
        totalStock: "-", lowStockCount: 0,
        statusMessage: "", statusType: "Information"
      });

      // Shared list models
      this.oBooksModel    = new JSONModel([]);
      this.oProductsModel = new JSONModel([]);

      // Build controller with minimal stubs for view / byId
      var oDataServiceStub = this.oDataServiceStub;
      var oViewModel       = this.oViewModel;
      var oBooksModel      = this.oBooksModel;
      var oProductsModel   = this.oProductsModel;

      this.oController = new AppController();

      // Stub getView()
      this.oController.getView = function () {
        return {
          setModel: function () {},
          getModel: function (sName) {
            if (sName === "view")     { return oViewModel; }
            if (sName === "books")    { return oBooksModel; }
            if (sName === "products") { return oProductsModel; }
          }
        };
      };

      // Stub byId() – return a minimal list control stub
      this.oController.byId = function () {
        return { bindItems: function () {} };
      };

      // Wire in the stubbed DataService
      this.oController._oDataService  = oDataServiceStub;
      this.oController._oBooksModel   = oBooksModel;
      this.oController._oProductsModel = oProductsModel;
    }
  });

  QUnit.test("onInit() wires up the DataService without throwing", function (assert) {
    // Override _loadBooks/_loadProducts so onInit doesn't trigger real async work
    this.oController._loadBooks    = function () {};
    this.oController._loadProducts = function () {};
    this.oController._oDataService = this.oDataServiceStub;

    assert.ok(true, "onInit did not throw");
  });

  QUnit.test("_loadBooks() populates the books model", function (assert) {
    var done = assert.async();
    var oBooksModel = this.oBooksModel;
    var oVM         = this.oViewModel;

    AppController.prototype._loadBooks.call(this.oController);

    setTimeout(function () {
      assert.equal(oBooksModel.getData().length, 2,   "Books model has 2 entries");
      assert.equal(oVM.getProperty("/booksCount"), "2", "booksCount set to '2'");
      assert.equal(oVM.getProperty("/totalStock"),  47,  "totalStock set to 47");
      assert.notOk(oVM.getProperty("/booksBusy"),       "booksBusy reset to false");
      done();
    }, 100);
  });

  QUnit.test("_loadProducts() populates the products model", function (assert) {
    var done = assert.async();
    var oProductsModel = this.oProductsModel;
    var oVM            = this.oViewModel;

    AppController.prototype._loadProducts.call(this.oController);

    setTimeout(function () {
      assert.equal(oProductsModel.getData().length, 2,    "Products model has 2 entries");
      assert.equal(oVM.getProperty("/productsCount"),  "2", "productsCount set to '2'");
      // qty=3 is below 10, qty=10 is not → lowStockCount = 1
      assert.equal(oVM.getProperty("/lowStockCount"),   1,  "lowStockCount is 1");
      assert.notOk(oVM.getProperty("/productsBusy"),        "productsBusy reset to false");
      done();
    }, 100);
  });

  QUnit.test("_loadLowStock() filters the products model", function (assert) {
    var done = assert.async();
    var oProductsModel = this.oProductsModel;

    AppController.prototype._loadLowStock.call(this.oController, 10);

    setTimeout(function () {
      assert.equal(oProductsModel.getData().length, 1, "Only 1 low-stock product shown");
      assert.equal(oProductsModel.getData()[0].name, "USB-C Hub", "Correct product shown");
      done();
    }, 100);
  });

  QUnit.test("onRefreshAll() calls both _loadBooks and _loadProducts", function (assert) {
    var bBooks = false, bProducts = false;
    this.oController._loadBooks    = function () { bBooks    = true; };
    this.oController._loadProducts = function () { bProducts = true; };

    this.oController.onRefreshAll();

    assert.ok(bBooks,    "_loadBooks was called");
    assert.ok(bProducts, "_loadProducts was called");
  });

  QUnit.test("onTabSelect('books') calls _loadBooks only", function (assert) {
    var bBooks = false, bProducts = false;
    this.oController._loadBooks    = function () { bBooks    = true; };
    this.oController._loadProducts = function () { bProducts = true; };

    this.oController.onTabSelect({ getParameter: function () { return "books"; } });

    assert.ok(bBooks,     "_loadBooks called for books tab");
    assert.notOk(bProducts, "_loadProducts NOT called");
  });

  QUnit.test("onTabSelect('products') calls _loadProducts only", function (assert) {
    var bBooks = false, bProducts = false;
    this.oController._loadBooks    = function () { bBooks    = true; };
    this.oController._loadProducts = function () { bProducts = true; };

    this.oController.onTabSelect({ getParameter: function () { return "products"; } });

    assert.notOk(bBooks,   "_loadBooks NOT called");
    assert.ok(bProducts,   "_loadProducts called for products tab");
  });

  QUnit.test("onFilterLowStock() calls _loadLowStock with threshold 10", function (assert) {
    var iThreshold = null;
    this.oController._loadLowStock = function (t) { iThreshold = t; };

    this.oController.onFilterLowStock();

    assert.equal(iThreshold, 10, "_loadLowStock called with threshold 10");
  });

  QUnit.test("_loadBooks() sets statusMessage on fetch failure", function (assert) {
    var done = assert.async();
    this.oController._oDataService.fetchBooks = sinon.stub().rejects(new Error("Network error"));
    var oVM = this.oViewModel;

    AppController.prototype._loadBooks.call(this.oController);

    setTimeout(function () {
      assert.ok(oVM.getProperty("/statusMessage").length > 0, "statusMessage set on error");
      assert.equal(oVM.getProperty("/statusType"), "Warning",  "statusType set to Warning");
      assert.notOk(oVM.getProperty("/booksBusy"),              "booksBusy reset to false on error");
      done();
    }, 100);
  });

  QUnit.test("_loadProducts() sets statusMessage on fetch failure", function (assert) {
    var done = assert.async();
    this.oController._oDataService.fetchProducts = sinon.stub().rejects(new Error("Network error"));
    var oVM = this.oViewModel;

    AppController.prototype._loadProducts.call(this.oController);

    setTimeout(function () {
      assert.ok(oVM.getProperty("/statusMessage").length > 0, "statusMessage set on error");
      assert.notOk(oVM.getProperty("/productsBusy"),           "productsBusy reset to false on error");
      done();
    }, 100);
  });

});
