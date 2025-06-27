import Graphic from "@arcgis/core/Graphic";

/**
 * Draws migration lines and stayer points on the map.
 * @param {Array} features - Array of feature objects.
 * @param {number} minValue - Minimum value for filtering.
 * @param {Object} appState - Centralized app state (must have linesLayer, pointsLayer).
 */

export function drawLines(features, minValue, appState) {
  appState.linesLayer.removeAll();
  appState.pointsLayer.removeAll();

  // Get min and max n for normalization
  const nValues = features.filter(f => f.attributes.n >= minValue).map(f => f.attributes.n);
  const minN = Math.min(...nValues);
  const maxN = Math.max(...nValues);

  const lineGraphics = [];
  const pointGraphics = [];

  features.forEach((feature) => {
    // For migration lines, only use n
    if (feature.attributes.o_cz !== feature.attributes.d_cz) {
      const n = feature.attributes.n;
      if (n >= minValue && n > 0) {
        const totalOut = features
          .filter(f => f.attributes.o_cz === feature.attributes.o_cz)
          .reduce((sum, f) => sum + (f.attributes.n || 0), 0);

        const percent = totalOut > 0 ? (n / totalOut) * 100 : 0;

        // Normalize n to a width and color
        const width = Math.min(12, Math.max(1, Math.log10(n) - 1));
        let t = (n - minN) / (maxN - minN);
        if (!isFinite(t)) t = 0;
        const color = [
          Math.round(51 + (0 - 173) * t),
          Math.round(102 + (51 - 216) * t),
          Math.round(204 + (153 - 230) * t),
          0.85
        ];
        const line = {
          type: "polyline",
          paths: [
            [feature.attributes.o_x_coord, feature.attributes.o_y_coord],
            [feature.attributes.d_x_coord, feature.attributes.d_y_coord]
          ],
          spatialReference: { wkid: 4326 }
        };
        // Find the "stayer" feature for the origin
        const stayerFeature = features.find(f =>
          f.attributes.o_cz === feature.attributes.o_cz &&
          f.attributes.d_cz === feature.attributes.o_cz
        );
        const stayerPercent = stayerFeature ? stayerFeature.attributes.pr_d_o : null;

        const graphic = new Graphic({
          geometry: line,
          symbol: {
            type: "simple-line",
            color: color,
            width: width
          },
          attributes: {
            ...feature.attributes,
            o_cz: feature.attributes.o_cz,
            d_cz: feature.attributes.d_cz
          },
          popupTemplate: {
            title: "{o_cz_name}, {o_state_name} → {d_cz_name}, {d_state_name}",
            content: `<br/>Of the individuals that moved between childhood (measured by location at age 16) and young adulthood (location at age 26), <b>${n.toLocaleString()}</b> people moved from <b>{o_cz_name}</b> to <b>{d_cz_name}</b>.
              This represents <b>${percent.toFixed(1)}%</b> of young adults that left <b>{o_cz_name}</b>.
              <b>${stayerPercent !== null ? (stayerPercent * 100).toFixed(1) : "?"}%</b> of young adults stayed in the <b>{o_cz_name}</b> commuting zone.<br/>`
          }
        });
        lineGraphics.push(graphic);
      }
    } else {
      // For stayers, use n, or fallback to n_tot_o/n_tot_d
      let n = feature.attributes.n;
      if (!n || n === 0) {
        n = feature.attributes.n_tot_o || feature.attributes.n_tot_d || 0;
      }
      if (n >= minValue && n > 0) {
        const width = Math.min(12, Math.max(1, Math.log10(n) - 1));
        let pr_d_o = feature.attributes.pr_d_o;

        // If you want to match the line's value:
        if (feature.attributes.o_cz === feature.attributes.d_cz) {
          // Find the matching line feature (if it exists)
          const matchingLine = features.find(f =>
            f.attributes.o_cz === feature.attributes.o_cz &&
            f.attributes.d_cz === feature.attributes.d_cz &&
            f !== feature // not the same object
          );
          if (matchingLine) {
            pr_d_o = matchingLine.attributes.pr_d_o;
          }
        }

        const point = {
          type: "point",
          x: feature.attributes.o_x_coord,
          y: feature.attributes.o_y_coord,
          spatialReference: { wkid: 4326 }
        };
        const graphic = new Graphic({
          geometry: point,
          symbol: {
            type: "simple-marker",
            color: [0, 153, 51, 0.7],
            size: Math.max(8, width * 2),
            outline: {
              color: [255, 255, 255, 0.8],
              width: 1.5
            }
          },
          attributes: {
            ...feature.attributes,
            o_cz: feature.attributes.o_cz,
            d_cz: feature.attributes.d_cz
          },
          popupTemplate: {
            title: "{o_cz_name}, {o_state_name}",
            content: `<br/>Of the individuals that moved between childhood (measured by location at age 16) and young adulthood (location at age 26), <b>${(pr_d_o * 100).toFixed(1)}%</b> (${n.toLocaleString()}) of young adults stayed in the <b>{o_cz_name} Commuting Zone.</b>`,
          }
        });
        pointGraphics.push(graphic);
      }
    }
  });
  // add all graphics at the same time
  appState.linesLayer.addMany(lineGraphics);
  appState.pointsLayer.addMany(pointGraphics);
  return lineGraphics.length;
}