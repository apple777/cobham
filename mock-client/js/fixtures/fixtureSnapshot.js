/**
 * Snapshot fixture matching GUI screenshot (Topology / oper1).
 * Field names mirror axsh JSON from msdh/code.js.
 */

/** @typedef {'0'|'1'|'2'|'3'|'4'|'-'} NodeStatusCode */
/** @typedef {'0'|'1'|'-'} NodeCommCode */

/**
 * @typedef {Object} TopologyNodeFixture
 * @property {string} ID
 * @property {string} Tag
 * @property {string} Location
 * @property {string} NodeType
 * @property {NodeCommCode} Comm
 * @property {NodeStatusCode} Status
 * @property {number} [NodeOrder]
 * @property {TopologyNodeFixture[]} [children]
 * @property {string} [name]
 */

export const FIXTURE_META = {
  username: 'sysadmin',
  tag: 'site-01',
  model: 'MSDH-M',
  softwareVersions: ['3.0.0.2461', '3.0.0.4593', 'JSON 3.0.0.4593'],
  activeOperator: 'oper1',
  activeRoutingProfile: 'oper1',
  displayMode: 'topology',
};

export const FIXTURE_OPERATORS = {
  operators: [
    {
      SysName: 'oper1',
      Name: 'oper1',
      Active: true,
    },
  ],
};

/** BTS Port Group — 1 sector group, red aggregate */
export const FIXTURE_SECTGRP_LINES = [
  'SECTGRP 1: "Group A" SECT_001',
];

export const FIXTURE_SECTOR_JSON = {
  sector: [
    {
      SectorID: 'SECT_001',
      Tag: 'Sector 1',
      Comm: '0',
      Status: '0',
    },
  ],
};

/** topology -o oper1 --json */
export const FIXTURE_TOPOLOGY_JSON = {
  nodes: [
    {
      ID: 'APOI_001',
      Tag: 'APOI-1',
      Location: 'Rack-1',
      'Node Type': 'APOI',
      Comm: '0',
      Status: '4',
      NodeOrder: 1,
    },
    {
      ID: 'MTDI_001',
      Tag: 'MTDI-1',
      Location: 'Rack-1',
      'Node Type': 'MTDI',
      Comm: '0',
      Status: '0',
      NodeOrder: 1,
    },
    {
      ID: 'MTDI_002',
      Tag: 'MTDI-2',
      Location: 'Rack-1',
      'Node Type': 'MTDI',
      Comm: '0',
      Status: '4',
      NodeOrder: 2,
    },
    {
      ID: 'MTDI_003',
      Tag: 'MTDI-3',
      Location: 'Rack-1',
      'Node Type': 'MTDI',
      Comm: '0',
      Status: '4',
      NodeOrder: 3,
    },
    {
      ID: 'MTDI_004',
      Tag: 'MTDI-4',
      Location: 'Rack-1',
      'Node Type': 'MTDI',
      Comm: '0',
      Status: '4',
      NodeOrder: 4,
    },
    {
      ID: 'MSDH_001',
      Tag: 'MSDH-1',
      Location: 'Rack-2',
      'Node Type': 'MSDH',
      Comm: '0',
      Status: '4',
      NodeOrder: 1,
    },
    {
      ID: 'MSDH_002',
      Tag: 'MSDH-2',
      Location: 'Rack-2',
      'Node Type': 'MSDH',
      Comm: '0',
      Status: '4',
      NodeOrder: 2,
    },
  ],
};

export const FIXTURE_ZONE_LINES = [];

export const FIXTURE_RACK_JSON = {
  Racks: [],
};

export const FIXTURE_BANDS_JSON = {
  bands: [],
};

/** Layer display labels from drawTopology() in msdh/code.js */
export const TOPOLOGY_LAYER_LABELS = {
  SECTGRP: 'BTS Port Group',
  APOI: 'Axell Point of Interface',
  MTDI: 'Multi Technology Digital Interface',
  MSDH: 'Multi Sector Digital Hub',
  ZONE: 'idRemote',
};

/** Node icon asset map from msdh/code.js imgMap */
export const TOPOLOGY_NODE_ICON_MAP = {
  SECTGRP: '../../src/images/icons/sectgrp_icon.png',
  APOI: '../../src/images/icons/APOI_bigicon.png',
  MTDI: '../../src/images/icons/MTDI_bigicon.png',
  MSDH: '../../src/images/icons/MSDH_bigicon.png',
  ZONE: '../../src/images/icons/zone_icon.png',
};

/**
 * Severity rollup (highest wins). Matches msdh/code.js drawTopology header LED logic.
 * 0=red, 1=orange, 2=yellow, 3=white, 4=green
 * @param {Array<{Comm: NodeCommCode, Status: NodeStatusCode, NodeType?: string, 'Node Type'?: string}>} nodeList
 * @param {{ sectRed?: boolean }} [options]
 * @returns {'0'|'1'|'2'|'3'|'4'}
 */
export function computeLayerSeverity(nodeList, options = {}) {
  let highestSeverity = 4;

  for (const node of nodeList) {
    const nodeType = node.NodeType || node['Node Type'] || '';

    if (node.Comm === '1') {
      return '0';
    }

    if (node.Comm === '0' && node.Status === '0') {
      if (nodeType.includes('SECTGRP')) {
        highestSeverity = options.sectRed ? 0 : 4;
      } else {
        return '0';
      }
    } else if (node.Comm === '0' && node.Status === '1' && highestSeverity > 1) {
      highestSeverity = 1;
    } else if (node.Comm === '0' && node.Status === '2' && highestSeverity > 2) {
      highestSeverity = 2;
    } else if (node.Comm === '0' && node.Status === '3' && highestSeverity > 3) {
      highestSeverity = 3;
    } else if (node.Comm === '0' && node.Status === '4' && highestSeverity > 4) {
      highestSeverity = 4;
    } else if (node.Comm === '-' && node.Status === '1') {
      return '0';
    }
  }

  return String(highestSeverity);
}

/**
 * Build normalized layer model consumed by topologyView.js
 * @param {string} operatorName
 * @returns {Array<{ layerId: string, layerLabel: string, severity: string, nodes: Array<object> }>}
 */
export function buildTopologyLayerModel(operatorName) {
  const sectgrpNode = {
    ID: `sectgrp_${operatorName}_1`,
    name: 'Group A',
    'Node Type': 'SECTGRP',
    Comm: '0',
    Status: '0',
    children: FIXTURE_SECTOR_JSON.sector.map((sector) => ({
      ...sector,
      ID: sector.SectorID,
      'Node Type': 'VIRT_SECT',
      Comm: sector.Comm,
      Status: sector.Status,
    })),
  };

  const apoiNodes = FIXTURE_TOPOLOGY_JSON.nodes.filter((n) => n['Node Type'].includes('APOI'));
  const mtdiNodes = FIXTURE_TOPOLOGY_JSON.nodes.filter((n) => n['Node Type'].includes('MTDI'));
  const msdhNodes = FIXTURE_TOPOLOGY_JSON.nodes.filter((n) => n['Node Type'].includes('MSDH'));

  return [
    {
      layerId: 'SECTGRP',
      layerLabel: TOPOLOGY_LAYER_LABELS.SECTGRP,
      severity: computeLayerSeverity([sectgrpNode], { sectRed: true }),
      nodes: [sectgrpNode],
    },
    {
      layerId: 'APOI',
      layerLabel: TOPOLOGY_LAYER_LABELS.APOI,
      severity: computeLayerSeverity(apoiNodes),
      nodes: apoiNodes,
    },
    {
      layerId: 'MTDI',
      layerLabel: TOPOLOGY_LAYER_LABELS.MTDI,
      severity: computeLayerSeverity(mtdiNodes),
      nodes: mtdiNodes,
    },
    {
      layerId: 'MSDH',
      layerLabel: TOPOLOGY_LAYER_LABELS.MSDH,
      severity: computeLayerSeverity(msdhNodes),
      nodes: msdhNodes,
    },
  ];
}
