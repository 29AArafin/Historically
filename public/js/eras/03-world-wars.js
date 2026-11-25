/* ==========================================================================
   Era 3 — World Wars (1914–1945)
   Overcast olive sky, trench line, barbed wire, smoke columns, lone biplane.
   ========================================================================== */

(function () {
  'use strict';

  const EraUtils = window.Historically.EraUtils;

  const P = {
    skyTop: '#61684f',
    skyMid: '#858868',
    skyHorizon: '#b7a985',
    cloud: '#9b987e',
    smoke: '#4b4a3e',
    smokeLight: '#6b6754',
    trench: '#4b3d2c',
    mud: '#5b4732',
    wire: '#2c2b24',
    plane: '#5f604b',
    olive: '#6b6d4a',
    ember: '#b4633c',
  };

  function drawBiplane(p, x, y) {
    p.rect(x - 9, y, 18, 2, P.plane);
    p.rect(x - 5, y - 3, 10, 2, P.plane);
    p.rect(x - 3, y - 4, 2, 2, P.smoke);
    p.rect(x + 2, y - 4, 2, 2, P.smoke);
    p.rect(x - 11, y + 1, 4, 1, P.plane);
    p.rect(x + 7, y + 1, 4, 1, P.plane);
    p.rect(x - 2, y + 2, 4, 1, P.wire);
    p.rect(x + 10, y - 1, 2, 1, P.wire);
    p.rect(x - 12, y - 1, 2, 1, P.wire);
  }

  function drawSandbag(p, x, y, w) {
    p.rect(x, y, w, 3, P.trench);
    p.rect(x, y, w, 1, P.olive);
    p.rect(x + 1, y + 3, w - 2, 1, P.mud);
  }

  function drawTree(p, x, baseY, sway) {
    const cx = x + sway;
    p.rect(x - 3, baseY - 20, 6, 20, P.trench);
    p.rect(x - 6, baseY - 1, 12, 2, P.wire);
    // Shattered, sooty branches
    p.line(x, baseY - 18, cx - 12, baseY - 36, P.wire, 2);
    p.line(x + 1, baseY - 16, cx + 9, baseY - 30, P.trench, 1);
    p.line(cx - 12, baseY - 36, cx - 19, baseY - 42, P.wire, 1);
    p.line(cx - 12, baseY - 36, cx - 7, baseY - 44, P.trench, 1);
    p.line(cx + 9, baseY - 30, cx + 16, baseY - 42, P.wire, 1);
    p.line(cx + 9, baseY - 30, cx + 4, baseY - 40, P.trench, 1);
    p.line(x - 3, baseY - 12, x - 14, baseY - 20, P.wire, 1);
    p.rect(cx - 19, baseY - 44, 2, 2, P.ember);
    p.rect(cx + 15, baseY - 43, 2, 2, P.ember);
  }

  EraUtils.register({
    id: 'world-wars',
    name: 'World Wars',
    yearRange: '1914–1945',
    representativeYear: 1918,
    palette: P,
    order: 3,

    drawBackdrop(p) {
      const { artW: w, artH: h, groundY: gy } = p;
      const rng = p.rng;
      const b1 = Math.round(gy * 0.4);
      const b2 = Math.round(gy * 0.76);

      p.rect(0, 0, w, b1, P.skyTop);
      p.rect(0, b1, w, b2 - b1, P.skyMid);
      p.rect(0, b2, w, gy - b2, P.skyHorizon);
      p.ditherEdge(b1, P.skyTop, P.skyMid);
      p.ditherEdge(b2, P.skyMid, P.skyHorizon);

      // Heavy overcast banks
      for (let i = 0; i < (p.mobile ? 3 : 6); i++) {
        const x = rng() * w;
        const y = rng() * b2;
        p.rect(x, y, 18 + rng() * 26, 2, P.cloud);
        p.rect(x + 4, y + 2, 12 + rng() * 18, 1, P.smokeLight);
      }

      // Distant ruined skyline
      const horizon = gy - 10;
      p.rect(0, horizon, w, 2, P.smoke);
      for (let i = 0; i < (p.mobile ? 8 : 15); i++) {
        const x = (i / 15) * w + rng() * 6;
        const bh = 4 + rng() * 13;
        p.rect(x, horizon - bh, 3 + rng() * 4, bh, P.smoke);
      }

      // Smoke columns from the far battlefield
      const columns = p.mobile ? [0.18, 0.76] : [0.14, 0.44, 0.78];
      columns.forEach((frac) => {
        const x = Math.round(w * frac);
        p.rect(x - 3, gy - 22, 6, 12, P.smoke);
        p.rect(x - 2, gy - 26, 4, 5, P.smokeLight);
      });

      // Trench line: dark cut, sandbags, posts
      const lineY = gy - 16;
      p.rect(0, lineY, w, 7, P.trench);
      p.rect(0, lineY - 1, w, 2, P.mud);
      for (let x = 0; x < w; x += 9) {
        if (rng() > 0.28) drawSandbag(p, x, lineY - 4, 8);
        if (rng() > 0.55) drawSandbag(p, x + 4, lineY + 4, 7);
      }
      for (let x = 2; x < w; x += 16) {
        p.rect(x, lineY - 9, 1, 11, P.wire);
      }
      p.line(0, lineY - 8, w, lineY - 8, P.wire, 1);
      p.line(0, lineY - 5, w, lineY - 5, P.wire, 1);

      // Barbed wire fence in the near ground
      const fenceY = gy + 7;
      for (let x = 1; x < w; x += 21) {
        p.rect(x, fenceY - 12, 1, 14, P.wire);
        p.line(x - 4, fenceY - 10, x + 5, fenceY - 9, P.wire, 1);
        p.line(x - 3, fenceY - 5, x + 4, fenceY - 6, P.wire, 1);
        p.rect(x + 2, fenceY - 10, 1, 1, P.wire);
        p.rect(x - 2, fenceY - 5, 1, 1, P.wire);
      }
      p.line(0, fenceY - 9, w, fenceY - 9, P.wire, 1);
      p.line(0, fenceY - 5, w, fenceY - 5, P.wire, 1);

      // Muddy churned ground
      p.rect(0, gy, w, h - gy, P.mud);
      p.rect(0, gy, w, 2, P.olive);
      p.rect(0, gy + 2, w, 2, P.trench);
      p.rect(0, gy + 8, w, h - gy - 8, P.mud);
      p.grain(0, gy + 5, w, h - gy - 5, P.trench, 0.12, 1);
      for (let i = 0; i < (p.mobile ? 4 : 8); i++) {
        const x = rng() * w;
        const y = gy + 8 + rng() * 8;
        p.rect(x, y, 7 + rng() * 8, 2, P.smoke);
        p.rect(x + 1, y + 2, 4, 1, P.smokeLight);
      }
      // Duckboards
      for (let x = 4; x < w * 0.3; x += 7) p.rect(x, gy + 15, 5, 2, P.trench);
      for (let x = w * 0.72; x < w; x += 7) p.rect(x, gy + 18, 5, 2, P.trench);
      p.ditherEdge(gy, P.skyHorizon, P.mud);
    },

    drawAmbient(p, timeSec) {
      const { artW: w, groundY: gy } = p;
      // Slow lone biplane crossing the sky
      const planeX = ((timeSec * 4.2 + 20) % (w + 50)) - 25;
      drawBiplane(p, Math.round(planeX), Math.round(gy * 0.28));

      // Battlefield smoke drifting up and sideways
      const columns = p.mobile ? [0.18, 0.76] : [0.14, 0.44, 0.78];
      const puffs = p.mobile ? 2 : 4;
      columns.forEach((frac, ci) => {
        for (let i = 0; i < puffs; i++) {
          const phase = (timeSec * 0.09 + i / puffs + ci * 0.13) % 1;
          const x = w * frac + phase * 16 + Math.sin(phase * 5 + ci) * 2;
          const y = gy - 28 - phase * 34;
          const size = 2 + Math.floor(phase * 6);
          p.rect(x, y, size, 2 + Math.floor(phase * 3), P.smokeLight);
          if (phase > 0.45) p.rect(x + 1, y + 1, size - 1, 2, P.smoke);
        }
      });

      // Sparse drifting ground haze
      if (!p.mobile) {
        p.rect(((timeSec * 3) % (w + 40)) - 20, gy - 18, 22, 1, P.cloud);
      }
    },

    drawTree,
  });
})();
