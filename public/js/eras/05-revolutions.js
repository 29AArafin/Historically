/* ==========================================================================
   Era 5 — Revolutions & Enlightenment (1648–1815)
   Powder-blue sky, cobbled square, domed civic hall, tall ship, waving flag.
   ========================================================================== */

(function () {
  'use strict';

  const EraUtils = window.Historically.EraUtils;

  const P = {
    skyTop: '#6fa7d4',
    skyMid: '#a8cbe2',
    skyHorizon: '#eadfc0',
    dome: '#cdc6ac',
    stone: '#a79c80',
    stoneDark: '#6f6653',
    cobble: '#8b8371',
    cobbleDark: '#5d5749',
    flagRed: '#b74440',
    flagBlue: '#3f5c8a',
    leaf: '#5b7d4e',
    leafDark: '#3b5738',
  };

  function drawSailingShip(p, x, baseY) {
    // Hull
    p.poly(
      [
        [x - 14, baseY],
        [x + 14, baseY],
        [x + 10, baseY + 5],
        [x - 9, baseY + 5],
      ],
      P.stoneDark
    );
    p.rect(x - 12, baseY, 25, 1, P.dome);
    // Three masts
    [x - 8, x, x + 8].forEach((mx, index) => {
      const mastH = index === 1 ? 32 : 25;
      p.rect(mx, baseY - mastH, 1, mastH, P.stoneDark);
      p.rect(mx - 5, baseY - mastH + 5, 11, 1, P.stoneDark);
      p.rect(mx - 4, baseY - mastH + 12, 8, 1, P.stoneDark);
      // Sail
      p.poly(
        [
          [mx - 4, baseY - mastH + 6],
          [mx, baseY - mastH + 3],
          [mx, baseY - mastH + 16],
          [mx - 4, baseY - mastH + 13],
        ],
        P.dome
      );
      p.poly(
        [
          [mx + 1, baseY - mastH + 4],
          [mx + 5, baseY - mastH + 7],
          [mx + 5, baseY - mastH + 14],
          [mx + 1, baseY - mastH + 17],
        ],
        P.skyHorizon
      );
    });
    p.line(x - 8, baseY - 20, x + 8, baseY - 6, P.stoneDark, 1);
    p.line(x + 8, baseY - 19, x - 8, baseY - 7, P.stoneDark, 1);
    p.rect(x - 1, baseY - 33, 2, 3, P.flagRed);
  }

  function drawCivicHall(p, x, baseY, width, height) {
    // Steps
    p.rect(x - 6, baseY - 4, width + 12, 4, P.stoneDark);
    p.rect(x - 3, baseY - 7, width + 6, 3, P.stone);
    p.rect(x, baseY - 10, width, 3, P.dome);

    // Main block and columns
    p.rect(x, baseY - height, width, height - 10, P.stone);
    p.rect(x, baseY - height, width * 0.32, height - 10, P.dome);
    p.rect(x + width * 0.32, baseY - height, 1, height - 10, P.stoneDark);
    const cols = p.mobile ? 4 : 6;
    for (let i = 0; i < cols; i++) {
      const cx = x + 6 + (i / (cols - 1)) * (width - 12);
      p.rect(cx, baseY - height + 8, 2, height - 20, P.dome);
      p.rect(cx + 1, baseY - height + 8, 1, height - 20, P.stoneDark);
      p.rect(cx - 1, baseY - height + 6, 4, 2, P.stoneDark);
      p.rect(cx - 1, baseY - 12, 4, 2, P.stoneDark);
    }
    // Windows
    for (let i = 0; i < cols - 1; i++) {
      const wx = x + 12 + (i / (cols - 1)) * (width - 24);
      p.rect(wx, baseY - height + 13, 3, 4, P.stoneDark);
    }

    // Pediment
    p.poly(
      [
        [x - 4, baseY - height],
        [x + width / 2, baseY - height - 11],
        [x + width + 4, baseY - height],
      ],
      P.dome
    );
    p.poly(
      [
        [x + width / 2, baseY - height - 11],
        [x + width + 4, baseY - height],
        [x + width - 8, baseY - height],
      ],
      P.stone
    );
    p.rect(x + width * 0.28, baseY - height - 4, width * 0.44, 2, P.stoneDark);

    // Drum and dome
    const domeW = width * 0.5;
    const domeX = x + width * 0.25;
    p.rect(domeX, baseY - height - 20, domeW, 9, P.stone);
    for (let i = 0; i < 6; i++) {
      p.rect(domeX + 2 + i * (domeW / 6), baseY - height - 19, 1, 7, P.stoneDark);
    }
    p.poly(
      [
        [domeX - 3, baseY - height - 20],
        [domeX + domeW / 2, baseY - height - 34],
        [domeX + domeW + 3, baseY - height - 20],
      ],
      P.dome
    );
    p.poly(
      [
        [domeX + domeW / 2, baseY - height - 34],
        [domeX + domeW + 3, baseY - height - 20],
        [domeX + domeW / 2, baseY - height - 20],
      ],
      P.stone
    );
    p.rect(domeX + domeW / 2 - 1, baseY - height - 40, 2, 7, P.stoneDark);
    p.rect(domeX + domeW / 2 - 2, baseY - height - 42, 4, 2, P.flagRed);

    // Flag poles at the corners
    p.rect(x + 2, baseY - height - 16, 1, 14, P.stoneDark);
    p.rect(x + width - 3, baseY - height - 16, 1, 14, P.stoneDark);
  }

  function drawTree(p, x, baseY, sway) {
    const cx = x + sway;
    p.rect(x - 2, baseY - 23, 4, 23, P.stoneDark);
    p.rect(x - 6, baseY - 1, 12, 2, P.stoneDark);
    p.line(x, baseY - 18, cx - 6, baseY - 27, P.stoneDark, 1);
    p.line(x, baseY - 18, cx + 6, baseY - 27, P.stoneDark, 1);
    // Formal clipped linden canopy
    p.rect(cx - 13, baseY - 40, 26, 13, P.leafDark);
    p.rect(cx - 10, baseY - 45, 20, 8, P.leafDark);
    p.rect(cx - 12, baseY - 38, 24, 9, P.leaf);
    p.rect(cx - 8, baseY - 44, 16, 7, P.leaf);
    p.rect(cx - 4, baseY - 47, 10, 4, P.leaf);
    p.rect(cx + 3, baseY - 41, 7, 4, P.leafDark);
    p.rect(cx - 6, baseY - 36, 8, 3, P.leafDark);
    p.rect(cx - 10, baseY - 28, 20, 2, P.leafDark);
  }

  EraUtils.register({
    id: 'revolutions',
    name: 'Revolutions & Enlightenment',
    yearRange: '1648–1815',
    representativeYear: 1789,
    palette: P,
    order: 5,

    drawBackdrop(p) {
      const { artW: w, artH: h, groundY: gy } = p;
      const rng = p.rng;
      const b1 = Math.round(gy * 0.43);
      const b2 = Math.round(gy * 0.79);

      p.rect(0, 0, w, b1, P.skyTop);
      p.rect(0, b1, w, b2 - b1, P.skyMid);
      p.rect(0, b2, w, gy - b2, P.skyHorizon);
      p.ditherEdge(b1, P.skyTop, P.skyMid);
      p.ditherEdge(b2, P.skyMid, P.skyHorizon);

      // Distant city roofs and a sliver of harbor
      const horizon = gy - 8;
      p.rect(0, horizon - 3, w, 3, P.flagBlue);
      for (let i = 0; i < (p.mobile ? 9 : 18); i++) {
        const x = (i / 18) * w + rng() * 5;
        const bh = 3 + rng() * 9;
        p.rect(x, horizon - bh, 5 + rng() * 6, bh, P.stoneDark);
        p.poly(
          [
            [x - 1, horizon - bh],
            [x + 2, horizon - bh - 3],
            [x + 8, horizon - bh],
          ],
          P.stone
        );
      }

      // Tall ship in the far distance
      drawSailingShip(p, Math.round(w * 0.1), horizon - 5);

      // Gabled houses on the left of the square
      for (let i = 0; i < 3; i++) {
        const bx = Math.round(w * 0.58 + i * w * 0.09);
        const bh = Math.round(gy * (0.13 + (i % 2) * 0.02));
        p.rect(bx, gy - 6 - bh, Math.round(w * 0.075), bh, P.stone);
        p.rect(bx, gy - 6 - bh, Math.round(w * 0.025), bh, P.dome);
        p.poly(
          [
            [bx - 1, gy - 6 - bh],
            [bx + w * 0.037, gy - 12 - bh],
            [bx + w * 0.075 + 1, gy - 6 - bh],
          ],
          P.stoneDark
        );
        p.rect(bx + 5, gy - bh - 1, 3, 4, P.stoneDark);
        p.rect(bx + 9, gy - bh - 1, 3, 4, P.stoneDark);
      }

      // Domed civic hall
      drawCivicHall(
        p,
        Math.round(w * 0.2),
        gy - 6,
        Math.round(w * 0.34),
        Math.round(gy * 0.34)
      );

      // Cobbled square
      p.rect(0, gy, w, h - gy, P.cobbleDark);
      p.rect(0, gy, w, 2, P.cobble);
      p.rect(0, gy + 2, w, h - gy - 2, P.cobbleDark);
      for (let y = gy + 5; y < h; y += 4) {
        const off = ((y - gy) / 4) % 2 === 0 ? 0 : 3;
        for (let x = -3 + off; x < w; x += 7) {
          p.rect(x, y, 6, 1, P.cobble);
          p.rect(x + 1, y + 1, 4, 1, P.stoneDark);
        }
      }
      p.grain(0, gy + 4, w, h - gy - 4, P.cobble, 0.05, 1);
      p.ditherEdge(gy, P.skyHorizon, P.cobble);
    },

    drawAmbient(p, timeSec) {
      const { artW: w, groundY: gy } = p;
      // Drifting clouds
      const clouds = p.mobile
        ? [{ x: 0.62, y: 0.18, s: 0.65, v: 1.4 }]
        : [
            { x: 0.18, y: 0.18, s: 0.7, v: 1.5 },
            { x: 0.7, y: 0.27, s: 0.55, v: 1.1 },
          ];
      clouds.forEach((cloud) => {
        const wrap = w + 44;
        const x = ((cloud.x * wrap + timeSec * cloud.v) % wrap) - 22;
        p.cloud(x, gy * cloud.y, cloud.s, P.skyHorizon, P.skyMid);
      });

      // Waving flag above the civic hall
      const fx = Math.round(w * 0.2) + 2;
      const fy = gy - 6 - Math.round(gy * 0.34) - 16;
      const step = Math.floor(timeSec * 7) % 4;
      const wave = [0, 1, 0, -1][step];
      p.poly(
        [
          [fx + 1, fy],
          [fx + 15, fy + wave],
          [fx + 12, fy + 6],
          [fx + 1, fy + 6],
        ],
        P.flagRed
      );
      p.rect(fx + 1, fy + 2, 10, 1, P.skyHorizon);
      p.rect(fx + 2, fy + 4, 7, 1, P.skyHorizon);
    },

    drawTree,
  });
})();
