/* ==========================================================================
   Era 6 — Renaissance & Exploration (1400–1648)
   Warm ochre sky, cathedral dome, harbor with caravels, terracotta roofs.
   ========================================================================== */

(function () {
  'use strict';

  const EraUtils = window.Historically.EraUtils;

  const P = {
    skyTop: '#d89a5c',
    skyMid: '#e8b97c',
    skyHorizon: '#f6dcae',
    terracotta: '#b75c38',
    terracottaDark: '#7e3a28',
    stone: '#d8c7a0',
    stoneDark: '#9a8867',
    water: '#4d7f88',
    waterDark: '#315a66',
    sail: '#f1e6cc',
    olive: '#7d8a55',
    oliveDark: '#53613a',
  };

  function drawCaravel(p, x, baseY, scale) {
    const s = scale;
    // Hull
    p.poly(
      [
        [x - 13 * s, baseY],
        [x + 13 * s, baseY],
        [x + 8 * s, baseY + 5 * s],
        [x - 8 * s, baseY + 5 * s],
      ],
      P.terracottaDark
    );
    p.rect(x - 12 * s, baseY, 24 * s, 2 * s, P.stoneDark);
    // Masts and lateen sails
    [x - 7 * s, x + 3 * s].forEach((mx, i) => {
      const mastH = (i === 0 ? 26 : 20) * s;
      p.rect(mx, baseY - mastH, 1, mastH, P.terracottaDark);
      p.line(mx - 5 * s, baseY - mastH + 4 * s, mx + 5 * s, baseY - mastH + 10 * s, P.terracottaDark, 1);
      p.poly(
        [
          [mx - 4 * s, baseY - mastH + 4 * s],
          [mx + 5 * s, baseY - mastH + 8 * s],
          [mx + 4 * s, baseY - mastH + 14 * s],
          [mx - 4 * s, baseY - mastH + 12 * s],
        ],
        P.sail
      );
      p.rect(mx - 3 * s, baseY - mastH + 6 * s, 6 * s, 1, P.stone);
    });
    p.line(x - 4 * s, baseY - 23 * s, x + 5 * s, baseY - 3 * s, P.terracottaDark, 1);
    p.rect(x - 12 * s, baseY - 1, 24 * s, 1, P.stone);
  }

  function drawDome(p, x, baseY, width, height) {
    // Cathedral body
    p.rect(x, baseY - height, width, height, P.stone);
    p.rect(x, baseY - height, width * 0.28, height, P.stoneDark);
    p.poly(
      [
        [x - 3, baseY - height],
        [x + width / 2, baseY - height - 8],
        [x + width + 3, baseY - height],
      ],
      P.stoneDark
    );
    // Arcade
    const arches = p.mobile ? 3 : 5;
    for (let i = 0; i < arches; i++) {
      const ax = x + 4 + (i / arches) * (width - 8);
      p.rect(ax, baseY - height * 0.55, 4, height * 0.4, P.terracottaDark);
      p.poly(
        [
          [ax, baseY - height * 0.55],
          [ax + 2, baseY - height * 0.62],
          [ax + 4, baseY - height * 0.55],
        ],
        P.terracottaDark
      );
    }

    // Octagonal drum and ribbed dome
    const dw = width * 0.62;
    const dx = x + (width - dw) / 2;
    p.rect(dx, baseY - height - 10, dw, 10, P.stone);
    for (let i = 0; i < 4; i++) {
      p.rect(dx + 3 + i * (dw / 4), baseY - height - 9, 1, 8, P.stoneDark);
    }
    p.poly(
      [
        [dx - 5, baseY - height - 10],
        [dx + dw / 2, baseY - height - 27],
        [dx + dw + 5, baseY - height - 10],
      ],
      P.terracotta
    );
    p.poly(
      [
        [dx + dw / 2, baseY - height - 27],
        [dx + dw + 5, baseY - height - 10],
        [dx + dw / 2, baseY - height - 10],
      ],
      P.terracottaDark
    );
    // Dome ribs
    p.line(dx + dw / 2, baseY - height - 26, dx + 2, baseY - height - 11, P.terracottaDark, 1);
    p.line(dx + dw / 2, baseY - height - 26, dx + dw - 2, baseY - height - 11, P.terracottaDark, 1);
    p.line(dx + dw / 2, baseY - height - 26, dx + dw / 2, baseY - height - 11, P.terracottaDark, 1);
    // Lantern
    p.rect(dx + dw / 2 - 2, baseY - height - 33, 4, 7, P.stone);
    p.poly(
      [
        [dx + dw / 2 - 3, baseY - height - 33],
        [dx + dw / 2, baseY - height - 37],
        [dx + dw / 2 + 3, baseY - height - 33],
      ],
      P.terracotta
    );
    p.rect(dx + dw / 2, baseY - height - 40, 1, 3, P.terracottaDark);
  }

  function drawTree(p, x, baseY, sway) {
    const cx = x + sway;
    p.rect(x - 2, baseY - 24, 4, 24, P.terracottaDark);
    p.rect(x - 6, baseY - 1, 12, 2, P.terracottaDark);
    p.line(x, baseY - 19, cx - 9, baseY - 30, P.terracottaDark, 1);
    p.line(x, baseY - 19, cx + 9, baseY - 29, P.terracottaDark, 1);
    p.rect(cx - 14, baseY - 42, 28, 13, P.oliveDark);
    p.rect(cx - 10, baseY - 47, 20, 7, P.oliveDark);
    p.rect(cx - 12, baseY - 38, 25, 8, P.olive);
    p.rect(cx - 8, baseY - 44, 16, 6, P.olive);
    p.rect(cx - 3, baseY - 47, 9, 3, P.olive);
    p.rect(cx + 4, baseY - 36, 7, 4, P.oliveDark);
    p.rect(cx - 8, baseY - 41, 4, 3, P.sail);
  }

  EraUtils.register({
    id: 'renaissance',
    name: 'Renaissance & Exploration',
    yearRange: '1400–1648',
    representativeYear: 1500,
    palette: P,
    order: 6,

    drawBackdrop(p) {
      const { artW: w, artH: h, groundY: gy } = p;
      const rng = p.rng;
      const b1 = Math.round(gy * 0.42);
      const b2 = Math.round(gy * 0.78);

      p.rect(0, 0, w, b1, P.skyTop);
      p.rect(0, b1, w, b2 - b1, P.skyMid);
      p.rect(0, b2, w, gy - b2, P.skyHorizon);
      p.ditherEdge(b1, P.skyTop, P.skyMid);
      p.ditherEdge(b2, P.skyMid, P.skyHorizon);

      // Low warm sun
      p.rect(w * 0.78, gy * 0.25, 24, 2, P.skyHorizon);
      p.rect(w * 0.78 + 4, gy * 0.25 - 4, 16, 2, P.skyHorizon);
      p.rect(w * 0.78 + 6, gy * 0.25 - 6, 12, 2, P.sail);

      const horizon = gy - 9;

      // Distant rooftops and towers
      for (let i = 0; i < (p.mobile ? 10 : 18); i++) {
        const x = (i / 18) * w + rng() * 4;
        const bh = 4 + rng() * 12;
        p.rect(x, horizon - bh, 5 + rng() * 6, bh, P.terracottaDark);
        p.poly(
          [
            [x - 1, horizon - bh],
            [x + 2, horizon - bh - 3],
            [x + 7, horizon - bh],
          ],
          P.terracotta
        );
      }
      // Bell tower
      p.rect(w * 0.68, horizon - 34, 7, 34, P.stone);
      p.poly(
        [
          [w * 0.68 - 2, horizon - 34],
          [w * 0.68 + 3.5, horizon - 41],
          [w * 0.68 + 9, horizon - 34],
        ],
        P.terracotta
      );
      p.rect(w * 0.68 + 2, horizon - 30, 3, 4, P.terracottaDark);

      // Harbor water on the left
      p.rect(0, horizon, w * 0.42, 5, P.waterDark);
      p.rect(0, horizon, w * 0.42, 2, P.water);
      for (let x = 2; x < w * 0.4; x += 8) {
        p.rect(x, horizon + 3, 4, 1, P.stoneDark);
      }
      // Quay edge
      p.rect(w * 0.42, horizon - 1, 2, 8, P.stoneDark);

      // Caravels in the harbor
      drawCaravel(p, Math.round(w * 0.09), horizon, p.mobile ? 0.8 : 1);
      drawCaravel(p, Math.round(w * 0.26), horizon, p.mobile ? 0.65 : 0.8);

      // Terracotta waterfront houses
      for (let i = 0; i < 4; i++) {
        const bx = Math.round(w * 0.46 + i * w * 0.09);
        const bh = Math.round(gy * (0.12 + (i % 2) * 0.03));
        p.rect(bx, gy - 8 - bh, Math.round(w * 0.075), bh, P.stone);
        p.rect(bx, gy - 8 - bh, Math.round(w * 0.02), bh, P.stoneDark);
        p.poly(
          [
            [bx - 2, gy - 8 - bh],
            [bx + w * 0.037, gy - 13 - bh],
            [bx + w * 0.075 + 2, gy - 8 - bh],
          ],
          P.terracotta
        );
        p.rect(bx + 4, gy - bh - 2, 3, 4, P.terracottaDark);
        p.rect(bx + 10, gy - bh - 2, 3, 4, P.terracottaDark);
        p.rect(bx + 16, gy - bh - 2, 3, 4, P.terracottaDark);
      }

      // Cathedral dome, kept left of the machine's silhouette
      drawDome(p, Math.round(w * 0.32), gy - 8, Math.round(w * 0.18), Math.round(gy * 0.3));

      // Stone quay with warm flagstones
      p.rect(0, gy, w, h - gy, P.stoneDark);
      p.rect(0, gy, w, 2, P.stone);
      p.rect(0, gy + 2, w, 3, P.terracottaDark);
      p.rect(0, gy + 5, w, h - gy - 5, P.stoneDark);
      for (let y = gy + 8; y < h; y += 6) {
        const off = ((y - gy) / 6) % 2 === 0 ? 0 : 5;
        for (let x = -5 + off; x < w; x += 11) {
          p.rect(x, y, 9, 1, P.terracottaDark);
        }
      }
      p.grain(0, gy + 5, w, h - gy - 5, P.stone, 0.045, 1);
      // Harbor bollards near the quay edge
      p.rect(w * 0.44, gy - 4, 2, 4, P.terracottaDark);
      p.rect(w * 0.46, gy - 2, 3, 1, P.terracotta);
      p.ditherEdge(gy, P.skyHorizon, P.stone);
    },

    drawAmbient(p, timeSec) {
      const { artW: w, groundY: gy } = p;
      // Clouds
      const clouds = p.mobile
        ? [{ x: 0.4, y: 0.16, s: 0.62, v: 1.2 }]
        : [
            { x: 0.12, y: 0.14, s: 0.7, v: 1.4 },
            { x: 0.55, y: 0.22, s: 0.55, v: 1.0 },
          ];
      clouds.forEach((cloud) => {
        const wrap = w + 46;
        const x = ((cloud.x * wrap + timeSec * cloud.v) % wrap) - 23;
        p.cloud(x, gy * cloud.y, cloud.s, P.sail, P.skyHorizon);
      });

      // Flags on the caravels, stepped wave
      const step = Math.floor(timeSec * 6) % 4;
      const wave = [0, 1, 0, -1][step];
      const fx1 = Math.round(w * 0.09) - 7;
      const fy1 = gy - 9 - 26;
      p.poly(
        [
          [fx1, fy1],
          [fx1 + 7, fy1 + wave],
          [fx1 + 6, fy1 + 4],
          [fx1, fy1 + 4],
        ],
        P.terracotta
      );
      const fx2 = Math.round(w * 0.26) + 3;
      const fy2 = gy - 9 - 16;
      p.poly(
        [
          [fx2, fy2],
          [fx2 + 6, fy2 - wave],
          [fx2 + 5, fy2 + 3],
          [fx2, fy2 + 3],
        ],
        P.terracottaDark
      );

      // Gulls
      const gullX = ((timeSec * 3.2 + 40) % (w + 30)) - 15;
      p.rect(gullX, gy * 0.32, 2, 1, P.stoneDark);
      p.rect(gullX + 3, gy * 0.32, 2, 1, P.stoneDark);
      p.rect(gullX + 2, gy * 0.32 - 1, 1, 1, P.stone);
    },

    drawTree,
  });
})();
