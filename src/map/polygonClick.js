import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { drawLines } from "./drawLines.js";

/**
 * Handles clicking on a polygon feature, queries migration data, and updates app state.
 * @param {Graphic} polygonGraphic - The clicked polygon graphic.
 * @param {Object} appState - The centralized app state.
 */
export async function handlePolygonClick(polygonGraphic, appState) {
  let cz_id = polygonGraphic.attributes.cz_id;

  if (!cz_id && polygonGraphic.attributes.OBJECTID) {
    const layer = polygonGraphic.layer;
    const query = layer.createQuery();
    query.objectIds = [polygonGraphic.attributes.OBJECTID];
    query.outFields = ["*"];
    const result = await layer.queryFeatures(query);
    if (result.features.length > 0) {
      cz_id = result.features[0].attributes.cz_id;
    }
  }

  if (!cz_id) {
    console.error("cz_id is undefined. Cannot run query.", polygonGraphic.attributes);
    return;
  }

  const migrationLayer = new FeatureLayer({
    url: "https://services1.arcgis.com/4yjifSiIG17X0gW4/arcgis/rest/services/Commuting_Zone_Migration_Centroid_Test/FeatureServer"
  });

  const migrationQuery = migrationLayer.createQuery();
  migrationQuery.where = `cz = ${cz_id}`;
  migrationQuery.outFields = [
    "o_x_coord", "o_y_coord", "d_x_coord", "d_y_coord", "n",
    "o_cz_name", "d_cz_name", "o_state_name", "d_state_name",
    "o_cz", "d_cz", "n_tot_o", "n_tot_d", "pr_d_o", "pr_o_d"
  ];
  migrationQuery.returnGeometry = false;

  try {
    const result = await migrationLayer.queryFeatures(migrationQuery);
    appState.allRelatedFeatures = result.features;

    // Optionally preview lines on polygon click (no message logic here)
    drawLines(appState.allRelatedFeatures, appState.minValue, appState);
  } catch (error) {
    console.error("Error querying centroid features:", error);
  }
}