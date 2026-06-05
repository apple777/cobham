import {
  buildRfRouteProfiles,
  buildRfRouteDetail,
  buildSectgrpBundle,
  buildTopologyBundle,
  getOperatorName,
  handleGetAttribute,
  handleSetAttribute,
} from './appState.js';

/** Shell commands from cmd.lua + msdh/cgi/cmd.lua that return plain ok/text */
export const OK_COMMANDS = [
  'rf_on_off', 'cpri_force_port', 'power_reset', 'hw_reset', 'check_cres_tag',
  'set_pim_test', 'imop_control', 'dobr_erase_slave_id', 'dobr_pa_control',
  'dobr_dingerd_kick', 'modem_at', 'device', 'correction_factor',
  'dobrstatus_remote', 'alarms_dump_remote', 'dobr_filters_get_remote',
  'dobr_filters_set_remote', 'read_gps_coordinates', 'set_ntpd',
  'swup_swap', 'swup_apply', 'swup_clear', 'swup_cancel', 'clear_sw_folder',
  'copy_sw_file', 'calendar_saveevents', 'saveprofileflag', 'reboot',
  'polygon_install', 'sw_burn', 'aemdpost', 'masterip', 'prepare_shard',
  'node_registration', 'portmap_registration', 'enable_streams', 'enable_routings',
  'rfranges_registration', 'statuspost', 'opaccess', 'opranges', 'libluatest',
  'opset', 'freqblocks', 'maclookup', 'profschedule', 'apoi', 'opadd', 'opdel',
  'update_credentials', 'deactivate_sfp', 'factory_reset_msdh',
  'add_route_to_rcd_queue', 'filter_quota', 'cpri_quota', 'filterdump',
  'memutility', 'runmulti', 'pingip', 'now', 'help', 'commands', 'inf',
  'get_alarms_info', 'sw_sys_swap', 'sw_app_swap', 'getprofileflag',
  'batch_command', 'msdhr', 'dobr_version', 'rf_on_off',
];

/**
 * @param {(command: string, handler: Function) => void} registerExact
 * @param {(pattern: RegExp, handler: Function) => void} registerPattern
 */
export function registerExtendedHandlers(registerExact, registerPattern) {
  for (const name of OK_COMMANDS) {
    registerExact(name, () => 'ok');
  }

  registerExact('sw_sys_status', () => 'bank_a active');
  registerExact('app_files', (_p, state) => JSON.stringify(state.system.banks.appFiles));
  registerExact('sys_files', (_p, state) => JSON.stringify(state.system.banks.sysFiles));
  registerExact('dobr_version', () => '3.0.0.4593');
  registerExact('get_sector_virtual', () => '0');
  registerExact('linkstatus --json', (_p, state) => JSON.stringify(state.system.linkstatus));
  registerExact('sw_burn_status', () => JSON.stringify({ status: 'idle', progress: 0 }));

  registerPattern(/^linkstatus(?:\s+.*)?$/i, (_m, state) => JSON.stringify(state.system.linkstatus));
  registerPattern(/^measurements dump env --json$/i, (_m, state) => JSON.stringify(state.system.measurements.env));
  registerPattern(/^measurements dump sfp --json$/i, () => JSON.stringify({ sfp: [] }));
  registerPattern(/^measurements dump cpri --json$/i, () => JSON.stringify({ cpri: [] }));
  registerPattern(/^measurements cpri clear$/i, () => 'ok');
  registerPattern(/^measurements sfp report .+$/i, () => JSON.stringify({ report: [] }));
  registerPattern(/^measurements (.+)$/i, (_m, state) => JSON.stringify(state.system.measurements));

  registerPattern(/^rfmeasurements .+ --json$/i, () => JSON.stringify({ measurements: [] }));
  registerPattern(/^rfmeasurements .+$/i, () => JSON.stringify({ measurements: [] }));
  registerPattern(/^rfmeasurements$/i, () => JSON.stringify({ measurements: [] }));
  registerPattern(/^rfmeasurement -o (\S+) --json$/i, () => JSON.stringify({ measurements: [] }));

  registerPattern(/^rrustatus --json$/i, (_m, state) => JSON.stringify(state.system.statusByTarget.rru));
  registerPattern(/^rru40status --json$/i, (_m, state) => JSON.stringify(state.system.statusByTarget.rru40));
  registerPattern(/^mtdistatus --json$/i, (_m, state) => JSON.stringify(state.system.statusByTarget.mtdi));
  registerPattern(/^dobrstatus --json$/i, (_m, state) => JSON.stringify(state.system.statusByTarget.dobr));

  registerPattern(/^cellres -o (\S+) --json$/i, (match, state) => {
    const op = getOperatorName(state, match[1]);
    return JSON.stringify(state.system.cellresByOperator[op] || { cellres: [] });
  });
  registerPattern(/^CELLRES -o (\S+) --CLEAR_DB (\S+)$/i, () => 'ok');
  registerPattern(/^CELLRES -o (\S+) sync_to_rru .+$/i, () => 'ok');

  registerPattern(/^connections -o (\S+) --json$/i, (match, state) => {
    const op = getOperatorName(state, match[1]);
    return JSON.stringify(state.system.connectionsByOperator[op] || { connections: [] });
  });
  registerPattern(/^connections -o (\S+) (DEL|DISABLE) .+$/i, () => 'ok');

  registerPattern(/^rf_quota -o (\S+) --json$/i, (match, state) => {
    const op = getOperatorName(state, match[1]);
    return JSON.stringify(state.system.rfQuotaByOperator[op] || { quota: 100, used: 0 });
  });
  registerPattern(/^rfnominal -o (\S+) --json$/i, (match, state) => {
    const op = getOperatorName(state, match[1]);
    return JSON.stringify(state.system.rfNominalByOperator[op] || { nominal: [] });
  });
  registerPattern(/^rflevels -o (\S+) --json$/i, (match, state) => {
    const op = getOperatorName(state, match[1]);
    return JSON.stringify(state.system.rfLevelsByOperator[op] || { levels: [] });
  });

  registerPattern(/^sector -o (\S+) --json$/i, (match, state) => {
    const bundle = state.topology.sectgrpByOperator[getOperatorName(state, match[1])];
    return JSON.stringify(bundle?.sector || { sector: [] });
  });
  registerPattern(/^SECTOR -o (\S+) --json$/i, (match, state) => {
    const bundle = state.topology.sectgrpByOperator[getOperatorName(state, match[1])];
    return JSON.stringify(bundle?.sector || { sector: [] });
  });
  registerPattern(/^SECTOR -o (\S+) DELETE (\S+)$/i, () => 'ok');
  registerPattern(/^sector -o (\S+) delete .+$/i, () => 'ok');

  registerPattern(/^sectgrp -o (\S+) (.+)$/i, () => 'ok');
  registerPattern(/^SECTGRP -o (\S+) MOVE .+$/i, () => 'ok');
  registerPattern(/^ZONE -o (\S+) MOVE .+$/i, () => 'ok');
  registerPattern(/^zone -o (\S+) move .+$/i, () => 'ok');

  registerPattern(/^topology -o (\S+) --order .+$/i, () => 'ok');
  registerPattern(/^topology --ip --json\s*$/i, (_m, state) => JSON.stringify(state.topology.bundleByOperator.oper1.topology));
  registerPattern(/^topology -o (\S+) --json\s*$/i, (match, state) => {
    const bundle = state.topology.bundleByOperator[getOperatorName(state, match[1])];
    return JSON.stringify(bundle?.topology || { nodes: [] });
  });

  registerPattern(/^RFROUTE -o (\S+) (\S+) GETPW (\S+) --json$/i, () => JSON.stringify({ power: -70 }));
  registerPattern(/^RFROUTE -o (\S+) (\S+) SETPW .+$/i, () => 'Result Code: 0');
  registerPattern(/^RFROUTE -o (\S+) (\S+) SETRF .+$/i, () => 'Result Code: 0');
  registerPattern(/^RFROUTE -o (\S+) (\S+) TAG ".+"$/i, () => 'Result Code: 0');
  registerPattern(/^RFROUTE -o (\S+) (\S+) COPY .+$/i, () => 'Result Code: 0');
  registerPattern(/^RFROUTE -o (\S+) (\S+) CREATE$/i, () => 'Result Code: 0');
  registerPattern(/^RFROUTE -o (\S+) (\S+) --json$/i, (match, state) => buildRfRouteDetail(state, match[1], match[2]));
  registerPattern(/^RFROUTE PROFILES -o (\S+) --json$/i, (match, state) => buildRfRouteProfiles(state, match[1]));
  registerPattern(/^RFROUTE -o (\S+) PROFILES --json$/i, (match, state) => buildRfRouteProfiles(state, match[1]));
  registerPattern(/^rfroute -o (\S+) --json$/i, (match, state) => buildRfRouteProfiles(state, match[1]));
  registerPattern(/^RFROUTE -o (\S+) (\S+) (LOCK|UNLOCK|DELETE|ACTIVATE)$/i, () => 'Result Code: 0');

  registerPattern(/^rfschedule -o (\S+) --json$/i, (match, state) =>
    JSON.stringify(state.routing.scheduleByOperator[getOperatorName(state, match[1])] || { RfSchedule: [] }));

  registerPattern(/^RFSCHEDULE -o (\S+) REMOVE EVENT_\d+$/i, () => 'ok');
  registerPattern(/^calendar_getevents .+$/i, () => JSON.stringify({ events: [] }));

  registerPattern(/^backup save$/i, () => 'ok');
  registerPattern(/^backup generalsave$/i, () => 'ok');
  registerPattern(/^backup deleteall$/i, () => 'ok');
  registerPattern(/^backup delete .+$/i, () => 'ok');
  registerPattern(/^backup load .+$/i, () => 'ok');
  registerPattern(/^backup generalload .+$/i, () => 'ok');
  registerPattern(/^backup upload .+$/i, () => 'ok');
  registerPattern(/^backup (.+)$/i, (_m, state) => JSON.stringify({ files: state.system.backup.system }));

  registerPattern(/^app_installer .+$/i, () => 'ok');
  registerPattern(/^sys_installer .+$/i, () => 'ok');

  registerPattern(/^dobr_filters get (\S+) --json$/i, () => JSON.stringify({ filters: [] }));
  registerPattern(/^dobr_filters (.+)$/i, () => 'ok');
  registerPattern(/^filterdump (.+)$/i, () => JSON.stringify({ filters: [] }));
  registerPattern(/^filterquota -o (\S+) (ALLOCATED|USED) RRU --json$/i, () => JSON.stringify({ quota: 100, used: 25 }));
  registerPattern(/^cpriquota -o (\S+) .+$/i, () => JSON.stringify({ quota: 10, used: 2 }));

  registerPattern(/^snmp (.+)$/i, (_m, state) => JSON.stringify(state.system.snmp));
  registerPattern(/^alarms logs --json .+$/i, () => JSON.stringify({ logs: [], page: 0 }));
  registerPattern(/^alarms dump --oper (\S+) --json$/i, (_m, state) => JSON.stringify(state.alarms.dump));
  registerPattern(/^alarms dump --json --oper (\S+)$/i, (_m, state) => JSON.stringify(state.alarms.dump));
  registerPattern(/^alarms eventoper .+$/i, () => 'ok');
  registerPattern(/^alarms clear$/i, () => 'ok');
  registerPattern(/^alarms (.+)$/i, () => 'ok');

  registerPattern(/^MSDHR (ADD|DELETE) .+$/i, () => 'ok');
  registerPattern(/^NODE (CHECK|DELETE) (.+)$/i, () => 'ok');
  registerPattern(/^node -o (\S+) .+$/i, () => 'ok');
  registerPattern(/^rack (.+)$/i, () => JSON.stringify({ Racks: [] }));

  registerPattern(/^get_rrc_message (\S+)$/i, () => '');
  registerPattern(/^clear_routing_alarm (\S+)$/i, () => 'ok');
  registerPattern(/^refresh_connections (.+)$/i, () => 'ok');
  registerPattern(/^copy_configuration (.+)$/i, () => 'ok');
  registerPattern(/^get_remote_measurements_sfp (.+)$/i, () => JSON.stringify({ sfp: [] }));
  registerPattern(/^delete_serials_opers (.+)$/i, () => 'ok');
  registerPattern(/^change_serials_opers (.+)$/i, () => 'ok');
  registerPattern(/^identify (.+)$/i, () => 'ok');
  registerPattern(/^credstat (.+)$/i, () => 'ok');
  registerPattern(/^msdhstatus (.+)$/i, () => JSON.stringify({ status: 'ok' }));
  registerPattern(/^mimobuddy -o (\S+) --json$/i, () => JSON.stringify({ buddies: [] }));
  registerPattern(/^operators -o (\S+) .+$/i, () => 'ok');
  registerPattern(/^TECHNOLOGIES --json$/i, () => JSON.stringify({ technologies: ['LTE', 'NR'] }));
  registerPattern(/^technologies --json$/i, () => JSON.stringify({ technologies: ['LTE', 'NR'] }));
  registerPattern(/^rfranges --json$/i, (_m, state) => JSON.stringify(state.system.rfranges));
  registerPattern(/^bands --json$/i, () => JSON.stringify({ bands: ['B1', 'B3', 'B7', 'B20'] }));

  registerPattern(/^SECTGRP -o (\S+) list --sectors && sector -o \1 --json$/i,
    (match, state) => buildSectgrpBundle(state, match[1]));
  registerPattern(/^SECTGRP -o (\S+) list --sectors$/i, (match, state) => {
    const bundle = state.topology.sectgrpByOperator[getOperatorName(state, match[1])];
    return (bundle?.lines || []).join('\n');
  });
  registerPattern(/^zone -o (\S+) list --nodes && topology -o \1 --json && rack topology --json$/i,
    (match, state) => buildTopologyBundle(state, match[1]));
  registerPattern(/^zone -o (\S+) list --nodes$/i, (match, state) => {
    const bundle = state.topology.bundleByOperator[getOperatorName(state, match[1])];
    return (bundle?.zoneLines || []).join('\n');
  });
  registerPattern(/^rack topology --json$/i, (_m, state) =>
    JSON.stringify(state.topology.bundleByOperator.oper1?.racks || { Racks: [] }));

  registerPattern(/^GET USEROPERATOR (\S+) --json$/i, (match, state) =>
    JSON.stringify(state.operators.usersByOperator[match[1]] || { users: [] }));

  registerPattern(/^measurements get (\S+)$/i, (match, state) => handleGetAttribute(state, match[1]));
  registerPattern(/^measurements set (\S+) (.+)$/i, (match, state) => handleSetAttribute(state, match[1], match[2]));
  registerPattern(/^get (\S+)(?:\s+(.*))?$/i, (match, state) => handleGetAttribute(state, match[1]));
  registerPattern(/^set (\S+) (.+)$/i, (match, state) => handleSetAttribute(state, match[1], match[2]));
  registerPattern(/^act (\S+)(?:\s+(.*))?$/i, () => 'ok');

  registerPattern(/^set_msdh_mode (.+)$/i, () => 'ok');
  registerPattern(/^sync_ports get$/i, () => '1');
  registerPattern(/^sync_ports set .+$/i, () => 'ok');
  registerPattern(/^mng_ports get$/i, () => '1');
  registerPattern(/^mng_ports set .+$/i, () => 'ok');
  registerPattern(/^fiber_redundancy get$/i, () => '0');
  registerPattern(/^eth_over_cpri get$/i, () => '0');
  registerPattern(/^eth_over_cpri set .+$/i, () => 'ok');
  registerPattern(/^marvell_port_on_off (.+)$/i, () => '0');
  registerPattern(/^mtdi_mute (.+)$/i, () => 'ok');
  registerPattern(/^kill_smd$/i, () => 'ok');
  registerPattern(/^write_mfr_data (.+)$/i, () => 'ok');
  registerPattern(/^web_passwd (.+)$/i, () => 'ok');
  registerPattern(/^swup_swap .+$/i, () => 'ok');
  registerPattern(/^fft (.+)$/i, () => JSON.stringify({ fft: [] }));

  /** Catch-all: mutating commands → ok, --json → {}, else empty string */
  registerPattern(/^(.+)$/i, (match) => {
    const cmd = match[1];
    if (/\b(set|delete|remove|add|move|rename|activate|lock|unlock|clear|save|upload|install|swap|burn|reset|mute|kick|control|post|registration)\b/i.test(cmd)) {
      if (cmd.toLowerCase().includes('activate') || cmd.toLowerCase().includes('rfroute')) {
        return 'Result Code: 0';
      }
      return 'ok';
    }
    if (/--json\b/i.test(cmd)) {
      return JSON.stringify({});
    }
    return '';
  });
}
