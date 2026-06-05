import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

function loadJson(name) {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, name), 'utf8'));
}

/**
 * @typedef {Object} AppState
 * @property {Record<string, string>} attributes
 * @property {object} operators
 * @property {object} topology
 * @property {object} routing
 * @property {object} alarms
 * @property {object} thresholds
 * @property {object} system
 * @property {Set<string>} unknownCommands
 */

/** @returns {AppState} */
export function createInitialState() {
  return {
    attributes: { ...loadJson('attributes.json') },
    operators: loadJson('operators.json'),
    topology: loadJson('topology.json'),
    routing: loadJson('routing.json'),
    alarms: loadJson('alarms.json'),
    thresholds: loadJson('thresholds.json'),
    system: loadJson('system.json'),
    unknownCommands: new Set(),
  };
}

/** @param {AppState} state @param {string} [operatorName] */
export function getOperatorName(state, operatorName) {
  if (!operatorName || operatorName === 'undefined' || operatorName === 'null') {
    return state.operators.activeOperator || 'oper1';
  }
  return operatorName;
}

/** @param {AppState} state @param {string} operatorName */
export function buildSectgrpBundle(state, operatorName) {
  const op = getOperatorName(state, operatorName);
  const bundle = state.topology.sectgrpByOperator[op] || state.topology.sectgrpByOperator.oper1;
  return [...bundle.lines, JSON.stringify(bundle.sector)].join('\n');
}

/** @param {AppState} state @param {string} operatorName */
export function buildTopologyBundle(state, operatorName) {
  const op = getOperatorName(state, operatorName);
  const bundle = state.topology.bundleByOperator[op] || state.topology.bundleByOperator.oper1;
  const zoneLines = bundle.zoneLines || [];
  return [
    ...zoneLines,
    JSON.stringify(bundle.topology),
    JSON.stringify(bundle.racks),
  ].join('\n');
}

/** @param {AppState} state @param {string} operatorName */
export function buildRfRouteProfiles(state, operatorName) {
  const op = getOperatorName(state, operatorName);
  const profileData = state.routing.profilesByOperator[op] || state.routing.profilesByOperator.oper1;
  return JSON.stringify(profileData);
}

/** @param {AppState} state @param {string} operatorName @param {string} profileName */
export function buildRfRouteDetail(state, operatorName, profileName) {
  const op = getOperatorName(state, operatorName);
  const key = `${op}:${profileName}`;
  if (state.routing.routeDetailByKey[key]) {
    return JSON.stringify(state.routing.routeDetailByKey[key]);
  }
  return JSON.stringify(state.routing.defaultRouteDetail);
}

/** @param {AppState} state @param {string} attr */
export function handleGetAttribute(state, attr) {
  const key = attr.toLowerCase();
  if (key in state.attributes) {
    return String(state.attributes[key]);
  }
  return '';
}

/** @param {AppState} state @param {string} attr @param {string} value */
export function handleSetAttribute(state, attr, value) {
  const key = attr.toLowerCase();
  state.attributes[key] = value.replace(/^"|"$/g, '');
  return state.attributes[key];
}

/** @param {AppState} state @param {string} command */
export function noteUnknownCommand(state, command) {
  if (!state.unknownCommands.has(command)) {
    state.unknownCommands.add(command);
    console.warn(`[mock-cgi] unhandled command: ${command}`);
  }
}
