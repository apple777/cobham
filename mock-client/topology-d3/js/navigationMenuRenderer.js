/** @typedef {import('./topologyD3Renderer.js').PlatformSettings} PlatformSettings */

const MENU_HOVER_DELAY_MS = 500;

/**
 * @param {PlatformSettings['navigationMenu']['targetSections'][number]} section
 * @param {PlatformSettings['sessionContext']} sessionContext
 * @returns {string}
 */
function renderMenuSection(section, sessionContext) {
  const headerDomId = section.menuSectionHeaderDomId || section.menuSectionId;
  const visibleItems = section.menuItems.filter((item) => isMenuItemVisible(item, sessionContext));

  if (visibleItems.length === 0) {
    return '';
  }

  return `
    <li class="header" id="${headerDomId}">${section.menuSectionLabel}
      <ul id="${section.menuSectionId}" class="section">
        ${visibleItems.map((item) => renderMenuItem(item)).join('')}
      </ul>
    </li>
  `;
}

/**
 * @param {PlatformSettings['navigationMenu']['targetSections'][number]['menuItems'][number]} menuItem
 * @returns {string}
 */
function renderMenuItem(menuItem) {
  const titleAttr = menuItem.menuItemTitle ? ` title="${menuItem.menuItemTitle}"` : '';
  const itemDomId = menuItem.menuItemDomId || menuItem.menuItemId;

  return `
    <li id="${itemDomId}">
      <a href="${menuItem.href}"${titleAttr}>
        <div class="icon ${menuItem.iconClass}"></div> ${menuItem.menuItemLabel}
      </a>
    </li>
  `;
}

/**
 * @param {PlatformSettings['navigationMenu']['targetSections'][number]['menuItems'][number]} menuItem
 * @param {PlatformSettings['sessionContext']} sessionContext
 * @returns {boolean}
 */
function isMenuItemVisible(menuItem, sessionContext) {
  if (menuItem.visible === false) {
    return false;
  }

  const hideForNonSysadmin = menuItem.hideForNonSysadmin === true;
  if (hideForNonSysadmin && sessionContext.username !== 'sysadmin') {
    return false;
  }

  const hideForReadOnly = menuItem.hideForReadOnly === true;
  if (hideForReadOnly && sessionContext.userAccess === 'RO') {
    return false;
  }

  return true;
}

/**
 * Renders legacy-compatible header menu from platform.settings.json.
 * Target sections are prepended before common sections (same as /js/header.js).
 *
 * @param {PlatformSettings} platformSettings
 */
export function renderNavigationMenuFromSettings(platformSettings) {
  const navigationMenu = platformSettings.navigationMenu;
  const menuListElement = document.querySelector('#header-link-list');

  if (!menuListElement || !navigationMenu) {
    return;
  }

  const sessionContext = platformSettings.sessionContext;
  const targetSectionsHtml = (navigationMenu.targetSections || [])
    .map((section) => renderMenuSection(section, sessionContext))
    .join('');
  const commonSectionsHtml = (navigationMenu.commonSections || [])
    .map((section) => renderMenuSection(section, sessionContext))
    .join('');

  const taglineHtml = navigationMenu.menuTagline
    ? `<li class="navigation-menu-tagline">${navigationMenu.menuTagline}</li>`
    : '';

  menuListElement.innerHTML = `${taglineHtml}${targetSectionsHtml}${commonSectionsHtml}`;
}

/**
 * Mirrors legacy header hover / iPad tap behavior from src/js/header.js.
 */
export function bindNavigationMenuInteraction() {
  const headerElement = document.querySelector('#header');
  const menuListElement = document.querySelector('#header-link-list');

  if (!headerElement || !menuListElement) {
    return;
  }

  const isTouchDevice = navigator.userAgent.match(/iPad/i) != null;
  let hoverDelayTimer;

  const showMenu = () => {
    menuListElement.style.display = 'block';
  };

  const hideMenu = () => {
    menuListElement.style.display = 'none';
  };

  if (isTouchDevice) {
    headerElement.addEventListener('click', showMenu);
    document.addEventListener('touchstart', (event) => {
      if (!headerElement.contains(/** @type {Node} */ (event.target))) {
        hideMenu();
      }
    });
    return;
  }

  headerElement.addEventListener('mouseenter', () => {
    hoverDelayTimer = window.setTimeout(showMenu, MENU_HOVER_DELAY_MS);
  });

  headerElement.addEventListener('mouseleave', () => {
    window.clearTimeout(hoverDelayTimer);
    hideMenu();
  });
}
