import { FIXTURE_META } from '../fixtures/fixtureSnapshot.js';
import { getMockApi } from '../mock/mockApi.js';

/**
 * @param {HTMLElement} rootElement
 */
export function renderAppHeader(rootElement) {
  rootElement.innerHTML = `
    <div class="app-header-placeholder" aria-hidden="true"></div>
    <header class="app-header" data-component="app-header">
      <div class="app-header__brand-cobham" aria-label="COBHAM"></div>
      <div class="app-header__brand-iddas" aria-label="idDAS"></div>
      <div class="app-header__page-title">
        <span class="app-header__page-title-text" data-bind="pageTitle">Topology</span>
      </div>
      <div class="app-header__version" data-bind="softwareVersion">Loading version...</div>
      <div class="app-header__user">
        <span class="app-header__user-icon" aria-hidden="true"></span>
        <span data-bind="username">${FIXTURE_META.username}</span>
        <span class="app-header__ajax-led" data-bind="ajaxLed" title="Communication with server"></span>
      </div>
      <button type="button" class="app-header__logout" title="Logout from the system" aria-label="Logout"></button>
    </header>
  `;

  hydrateHeaderMeta(rootElement);
}

/**
 * @param {HTMLElement} rootElement
 */
async function hydrateHeaderMeta(rootElement) {
  const mockApi = getMockApi();
  const ajaxLedElement = rootElement.querySelector('[data-bind="ajaxLed"]');
  const versionElement = rootElement.querySelector('[data-bind="softwareVersion"]');

  ajaxLedElement?.classList.add('is-busy');

  try {
    const [swvResponse, tagResponse] = await Promise.all([
      mockApi.execute('get swv'),
      mockApi.execute('get tag'),
    ]);

    if (versionElement) {
      versionElement.textContent = swvResponse.ajaxdata;
    }

    const pageTitleElement = rootElement.querySelector('[data-bind="pageTitle"]');
    if (pageTitleElement) {
      pageTitleElement.textContent = `Topology — ${tagResponse.ajaxdata}`;
    }
  } finally {
    ajaxLedElement?.classList.remove('is-busy');
  }
}

/**
 * @param {boolean} isBusy
 */
export function setHeaderAjaxBusy(isBusy) {
  const ajaxLedElement = document.querySelector('[data-bind="ajaxLed"]');
  ajaxLedElement?.classList.toggle('is-busy', isBusy);
}
