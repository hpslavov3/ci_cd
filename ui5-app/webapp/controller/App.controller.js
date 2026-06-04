sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "ui5app/model/DataService"
], function (Controller, JSONModel, MessageBox, MessageToast, DataService) {
  "use strict";

  return Controller.extend("ui5app.controller.App", {

    // ── Lifecycle ─────────────────────────────────────────────────────────

    onInit: function () {
      // Instantiate DataService directly – avoids timing issues with
      // getOwnerComponent() not being fully initialised when onInit fires.
      this._oDataService = new DataService();

      // View state model
      var oViewModel = new JSONModel({
        booksBusy:     false,
        productsBusy:  false,
        booksCount:    "0",
        productsCount: "0",
        totalStock:    "-",
        lowStockCount: 0,
        statusMessage: "",
        statusType:    "Information"
      });
      this.getView().setModel(oViewModel, "view");

      // Dedicated list models
      this._oBooksModel    = new JSONModel([]);
      this._oProductsModel = new JSONModel([]);
      this.getView().setModel(this._oBooksModel,    "books");
      this.getView().setModel(this._oProductsModel, "products");

      // Bind list aggregations programmatically
      this.byId("booksList").bindItems({
        path:     "books>/",
        template: this._getBookTemplate()
      });
      this.byId("productsList").bindItems({
        path:     "products>/",
        template: this._getProductTemplate()
      });

      // Load data
      this._loadBooks();
      this._loadProducts();
    },

    // ── Event handlers ────────────────────────────────────────────────────

    onTabSelect: function (oEvent) {
      var sKey = oEvent.getParameter("key");
      if (sKey === "books")    { this._loadBooks(); }
      if (sKey === "products") { this._loadProducts(); }
    },

    onRefreshAll: function () {
      this._loadBooks();
      this._loadProducts();
      MessageToast.show("Refreshed data from both services");
    },

    onFilterLowStock: function () {
      this._loadLowStock(10);
    },

    // ── Private helpers ───────────────────────────────────────────────────

    _loadBooks: function () {
      var oVM = this._getViewModel();
      oVM.setProperty("/booksBusy", true);
      oVM.setProperty("/statusMessage", "");

      this._oDataService.fetchBooks()
        .then(function (aBooks) {
          this._oBooksModel.setData(aBooks);
          oVM.setProperty("/booksCount", String(aBooks.length));
          oVM.setProperty("/booksBusy", false);
          return this._oDataService.fetchTotalStock();
        }.bind(this))
        .then(function (iTotal) {
          this._getViewModel().setProperty("/totalStock", iTotal !== undefined ? iTotal : "-");
        }.bind(this))
        .catch(function (oErr) {
          oVM.setProperty("/booksBusy", false);
          oVM.setProperty("/statusMessage",
            "Could not load books: " + oErr.message +
            " – make sure the CAP Java service is running on port 8080.");
          oVM.setProperty("/statusType", "Warning");
        }.bind(this));
    },

    _loadProducts: function () {
      var oVM = this._getViewModel();
      oVM.setProperty("/productsBusy", true);
      oVM.setProperty("/statusMessage", "");

      this._oDataService.fetchProducts()
        .then(function (aProducts) {
          this._oProductsModel.setData(aProducts);
          oVM.setProperty("/productsCount", String(aProducts.length));
          oVM.setProperty("/productsBusy", false);
          var iLow = aProducts.filter(function (p) { return p.quantity < 10; }).length;
          oVM.setProperty("/lowStockCount", iLow);
        }.bind(this))
        .catch(function (oErr) {
          oVM.setProperty("/productsBusy", false);
          oVM.setProperty("/statusMessage",
            "Could not load products: " + oErr.message +
            " – make sure the CAP Node service is running on port 4004.");
          oVM.setProperty("/statusType", "Warning");
        }.bind(this));
    },

    _loadLowStock: function (iThreshold) {
      var oVM = this._getViewModel();
      oVM.setProperty("/productsBusy", true);

      this._oDataService.fetchLowStock(iThreshold)
        .then(function (aLow) {
          this._oProductsModel.setData(aLow);
          oVM.setProperty("/productsCount", String(aLow.length));
          oVM.setProperty("/productsBusy", false);
          MessageToast.show("Showing " + aLow.length + " product(s) with stock < " + iThreshold);
        }.bind(this))
        .catch(function (oErr) {
          oVM.setProperty("/productsBusy", false);
          MessageBox.error("Failed to load low-stock products: " + oErr.message);
        }.bind(this));
    },

    _getViewModel: function () {
      return this.getView().getModel("view");
    },

    // ── List item templates ───────────────────────────────────────────────

    _getBookTemplate: function () {
      var oItem = new sap.m.ObjectListItem({
        title:       "{books>title}",
        number:      "{books>price}",
        numberUnit:  "USD",
        numberState: "Success"
      });
      oItem.addAttribute(new sap.m.ObjectAttribute({ title: "Author", text: "{books>author}" }));
      oItem.addAttribute(new sap.m.ObjectAttribute({ title: "Stock",  text: "{books>stock} units" }));
      return oItem;
    },

    _getProductTemplate: function () {
      var oItem = new sap.m.ObjectListItem({
        title:      "{products>name}",
        number:     "{products>price}",
        numberUnit: "USD"
      });
      oItem.addAttribute(new sap.m.ObjectAttribute({ title: "Category",    text: "{products>category}" }));
      oItem.addAttribute(new sap.m.ObjectAttribute({ title: "Quantity",    text: "{products>quantity} units" }));
      oItem.addAttribute(new sap.m.ObjectAttribute({ title: "Description", text: "{products>description}" }));
      return oItem;
    }

  });
});
