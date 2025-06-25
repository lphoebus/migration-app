import MapView from "@arcgis/core/views/MapView";

/**
 * Creates and returns Alaska and Hawaii inset MapViews.
 * @param {__esri.Map} map - The main Esri Map instance.
 * @returns {{ alaskaView: __esri.MapView, hawaiiView: __esri.MapView }}
 */
export function createInsetViews(map) {
  const alaskaView = new MapView({
    container: "alaskaViewDiv",
    map,
    center: [-152.4044, 64.2008],
    zoom: 2,
    ui: { components: [] },
    popupEnabled: false
  });

  const hawaiiView = new MapView({
    container: "hawaiiViewDiv",
    map,
    center: [-157.5828, 20.8968],
    zoom: 4,
    ui: { components: [] },
    popupEnabled: false
  });

  alaskaView.popupEnabled = false;
  hawaiiView.popupEnabled = false;

  return { alaskaView, hawaiiView };
}