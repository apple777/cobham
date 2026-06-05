import { FIXTURE_META, FIXTURE_OPERATORS } from '../fixtures/fixtureSnapshot.js';

/**
 * @typedef {Object} SystemOverviewState
 * @property {string} activeRoutingProfile
 * @property {string} selectedOperator
 * @property {'rack'|'topology'} displayMode
 * @property {string} username
 * @property {'green'|'red'} systemStatusLed
 */

/** @type {SystemOverviewState} */
export const systemOverviewState = {
  activeRoutingProfile: FIXTURE_META.activeRoutingProfile,
  selectedOperator: FIXTURE_META.activeOperator,
  displayMode: FIXTURE_META.displayMode,
  username: FIXTURE_META.username,
  systemStatusLed: 'green',
};

/**
 * @param {HTMLElement} rootElement
 * @param {{ onOperatorChange?: (operatorName: string) => void, onDisplayModeChange?: (mode: 'rack'|'topology') => void }} [handlers]
 */
export function renderSystemOverview(rootElement, handlers = {}) {
  const operatorOptions = FIXTURE_OPERATORS.operators
    .map((operator) => `<option value="${operator.SysName}">${operator.SysName}</option>`)
    .join('');

  rootElement.innerHTML = `
    <section class="system-overview" data-component="system-overview">
      <div class="system-overview__section">
        <span class="system-overview__label">Routing profile:</span>
        <span class="system-overview__value" data-bind="activeRoutingProfile">${systemOverviewState.activeRoutingProfile}</span>
      </div>
      <div class="system-overview__separator" aria-hidden="true"></div>
      <div class="system-overview__section">
        <span class="system-overview__label">Operator:</span>
        <select class="system-overview__select" data-bind="operatorSelect" aria-label="Operator">${operatorOptions}</select>
      </div>
      <div class="system-overview__separator" aria-hidden="true"></div>
      <div class="system-overview__section">
        <span class="system-overview__label">Display mode:</span>
        <select class="system-overview__select" data-bind="displayModeSelect" aria-label="Display mode">
          <option value="rack">Rack View</option>
          <option value="topology" selected>Topology View</option>
        </select>
      </div>
      <div class="system-overview__separator" aria-hidden="true"></div>
      <div class="system-overview__section">
        <span class="system-overview__label">Current logged in user:</span>
        <span class="system-overview__value" data-bind="username">${systemOverviewState.username}</span>
      </div>
      <div class="system-overview__status">
        <div class="system-overview__status-led is-${systemOverviewState.systemStatusLed}" data-bind="systemStatusLed" title="System Status"></div>
      </div>
    </section>
  `;

  const operatorSelect = rootElement.querySelector('[data-bind="operatorSelect"]');
  const displayModeSelect = rootElement.querySelector('[data-bind="displayModeSelect"]');

  operatorSelect?.addEventListener('change', (event) => {
    const target = /** @type {HTMLSelectElement} */ (event.target);
    systemOverviewState.selectedOperator = target.value;
    handlers.onOperatorChange?.(target.value);
  });

  displayModeSelect?.addEventListener('change', (event) => {
    const target = /** @type {HTMLSelectElement} */ (event.target);
    systemOverviewState.displayMode = /** @type {'rack'|'topology'} */ (target.value);
    handlers.onDisplayModeChange?.(systemOverviewState.displayMode);
  });
}

/**
 * @param {Partial<SystemOverviewState>} patch
 */
export function patchSystemOverviewState(patch) {
  Object.assign(systemOverviewState, patch);

  const routingProfileElement = document.querySelector('[data-bind="activeRoutingProfile"]');
  if (routingProfileElement && patch.activeRoutingProfile) {
    routingProfileElement.textContent = patch.activeRoutingProfile;
  }
}
