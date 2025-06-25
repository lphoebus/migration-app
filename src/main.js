import "./style.css"
import "@arcgis/core/assets/esri/themes/light/main.css";
import "@esri/calcite-components/dist/calcite/calcite.css";
import { defineCustomElements } from "@esri/calcite-components/dist/loader";
defineCustomElements(window);
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-layer-list";
import "@arcgis/map-components/components/arcgis-legend";
import "@arcgis/map-components/components/arcgis-basemap-gallery";
import "@arcgis/map-components/components/arcgis-bookmarks";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-home";
import "@arcgis/map-components/components/arcgis-feature";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { drawLines } from "./map/drawLines.js";
import { highlightFeature, setupHighlightOnClick } from "./map/highlight.js";
import { handlePolygonClick } from "./map/polygonClick.js";
import { setupFeatureInfoClick } from "./ui/featureInfoPanel.js";
import {updateDropdownForActiveLayer, updateRendererForActiveLayer, watchLayerVisibility } from "./ui/smartMappingDropdown.js";
import { findLayerByTitle, flattenFeatureLayers, getTargetLayers } from "./utils/helpers.js";
import { createInsetViews } from "./map/insets.js";
import { setupSliderControls } from "./ui/slider.js";
import { setupActionBar } from "./ui/actionBar.js";


const mapEl = document.getElementById("mapEl");

// --- Centralized App State ---
const appState = {
  allRelatedFeatures: [],
  minValue: 500,
  highlightHandle: null,
  activeWidget: null,
  actionBarExpanded: false,
  alaskaView: null,
  hawaiiView: null,
  linesLayer: null,
  pointsLayer: null
};

getTargetLayers(mapEl)
setupActionBar(appState, mapEl);

mapEl.addEventListener("arcgisViewReadyChange", async (evt) => {
  // Set popupTemplate for Household Income as early as possible
  const householdLayer = findLayerByTitle(mapEl.map.layers, "Household Income");
  if (householdLayer) await householdLayer.load();

  const individualLayer = findLayerByTitle(mapEl.map.layers, "Individual Income");
  if (individualLayer) await individualLayer.load();

  // Set minimum and maximum zoom levels
  mapEl.view.constraints = { minZoom: 4, maxZoom: 12 };

  mapEl.view.padding = { left: 49 };

  
  document.querySelector("calcite-shell").hidden = false;
  document.querySelector("calcite-loader").hidden = true;

  // Add a graphics layer for the migration lines
  appState.graphicsLayer = new GraphicsLayer({ listMode: "hide" });
  mapEl.map.add(appState.graphicsLayer);

  // Add these after your map is created, before drawing anything:
  appState.linesLayer = new GraphicsLayer({ listMode: "hide" });
  appState.pointsLayer = new GraphicsLayer({ listMode: "hide" });
  mapEl.map.add(appState.linesLayer);
  mapEl.map.add(appState.pointsLayer);

  // --- Slider and Buttons ---
    // --- Slider and Buttons ---
  setupSliderControls(appState, drawLines);

  // --- Create inset views ---
  const { alaskaView, hawaiiView } = createInsetViews(mapEl.map);
  appState.alaskaView = alaskaView;
  appState.hawaiiView = hawaiiView;
  mapEl.view.popupEnabled = false;

  // --- Attach click handlers to all views ---
  setupFeatureInfoClick(mapEl.view, appState, highlightFeature, handlePolygonClick);
  setupFeatureInfoClick(appState.alaskaView, appState, highlightFeature, handlePolygonClick);
  setupFeatureInfoClick(appState.hawaiiView, appState, highlightFeature, handlePolygonClick);


  // --- Dropdown logic for dynamic fields using Calcite Dropdown ---
  const fieldSelect = document.getElementById("field-select");
  const getLayers = () => getTargetLayers(mapEl);

  // Initial population
  updateDropdownForActiveLayer(fieldSelect, getLayers);

  // Listen for dropdown selection changes
  fieldSelect.addEventListener("calciteSelectChange", (event) => {
    updateRendererForActiveLayer(event.target.value, mapEl, getLayers);
  });

  // Watch for layer visibility changes
  watchLayerVisibility(getLayers, updateDropdownForActiveLayer, fieldSelect);

  // Attach to all views
  setupHighlightOnClick(mapEl.view, appState);
  setupHighlightOnClick(appState.alaskaView, appState);
  setupHighlightOnClick(appState.hawaiiView, appState);

  document.getElementById("info-action").addEventListener("click", () => {
    document.getElementById("about-dialog").open = true;
  });
  document.getElementById("about-dialog-close").addEventListener("click", () => {
    document.getElementById("about-dialog").open = false;
  });

});

