/* ==========================================================================
   Historically — Time Machine Sprite & Portal Ring
   Shared by the idle scene, charge, vortex and arrival poses.
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.TimeMachine = (() => {
  'use strict';

  const U = 2;
  const COLORS = {
    ink: '#1a1d26',
    steelMid: '#7c8b99',
    steelDark: '#44505e',
    brassLight: '#e6c27a',
    brassMid: '#b88940',
    cyan: '#72f5ff',
    cyanMid: '#26b6c9',
    cream: '#fff8eb',
    pink: '#f06595',
  };

  function rect(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x) * U, Math.round(y) * U, Math.round(w) * U, Math.round(h) * U);
  }

  function poly(c, points, color) {
    c.fillStyle = color;
    c.beginPath();
    points.forEach(([x, y], index) => {
      const bx = Math.round(x) * U;
      const by = Math.round(y) * U;
      if (index === 0) c.moveTo(bx, by);
      else c.lineTo(bx, by);
    });
    c.closePath();
    c.fill();
  }

  function drawPortalRing(c, cx, cy, phase, energy, reduceMotion) {
    const segments = 18;
    const radius = 23;
    const litCount = energy > 0.6 ? segments : Math.max(4, Math.floor(segments * 0.45));
    const spin = Math.floor(phase) % segments;
    const flash = Math.floor(phase * 2) % 5 === 0;

    for (let i = 0; i < segments; i++) {
      if (i % 2 === 0 && energy < 0.5) continue;
      const angle = (i / segments) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.55;
      const active = (i - spin + segments) % segments < litCount;
      if (!active) continue;
      const color = energy > 0.75 && flash ? COLORS.cream : energy > 0.45 ? COLORS.cyan : COLORS.cyanMid;
      const size = energy > 0.7 ? 3 : 2;
      rect(c, x - size / 2, y - size / 2, size, size, color);
      if (energy > 0.8 && i % 3 === 0) {
        rect(c, x - 1, y - 1, 2, 2, COLORS.cream);
      }
      if (!reduceMotion && energy > 0.7) {
        rect(c, x - 1, y - 1, 1, 1, COLORS.pink);
      }
    }
  }

  function draw(ctx, options) {
    const {
      x,
      baseY,
      timeSec = 0,
      ringPhase = 0,
      energy = 0,
      charge = 0,
      offsetX = 0,
      offsetY = 0,
      reduceMotion = false,
    } = options;

    const cx = Math.round(x + offsetX);
    const by = Math.round(baseY + offsetY);

    // Portal halo behind the hull
    if (energy > 0.25) {
      const halo = energy > 0.7 ? COLORS.cyan : COLORS.cyanMid;
      const haloSize = energy > 0.7 ? 10 : 6;
      rect(ctx, cx - haloSize / 2, by - 25 - haloSize / 2, haloSize, haloSize, halo);
    }
    drawPortalRing(ctx, cx, by - 24, ringPhase, energy, reduceMotion);

    // Landing shadow
    rect(ctx, cx - 18, by, 36, 2, COLORS.ink);
    rect(ctx, cx - 12, by + 2, 24, 1, COLORS.steelDark);

    // Antenna
    rect(ctx, cx - 1, by - 52, 2, 8, COLORS.ink);
    rect(ctx, cx, by - 50, 1, 6, COLORS.steelMid);
    rect(ctx, cx - 2, by - 54, 4, 2, COLORS.ink);
    const beacon = Math.sin(timeSec * 5 + 1) > 0 ? COLORS.cyan : COLORS.cyanMid;
    rect(ctx, cx - 1, by - 54, 2, 1, beacon);

    // Legs
    poly(
      ctx,
      [
        [cx - 12, by - 12],
        [cx - 8, by - 12],
        [cx - 14, by],
        [cx - 18, by],
      ],
      COLORS.ink
    );
    poly(
      ctx,
      [
        [cx + 8, by - 12],
        [cx + 12, by - 12],
        [cx + 18, by],
        [cx + 14, by],
      ],
      COLORS.ink
    );
    rect(ctx, cx - 18, by - 2, 6, 2, COLORS.steelDark);
    rect(ctx, cx + 12, by - 2, 6, 2, COLORS.steelDark);
    rect(ctx, cx - 14, by - 8, 4, 6, COLORS.steelMid);
    rect(ctx, cx + 10, by - 8, 4, 6, COLORS.steelMid);

    // Hull silhouette
    poly(
      ctx,
      [
        [cx - 8, by - 42],
        [cx + 8, by - 42],
        [cx + 16, by - 34],
        [cx + 16, by - 14],
        [cx + 10, by - 8],
        [cx - 10, by - 8],
        [cx - 16, by - 14],
        [cx - 16, by - 34],
      ],
      COLORS.ink
    );

    // Brass dome
    poly(
      ctx,
      [
        [cx - 6, by - 40],
        [cx + 6, by - 40],
        [cx + 14, by - 32],
        [cx + 14, by - 26],
        [cx - 14, by - 26],
        [cx - 14, by - 32],
      ],
      COLORS.brassMid
    );
    rect(ctx, cx - 8, by - 38, 10, 4, COLORS.brassLight);
    rect(ctx, cx + 8, by - 34, 4, 8, COLORS.steelDark);

    // Steel hull
    rect(ctx, cx - 14, by - 24, 28, 12, COLORS.steelMid);
    rect(ctx, cx + 8, by - 24, 6, 12, COLORS.steelDark);
    rect(ctx, cx - 10, by - 12, 20, 2, COLORS.steelDark);
    rect(ctx, cx - 14, by - 26, 28, 2, COLORS.brassLight);

    // Rivets
    rect(ctx, cx - 12, by - 24, 2, 2, COLORS.brassLight);
    rect(ctx, cx + 10, by - 24, 2, 2, COLORS.brassLight);
    rect(ctx, cx - 12, by - 14, 2, 2, COLORS.steelDark);
    rect(ctx, cx + 10, by - 14, 2, 2, COLORS.steelDark);

    // Glass porthole
    rect(ctx, cx - 4, by - 38, 8, 10, COLORS.steelDark);
    rect(ctx, cx - 6, by - 36, 12, 6, COLORS.steelDark);
    rect(ctx, cx - 2, by - 36, 4, 6, COLORS.cyanMid);
    rect(ctx, cx - 4, by - 34, 8, 4, COLORS.cyanMid);
    rect(ctx, cx - 2, by - 36, 2, 2, COLORS.cream);

    // Charge arcs crawling across the hull
    if (charge > 0.05) {
      const arc = Math.floor(ringPhase) % 4;
      const color = arc % 2 === 0 ? COLORS.cyan : COLORS.cream;
      rect(ctx, cx - 14, by - 20 + arc * 2, 3, 1, color);
      rect(ctx, cx + 11, by - 18 - arc, 3, 1, COLORS.cyanMid);
      if (charge > 0.55) {
        rect(ctx, cx - 1, by - 44, 2, 4, COLORS.cream);
        rect(ctx, cx - 18, by - 26, 4, 1, COLORS.cyan);
        rect(ctx, cx + 14, by - 26, 4, 1, COLORS.cyan);
      }
    }
  }

  return { draw, COLORS };
})();
