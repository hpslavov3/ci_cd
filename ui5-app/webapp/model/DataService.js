sap.ui.define([
  "sap/ui/base/Object"
], function (BaseObject) {
  "use strict";

  var JAVA_BASE  = "/java-api/odata/v4/books";
  var NODE_BASE  = "/node-api/odata/v4/products";

  return BaseObject.extend("ui5app.model.DataService", {

    fetchBooks: function () {
      return fetch(JAVA_BASE + "/Books")
        .then(this._parseJson)
        .then(function (d) { return d.value; });
    },

    fetchBook: function (id) {
      return fetch(JAVA_BASE + "/Books(" + id + ")")
        .then(this._parseJson);
    },

    fetchTotalStock: function () {
      return fetch(JAVA_BASE + "/totalStock()")
        .then(this._parseJson)
        .then(function (d) { return d.value; });
    },

    fetchProducts: function () {
      return fetch(NODE_BASE + "/Products")
        .then(this._parseJson)
        .then(function (d) { return d.value; });
    },

    fetchLowStock: function (threshold) {
      var t = threshold !== undefined ? threshold : 10;
      return fetch(NODE_BASE + "/lowStock(threshold=" + t + ")")
        .then(this._parseJson)
        .then(function (d) { return d.value; });
    },

    restock: function (productId, qty) {
      return fetch(NODE_BASE + "/restock", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ productId: productId, qty: qty })
      }).then(this._parseJson);
    },

    _parseJson: function (response) {
      if (!response.ok) {
        return response.json().then(function (err) {
          throw new Error(
            (err && err.error && err.error.message) || "HTTP " + response.status
          );
        });
      }
      return response.json();
    }
  });
});
