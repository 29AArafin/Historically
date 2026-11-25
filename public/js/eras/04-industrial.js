/* ==========================================================================
   Era 4 — Industrial & Imperial Age (1815–1914)
   Soot-grey sky, factory chimneys, steam locomotive, brick terraces.
   ========================================================================== */

(function () {
  'use strict';

  const EraUtils = window.Historically.EraUtils;

  const P = {
    skyTop: '#5c5d5c',
    skyMid: '#837d73',
    skyHorizon: '#b39a73',
    smoke: '#3a3734',
    smokeLight: '#6b645b',
    brick: '#8a4a35',
    brickLight: '#b06c4e',
    roof: '#4d3b32',
    steel: '#7b7366',
    rail: '#34312e',
    grass: '#5b593b',
    ember: '#d68a4a',
  };

  function drawChimney(p, x, baseY, width, height) {
    p.rect(x, baseY - height, width, height, P.brick);
    p.rect(x, baseY - height, Math.max(1, width * 0.35), height, P.brickLight);
    p.rect(x - 1, baseY - height - 3, width + 2, 3, P.roof);
    p.rect(x - 1, baseY - height - 4, width + 2, 1, P.brickLight);
    p.rect(x, baseY - height + 2, width, 1, P.roof);
  }

  function drawFactory(p, x, baseY, width, height) {
    p.rect(x, baseY - height, width, height, P.brick);
    p.rect(x, baseY - height, width * 0.4, height, P.brickLight);
    // Sawtooth roof
    for (let i = 0; i < 4; i++) {
      const rx = x + (i / 4) * width;
      p.poly(
        [
          [rx, baseY - height],
          [rx + width / 8, baseY - height - 7],
          [rx + width / 4, baseY - height],
        ],
        P.roof
      );
    }
    // Tall windows
    for (let wy = baseY - height + 8; wy < baseY - 8; wy += 9) {
      for (let wx = x + 4; wx < x + width - 4; wx += 8) {
        p.rect(wx, wy, 4, 5, P.rail);
        if (p.rng() > 0.45) p.rect(wx + 1, wy + 1, 2, 2, P.ember);
      }
    }
  }

  function drawLocomotive(p, x, baseY) {
    // Rails
    p.rect(x - 52, baseY + 1, 124, 1, P.steel);
    p.rect(x - 52, baseY + 3, 124, 1, P.rail);
    for (let rx = x - 50; rx < x + 70; rx += 9) {
      p.rect(rx, baseY + 2, 1, 3, P.rail);
    }

    // Locomotive body
    p.rect(x, baseY - 15, 26, 12, P.rail);
    p.rect(x + 2, baseY - 17, 15, 3, P.steel);
    p.rect(x + 3, baseY - 21, 5, 5, P.rail);
    p.rect(x + 2, baseY - 22, 7, 1, P.steel);
    p.rect(x + 20, baseY - 13, 6, 10, P.roof);
    p.rect(x + 22, baseY - 17, 3, 4, P.rail);
    p.rect(x + 4, baseY - 11, 16, 2, P.rail);
    p.rect(x + 1, baseY - 4, 25, 2, P.brick);
    p.rect(x + 2, baseY - 2, 4, 2, P.rail);
    p.rect(x + 19, baseY - 2, 4, 2, P.rail);
    p.rect(x + 7, baseY - 2, 4, 2, P.steel);
    p.rect(x + 25, baseY - 5, 2, 4, P.ember);

    // Tender and first carriage
    p.rect(x + 28, baseY - 12, 14, 9, P.roof);
    p.rect(x + 29, baseY - 10, 12, 2, P.brick);
    p.rect(x + 30, baseY - 2, 3, 2, P.rail);
    p.rect(x + 37, baseY - 2, 3, 2, P.rail);
    p.rect(x + 45, baseY - 13, 20, 10, P.brick);
    p.rect(x + 47, baseY - 11, 4, 3, P.ember);
    p.rect(x + 53, baseY - 11, 4, 3, P.rail);
    p.rect(x + 46, baseY - 2, 3, 2, P.rail);
    p.rect(x + 60, baseY - 2, 3, 2, P.rail);
  }

  function drawTree(p, x, baseY, sway) {
    const cx = x + sway;
    p.rect(x - 2, baseY - 24, 4, 24, P.roof);
    p.rect(x - 7, baseY - 1, 14, 2, P.rail);
    p.line(x, baseY - 20, cx - 13, baseY - 34, P.rail, 2);
    p.line(x, baseY - 18, cx + 11, baseY - 30, P.rail, 2);
    p.line(cx - 13, baseY - 34, cx - 20, baseY - 38, P.rail, 1);
    p.line(cx - 13, baseY - 34, cx - 9, baseY - 44, P.rail, 1);
    p.line(cx + 11, baseY - 30, cx + 18, baseY - 36, P.rail, 1);
    p.line(cx + 11, baseY - 30, cx + 6, baseY - 43, P.rail, 1);
    p.line(x - 2, baseY - 12, x - 14, baseY - 23, P.rail, 1);
    p.rect(cx - 6, baseY - 30, 4, 2, P.smokeLight);
    p.rect(cx + 8, baseY - 27, 3, 2, P.smokeLight);
    p.rect(cx - 18, baseY - 39, 2, 2, P.ember);
  }

  EraUtils.register({
    id: 'industrial',
    name: 'Industrial & Imperial Age',
    yearRange: '1815–1914',
    representativeYear: 1890,
    palette: P,
    order: 4,

    drawBackdrop(p) {
      const { artW: w, artH: h, groundY: gy } = p;
      const rng = p.rng;
      const b1 = Math.round(gy * 0.4);
      const b2 = Math.round(gy * 0.77);

      p.rect(0, 0, w, b1, P.skyTop);
      p.rect(0, b1, w, b2 - b1, P.skyMid);
      p.rect(0, b2, w, gy - b2, P.skyHorizon);
      p.ditherEdge(b1, P.skyTop, P.skyMid);
      p.ditherEdge(b2, P.skyMid, P.skyHorizon);

      // Smoggy pale sun
      p.rect(w * 0.74, gy * 0.2, 22, 2, P.skyHorizon);
      p.rect(w * 0.74 + 3, gy * 0.2 - 3, 16, 2, P.skyHorizon);
      p.rect(w * 0.74 + 5, gy * 0.2 - 5, 12, 2, P.brickLight);

      // Distant chimney skyline
      const horizon = gy - 6;
      p.rect(0, horizon, w, 2, P.smoke);
      for (let i = 0; i < (p.mobile ? 8 : 16); i++) {
        const x = (i / 16) * w + rng() * 4;
        const bh = 5 + rng() * 18;
        p.rect(x, horizon - bh, 2 + rng() * 3, bh, P.smoke);
      }
      for (let i = 0; i < (p.mobile ? 3 : 5); i++) {
        const x = (0.12 + i * 0.17) * w;
        drawChimney(p, Math.round(x), horizon, 4, Math.round(22 + rng() * 20));
      }

      // Mid-ground factory
      drawFactory(p, Math.round(w * 0.58), gy - 2, Math.round(w * 0.25), Math.round(gy * 0.26));
      drawChimney(p, Math.round(w * 0.61), gy - Math.round(gy * 0.26) - 1, 5, Math.round(gy * 0.4));
      drawChimney(p, Math.round(w * 0.71), gy - Math.round(gy * 0.26) - 1, 6, Math.round(gy * 0.48));
      drawChimney(p, Math.round(w * 0.81), gy - Math.round(gy * 0.26) - 2, 4, Math.round(gy * 0.35));

      // Brick terrace houses
      for (let i = 0; i < 4; i++) {
        const bx = Math.round(w * 0.06 + i * w * 0.055);
        const bh = Math.round(gy * (0.17 + (i % 2) * 0.03));
        p.rect(bx, gy - 4 - bh, Math.round(w * 0.05), bh, P.brick);
        p.rect(bx, gy - 4 - bh, Math.round(w * 0.012), bh, P.brickLight);
        p.poly(
          [
            [bx - 1, gy - 4 - bh],
            [bx + w * 0.025, gy - 8 - bh],
            [bx + w * 0.05 + 1, gy - 4 - bh],
          ],
          P.roof
        );
        p.rect(bx + 3, gy - bh - 1, 3, 4, P.rail);
        p.rect(bx + 3, gy - bh, 2, 2, P.ember);
        drawChimney(p, bx + 2, gy - 4 - bh - 5, 2, 5);
      }

      // Locomotive on the rail line behind the machine
      drawLocomotive(p, Math.round(w * 0.25), gy - 10);
      p.rect(0, gy - 8, w, 1, P.rail);

      // Cobbled street
      p.rect(0, gy, w, h - gy, P.rail);
      p.rect(0, gy, w, 3, P.brick);
      p.rect(0, gy + 3, w, h - gy - 3, P.rail);
      for (let y = gy + 6; y < h; y += 5) {
        for (let x = 0; x < w; x += 7) {
          const off = ((y / 5) % 2) * 3;
          p.rect(x + off, y, 5, 1, P.smoke);
        }
      }
      p.grain(0, gy + 5, w, h - gy - 5, P.smokeLight, 0.035, 1);
      p.ditherEdge(gy, P.skyHorizon, P.brick);
    },

    drawAmbient(p, timeSec) {
      const { artW: w, groundY: gy } = p;
      const chimneyXs = [0.61, 0.71, 0.81];
      const puffs = p.mobile ? 2 : 3;
      chimneyXs.forEach((frac, ci) => {
        const h = gy * (ci === 1 ? 0.48 : ci === 0 ? 0.4 : 0.35);
        const baseY = gy - gy * 0.26 - h;
        for (let i = 0; i < puffs; i++) {
          const phase = (timeSec * 0.11 + i / puffs + ci * 0.21) % 1;
          const x = w * frac + phase * (14 + ci * 5) + Math.sin(phase * 4 + ci) * 2;
          const y = baseY - 3 - phase * 34;
          const size = 2 + Math.floor(phase * 5);
          p.rect(x, y, size, 2 + Math.floor(phase * 2), P.smokeLight);
          p.rect(x + 1, y + 1, size - 1, 1, P.smoke);
        }
      });

      // Locomotive steam
      const lx = Math.round(w * 0.25) + 5;
      for (let i = 0; i < (p.mobile ? 2 : 4); i++) {
        const phase = (timeSec * 0.35 + i / 4) % 1;
        p.rect(lx + phase * 12, gy - 34 - phase * 16, 3 + phase * 3, 2, P.smokeLight);
      }

      // Low smog bank
      const smogX = ((timeSec * 2.2) % (w + 60)) - 30;
      p.rect(smogX, gy - 22, 38, 2, P.smokeLight);
      p.rect(smogX + 7, gy - 20, 24, 1, P.smoke);
    },

    drawTree,
  });
})();
