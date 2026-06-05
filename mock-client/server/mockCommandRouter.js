import {
  createInitialState,
  handleGetAttribute,
  handleSetAttribute,
  noteUnknownCommand,
} from './appState.js';
import { registerExtendedHandlers } from './defaultHandlers.js';

export class MockCommandRouter {
  #state;
  #exactHandlers = new Map();
  #patternHandlers = [];

  constructor() {
    this.#state = createInitialState();
    this.#registerHandlers();
  }

  getState() {
    return this.#state;
  }

  execute(wholeCommand) {
    const parts = wholeCommand
      .split('&')
      .map((part) => part.trim())
      .filter(Boolean);

    return parts.map((part) => this.#executeSingle(part)).join(' ');
  }

  #executeSingle(commandLine) {
    if (commandLine.includes('&&')) {
      return commandLine
        .split('&&')
        .map((segment) => segment.trim())
        .map((segment) => this.#executeSingle(segment))
        .join('\n');
    }

    const normalized = commandLine.trim();
    const lower = normalized.toLowerCase();

    if (this.#exactHandlers.has(lower)) {
      const spaceIndex = normalized.indexOf(' ');
      const params = spaceIndex === -1 ? '' : normalized.slice(spaceIndex + 1);
      return this.#exactHandlers.get(lower)(params, this.#state, normalized);
    }

    for (const { pattern, handler } of this.#patternHandlers) {
      const match = normalized.match(pattern);
      if (match) {
        return handler(match, this.#state, normalized);
      }
    }

    noteUnknownCommand(this.#state, normalized);
    return '';
  }

  #registerHandlers() {
    const exact = (command, handler) => {
      this.#exactHandlers.set(command.toLowerCase(), handler);
    };

    const pattern = (regex, handler) => {
      this.#patternHandlers.push({ pattern: regex, handler });
    };

    exact('username', () => 'sysadmin');
    exact('roundtrip', () => 'roundtrip');
    exact('get tag', (_p, state) => handleGetAttribute(state, 'tag'));
    exact('get loc', (_p, state) => handleGetAttribute(state, 'loc'));
    exact('get ltg', (_p, state) => handleGetAttribute(state, 'ltg'));
    exact('get mdl', (_p, state) => handleGetAttribute(state, 'mdl'));
    exact('get swv', (_p, state) => handleGetAttribute(state, 'swv'));
    exact('get spc', (_p, state) => handleGetAttribute(state, 'spc'));
    exact('get_serial', () => 'SN-MOCK-0001');
    exact('get_date', () => '2026-06-05 12:00:00');
    exact('get_internal_ip', () => '192.168.1.100');
    exact('myip', () => '127.0.0.1');
    exact('clientip', () => 'localhost');
    exact('serverip', () => 'localhost');
    exact('nodestat', () => 'ok');
    exact('read_mfr_data', () => 'mock mfr data');
    exact('alarmnames', () => 'TEMP DOO COMM');
    exact('getsysstat', () => '12.5 45.0 38.0');
    exact('operators --json', (_p, state) => JSON.stringify(state.operators.list));
    exact('inventory_cmd', () => JSON.stringify({ nodes: [] }));
    exact('hardware', () => 'mock hardware info');
    exact('logdump', () => 'mock log dump');
    exact('alarmconfig --weblayout', (_p, state) => JSON.stringify(state.thresholds.weblayout));
    exact('alarms dump --json', (_p, state) => JSON.stringify(state.alarms.dump));
    exact('measurements get tem', (_p, state) => handleGetAttribute(state, 'tem'));
    exact('measurements get exd', (_p, state) => handleGetAttribute(state, 'exd'));
    exact('get_swup_status', () => JSON.stringify({ status: 'idle' }));
    exact('get_swup_files', () => JSON.stringify({ files: [] }));
    exact('get_patches', () => '');
    exact('get_patches_all', () => '');

    registerExtendedHandlers(exact, pattern);
  }
}

let sharedRouter = null;

export function getMockCommandRouter() {
  if (!sharedRouter) {
    sharedRouter = new MockCommandRouter();
  }
  return sharedRouter;
}
