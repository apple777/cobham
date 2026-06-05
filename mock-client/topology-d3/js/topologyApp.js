import {
  applyHeaderFromSettings,
  applySystemOverviewFromSettings,
  loadPlatformSettings,
} from './platformConfigLoader.js';
import {
  bindNavigationMenuInteraction,
  renderNavigationMenuFromSettings,
} from './navigationMenuRenderer.js';
import { bindTopologyResize, renderTopologyD3 } from './topologyD3Renderer.js';

async function bootstrapTopologyD3App() {
  const platformSettings = await loadPlatformSettings();

  applyHeaderFromSettings(platformSettings);
  applySystemOverviewFromSettings(platformSettings);
  renderNavigationMenuFromSettings(platformSettings);
  bindNavigationMenuInteraction();
  renderTopologyD3(platformSettings);
  bindTopologyResize(platformSettings);

  const displayModeSelect = document.querySelector('#display_filter_list');
  displayModeSelect?.addEventListener('change', (event) => {
    const target = /** @type {HTMLSelectElement} */ (event.target);
    if (target.value === 'rack') {
      console.info('[topology-d3] Rack View stub — switch displayMode in platform.settings.json');
    } else {
      renderTopologyD3(platformSettings);
    }
  });

  const operatorSelect = document.querySelector('#operator_list');
  operatorSelect?.addEventListener('change', () => {
    renderTopologyD3(platformSettings);
  });
}

bootstrapTopologyD3App().catch((error) => {
  console.error('[topology-d3] bootstrap failed:', error);
  const container = document.querySelector('#topology-container');
  if (container) {
    container.innerHTML = `<p style="padding:16px;color:#c00">Failed to load topology: ${error.message}</p>`;
  }
});
