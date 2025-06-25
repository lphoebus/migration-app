/**
 * Sets up slider and button controls for migration lines.
 * @param {object} appState - Centralized app state object.
 * @param {function} drawLines - Function to draw migration lines.
 */
export function setupSliderControls(appState, drawLines) {
  const sliderLeft = document.getElementById("slider-left");
  if (sliderLeft) {
    sliderLeft.addEventListener("calciteSliderInput", (event) => {
      appState.minValue = event.target.valueAsNumber || event.target.value;
      if (appState.allRelatedFeatures.length > 0) {
        drawLines(appState.allRelatedFeatures, appState.minValue, appState);
      }
    });
  }

  const drawLinesBtn = document.getElementById("draw-lines-btn");
  if (drawLinesBtn) {
    drawLinesBtn.addEventListener("click", () => {
      if (appState.allRelatedFeatures.length > 0) {
        drawLines(appState.allRelatedFeatures, appState.minValue, appState);
      }
    });
  }

  const clearLinesBtn = document.getElementById("clear-lines-btn");
  if (clearLinesBtn) {
    clearLinesBtn.addEventListener("click", () => {
      appState.linesLayer.removeAll();
      appState.pointsLayer.removeAll();
    });
  }
}