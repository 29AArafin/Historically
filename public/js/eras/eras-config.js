/* ==========================================================================
   Historically — Era Config
   The single ordered era registry used by the scene, timeline and game loop.
   Add an era by creating its module and adding it to the registry.
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.Eras = (() => {
  'use strict';

  const Utils = window.Historically.EraUtils;
  const list = Utils.registry.slice().sort((a, b) => a.order - b.order);

  // Compact labels keep the mobile HUD inside the viewport.
  const SHORT_NAMES = {
    digital: 'DIGITAL',
    'cold-war': 'COLD WAR',
    'world-wars': 'WORLD WARS',
    industrial: 'INDUSTRIAL',
    revolutions: 'REVOLUTIONS',
    renaissance: 'RENAISSANCE',
    medieval: 'MEDIEVAL',
    classical: 'CLASSICAL',
    'bronze-age': 'BRONZE AGE',
    prehistory: 'PREHISTORY',
  };

  list.forEach((era) => {
    era.shortName = SHORT_NAMES[era.id] || era.name;
  });

  function eraIndexForYear(year) {
    if (year >= 1990) return 0;
    if (year >= 1945) return 1;
    if (year >= 1914) return 2;
    if (year >= 1815) return 3;
    if (year >= 1648) return 4;
    if (year >= 1400) return 5;
    if (year >= 500) return 6;
    if (year >= -800) return 7;
    if (year >= -3000) return 8;
    return 9;
  }

  function formatYear(year) {
    if (year < 0) return `${Math.abs(year)} BCE`;
    return `${year} CE`;
  }

  function formatShortYear(year) {
    if (year < 0) return `${Math.abs(year)} BCE`;
    return String(year);
  }

  function get(index) {
    return list[Math.max(0, Math.min(list.length - 1, index))];
  }

  return {
    list,
    count: list.length,
    eraIndexForYear,
    formatYear,
    formatShortYear,
    get,
  };
})();
