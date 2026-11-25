/* ==========================================================================
   Era 7 — Medieval (500–1400)
   Cool misty dawn, hilltop castle, village huts, windmill, tower banner.
   ========================================================================== */

(function () {
  'use strict';

  const EraUtils = window.Historically.EraUtils;

  const P = {
    skyTop: '#5f7482',
    skyMid: '#8ea4af',
    skyHorizon: '#d6c9b5',
    mist: '#aebcbd',
    stone: '#928f84',
    stoneDark: '#5f5e57',
    hill: '#465442',
    hillLight: '#5c6e52',
    thatch: '#a78a55',
    wood: '#634b34',
    banner: '#a83f45',
    flame: '#e0a15a',
  };

  function castleMetrics(p) {
    return {
      x: Math.round(p.artW * 0.72),
      baseY: p.groundY - 33,
    };
  }

  function drawWindmill(p, x, baseY, timeSec, withSails) {
    p.rect(x - 5, baseY - 24, 10, 24, P.stone);
    p.rect(x - 5, baseY - 24, 3, 24, P.stoneDark);
    p.poly(
      [
        [x - 7, baseY - 24],
        [x, baseY - 30],
        [x + 7, baseY - 24],
      ],
      P.wood
    );
    p.rect(x - 2, baseY - 9, 4, 9, P.wood);
    if (!withSails) return;
    const hubX = x;
    const hubY = baseY - 31;
    p.circle(hubX, hubY, 1, P.wood);
    for (let i = 0; i < 4; i++) {
      const angle = timeSec * 0.55 + (i * Math.PI) / 2;
      const ex = hubX + Math.cos(angle) * 12;
      const ey = hubY + Math.sin(angle) * 12;
      p.line(hubX, hubY, ex, ey, P.wood, 1);
      const px = hubX + Math.cos(angle + 0.35) * 9;
      const py = hubY + Math.sin(angle + 0.35) * 9;
      p.rect(px - 2, py, 4, 2, P.thatch);
    }
  }

  function drawTree(p, x, baseY, sway) {
    const cx = x + sway;
    p.rect(x - 3, baseY - 25, 6, 25, P.wood);
    p.rect(x - 7, baseY - 1, 14, 2, P.stoneDark);
    p.line(x, baseY - 20, cx - 12, baseY - 33, P.wood, 2);
    p.line(x + 1, baseY - 21, cx + 10, baseY - 31, P.wood, 2);
    p.line(cx - 12, baseY - 33, cx - 18, baseY - 41, P.wood, 1);
    p.line(cx - 12, baseY - 33, cx - 7, baseY - 43, P.wood, 1);
    p.line(cx + 10, baseY - 31, cx + 17, baseY - 38, P.wood, 1);
    p.line(cx + 10, baseY - 31, cx + 7, baseY - 42, P.wood, 1);
    // Sparse old canopy
    p.rect(cx - 18, baseY - 44, 36, 12, P.hillLight);
    p.rect(cx - 14, baseY - 49, 26, 7, P.hillLight);
    p.rect(cx - 16, baseY - 42, 30, 7, P.hill);
    p.rect(cx - 9, baseY - 47, 18, 5, P.hill);
    p.rect(cx + 8, baseY - 40, 8, 5, P.hill);
    p.rect(cx - 6, baseY - 46, 5, 3, P.stone);
    p.rect(cx + 2, baseY - 38, 4, 2, P.stoneDark);
  }

  EraUtils.register({
    id: 'medieval',
    name: 'Medieval',
    yearRange: '500–1400',
    representativeYear: 1100,
    palette: P,
    order: 7,

    drawBackdrop(p) {
      const { artW: w, artH: h, groundY: gy } = p;
      const rng = p.rng;
      const b1 = Math.round(gy * 0.38);
      const b2 = Math.round(gy * 0.72);

      p.rect(0, 0, w, b1, P.skyTop);
      p.rect(0, b1, w, b2 - b1, P.skyMid);
      p.rect(0, b2, w, gy - b2, P.skyHorizon);
      p.ditherEdge(b1, P.skyTop, P.skyMid);
      p.ditherEdge(b2, P.skyMid, P.skyHorizon);

      // Pale dawn glow
      p.rect(w * 0.24, gy * 0.44, 34, 2, P.skyHorizon);
      p.rect(w * 0.24 + 6, gy * 0.44 - 3, 22, 2, P.skyHorizon);
      p.rect(w * 0.24 + 10, gy * 0.44 - 5, 14, 2, P.mist);

      // Layered distant hills
      p.poly(
        [
          [0, gy - 8],
          [0, gy - 25],
          [w * 0.18, gy - 33],
          [w * 0.4, gy - 19],
          [w * 0.56, gy - 27],
          [w * 0.8, gy - 16],
          [w, gy - 26],
          [w, gy - 8],
        ],
        P.mist
      );
      p.poly(
        [
          [0, gy - 4],
          [0, gy - 18],
          [w * 0.2, gy - 22],
          [w * 0.46, gy - 12],
          [w * 0.66, gy - 20],
          [w * 0.9, gy - 10],
          [w, gy - 16],
          [w, gy - 4],
        ],
        P.hill
      );

      // Castle hill
      p.poly(
        [
          [w * 0.48, gy - 4],
          [w * 0.58, gy - 22],
          [w * 0.72, gy - 33],
          [w * 0.86, gy - 20],
          [w, gy - 12],
          [w, gy - 4],
        ],
        P.hillLight
      );
      p.poly(
        [
          [w * 0.56, gy - 4],
          [w * 0.68, gy - 20],
          [w * 0.82, gy - 10],
          [w, gy - 4],
        ],
        P.hill
      );
      p.grain(w * 0.48, gy - 24, w * 0.5, 18, P.hill, 0.14, 1);

      // Castle on the hill
      const castle = castleMetrics(p);
      const cw = Math.round(w * 0.1);
      const ch = Math.round(gy * 0.22);
      p.rect(castle.x - cw / 2, castle.baseY - ch, cw, ch, P.stone);
      p.rect(castle.x - cw / 2, castle.baseY - ch, cw * 0.35, ch, P.stoneDark);
      // Battlements
      for (let i = 0; i < 6; i++) {
        p.rect(castle.x - cw / 2 + i * (cw / 6), castle.baseY - ch - 4, cw / 10, 4, P.stone);
      }
      // Flanking towers
      [castle.x - cw / 2 - 3, castle.x + cw / 2 - 4].forEach((tx) => {
        const th = ch + 9;
        p.rect(tx, castle.baseY - th, 8, th, P.stone);
        p.rect(tx, castle.baseY - th, 3, th, P.stoneDark);
        for (let i = 0; i < 3; i++) {
          p.rect(tx + i * 3, castle.baseY - th - 3, 2, 3, P.stone);
        }
        p.rect(tx + 3, castle.baseY - th + 6, 2, 3, P.stoneDark);
      });
      // Gate and windows
      p.poly(
        [
          [castle.x - 5, castle.baseY],
          [castle.x - 5, castle.baseY - 8],
          [castle.x - 2, castle.baseY - 11],
          [castle.x + 2, castle.baseY - 11],
          [castle.x + 5, castle.baseY - 8],
          [castle.x + 5, castle.baseY],
        ],
        P.stoneDark
      );
      p.rect(castle.x - cw * 0.28, castle.baseY - ch + 5, 2, 3, P.wood);
      p.rect(castle.x + cw * 0.18, castle.baseY - ch + 7, 2, 3, P.wood);
      p.rect(castle.x - cw * 0.05, castle.baseY - ch + 10, 2, 3, P.flame);

      // Banner pole (flag is animated)
      p.rect(castle.x - 1, castle.baseY - ch - 18, 1, 14, P.stoneDark);
      p.rect(castle.x - 2, castle.baseY - ch - 19, 3, 2, P.banner);

      // Village huts
      for (let i = 0; i < (p.mobile ? 2 : 3); i++) {
        const hx = Math.round(w * (0.06 + i * 0.11));
        const hw = Math.round(w * (0.09 - i * 0.012));
        const hh = Math.round(gy * 0.1);
        p.rect(hx, gy - 4 - hh, hw, hh, P.stone);
        p.rect(hx, gy - 4 - hh, hw * 0.35, hh, P.wood);
        p.poly(
          [
            [hx - 3, gy - 4 - hh],
            [hx + hw / 2, gy - 12 - hh],
            [hx + hw + 3, gy - 4 - hh],
          ],
          P.thatch
        );
        p.rect(hx + hw * 0.55, gy - 4 - hh - 9, 2, 6, P.stoneDark);
        p.rect(hx + hw * 0.55, gy - 4 - hh - 10, 2, 1, P.stone);
        p.rect(hx + hw * 0.2, gy - 4 - hh + 4, 3, 4, P.stoneDark);
        p.rect(hx + hw * 0.58, gy - 4 - hh + 3, 3, 5, P.flame);
        p.rect(hx - 2, gy - 4, hw + 4, 2, P.wood);
      }

      // Windmill on its rise
      p.poly(
        [
          [w * 0.06, gy - 2],
          [w * 0.16, gy - 11],
          [w * 0.28, gy - 2],
        ],
        P.hill
      );
      drawWindmill(p, Math.round(w * 0.16), gy - 8, 0, false);

      // Foreground meadow
      p.rect(0, gy, w, h - gy, P.hill);
      p.rect(0, gy, w, 2, P.hillLight);
      p.rect(0, gy + 2, w, 3, P.hill);
      p.rect(0, gy + 6, w, h - gy - 6, P.hill);
      for (let x = 0; x < w; x += 4) {
        if (rng() > 0.55) p.rect(x, gy - 2, 1, 2, P.hillLight);
        if (rng() > 0.82) p.rect(x, gy + 4, 1, 2, P.stoneDark);
      }
      // Winding path
      p.poly(
        [
          [w * 0.4, h],
          [w * 0.38, gy + 10],
          [w * 0.5, gy + 6],
          [w * 0.58, h],
        ],
        P.thatch
      );
      p.grain(w * 0.4, gy + 6, w * 0.18, h - gy - 6, P.stoneDark, 0.08, 1);
      p.ditherEdge(gy, P.skyHorizon, P.hillLight);
    },

    drawAmbient(p, timeSec) {
      const { artW: w, groundY: gy } = p;
      // Rotating windmill sails
      drawWindmill(p, Math.round(w * 0.16), gy - 8, timeSec, true);

      // Tower banner
      const castle = castleMetrics(p);
      const ch = Math.round(gy * 0.22);
      const fx = castle.x;
      const fy = castle.baseY - ch - 18;
      const step = Math.floor(timeSec * 7) % 4;
      const wave = [0, 1, 0, -1][step];
      p.poly(
        [
          [fx + 1, fy],
          [fx + 12, fy + wave],
          [fx + 10, fy + 5],
          [fx + 1, fy + 5],
        ],
        P.banner
      );
      p.rect(fx + 2, fy + 2, 8, 1, P.stone);

      // Chimney smoke
      for (let i = 0; i < (p.mobile ? 2 : 3); i++) {
        const hx = w * (0.06 + i * 0.11);
        const hh = gy * 0.1;
        const hw = w * (0.09 - i * 0.012);
        const sx = hx + hw * 0.55;
        const sy = gy - 4 - hh - 10;
        for (let j = 0; j < (p.mobile ? 2 : 3); j++) {
          const phase = (timeSec * 0.12 + j / 3 + i * 0.17) % 1;
          p.rect(sx + phase * 8 + Math.sin(phase * 5 + i) * 2, sy - phase * 22, 2 + phase * 3, 2, P.mist);
          p.rect(sx + 1 + phase * 8, sy - phase * 22 + 2, 2, 1, P.stone);
        }
      }

      // Drifting dawn mist
      const mistX = ((timeSec * 2.5) % (w + 70)) - 35;
      p.rect(mistX, gy - 16, 48, 1, P.mist);
      p.rect(mistX + 14, gy - 13, 30, 1, P.mist);
      if (!p.mobile) {
        p.rect(((timeSec * 1.3 + 40) % (w + 50)) - 20, gy - 22, 34, 1, P.mist);
      }
    },

    drawTree,
  });
})();
