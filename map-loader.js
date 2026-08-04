(function () {
  "use strict";

  AFRAME.registerComponent("quest-map-model", {
    schema: {
      fallback: { type: "selector" },
      name: { default: "Map" }
    },

    init: function () {
      this.handleLoaded = this.handleLoaded.bind(this);
      this.handleError = this.handleError.bind(this);

      // The lightweight fallback remains visible until the GLB has fully loaded.
      this.el.setAttribute("visible", false);
      if (this.data.fallback) {
        this.data.fallback.setAttribute("visible", true);
      }

      this.el.addEventListener("model-loaded", this.handleLoaded);
      this.el.addEventListener("model-error", this.handleError);
    },

    remove: function () {
      this.el.removeEventListener("model-loaded", this.handleLoaded);
      this.el.removeEventListener("model-error", this.handleError);
    },

    handleLoaded: function () {
      this.el.setAttribute("visible", true);
      this.el.dataset.modelState = "loaded";

      if (this.data.fallback) {
        this.data.fallback.setAttribute("visible", false);
      }

      console.info("[WEIRD VR] Loaded map model:", this.data.name);
    },

    handleError: function (event) {
      this.el.setAttribute("visible", false);
      this.el.dataset.modelState = "error";

      if (this.data.fallback) {
        this.data.fallback.setAttribute("visible", true);
      }

      console.error("[WEIRD VR] Failed to load map model:", this.data.name, event.detail || event);
    }
  });
}());
