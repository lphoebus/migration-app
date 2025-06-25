export function findLayerByTitle(layers, title) {
  for (const layer of layers.items || layers) {
    if (layer.title === title) return layer;
    if (layer.type === "group" && layer.layers) {
      const found = findLayerByTitle(layer.layers, title);
      if (found) return found;
    }
  }
  return null;
}

export function flattenFeatureLayers(layers) {
  let result = [];
  for (const layer of layers.items || layers) {
    if (layer.type === "group" && layer.layers) {
      result = result.concat(flattenFeatureLayers(layer.layers));
    } else if (layer.type === "feature") {
      result.push(layer);
    }
  }
  return result;
}

export function getTargetLayers(mapEl) {
  const allLayerTitles = ["Household Income", "Individual Income"];
  const allFeatureLayers = flattenFeatureLayers(mapEl.map.layers);
  return allFeatureLayers.filter(lyr => allLayerTitles.includes(lyr.title));
}