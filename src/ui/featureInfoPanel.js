import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

/**
 * Updates and displays the feature info panel for a given graphic.
 */
export function showFeatureInfoPanel(graphic, featuresComponent, featureInfoPanel, extraContent = "") {
  if (!graphic) {
    featuresComponent.graphic = null;
    featureInfoPanel.closed = true;
    return;
  }

  if (extraContent && graphic.geometry?.type === "polyline") {
    if (!graphic._baseContent) {
      graphic._baseContent = graphic.popupTemplate.content;
    }
    graphic.popupTemplate = {
      title: graphic.popupTemplate.title,
      content: `
        ${graphic._baseContent}
        <br/><h3>Neighborhood Characteristics</h3> 
        ${extraContent}
      `
    };
  }

  featuresComponent.graphic = null;
  featuresComponent.graphic = graphic;
  featureInfoPanel.closed = false;
}

/**
 * Sets up the click handler for feature info panel logic.
 */
export function setupFeatureInfoClick(view, appState, highlightFeature, handlePolygonClick) {
  view.when(() => {
    view.on("click", async (event) => {
      const response = await view.hitTest(event);
      const featureInfoPanel = document.getElementById("feature-info-panel");
      const featuresComponent = document.getElementById("feature-info");

      const graphic = response.results.find(
        (result) =>
          result.graphic?.layer?.type === "feature" ||
          (result.graphic?.geometry?.type === "polyline" && result.graphic?.layer?.type === "graphics") ||
          (result.graphic?.geometry?.type === "point" && result.graphic?.layer?.type === "graphics")
      )?.graphic;

      if (graphic) {
        highlightFeature(graphic, view, appState);

        if (graphic.geometry?.type === "polygon") {
          handlePolygonClick(graphic, appState);
        }
        // If it's a migration line, query extra info
        if (graphic.geometry?.type === "polyline" && graphic.attributes.o_cz && graphic.attributes.d_cz) {
          const oCz = graphic.attributes.o_cz;
          const dCz = graphic.attributes.d_cz;

          const covariateTable = new FeatureLayer({
            url: "https://services8.arcgis.com/peDZJliSvYims39Q/arcgis/rest/services/Commuting_Zone_Covariates_Table/FeatureServer",
            outFields: ["*"]
          });
          const query = covariateTable.createQuery();
          query.where = `cz IN (${oCz}, ${dCz})`;
          query.returnGeometry = false;

          try {
            const result = await covariateTable.queryFeatures(query);
            let oInfo = "No info found.";
            let dInfo = "No info found.";
            result.features.forEach(f => {
              if (f.attributes.cz == oCz) oInfo = f.attributes;
              if (f.attributes.cz == dCz) dInfo = f.attributes;
            });

            function buildTable(data, label) {
              if (!data) return `<div>No data for ${label}.</div>`;
              const change_emp_19902010 = Math.round(data.change_emp_pooled1990_2010 * 100) / 1;
              const change_emp_19802000 = Math.round(data.change_emp_pooled1980_2000 * 100) / 1;
              const change_coll_19802000 = Math.round(data.change_frac_coll_pooled1980_200 * 100) / 1;
              const change_coll_19902010 = Math.round(data.change_frac_coll_pooled1990_201 * 100) / 1;
              return `
                <div style="margin-bottom:8px;"><b>${label} Neighborhood Characteristics</b></div>
                <table style="width:100%; border:1px solid LightGray; border-collapse: collapse;">
                  <tr><th style="border:1px solid LightGray;">Change in Employment Rate 1980-2000</th>
                    <th style="border:1px solid LightGray;">Change in Employment Rate 1990-2010</th></tr>
                  <tr><td style="text-align:center; border:1px solid LightGray;">${change_emp_19802000}%</td>
                    <td style="text-align:center; border:1px solid LightGray;">${change_emp_19902010}%</td></tr>
                  <tr><th style="border:1px solid LightGray;">Change in College Graduation Rate 1980-2000</th>
                    <th style="border:1px solid LightGray;">Change in College Graduation Rate 1990-2010</th></tr>
                  <tr><td style="text-align:center; border:1px solid LightGray;">${change_coll_19802000}%</td>
                    <td style="text-align:center; border:1px solid LightGray;">${change_coll_19902010}%</td></tr>
                </table>
              `;
            }

            const oTable = buildTable(oInfo, "Origin");
            const dTable = buildTable(dInfo, "Destination");
            showFeatureInfoPanel(
              graphic,
              featuresComponent,
              featureInfoPanel,
              `${oTable}<br/>${dTable}`
            );
          } catch (err) {
            console.error("Error querying extra info table:", err);
          }
        } else if (graphic.geometry?.type === "point") {
          showFeatureInfoPanel(graphic, featuresComponent, featureInfoPanel);
        } else {
          showFeatureInfoPanel(graphic, featuresComponent, featureInfoPanel);
        }
      } else {
        showFeatureInfoPanel(null, featuresComponent, featureInfoPanel);
      }
    });
  });
}