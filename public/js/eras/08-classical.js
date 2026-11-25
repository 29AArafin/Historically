/* ==========================================================================
   Era 8 — Classical Antiquity (800 BCE–500 CE)
   Roman scene: amphitheater, aqueduct, marble columns, cypress, olive tree.
   ========================================================================== */

(function () {
  'use strict';

  const EraUtils = window.Historically.EraUtils;

  const P = {
    skyTop: '#3f9fd4',
    skyMid: '#8ccce7',
    skyHorizon: '#f0e2c4',
    marble: '#e9dfc8',
    marbleShade: '#b7a98d',
    colosseum: '#c9a273',
    colosseumDark: '#8f6c4a',
    aqueduct: '#cdbb96',
    olive: '#7d8a55',
    cypress: '#2e5a3a',
    cypressDark: '#1c3d28',
    ink: '#3a3326',
  };

  function drawColumn(p, x, baseY, height) {
    p.rect(x - 5, baseY - 3, 10, 3, P.marbleShade);
    p.rect(x - 4, baseY - height, 8, height - 3, P.marble);
    p.rect(x - 4, baseY - height, 2, height - 3, P.marbleShade);
    for (let y = baseY - height + 5; y < baseY - 5; y += 4) {
      p.rect(x - 3, y, 1, 3, P.marbleShade);
      p.rect(x + 3, y, 1, 3, P.marbleShade);
    }
    p.rect(x - 6, baseY - height - 2, 12, 3, P.marble);
    p.rect(x - 6, baseY - height - 3, 12, 1, P.marbleShade);
    p.rect(x - 7, baseY - height + 2, 14, 1, P.marbleShade);
  }

  function drawAqueduct(p, x, baseY, width, height) {
    p.rect(x, baseY - height, width, height, P.aqueduct);
    p.rect(x, baseY - height, width, 2, P.marble);
    p.rect(x, baseY - height + 3, width, 1, P.marbleShade);
    const arches = Math.max(3, Math.round(width / 22));
    for (let i = 0; i < arches; i++) {
      const ax = x + 3 + (i / arches) * (width - 6);
      const aw = (width - 6) / arches - 7;
      if (aw < 3) continue;
      p.rect(ax, baseY - height + 7, aw, height - 7, P.marbleShade);
      p.rect(ax, baseY - height + 10, aw, height - 10, P.colosseumDark);
      p.poly(
        [
          [ax, baseY - height + 10],
          [ax + aw / 2, baseY - height + 5],
          [ax + aw, baseY - height + 10],
        ],
        P.colosseumDark
      );
      p.rect(ax + aw / 2 - 1, baseY - height + 7, 2, 2, P.aqueduct);
    }
    // Top water channel
    p.rect(x - 1, baseY - height - 2, width + 2, 2, P.marble);
  }

  function drawAmphitheater(p, cx, baseY, width, height) {
    const left = cx - width / 2;
    const right = cx + width / 2;
    // Outer elliptical mass
    p.poly(
      [
        [left, baseY],
        [left + 3, baseY - height * 0.55],
        [left + width * 0.18, baseY - height * 0.85],
        [cx, baseY - height],
        [right - width * 0.18, baseY - height * 0.85],
        [right - 3, baseY - height * 0.55],
        [right, baseY],
      ],
      P.colosseum
    );
    p.poly(
      [
        [left, baseY],
        [left + 3, baseY - height * 0.55],
        [left + width * 0.18, baseY - height * 0.85],
        [cx, baseY - height],
        [cx, baseY],
      ],
      P.colosseumDark
    );
    // Stepped top edge
    for (let i = 0; i < 7; i++) {
      const sx = left + 8 + i * (width - 16) / 7;
      p.rect(sx, baseY - height - 2, (width - 16) / 14, 3, P.colosseum);
    }

    // Two rows of arched openings
    const arches = Math.max(4, Math.floor(width / 12));
    for (let tier = 0; tier < 2; tier++) {
      const ay = baseY - height * (0.34 + tier * 0.3);
      for (let i = 0; i < arches; i++) {
        const ax = left + 7 + (i / arches) * (width - 14);
        const aw = (width - 14) / arches - 4;
        if (aw < 2) continue;
        p.rect(ax, ay, aw, height * 0.19, P.colosseumDark);
        p.poly(
          [
            [ax, ay],
            [ax + aw / 2, ay - 4],
            [ax + aw, ay],
          ],
          P.colosseumDark
        );
      }
    }
    p.rect(left + 3, baseY - 3, width - 6, 3, P.ink);
    p.rect(cx - width * 0.18, baseY - height * 0.55, width * 0.36, 1, P.aqueduct);
  }

  function drawCypress(p, x, baseY, height) {
    p.rect(x - 1, baseY - 4, 2, 4, P.ink);
    p.rect(x - 3, baseY - height * 0.65, 6, height * 0.65, P.cypressDark);
    p.poly(
      [
        [x, baseY - height],
        [x - 5, baseY - height * 0.5],
        [x - 4, baseY - 6],
        [x + 4, baseY - 6],
        [x + 5, baseY - height * 0.5],
      ],
      P.cypress
    );
    p.rect(x - 2, baseY - height * 0.8, 2, height * 0.3, P.cypressDark);
  }

  function drawTree(p, x, baseY, sway) {
    const cx = x + sway;
    p.rect(x - 3, baseY - 24, 6, 24, P.ink);
    p.rect(x - 7, baseY - 1, 14, 2, P.ink);
    p.line(x, baseY - 20, cx - 10, baseY - 31, P.ink, 2);
    p.line(x + 1, baseY - 20, cx + 10, baseY - 30, P.ink, 1);
    p.line(cx - 10, baseY - 31, cx - 16, baseY - 38, P.ink, 1);
    p.line(cx + 10, baseY - 30, cx + 16, baseY - 37, P.ink, 1);
    // Silver-green olive canopy
    p.rect(cx - 17, baseY - 42, 34, 11, P.olive);
    p.rect(cx - 12, baseY - 47, 24, 7, P.olive);
    p.rect(cx - 7, baseY - 50, 15, 5, P.olive);
    p.rect(cx - 14, baseY - 41, 28, 7, P.cypress);
    p.rect(cx - 8, baseY - 46, 16, 4, P.cypress);
    p.rect(cx + 8, baseY - 38, 8, 5, P.cypress);
    p.rect(cx - 14, baseY - 43, 5, 3, P.aqueduct);
    p.rect(cx + 2, baseY - 48, 5, 3, P.aqueduct);
    p.rect(cx - 4, baseY - 39, 3, 2, P.marbleShade);
  }

  EraUtils.register({
    id: 'classical',
    name: 'Classical Antiquity',
    yearRange: '800 BCE–500 CE',
    representativeYear: -44,
    palette: P,
    order: 8,

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

      // Sun
      const sx = Math.round(w * 0.82);
      const sy = Math.round(gy * 0.18);
      p.rect(sx - 10, sy - 5, 20, 10, P.skyHorizon);
      p.rect(sx - 5, sy - 10, 10, 20, P.skyHorizon);
      p.rect(sx - 7, sy - 7, 14, 14, P.marble);

      // Distant hills with cypress silhouettes
      const horizon = gy - 6;
      p.poly(
        [
          [0, horizon],
          [0, horizon - 12],
          [w * 0.2, horizon - 18],
          [w * 0.42, horizon - 8],
          [w * 0.66, horizon - 15],
          [w * 0.86, horizon - 7],
          [w, horizon - 12],
          [w, horizon],
        ],
        P.olive
      );
      for (let i = 0; i < (p.mobile ? 5 : 9); i++) {
        const x = (0.08 + i * 0.1) * w;
        drawCypress(p, Math.round(x), horizon - 2, 11 + rng() * 7);
      }

      // Aqueduct sweeping across the left
      drawAqueduct(
        p,
        Math.round(w * 0.06),
        gy - 8,
        Math.round(w * 0.44),
        Math.round(gy * 0.2)
      );

      // Marble colonnade fragments
      drawColumn(p, Math.round(w * 0.4), gy - 4, Math.round(gy * 0.2));
      drawColumn(p, Math.round(w * 0.47), gy - 4, Math.round(gy * 0.22));
      drawColumn(p, Math.round(w * 0.54), gy - 4, Math.round(gy * 0.2));
      p.rect(w * 0.39, gy - 4 - Math.round(gy * 0.2) - 3, w * 0.17, 2, P.marble);
      p.rect(w * 0.39, gy - 4 - Math.round(gy * 0.2) - 5, w * 0.17, 2, P.marbleShade);

      // Colosseum-style amphitheater on the right
      drawAmphitheater(
        p,
        Math.round(w * 0.82),
        gy - 4,
        Math.round(w * 0.32),
        Math.round(gy * 0.27)
      );

      // Cypress trees near the right edge
      drawCypress(p, Math.round(w * 0.61), gy - 4, Math.round(gy * 0.34));
      if (!p.mobile) drawCypress(p, Math.round(w * 0.97), gy - 2, Math.round(gy * 0.3));

      // Pale stone plaza
      p.rect(0, gy, w, h - gy, P.marbleShade);
      p.rect(0, gy, w, 2, P.marble);
      p.rect(0, gy + 2, w, 2, P.aqueduct);
      p.rect(0, gy + 4, w, h - gy - 4, P.marbleShade);
      for (let y = gy + 7; y < h; y += 5) {
        const off = ((y - gy) / 5) % 2 === 0 ? 0 : 4;
        for (let x = -4 + off; x < w; x += 9) {
          p.rect(x, y, 7, 1, P.aqueduct);
        }
      }
      p.grain(0, gy + 4, w, h - gy - 4, P.marble, 0.04, 1);
      p.ditherEdge(gy, P.skyHorizon, P.marble);
    },

    drawAmbient(p, timeSec) {
      const { artW: w, groundY: gy } = p;
      // Slow birds
      const birdCount = p.mobile ? 2 : 4;
      for (let i = 0; i < birdCount; i++) {
        const span = w + 40;
        const x = ((timeSec * (4 + i * 0.7) + i * 31) % span) - 20;
        const y = gy * (0.22 + i * 0.045) + Math.sin(timeSec * 0.8 + i) * 2;
        const flap = Math.floor(timeSec * 4 + i) % 2;
        p.rect(x, y, 2, 1, P.ink);
        p.rect(x + 3, y, 2, 1, P.ink);
        if (flap) {
          p.rect(x + 1, y - 1, 1, 1, P.ink);
          p.rect(x + 4, y - 1, 1, 1, P.ink);
        }
      }

      // High cloud wisps
      const cloudX = ((timeSec * 1.4) % (w + 60)) - 30;
      p.rect(cloudX, gy * 0.12, 28, 1, P.skyHorizon);
      p.rect(cloudX + 8, gy * 0.12 + 2, 18, 1, P.marble);
    },

    drawTree,
  });
})();
