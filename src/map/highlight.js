export function highlightFeature(feature, view, appState) {
  // Remove previous highlight
  if (appState.highlightHandle) {
    appState.highlightHandle.remove();
    appState.highlightHandle = null;
  }

  // Set highlight options based on geometry type
  if (feature.geometry.type === "polygon") {
    view.highlightOptions = {
      color: [255, 255, 0, 1],
      fillOpacity: 0.2,
      haloOpacity: 0.8
    };
  } else if (feature.geometry.type === "polyline") {
    view.highlightOptions = {
      color: [0, 255, 255, 1],
      haloOpacity: 0.8
    };
  } else if (feature.geometry.type === "point") {
    view.highlightOptions = {
      color: [255, 0, 255, 1],
      haloOpacity: 0.8
    };
  }

  // Highlight logic for FeatureLayer vs GraphicsLayer
  let layerToHighlight = null;
  if (feature.layer && feature.layer.type === "feature") {
    layerToHighlight = feature.layer;
  } else if (feature.layer && feature.layer.type === "graphics") {
    // For custom graphics, determine which layer to use
    if (feature.geometry.type === "polyline") {
      layerToHighlight = appState.linesLayer;
    } else if (feature.geometry.type === "point") {
      layerToHighlight = appState.pointsLayer;
    }
  }

  if (layerToHighlight) {
    view.whenLayerView(layerToHighlight).then(layerView => {
      appState.highlightHandle = layerView.highlight(feature);
    });
  }
}

export function setupHighlightOnClick(view, appState) {
  view.on("click", async (event) => {
    const hit = await view.hitTest(event);
    const result = hit.results.find(r =>
      r.graphic &&
      (
        r.graphic.layer?.type === "feature" ||
        r.graphic.layer === appState.linesLayer ||
        r.graphic.layer === appState.pointsLayer
      )
    );
    if (result && result.graphic) {
      highlightFeature(result.graphic, view, appState);
    } else {
      if (appState.highlightHandle) {
        appState.highlightHandle.remove();
        appState.highlightHandle = null;
      }
    }
  });
}