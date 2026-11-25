/* ==========================================================================
   Era 1 — Digital Age (1990–2026)
   Clear blue sky, glass towers, satellite dish, power lines, paved road.
   ========================================================================== */

(function () {
  'use strict';

  const EraUtils = window.Historically.EraUtils;

  const P = {
    skyTop: '#2f8fd8',
    skyMid: '#6ab9ea',
    skyHorizon: '#c9edf7',
    glassLight: '#bfe9f7',
    glassMid: '#76b6cf',
    glassDark: '#356982',
    lit: '#f3df8f',
    concrete: '#9aa7b2',
    asphalt: '#3b424d',
    leaf: '#4f8f3e',
    leafDark: '#2d5c2c',
    bark: '#5a4632',
  };

  function drawTower(p, x, baseY, w, h, litSeed) {
    const rng = p.rng;
    p.rect(x, baseY - h, w, h, P.glassMid);
    p.rect(x, baseY - h, Math.max(1, w * 0.45), h, P.glassLight);
    p.rect(x + w - Math.max(1, w * 0.3), baseY - h, Math.max(1, w * 0.3), h, P.glassDark);
    p.rect(x, baseY - h, w, 1, P.glassDark);

    const cols = Math.max(2, Math.floor(w / 3));
    const rows = Math.max(3, Math.floor(h / 4));
    for (let row = 1; row < rows - 1; row++) {
      for (let col = 1; col < cols; col++) {
        if (rng() > 0.52) {
          const wx = x + 1 + (col / cols) * (w - 2);
          const wy = baseY - h + 2 + (row / rows) * (h - 4);
          p.rect(wx, wy, 1, 1, rng() > 0.2 ? P.lit : P.glassLight);
        }
      }
    }

    // Rooftop mast and blinking beacon
    p.rect(x + w / 2 - 0.5, baseY - h - 6, 1, 6, P.glassDark);
    p.rect(x + w / 2 - 1, baseY - h - 7, 2, 2, litSeed ? P.lit : P.glassLight);
  }

  function drawSatelliteDish(p, x, y) {
    p.rect(x - 1, y, 2, 12, P.glassDark);
    p.poly(
      [
        [x - 8, y - 7],
        [x + 2, y - 11],
        [x + 8, y - 6],
        [x - 1, y - 1],
      ],
      P.concrete
    );
    p.poly(
      [
        [x - 5, y - 6],
        [x + 1, y - 9],
        [x + 3, y - 5],
        [x - 3, y - 3],
      ],
      P.lit
    );
    p.line(x + 1, y - 5, x + 7, y - 12, P.glassDark, 1);
    p.rect(x + 6, y - 13, 2, 2, P.lit);
  }

  function drawTree(p, x, baseY, sway) {
    p.rect(x - 2, baseY - 25, 4, 25, P.bark);
    p.rect(x - 7, baseY - 1, 14, 2, P.bark);
    p.line(x, baseY - 19, x - 8, baseY - 28, P.bark, 2);
    p.line(x + 2, baseY - 20, x + 9, baseY - 30, P.bark, 2);
    p.line(x - 1, baseY - 22, x - 12, baseY - 32, P.bark, 1);
    p.line(x + 1, baseY - 23, x + 12, baseY - 34, P.bark, 1);

    const cx = x + sway;
    p.rect(cx - 18, baseY - 44, 36, 12, P.leafDark);
    p.rect(cx - 14, baseY - 50, 28, 10, P.leafDark);
    p.rect(cx - 8, baseY - 54, 16, 6, P.leafDark);

    p.rect(cx - 16, baseY - 42, 30, 9, P.leaf);
    p.rect(cx - 10, baseY - 50, 20, 8, P.leaf);
    p.rect(cx - 3, baseY - 54, 11, 6, P.leaf);
    p.rect(cx + 8, baseY - 38, 9, 6, P.leaf);
    p.rect(cx - 12, baseY - 37, 8, 5, P.leafDark);
    p.rect(cx + 3, baseY - 47, 4, 3, P.skyHorizon);
  }

  EraUtils.register({
    id: 'digital',
    name: 'Digital Age',
    yearRange: '1990–2026',
    representativeYear: 2026,
    palette: P,
    order: 1,

    drawBackdrop(p) {
      const { artW: w, artH: h, groundY: gy } = p;
      const rng = p.rng;
      const b1 = Math.round(gy * 0.44);
      const b2 = Math.round(gy * 0.8);

      p.rect(0, 0, w, b1, P.skyTop);
      p.rect(0, b1, w, b2 - b1, P.skyMid);
      p.rect(0, b2, w, gy - b2, P.skyHorizon);
      p.ditherEdge(b1, P.skyTop, P.skyMid);
      p.ditherEdge(b2, P.skyMid, P.skyHorizon);

      // Blocky sun in the upper right
      const sx = Math.round(w * 0.82);
      const sy = Math.round(gy * 0.2);
      p.rect(sx - 9, sy - 5, 18, 10, P.skyHorizon);
      p.rect(sx - 5, sy - 9, 10, 18, P.skyHorizon);
      p.rect(sx - 6, sy - 6, 12, 12, P.lit);

      // Distant glass skyline
      const horizon = gy - 8;
      const towerCount = p.mobile ? 9 : 17;
      for (let i = 0; i < towerCount; i++) {
        const frac = (i + 0.5) / towerCount;
        const x = frac * w;
        const bw = p.mobile ? 7 + rng() * 5 : 6 + rng() * 8;
        const bh = 18 + rng() * (p.mobile ? 26 : 42);
        drawTower(p, Math.round(x - bw / 2), horizon, Math.round(bw), Math.round(bh), false);
      }

      // Mid-ground glass towers
      drawTower(p, Math.round(w * 0.08), horizon + 4, Math.round(w * 0.1), Math.round(gy * 0.48), true);
      drawTower(p, Math.round(w * 0.27), horizon + 4, Math.round(w * 0.08), Math.round(gy * 0.4), false);
      drawTower(p, Math.round(w * 0.7), horizon + 4, Math.round(w * 0.12), Math.round(gy * 0.5), true);

      // Satellite dish on a low roof
      p.rect(w * 0.56, horizon - 10, w * 0.07, 10, P.glassDark);
      p.rect(w * 0.56, horizon - 10, w * 0.07, 2, P.glassMid);
      drawSatelliteDish(p, Math.round(w * 0.59), horizon - 10);

      // Road behind the plaza
      const roadY = gy - 9;
      p.rect(0, roadY, w, 9, P.asphalt);
      p.rect(0, roadY, w, 1, P.concrete);
      for (let x = 4; x < w; x += 18) {
        p.rect(x, roadY + 4, 8, 1, P.lit);
      }
      // A blocky car
      const carX = Math.round(w * 0.18);
      p.rect(carX, roadY + 1, 11, 4, P.glassDark);
      p.rect(carX + 2, roadY - 1, 6, 2, P.glassMid);
      p.rect(carX + 1, roadY + 5, 2, 2, P.concrete);
      p.rect(carX + 8, roadY + 5, 2, 2, P.concrete);

      // Power poles and sagging wires
      const poles = p.mobile ? [3, w - 5] : [3, w * 0.34, w - 5];
      poles.forEach((px) => {
        p.rect(px, gy - 50, 2, 50, P.glassDark);
        p.rect(px - 5, gy - 48, 12, 2, P.glassDark);
        p.rect(px - 3, gy - 44, 8, 1, P.glassDark);
      });
      for (let i = 0; i < poles.length - 1; i++) {
        const ax = poles[i] + 1;
        const bx = poles[i + 1] + 1;
        for (let x = ax; x < bx; x += 2) {
          const t = (x - ax) / Math.max(1, bx - ax);
          const sag = Math.sin(t * Math.PI) * 5;
          p.rect(x, gy - 49 + sag, 2, 1, P.glassDark);
          p.rect(x, gy - 45 + sag * 1.2, 2, 1, P.glassDark);
        }
      }

      // Foreground paved plaza
      p.rect(0, gy, w, h - gy, P.concrete);
      p.rect(0, gy, w, 2, P.glassLight);
      p.rect(0, gy + 2, w, 2, P.glassMid);
      p.rect(0, gy + 8, w, h - gy - 8, P.concrete);
      for (let x = 0; x < w; x += 14) {
        p.rect(x, gy + 4, 1, h - gy - 4, P.glassMid);
      }
      for (let y = gy + 12; y < h; y += 9) {
        p.rect(0, y, w, 1, P.glassMid);
      }
      p.grain(0, gy + 4, w, h - gy - 4, P.glassMid, 0.035, 1);
      p.ditherEdge(gy, P.skyHorizon, P.concrete);
    },

    drawAmbient(p, timeSec) {
      const { artW: w, groundY: gy } = p;
      const clouds = p.mobile
        ? [{ x: 0.2, y: 0.14, s: 0.8, v: 2.2 }]
        : [
            { x: 0.1, y: 0.16, s: 0.9, v: 2.2 },
            { x: 0.56, y: 0.1, s: 0.7, v: 1.5 },
            { x: 0.8, y: 0.3, s: 0.6, v: 1.8 },
          ];
      clouds.forEach((cloud) => {
        const wrap = w + 50;
        const x = ((cloud.x * wrap + timeSec * cloud.v) % wrap) - 25;
        p.cloud(x, gy * cloud.y, cloud.s, P.skyHorizon, P.glassLight);
      });

      // Two windows blink on the near tower
      const blink = Math.floor(timeSec * 1.4) % 3;
      const wx = Math.round(w * 0.7) + 4;
      const wy = gy - 34;
      if (blink !== 1) p.rect(wx, wy, 1, 1, P.lit);
      if (blink === 2) p.rect(wx + 3, wy + 6, 1, 1, P.skyHorizon);
    },

    drawTree,
  });
})();
