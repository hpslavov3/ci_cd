sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/Device",
  "ui5app/model/DataService"
], function (UIComponent, Device, DataService) {
  "use strict";

  return UIComponent.extend("ui5app.Component", {

    metadata: {
      manifest: "json"
    },

    init: function () {
      // Call parent init first (sets up models from manifest)
      UIComponent.prototype.init.apply(this, arguments);

      // Initialize router
      this.getRouter().initialize();

      // Expose DataService on component for controller access
      this._dataService = new DataService();
    },

    getDataService: function () {
      return this._dataService;
    },

    getContentDensityClass: function () {
      return Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact";
    }

  });
});
