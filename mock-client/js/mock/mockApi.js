import {
  FIXTURE_BANDS_JSON,
  FIXTURE_META,
  FIXTURE_OPERATORS,
  FIXTURE_RACK_JSON,
  FIXTURE_SECTGRP_LINES,
  FIXTURE_SECTOR_JSON,
  FIXTURE_TOPOLOGY_JSON,
  FIXTURE_ZONE_LINES,
} from '../fixtures/fixtureSnapshot.js';

/**
 * Vanilla JS replacement for POST /cgi/cmd.lua
 * Matches command strings used in src/js/api.js and src/msdh/code.js
 */
export class MockAxshApi {
  /** @type {Map<string, string|object>} */
  #commandRegistry = new Map();

  /** @type {boolean} */
  #isBusy = false;

  /** @type {number} */
  #latencyMs;

  /**
   * @param {{ latencyMs?: number }} [options]
   */
  constructor(options = {}) {
    this.#latencyMs = options.latencyMs ?? 120;
    this.#registerDefaults();
  }

  #registerDefaults() {
    this.#commandRegistry.set('username', FIXTURE_META.username);
    this.#commandRegistry.set('get tag', FIXTURE_META.tag);
    this.#commandRegistry.set('get mdl', FIXTURE_META.model);
    this.#commandRegistry.set('get swv', FIXTURE_META.softwareVersions.join(' '));
    this.#commandRegistry.set('operators --json', FIXTURE_OPERATORS);
    this.#commandRegistry.set('bands --json', FIXTURE_BANDS_JSON);
    this.#commandRegistry.set('roundtrip', 'ok');

    this.#registerOperatorScopedCommands(FIXTURE_META.activeOperator);
  }

  /**
   * @param {string} operatorName
   */
  #registerOperatorScopedCommands(operatorName) {
    const sectgrpBundle = [
      ...FIXTURE_SECTGRP_LINES,
      JSON.stringify(FIXTURE_SECTOR_JSON),
    ].join('\n');

    const topologyBundle = [
      ...FIXTURE_ZONE_LINES,
      JSON.stringify(FIXTURE_TOPOLOGY_JSON),
      JSON.stringify(FIXTURE_RACK_JSON),
    ].join('\n');

    this.#commandRegistry.set(
      `SECTGRP -o ${operatorName} list --sectors && sector -o ${operatorName} --json`,
      sectgrpBundle,
    );

    this.#commandRegistry.set(
      `zone -o ${operatorName} list --nodes && topology -o ${operatorName} --json && rack topology --json`,
      topologyBundle,
    );

    this.#commandRegistry.set(
      `rfroute -o ${operatorName} --json`,
      { Active: FIXTURE_META.activeRoutingProfile },
    );
  }

  /**
   * @param {string} command
   * @param {string|object} response
   */
  registerCommand(command, response) {
    this.#commandRegistry.set(command.trim(), response);
  }

  /**
   * @param {string} command
   * @returns {Promise<{ ajaxdata: string, executionTimeMs: number }>}
   */
  async execute(command) {
    const normalizedCommand = command.trim();
    this.#isBusy = true;

    await new Promise((resolve) => setTimeout(resolve, this.#latencyMs));

    const payload = this.#commandRegistry.get(normalizedCommand);
    this.#isBusy = false;

    if (payload === undefined) {
      throw new Error(`MockAxshApi: unregistered command "${normalizedCommand}"`);
    }

    const ajaxdata = typeof payload === 'string' ? payload : JSON.stringify(payload);

    return {
      ajaxdata,
      executionTimeMs: this.#latencyMs,
    };
  }

  isCallPending() {
    return this.#isBusy;
  }
}

/** @type {MockAxshApi|null} */
let sharedMockApi = null;

/** @returns {MockAxshApi} */
export function getMockApi() {
  if (!sharedMockApi) {
    sharedMockApi = new MockAxshApi();
  }
  return sharedMockApi;
}

/**
 * Drop-in fetch interceptor for legacy api.exe({ cmd }) migration.
 * @param {string} cmdUrl
 */
export function installMockFetchInterceptor(cmdUrl = '/cgi/cmd.lua') {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;

    if (!url.includes(cmdUrl)) {
      return originalFetch(input, init);
    }

    const body = init.body instanceof FormData
      ? init.body.get('cmd')
      : new URLSearchParams(String(init.body || '')).get('cmd');

    const api = getMockApi();

    try {
      const result = await api.execute(String(body || ''));
      return new Response(result.ajaxdata, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    } catch (error) {
      return new Response(String(error.message || error), {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  };
}
