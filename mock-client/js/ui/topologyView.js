import {
  TOPOLOGY_LAYER_LABELS,
  TOPOLOGY_NODE_ICON_MAP,
  buildTopologyLayerModel,
  computeLayerSeverity,
} from '../fixtures/fixtureSnapshot.js';

/**
 * @param {HTMLElement} rootElement
 * @param {string} operatorName
 * @param {{ onNodeClick?: (node: object) => void }} [handlers]
 */
export function renderTopologyView(rootElement, operatorName, handlers = {}) {
  const layerModel = buildTopologyLayerModel(operatorName);

  rootElement.innerHTML = `
    <div class="topology-canvas" data-component="topology-canvas">
      <div class="topology-canvas__layers" data-bind="topologyLayers"></div>
    </div>
  `;

  const layersContainer = rootElement.querySelector('[data-bind="topologyLayers"]');
  if (!layersContainer) {
    return;
  }

  for (const layer of layerModel) {
    layersContainer.appendChild(createTopologyLayerElement(layer, handlers));
  }
}

/**
 * @param {{ layerId: string, layerLabel: string, severity: string, nodes: Array<object> }} layer
 * @param {{ onNodeClick?: (node: object) => void }} handlers
 */
function createTopologyLayerElement(layer, handlers) {
  const layerElement = document.createElement('section');
  layerElement.className = 'topology-layer';
  layerElement.dataset.layerId = layer.layerId;

  layerElement.innerHTML = `
    <header class="topology-layer__header">
      <span class="topology-layer__title">${layer.layerLabel}</span>
      <span class="topology-layer__status-led" data-severity="${layer.severity}" aria-label="Layer status"></span>
    </header>
    <div class="topology-layer__content" data-bind="layerNodes"></div>
  `;

  const nodesContainer = layerElement.querySelector('[data-bind="layerNodes"]');

  for (const node of layer.nodes) {
    nodesContainer?.appendChild(createTopologyNodeButton(layer.layerId, node, handlers));
  }

  return layerElement;
}

/**
 * @param {string} layerId
 * @param {object} node
 * @param {{ onNodeClick?: (node: object) => void }} handlers
 */
function createTopologyNodeButton(layerId, node, handlers) {
  const nodeType = String(node['Node Type'] || '');
  const iconKey = resolveIconKey(nodeType);
  const iconClass = resolveIconSizeClass(iconKey);
  const severity = computeNodeSeverity(node, layerId);
  const isEmptyGroup = Array.isArray(node.children) && node.children.length === 0;

  const buttonElement = document.createElement('button');
  buttonElement.type = 'button';
  buttonElement.className = `topology-node${isEmptyGroup ? ' is-empty' : ''}`;
  buttonElement.dataset.nodeId = String(node.ID || node.name || '');
  buttonElement.dataset.nodeType = nodeType;
  buttonElement.title = String(node.Tag || node.name || node.ID || '');

  buttonElement.innerHTML = `
    <img
      class="topology-node__icon topology-node__icon--${iconClass}"
      src="${TOPOLOGY_NODE_ICON_MAP[iconKey]}"
      alt="${nodeType}"
      draggable="false"
    />
    <span class="topology-node__led" data-severity="${severity}" aria-hidden="true"></span>
  `;

  buttonElement.addEventListener('click', () => {
    document.querySelectorAll('.topology-node.is-selected').forEach((element) => {
      element.classList.remove('is-selected');
    });
    buttonElement.classList.add('is-selected');
    handlers.onNodeClick?.(node);
  });

  return buttonElement;
}

/**
 * @param {string} nodeType
 */
function resolveIconKey(nodeType) {
  if (nodeType.includes('SECTGRP')) return 'SECTGRP';
  if (nodeType.includes('APOI')) return 'APOI';
  if (nodeType.includes('MTDI')) return 'MTDI';
  if (nodeType.includes('MSDH')) return 'MSDH';
  if (nodeType.includes('ZONE')) return 'ZONE';
  return 'APOI';
}

/**
 * @param {string} iconKey
 */
function resolveIconSizeClass(iconKey) {
  return iconKey.toLowerCase();
}

/**
 * @param {object} node
 * @param {string} layerId
 */
function computeNodeSeverity(node, layerId) {
  if (layerId === 'SECTGRP') {
    return computeLayerSeverity([node], { sectRed: true });
  }
  return computeLayerSeverity([node]);
}

export { TOPOLOGY_LAYER_LABELS };
