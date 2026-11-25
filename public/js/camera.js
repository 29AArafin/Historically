/* ==========================================================================
   Historically — Depth & Camera Controller
   Maps historical years to vertical world coordinates and eases the camera
   down through the subterranean strata after each answer.
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.WorldCamera = (() => {
  'use strict';

  // Surface ground line in logical art units (2 buffer px per art unit)
  const SURFACE_Y = 96;
  const MAX_DEPTH = 680;
  const EASE_DURATION_MS = 1900;

  // Era tick stops along the right-edge ruler (depth measured below SURFACE_Y)
  const ERA_STOPS = [
    { year: 2026, label: '2026 . TODAY', depth: 0 },
    { year: 1800, label: '1800 . INDUSTRIAL', depth: 120 },
    { year: 1400, label: '1400 . RENAISSANCE', depth: 210 },
    { year: 500, label: '500 . MIDDLE AGES', depth: 310 },
    { year: 1, label: '1 CE . CLASSICAL', depth: 405 },
    { year: -3000, label: '3000 BCE . BRONZE', depth: 525 },
    { year: -10000, label: '10000 BCE . STONE', depth: 660 },
  ];

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Piecewise-linear map from historical year to depth below ground
  function yearToDepth(year) {
    if (year >= ERA_STOPS[0].year) return 0;

    for (let i = 0; i < ERA_STOPS.length - 1; i++) {
      const upper = ERA_STOPS[i];
      const lower = ERA_STOPS[i + 1];
      if (year <= upper.year && year >= lower.year) {
        const span = upper.year - lower.year;
        const frac = span === 0 ? 0 : (upper.year - year) / span;
        return upper.depth + frac * (lower.depth - upper.depth);
      }
    }

    const last = ERA_STOPS[ERA_STOPS.length - 1];
    const extra = Math.min(20, ((last.year - year) / 2000) * 20);
    return Math.min(MAX_DEPTH, last.depth + extra);
  }

  function createCamera() {
    const state = {
      currentYear: 2026,
      depth: 0,
      scrollY: 0,
      animStartDepth: 0,
      animTargetDepth: 0,
      animStartScroll: 0,
      animTargetScroll: 0,
      animStartTime: 0,
      isAnimating: false,
      onComplete: null,
    };

    function computeTargetScroll(depth, viewArtHeight) {
      if (depth <= 0) return 0;
      const worldY = SURFACE_Y + depth;
      const anchorY = viewArtHeight * 0.44;
      return Math.max(0, worldY - anchorY);
    }

    function snapToYear(year, viewArtHeight) {
      state.currentYear = year;
      state.depth = yearToDepth(year);
      state.scrollY = computeTargetScroll(state.depth, viewArtHeight);
      state.isAnimating = false;
      state.onComplete = null;
    }

    function descendToYear(year, viewArtHeight, reduceMotion, onComplete) {
      const targetDepth = yearToDepth(year);
      const targetScroll = computeTargetScroll(targetDepth, viewArtHeight);
      state.currentYear = year;

      if (reduceMotion) {
        state.depth = targetDepth;
        state.scrollY = targetScroll;
        state.isAnimating = false;
        if (onComplete) onComplete();
        return;
      }

      state.animStartDepth = state.depth;
      state.animTargetDepth = targetDepth;
      state.animStartScroll = state.scrollY;
      state.animTargetScroll = targetScroll;
      state.animStartTime = performance.now();
      state.isAnimating = true;
      state.onComplete = onComplete || null;
    }

    function update(nowMs) {
      if (!state.isAnimating) return;

      const elapsed = nowMs - state.animStartTime;
      const progress = Math.min(1, elapsed / EASE_DURATION_MS);
      const eased = easeInOutCubic(progress);

      state.depth =
        state.animStartDepth + (state.animTargetDepth - state.animStartDepth) * eased;
      state.scrollY =
        state.animStartScroll + (state.animTargetScroll - state.animStartScroll) * eased;

      if (progress >= 1) {
        state.depth = state.animTargetDepth;
        state.scrollY = state.animTargetScroll;
        state.isAnimating = false;
        const cb = state.onComplete;
        state.onComplete = null;
        if (cb) cb();
      }
    }

    // Returns where the floating prompt panel should sit in screen pixels (0..viewportH)
    function getPanelScreenY(roundIndex, viewArtHeight, scale) {
      // Round 1 sits just under the ground line, near the time machine
      const worldAnchor =
        roundIndex === 0 ? SURFACE_Y + 34 : SURFACE_Y + state.depth;
      return (worldAnchor - state.scrollY) * 2 * scale;
    }

    function getDepthRatio() {
      return Math.min(1, Math.max(0, state.depth / MAX_DEPTH));
    }

    return {
      SURFACE_Y,
      MAX_DEPTH,
      ERA_STOPS,
      state,
      yearToDepth,
      snapToYear,
      descendToYear,
      update,
      getPanelScreenY,
      getDepthRatio,
    };
  }

  return {
    SURFACE_Y,
    MAX_DEPTH,
    ERA_STOPS,
    yearToDepth,
    createCamera,
  };
})();
