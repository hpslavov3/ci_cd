sap.ui.define([
  "sap/ui/test/Opa5",
  "sap/ui/test/opaQunit",
  "sap/ui/test/actions/Press",
  "sap/ui/test/matchers/PropertyStrictEquals",
  "sap/ui/test/matchers/AggregationLengthEquals"
], function (Opa5, opaTest, Press, PropertyStrictEquals, AggregationLengthEquals) {
  "use strict";

  // ─── OPA5 Page Objects ───────────────────────────────────────────────────

  var oConfig = {
    appParams:      { serverDelay: 0 },
    viewNamespace:  "ui5app.view."
  };

  // Page Object: Main Page
  var MainPage = {

    iStartTheApp: function () {
      return this.iStartMyUIComponent({
        componentConfig: {
          name: "ui5app",
          async: true
        }
      });
    },

    iShouldSeeThePage: function () {
      return this.waitFor({
        id: "mainPage",
        viewName: "App",
        success: function (oPage) {
          Opa5.assert.ok(oPage, "The main page is visible");
        },
        errorMessage: "Main page not found"
      });
    },

    iShouldSeeTheIconTabBar: function () {
      return this.waitFor({
        id: "mainTabBar",
        viewName: "App",
        success: function (oTabBar) {
          Opa5.assert.ok(oTabBar, "IconTabBar is visible");
          Opa5.assert.equal(
            oTabBar.getItems().length, 2,
            "IconTabBar has 2 tabs (Books + Products)"
          );
        },
        errorMessage: "IconTabBar not found"
      });
    },

    iPressTheProductsTab: function () {
      return this.waitFor({
        id: "productsTab",
        viewName: "App",
        actions: new Press(),
        success: function () {
          Opa5.assert.ok(true, "Products tab pressed");
        },
        errorMessage: "Products tab not pressable"
      });
    },

    iPressTheBooksTab: function () {
      return this.waitFor({
        id: "booksTab",
        viewName: "App",
        actions: new Press(),
        success: function () {
          Opa5.assert.ok(true, "Books tab pressed");
        },
        errorMessage: "Books tab not pressable"
      });
    },

    iPressRefreshAll: function () {
      return this.waitFor({
        controlType: "sap.m.Button",
        viewName: "App",
        matchers: new PropertyStrictEquals({ name: "text", value: "Refresh All" }),
        actions: new Press(),
        success: function () {
          Opa5.assert.ok(true, "Refresh All button pressed");
        },
        errorMessage: "Refresh All button not found"
      });
    },

    iPressFilterLowStock: function () {
      return this.waitFor({
        controlType: "sap.m.Button",
        viewName: "App",
        matchers: new PropertyStrictEquals({ name: "text", value: "Show Low Stock (<10)" }),
        actions: new Press(),
        success: function () {
          Opa5.assert.ok(true, "Low stock filter button pressed");
        },
        errorMessage: "Low stock filter button not found"
      });
    },

    iTeardownMyApp: function () {
      return this.iTeardownMyUIComponent();
    }
  };

  // Register page objects
  Opa5.createPageObjects({
    onTheMainPage: {
      actions: {
        iStartTheApp:          MainPage.iStartTheApp,
        iPressTheProductsTab:  MainPage.iPressTheProductsTab,
        iPressTheBooksTab:     MainPage.iPressTheBooksTab,
        iPressRefreshAll:      MainPage.iPressRefreshAll,
        iPressFilterLowStock:  MainPage.iPressFilterLowStock,
        iTeardownMyApp:        MainPage.iTeardownMyApp
      },
      assertions: {
        iShouldSeeThePage:       MainPage.iShouldSeeThePage,
        iShouldSeeTheIconTabBar: MainPage.iShouldSeeTheIconTabBar
      }
    }
  });

  // ─── OPA5 Journey ────────────────────────────────────────────────────────

  QUnit.module("App Journey – Navigation");

  opaTest("The app loads and shows the main page", function (Given, When, Then) {
    Given.onTheMainPage.iStartTheApp();
    Then.onTheMainPage.iShouldSeeThePage();
    Then.onTheMainPage.iShouldSeeTheIconTabBar();
  });

  opaTest("Switching to Products tab works", function (Given, When, Then) {
    When.onTheMainPage.iPressTheProductsTab();
    Then.onTheMainPage.iShouldSeeThePage(); // page still visible
  });

  opaTest("Switching back to Books tab works", function (Given, When, Then) {
    When.onTheMainPage.iPressTheBooksTab();
    Then.onTheMainPage.iShouldSeeThePage();
  });

  opaTest("Refresh All button is pressable", function (Given, When, Then) {
    When.onTheMainPage.iPressRefreshAll();
    Then.onTheMainPage.iShouldSeeThePage();

    // Tear down after last test
    Then.onTheMainPage.iTeardownMyApp();
  });
});
