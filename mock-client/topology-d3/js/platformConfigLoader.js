const PLATFORM_SETTINGS_URL = '/config/platform.settings.json';

/** @typedef {import('./topologyD3Renderer.js').PlatformSettings} PlatformSettings */

/** @returns {Promise<PlatformSettings>} */
export async function loadPlatformSettings() {
  const response = await fetch(PLATFORM_SETTINGS_URL);
  if (!response.ok) {
    throw new Error(`Failed to load platform settings: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * @param {PlatformSettings} platformSettings
 */
export function applyHeaderFromSettings(platformSettings) {
  const session = platformSettings.sessionContext;
  const header = platformSettings.headerBar;

  document.title = header.pageTitleText;
  const titleEl = document.querySelector('#header-text-title');
  if (titleEl) {
    titleEl.textContent = `${header.pageTitleText} — ${session.siteTag}`;
  }

  const userEl = document.querySelector('#header-text-username');
  if (userEl) userEl.textContent = session.username;

  const versionEl = document.querySelector('#header-text-version-number');
  if (versionEl) versionEl.textContent = session.softwareVersionDisplay;
}

/**
 * @param {PlatformSettings} platformSettings
 */
export function applySystemOverviewFromSettings(platformSettings) {
  const overview = platformSettings.systemOverviewBar;

  const routingEl = document.querySelector('#routing_setup_select');
  if (routingEl) routingEl.textContent = overview.routingProfileValue;

  const operatorSelect = document.querySelector('#operator_list');
  if (operatorSelect) {
    operatorSelect.innerHTML = overview.operatorOptions
      .map((op) => `<option value="${op.sysName}">${op.displayName}</option>`)
      .join('');
    operatorSelect.value = overview.operatorSelectedValue;
  }

  const displaySelect = document.querySelector('#display_filter_list');
  if (displaySelect) {
    displaySelect.value = overview.displayModeSelectedValue;
  }

  const usernameEl = document.querySelector('#username');
  if (usernameEl) usernameEl.textContent = overview.loggedInUserValue;
}

/**
 * @param {PlatformSettings} platformSettings
 * @returns {PlatformSettings['topologyD3']}
 */
export function getTopologyD3Config(platformSettings) {
  return platformSettings.topologyD3;
}
