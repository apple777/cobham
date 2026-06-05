/**
 * Independent D3 v3 topology renderer — driven by platform.settings.json
 * Decoupled from legacy msdh/code.js RequireJS stack.
 */

/** @typedef {object} PlatformSettings */

/**
 * @param {string} commCode
 * @param {string} statusCode
 * @param {string} nodeType
 * @param {{ sectRed?: boolean }} [options]
 * @returns {number} 0=red … 4=green
 */
export function computeDeviceSeverity(commCode, statusCode, nodeType, options = {}) {
  if (commCode === '1') return 0;
  if (commCode === '0' && statusCode === '0') {
    if (nodeType.includes('SECTGRP')) {
      return options.sectRed ? 0 : 4;
    }
    return 0;
  }
  if (commCode === '0' && statusCode === '1') return 1;
  if (commCode === '0' && statusCode === '2') return 2;
  if (commCode === '0' && statusCode === '3') return 3;
  if (commCode === '0' && statusCode === '4') return 4;
  if (commCode === '-' && statusCode !== '1') return 4;
  return 4;
}

/**
 * @param {Array<{ severity?: number, commCode?: string, statusCode?: string, nodeType?: string }>} devices
 * @param {{ sectRed?: boolean }} [options]
 */
export function computeLayerSeverity(devices, options = {}) {
  let highest = 4;
  for (const device of devices) {
    const severity = device.severity ?? computeDeviceSeverity(
      device.commCode || '0',
      device.statusCode || '4',
      device.nodeType || '',
      options,
    );
    if (severity === 0) return 0;
    if (severity < highest) highest = severity;
  }
  return highest;
}

/**
 * @param {PlatformSettings} platformSettings
 * @param {string} containerSelector
 */
export function renderTopologyD3(platformSettings, containerSelector = '#topology-container') {
  const topologyConfig = platformSettings.topologyD3;
  const tokens = platformSettings.designTokens;
  const severityModel = platformSettings.severityModel;

  const container = document.querySelector(containerSelector);
  if (!container) {
    throw new Error(`Topology container not found: ${containerSelector}`);
  }

  container.innerHTML = '';

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight - tokens.layoutTopologyOffsetTopPx;
  const marginLeft = tokens.layoutTopologyMarginLeftPx;
  const marginRight = tokens.layoutTopologyMarginRightPx;
  const nodeHeight = tokens.layoutNodeHeightPx;
  const layerPadding = (viewportHeight - nodeHeight * topologyConfig.layerCountBase)
    / (topologyConfig.layerCountBase + 1);

  container.style.width = `${viewportWidth}px`;
  container.style.height = `${viewportHeight}px`;

  const svg = d3.select(containerSelector)
    .append('svg')
    .attr('id', topologyConfig.svgElementId)
    .attr('class', 'container')
    .attr('width', viewportWidth)
    .attr('height', viewportHeight);

  if (topologyConfig.enableZoom) {
    const zoomListener = d3.behavior.zoom()
      .scaleExtent([topologyConfig.zoomScaleExtentMin, topologyConfig.zoomScaleExtentMax])
      .on('zoom', () => {
        svgGroup.attr('transform', `translate(${d3.event.translate})scale(${d3.event.scale})`);
      });
    svg.call(zoomListener);
  }

  svg.append('rect')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', topologyConfig.canvasBackgroundColor);

  appendSeverityGradients(svg, severityModel.gradientStops);

  const svgGroup = svg.append('g').attr('id', topologyConfig.svgGroupElementId);

  let layerCountOffset = 0;
  const sortedLayers = [...topologyConfig.layers].sort((a, b) => a.layerOrder - b.layerOrder);

  for (const layer of sortedLayers) {
    const layerDevices = layer.devices || [];
    const layerSeverity = layer.layerSeverity ?? computeLayerSeverity(layerDevices, {
      sectRed: layer.layerId === 'SECTGRP',
    });
    const nodeTypeKey = layer.layerId;
    const nodeSize = topologyConfig.nodeSizeMap[nodeTypeKey] || { widthPx: 100, heightPx: 30 };
    const layerOrder = nodeSize.layerOrder + layerCountOffset;
    const isRemoteLayer = layerOrder >= 5;
    const headerY = isRemoteLayer
      ? layerOrder * layerPadding + nodeSize.layerOrder * nodeHeight - topologyConfig.layerRemoteVerticalOffsetPx
      : layerOrder * layerPadding + nodeSize.layerOrder * nodeHeight - topologyConfig.layerVerticalOffsetPx;

    const headerTextY = headerY + tokens.layoutLayerHeaderTextOffsetYPx;
    const headerLedY = headerY + tokens.layoutLayerHeaderLedOffsetYPx;

    const headerGroup = svgGroup.append('g')
      .attr('id', `${layer.layerId}_overall-status`)
      .attr('class', 'layer_header');

    headerGroup.append('rect')
      .attr('width', '100%')
      .attr('height', `${tokens.layoutLayerHeaderHeightPx}px`)
      .attr('x', 0)
      .attr('y', headerY)
      .style('fill', tokens.colorSurfaceLayerHeader);

    headerGroup.append('text')
      .attr('x', tokens.layoutLayerHeaderTextOffsetXPx)
      .attr('y', headerTextY)
      .text(layer.layerLabel)
      .style('fill', tokens.colorTextLayerHeader)
      .style('font-weight', 'bold')
      .style('font-family', tokens.fontFamilyBase)
      .style('font-size', `${tokens.fontSizeBasePx}px`);

    headerGroup.append('circle')
      .attr('id', `${layer.layerId}_overall-status-led`)
      .attr('cx', `${tokens.layoutLayerHeaderLedOffsetXPct}%`)
      .attr('cy', headerLedY)
      .attr('r', tokens.layoutLayerHeaderLedRadiusPx)
      .style('fill', `url(#${severityModel.severityToGradientId[String(layerSeverity)] || 'green'})`);

    const allowedWidth = (viewportWidth - marginRight) / Math.max(layerDevices.length, 1) - marginLeft;
    const totalWidth = Math.max(allowedWidth, nodeSize.widthPx * 0.3);
    const nodeYBase = headerY + tokens.layoutLayerHeaderHeightPx + layerPadding * 0.35;

    layerDevices.forEach((device, index) => {
      const deviceSeverity = device.severity ?? computeDeviceSeverity(
        device.commCode,
        device.statusCode,
        device.nodeType,
        { sectRed: layer.layerId === 'SECTGRP' },
      );
      const iconPath = topologyConfig.nodeIconAssetMap[device.nodeType] || topologyConfig.nodeIconAssetMap.APOI;
      const translateX = marginLeft + ((index + 0.5) / layerDevices.length) * (viewportWidth - marginLeft - marginRight);
      const iconHeight = device.nodeType === 'MTDI' || device.nodeType === 'MSDH'
        ? nodeSize.heightPx * 6
        : nodeSize.heightPx;

      const nodeGroup = svgGroup.append('g')
        .attr('id', device.deviceId)
        .attr('class', `topology-d3-node ${device.nodeType} nodes`)
        .attr('node-type', device.nodeType)
        .attr('transform', `translate(${translateX}, ${nodeYBase})`)
        .attr('cursor', 'pointer')
        .on('click', () => {
          d3.selectAll('.topology-d3-node').classed('is-selected', false);
          d3.select(`#${CSS.escape(device.deviceId)}`).classed('is-selected', true);
        });

      nodeGroup.append('image')
        .attr('xlink:href', iconPath)
        .attr('x', -totalWidth / 2)
        .attr('y', -iconHeight / 2)
        .attr('width', totalWidth)
        .attr('height', iconHeight)
        .style('filter', 'drop-shadow(2px 2px 3px rgba(92, 92, 92, 0.55))');

      nodeGroup.append('circle')
        .attr('id', `${device.deviceId}_led`)
        .attr('cx', totalWidth / 2 - 4)
        .attr('cy', -iconHeight / 2 + 4)
        .attr('r', tokens.layoutLayerHeaderLedRadiusPx)
        .style('fill', `url(#${severityModel.severityToGradientId[String(deviceSeverity)] || 'green'})`);
    });
  }

  return { svg, svgGroup };
}

/**
 * @param {d3.Selection} svg
 * @param {Record<string, { inner: string, outer: string }>} gradientStops
 */
function appendSeverityGradients(svg, gradientStops) {
  const defs = svg.append('defs');
  for (const [gradientId, stops] of Object.entries(gradientStops)) {
    const gradient = defs.append('radialGradient')
      .attr('id', gradientId)
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('fx', '50%')
      .attr('fy', '50%')
      .attr('spreadMethod', 'pad');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', stops.inner).attr('stop-opacity', 1);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', stops.outer).attr('stop-opacity', 1);
  }
}

/**
 * @param {PlatformSettings} platformSettings
 * @param {string} containerSelector
 */
export function rerenderTopologyD3(platformSettings, containerSelector = '#topology-container') {
  return renderTopologyD3(platformSettings, containerSelector);
}

/** @param {PlatformSettings} platformSettings */
export function bindTopologyResize(platformSettings) {
  window.addEventListener('resize', () => {
    renderTopologyD3(platformSettings);
  });
}
