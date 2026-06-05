import { getMockApi } from './mock/mockApi.js';
import { renderAppHeader, setHeaderAjaxBusy } from './ui/header.js';
import { renderSystemOverview, systemOverviewState } from './ui/systemOverview.js';
import { renderTopologyView } from './ui/topologyView.js';

const mockApi = getMockApi();

/**
 * Bootstrap Topology page — vanilla JS client-side replacement for Lua CGI backend.
 */
async function bootstrapTopologyApp() {
  const headerMount = document.querySelector('#app-header-root');
  const overviewMount = document.querySelector('#system-overview-root');
  const topologyMount = document.querySelector('#topology-root');

  if (!headerMount || !overviewMount || !topologyMount) {
    throw new Error('TopologyApp: required mount points missing');
  }

  renderAppHeader(headerMount);

  renderSystemOverview(overviewMount, {
    onOperatorChange: async (operatorName) => {
      await refreshTopology(topologyMount, operatorName);
    },
    onDisplayModeChange: (displayMode) => {
      if (displayMode === 'rack') {
        console.info('TopologyApp: Rack View not implemented in mock-client yet');
      }
    },
  });

  await refreshTopology(topologyMount, systemOverviewState.selectedOperator);
  startPolling(systemOverviewState.selectedOperator, topologyMount);
}

/**
 * @param {HTMLElement} topologyMount
 * @param {string} operatorName
 */
async function refreshTopology(topologyMount, operatorName) {
  setHeaderAjaxBusy(true);

  try {
    await mockApi.execute(`SECTGRP -o ${operatorName} list --sectors && sector -o ${operatorName} --json`);
    await mockApi.execute(`zone -o ${operatorName} list --nodes && topology -o ${operatorName} --json && rack topology --json`);

    renderTopologyView(topologyMount, operatorName, {
      onNodeClick: (node) => {
        console.info('TopologyApp: node selected', node);
      },
    });
  } finally {
    setHeaderAjaxBusy(false);
  }
}

/**
 * @param {string} operatorName
 * @param {HTMLElement} topologyMount
 */
function startPolling(operatorName, topologyMount) {
  window.setInterval(async () => {
    if (mockApi.isCallPending()) {
      return;
    }

    await refreshTopology(topologyMount, operatorName);
  }, 20000);
}

bootstrapTopologyApp().catch((error) => {
  console.error('TopologyApp bootstrap failed:', error);
});
