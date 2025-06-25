export function setupActionBar(appState, mapEl) {
  const handleActionBarClick = ({ target }) => {
    if (target.tagName !== "CALCITE-ACTION") return;
    if (target.id === "info-action") return;
    document.querySelectorAll("calcite-panel").forEach(panelEl => panelEl.closed = true);
    document.querySelectorAll("calcite-action").forEach(actionEl => actionEl.active = false);
    const nextWidget = target.dataset.actionId;
    if (nextWidget !== appState.activeWidget) {
      document.querySelector(`[data-action-id=${nextWidget}]`).active = true;
      const panel = document.querySelector(`[data-panel-id=${nextWidget}]`);
      if (panel) {
        panel.closed = false;
        panel.setFocus();
      }
      appState.activeWidget = nextWidget;
    } else {
      appState.activeWidget = null;
    }
  };

  document.querySelectorAll("calcite-panel").forEach(panelEl => {
    panelEl.addEventListener("calcitePanelClose", () => {
      const actionEl = document.querySelector(`[data-action-id=${appState.activeWidget}]`);
      if (actionEl) {
        actionEl.active = false;
        actionEl.setFocus();
      }
      appState.activeWidget = null;
    });
  });

  document.querySelector("calcite-action-bar").addEventListener("click", handleActionBarClick);

  document.addEventListener("calciteActionBarToggle", event => {
    appState.actionBarExpanded = !appState.actionBarExpanded;
    mapEl.view.padding = { left: appState.actionBarExpanded ? 135 : 49 };
  });
}