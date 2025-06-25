import * as colorSchemes from "@arcgis/core/smartMapping/symbology/color.js";
import * as colorRendererCreator from "@arcgis/core/smartMapping/renderers/color";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";

// --- Smart mapping options config ---
export const smartMappingOptionsByLayer = {
  "Household Income": [
    {
      label: "Change in Household Income between 1978 and 1992 (1st Percentile)",
      expression: "$feature.change_kfi_pooled_pooled_p1"
    },
    {
      label: "Change in Household Income between 1978 and 1992 (25st Percentile)",
      expression: "$feature.change_kfi_pooled_pooled_p25"
    },
    {
      label: "Change in Household Income between 1978 and 1992 (50st Percentile)",
      expression: "$feature.change_kfi_pooled_pooled_p50"
    },
    {
      label: "Change in Household Income between 1978 and 1992 (75st Percentile)",
      expression: "$feature.change_kfi_pooled_pooled_p75"
    },
    {
      label: "Change in Household Income between 1978 and 1992 (100st Percentile)",
      expression: "$feature.change_kfi_pooled_pooled_p100"
    }
  ],
  "Individual Income": [
    {
      label: "Change in Individual Income between 1978 and 1992 (1st Percentile)",
      expression: "$feature.change_kii_pooled_pooled_p1"
    },
    {
      label: "Change in Individual Income between 1978 and 1992 (25th Percentile)",
      expression: "$feature.change_kii_pooled_pooled_p25"
    },
    {
      label: "Change in Individual Income between 1978 and 1992 (50th Percentile)",
      expression: "$feature.change_kii_pooled_pooled_p50"
    },
    {
      label: "Change in Individual Income between 1978 and 1992 (75th Percentile)",
      expression: "$feature.change_kii_pooled_pooled_p75"
    },
    {
      label: "Change in Individual Income between 1978 and 1992 (100th Percentile)",
      expression: "$feature.change_kii_pooled_pooled_p100"
    }
  ]
};

// --- Helper functions ---
export function getActiveLayer(getTargetLayers) {
  const layers = getTargetLayers();
  return layers.find(layer => layer.visible);
}

export function getSmartMappingOptionsForActiveLayer(getTargetLayers) {
  const activeLayer = getActiveLayer(getTargetLayers);
  if (!activeLayer) return [];
  return smartMappingOptionsByLayer[activeLayer.title] || [];
}

// --- Dropdown logic ---
export function updateDropdownForActiveLayer(fieldSelect, getTargetLayers, updateFeatureInfoTitle) {
  fieldSelect.innerHTML = "";
  const placeholder = document.createElement("calcite-option");
  placeholder.value = "";
  placeholder.textContent = "Select a field to visualize";
  placeholder.disabled = true;
  placeholder.selected = true;
  fieldSelect.appendChild(placeholder);

  const options = getSmartMappingOptionsForActiveLayer(getTargetLayers);
  options.forEach((opt, idx) => {
    const option = document.createElement("calcite-option");
    option.value = idx;
    option.textContent = opt.label;
    fieldSelect.appendChild(option);
  });

  if (options.length > 0) {
    fieldSelect.selectedIndex = 1;
    // Optionally: updateFeatureInfoTitle();
  } else {
    fieldSelect.selectedIndex = 0;
    if (updateFeatureInfoTitle) updateFeatureInfoTitle();
  }
}

export async function updateRendererForActiveLayer(selectedIdx, mapEl, getTargetLayers) {
  const activeLayer = getActiveLayer(getTargetLayers);
  if (!activeLayer) return;
  const view = mapEl.view;

  const options = getSmartMappingOptionsForActiveLayer(getTargetLayers);
  const option = options[selectedIdx];
  if (!option) return;

  // Arcade expression for the renderer
  const arcadeExpression = option.expression;

  let colorRampName;
  if (activeLayer.title === "Household Income") {
    colorRampName = "Green and Blue 3";
  } else if (activeLayer.title === "Individual Income") {
    colorRampName = "Red and Green 6";
  }

  let colorScheme = colorSchemes.getSchemeByName({
    basemap: view.map.basemap,
    geometryType: "polygon",
    theme: "above-and-below",
    name: colorRampName
  });

  const minValue = -5000;
  const maxValue = 5000;

  const params = {
    layer: activeLayer,
    view: view,
    valueExpression: arcadeExpression,
    valueExpressionTitle: option.label,
    colorScheme: colorScheme,
    theme: "above-and-below",
    outlineOptimizationEnabled: true,
    statistics: {
      min: minValue,
      max: maxValue
    }
  };

  try {
    const response = await colorRendererCreator.createContinuousRenderer(params);
    const renderer = response.renderer;

    // Force white outline for all color stops
    const outlineColor = [255, 255, 255, 0.25];
    const outlineWidth = 0.2;

    function setOutline(symbol) {
      if (symbol && symbol.outline) {
        symbol.outline.color = outlineColor;
        symbol.outline.width = outlineWidth;
      }
    }

    if (renderer.symbol) setOutline(renderer.symbol);

    if (renderer.classBreakInfos) {
      renderer.classBreakInfos.forEach(info => setOutline(info.symbol));
    }

    if (renderer.uniqueValueInfos) {
      renderer.uniqueValueInfos.forEach(info => setOutline(info.symbol));
    }

    if (renderer.visualVariables) {
      renderer.visualVariables.forEach(vv => {
        if (vv.stops) {
          vv.stops.forEach(stop => {
            if (stop.symbol) setOutline(stop.symbol);
          });
        }
      });
    }

    renderer.defaultSymbol = {
      type: "simple-fill",
      color: [200, 200, 200, 1],
      outline: {
        color: outlineColor,
        width: outlineWidth
      }
    };
    renderer.defaultLabel = "No Data";
    activeLayer.renderer = renderer;

    activeLayer.featureEffect = {
      filter: {
        where: `${selectedIdx} IS NOT NULL`
      },
      includedEffect: "drop-shadow(0px, 2px, 8px, #333)",
      excludedEffect: "grayscale(100%) opacity(30%)"
    };
  } catch (err) {
    console.error("Failed to create smartMapping renderer:", err);
  }
}

// --- Watch for layer visibility changes ---
export function watchLayerVisibility(getTargetLayers, updateDropdownForActiveLayer, fieldSelect, updateFeatureInfoTitle) {
  getTargetLayers().forEach(layer => {
    reactiveUtils.watch(
      () => layer.visible,
      () => {
        updateDropdownForActiveLayer(fieldSelect, getTargetLayers, updateFeatureInfoTitle);
      }
    );
  });
}
