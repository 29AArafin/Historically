/* ==========================================================================
   Era 10 — Prehistory (before 3000 BCE)
   Ember sky, volcano with lava glow, giant ferns, cave mouth, mammoth, fire.
   ========================================================================== */

(function () {
  'use strict';

  const EraUtils = window.Historically.EraUtils;

  const P = {
    skyTop: '#2e1b2c',
    skyMid: '#6e2c31',
    skyHorizon: '#c95f39',
    glow: '#f0a24a',
    lava: '#f7d05e',
    volcano: '#3a262c',
    volcanoDark: '#24171d',
    ground: '#2c2220',
    groundLight: '#44322b',
    fern: '#3f5c35',
    fernDark: '#263a24',
    bone: '#c9b896',
  };

  function campfireX(p) {
    return Math.round(p.artW * 0.33);
  }

  function drawFern(p, x, baseY, sway, scale) {
    const s = scale;
    p.rect(x - 1, baseY - 26 * s, 3, 26 * s, P.volcanoDark);
    p.rect(x - 4, baseY - 1, 8, 2, P.volcanoDark);
    const cx = x + sway;
    const top = baseY - 27 * s;
    // Arcing fronds
    const fronds = [
      [-22, -10],
      [22, -10],
      [-17, 1],
      [17, 1],
      [-9, -17],
      [9, -17],
      [-28, 1],
      [28, 1],
    ];
    fronds.forEach(([dx, dy], i) => {
      const ex = cx + dx * s;
      const ey = top + dy * s;
      p.line(cx, top, ex, ey, i % 2 === 0 ? P.fernDark : P.fern, 2);
      p.line(cx + dx * 0.45 * s, top + dy * 0.55 * s, ex, ey - 2, P.fern, 1);
      p.rect(ex - 1, ey, 3, 2, i % 2 === 0 ? P.fern : P.fernDark);
    });
    p.rect(cx - 2, top - 3, 5, 4, P.fernDark);
    p.rect(cx - 1, top - 4, 3, 2, P.fern);
  }

  function drawMammoth(p, x, baseY) {
    const bodyW = p.mobile ? 17 : 23;
    // Body and head
    p.rect(x - bodyW / 2, baseY - 14, bodyW, 12, P.volcanoDark);
    p.rect(x + bodyW / 2 - 5, baseY - 19, 7, 10, P.volcanoDark);
    p.poly(
      [
        [x + bodyW / 2 + 1, baseY - 17],
        [x + bodyW / 2 + 9, baseY - 15],
        [x + bodyW / 2 + 3, baseY - 12],
      ],
      P.volcanoDark
    );
    // Legs
    p.rect(x - bodyW / 2 + 2, baseY - 3, 4, 8, P.volcanoDark);
    p.rect(x - bodyW / 2 + 9, baseY - 3, 4, 8, P.volcanoDark);
    p.rect(x + bodyW / 2 - 7, baseY - 3, 4, 8, P.volcanoDark);
    // Trunk
    p.line(x + bodyW / 2 + 8, baseY - 14, x + bodyW / 2 + 8, baseY - 2, P.volcanoDark, 2);
    p.rect(x + bodyW / 2 + 7, baseY - 2, 4, 2, P.volcanoDark);
    // Tusks
    p.line(x + bodyW / 2 + 5, baseY - 11, x + bodyW / 2 + 12, baseY - 7, P.bone, 1);
    p.line(x + bodyW / 2 + 5, baseY - 10, x + bodyW / 2 + 13, baseY - 8, P.bone, 1);
    // Tail
    p.rect(x - bodyW / 2 - 1, baseY - 11, 2, 3, P.volcanoDark);
  }

  function drawVolcano(p, x, baseY, height, width) {
    p.poly(
      [
        [x - width / 2, baseY],
        [x - width * 0.14, baseY - height * 0.72],
        [x - width * 0.08, baseY - height],
        [x + width * 0.1, baseY - height],
        [x + width * 0.2, baseY - height * 0.7],
        [x + width / 2, baseY],
      ],
      P.volcano
    );
    p.poly(
      [
        [x - width / 2, baseY],
        [x - width * 0.14, baseY - height * 0.72],
        [x - width * 0.08, baseY - height],
        [x + width * 0.06, baseY - height],
        [x + width * 0.04, baseY - height * 0.55],
        [x - width * 0.04, baseY - 2],
      ],
      P.volcanoDark
    );
    // Lava streams
    p.line(x - width * 0.04, baseY - height + 2, x - width * 0.12, baseY - height * 0.36, P.lava, 2);
    p.line(x - width * 0.12, baseY - height * 0.36, x - width * 0.1, baseY - 2, P.glow, 1);
    p.line(x + width * 0.02, baseY - height + 3, x + width * 0.12, baseY - height * 0.28, P.glow, 1);
    // Crater glow
    p.rect(x - width * 0.08, baseY - height - 2, width * 0.18, 4, P.glow);
    p.rect(x - width * 0.03, baseY - height - 4, width * 0.1, 3, P.lava);
    p.rect(x - width * 0.15, baseY - height + 1, width * 0.3, 2, P.volcanoDark);
  }

  function drawTree(p, x, baseY, sway) {
    drawFern(p, x, baseY, sway, p.mobile ? 1.05 : 1.25);
  }

  EraUtils.register({
    id: 'prehistory',
    name: 'Prehistory',
    yearRange: 'before 3000 BCE',
    representativeYear: -10000,
    palette: P,
    order: 10,

    drawBackdrop(p) {
      const { artW: w, artH: h, groundY: gy } = p;
      const rng = p.rng;
      const b1 = Math.round(gy * 0.34);
      const b2 = Math.round(gy * 0.66);

      p.rect(0, 0, w, b1, P.skyTop);
      p.rect(0, b1, w, b2 - b1, P.skyMid);
      p.rect(0, b2, w, gy - b2, P.skyHorizon);
      p.ditherEdge(b1, P.skyTop, P.skyMid);
      p.ditherEdge(b2, P.skyMid, P.skyHorizon);

      // Ash clouds catching the firelight
      for (let i = 0; i < (p.mobile ? 3 : 6); i++) {
        const x = rng() * w;
        const y = rng() * b1;
        p.rect(x, y, 14 + rng() * 18, 2, P.skyMid);
        p.rect(x + 3, y + 2, 8 + rng() * 10, 1, P.volcano);
      }

      // Volcano dominating the right
      drawVolcano(
        p,
        Math.round(w * 0.82),
        gy - 4,
        Math.round(gy * 0.6),
        Math.round(w * 0.46)
      );

      // Rocky ridge and cave mouth on the left
      p.poly(
        [
          [0, gy],
          [0, gy - 34],
          [w * 0.08, gy - 42],
          [w * 0.16, gy - 30],
          [w * 0.24, gy - 10],
          [w * 0.28, gy],
        ],
        P.volcano
      );
      p.poly(
        [
          [w * 0.035, gy],
          [w * 0.04, gy - 14],
          [w * 0.09, gy - 20],
          [w * 0.14, gy - 12],
          [w * 0.145, gy],
        ],
        P.volcanoDark
      );
      // Cave mouth
      p.poly(
        [
          [w * 0.06, gy],
          [w * 0.065, gy - 10],
          [w * 0.095, gy - 14],
          [w * 0.12, gy - 9],
          [w * 0.125, gy],
        ],
        '#120c10'
      );
      p.rect(w * 0.07, gy - 4, 2, 2, P.bone);
      p.rect(w * 0.11, gy - 7, 1, 1, P.bone);

      // Mammoth in the middle distance
      drawMammoth(p, Math.round(w * 0.31), gy - 16);

      // Giant ferns
      drawFern(p, Math.round(w * 0.02), gy - 2, 0, 0.9);
      drawFern(p, Math.round(w * 0.19), gy - 2, 0, 0.7);
      drawFern(p, Math.round(w * 0.58), gy - 2, 0, 0.95);
      drawFern(p, Math.round(w * 0.95), gy - 2, 0, 0.8);

      // Campfire logs
      const fx = campfireX(p);
      p.rect(fx - 5, gy - 3, 11, 2, P.volcanoDark);
      p.rect(fx - 3, gy - 5, 7, 2, P.volcanoDark);
      p.rect(fx - 1, gy - 4, 3, 2, P.glow);

      // Dark ash ground
      p.rect(0, gy, w, h - gy, P.ground);
      p.rect(0, gy, w, 2, P.groundLight);
      p.rect(0, gy + 2, w, 3, P.volcanoDark);
      p.rect(0, gy + 6, w, h - gy - 6, P.ground);
      p.grain(0, gy + 5, w, h - gy - 5, P.groundLight, 0.08, 1);
      for (let i = 0; i < (p.mobile ? 5 : 10); i++) {
        const x = rng() * w;
        const y = gy + 6 + rng() * 8;
        p.rect(x, y, 2 + rng() * 4, 1, P.volcanoDark);
      }
      p.ditherEdge(gy, P.skyHorizon, P.groundLight);
    },

    drawAmbient(p, timeSec) {
      const { artW: w, groundY: gy } = p;
      const fx = campfireX(p);

      // Flickering campfire
      const step = Math.floor(timeSec * 10) % 4;
      const flick = [0, 1, 0, -1][step];
      p.poly(
        [
          [fx - 3, gy - 4],
          [fx - 1, gy - 12 - flick],
          [fx + 2, gy - 15 + flick],
          [fx + 4, gy - 8],
          [fx + 2, gy - 4],
        ],
        P.glow
      );
      p.poly(
        [
          [fx - 1, gy - 4],
          [fx + 1, gy - 10 + flick],
          [fx + 3, gy - 6],
        ],
        P.lava
      );
      p.rect(fx - 2, gy - 6, 2, 2, P.lava);

      // Rising embers
      const embers = p.mobile ? 3 : 7;
      for (let i = 0; i < embers; i++) {
        const phase = (timeSec * (0.28 + (i % 3) * 0.08) + i / embers) % 1;
        const x = fx + Math.sin(phase * 6 + i) * (3 + phase * 10);
        const y = gy - 6 - phase * 34;
        p.rect(x, y, 1, 1, i % 2 === 0 ? P.lava : P.glow);
      }

      // Volcano smoke plume
      const vx = Math.round(w * 0.82);
      const vy = gy - 4 - Math.round(gy * 0.6);
      for (let i = 0; i < (p.mobile ? 3 : 5); i++) {
        const phase = (timeSec * 0.07 + i / 5) % 1;
        const x = vx - 8 + phase * 18 + Math.sin(phase * 4 + i) * 3;
        const y = vy - 2 - phase * 36;
        const size = 3 + Math.floor(phase * 7);
        p.rect(x, y, size, 2, P.volcano);
        p.rect(x + 1, y + 2, size - 2, 1, P.volcanoDark);
      }

      // Pulsing crater glow
      const pulse = Math.floor(timeSec * 3) % 4;
      const extra = pulse === 0 ? 2 : pulse === 2 ? 1 : 0;
      p.rect(vx - 5 - extra, vy + 1, 10 + extra * 2, 2, P.glow);
      p.rect(vx - 2, vy + 2, 5, 1, P.lava);

      // Distant bats
      const batX = ((timeSec * 6 + 60) % (w + 30)) - 15;
      const batY = gy * 0.28 + Math.sin(timeSec * 1.4) * 3;
      const wing = Math.floor(timeSec * 6) % 2;
      p.rect(batX, batY, 2, 1, P.volcanoDark);
      p.rect(batX + 3, batY, 2, 1, P.volcanoDark);
      if (wing) {
        p.rect(batX + 1, batY - 1, 1, 1, P.volcanoDark);
        p.rect(batX + 4, batY - 1, 1, 1, P.volcanoDark);
      }
    },

    drawTree,
  });
})();
