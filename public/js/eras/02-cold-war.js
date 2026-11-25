/* ==========================================================================
   Era 2 — Cold War & Space Age (1945–1989)
   Grey-blue dusk, launch pad rocket, gantry, concrete bunkers, radar dish.
   ========================================================================== */

(function () {
  'use strict';

  const EraUtils = window.Historically.EraUtils;

  const P = {
    skyTop: '#33415c',
    skyMid: '#6c7b96',
    skyHorizon: '#c9a382',
    rocket: '#e2ded3',
    rocketShade: '#9aa2ad',
    red: '#c05243',
    concrete: '#8b8778',
    concreteDark: '#575548',
    steel: '#6d7a82',
    ink: '#1d2430',
    grass: '#5b6250',
    glow: '#d9b36b',
  };

  function drawRocket(p, x, baseY) {
    const bodyW = p.mobile ? 9 : 11;
    const bodyH = Math.round(p.groundY * (p.mobile ? 0.42 : 0.5));

    // Launch pad
    p.rect(x - 20, baseY - 3, 26, 3, P.concrete);
    p.rect(x - 22, baseY, 31, 2, P.concreteDark);
    p.rect(x - 9, baseY - 6, 5, 3, P.steel);
    p.rect(x + 3, baseY - 6, 5, 3, P.steel);

    // Rocket body
    p.rect(x - bodyW / 2, baseY - bodyH, bodyW, bodyH, P.rocket);
    p.rect(x - bodyW / 2, baseY - bodyH, Math.max(2, bodyW * 0.3), bodyH, P.rocketShade);
    p.poly(
      [
        [x - bodyW / 2, baseY - bodyH],
        [x, baseY - bodyH - 13],
        [x + bodyW / 2, baseY - bodyH],
      ],
      P.rocket
    );
    p.poly(
      [
        [x - bodyW / 2, baseY - bodyH],
        [x - bodyW / 5, baseY - bodyH - 8],
        [x - bodyW / 5, baseY - bodyH],
      ],
      P.rocketShade
    );
    p.rect(x - bodyW / 2, baseY - bodyH - 2, bodyW, 2, P.red);
    p.rect(x - bodyW / 2, baseY - bodyH * 0.55, bodyW, 2, P.red);
    p.rect(x - bodyW / 2, baseY - bodyH * 0.34, bodyW, 1, P.rocketShade);

    // Fins
    p.poly(
      [
        [x - bodyW / 2, baseY - 14],
        [x - bodyW / 2 - 7, baseY - 2],
        [x - bodyW / 2, baseY - 2],
      ],
      P.red
    );
    p.poly(
      [
        [x + bodyW / 2, baseY - 14],
        [x + bodyW / 2 + 7, baseY - 2],
        [x + bodyW / 2, baseY - 2],
      ],
      P.red
    );
    p.rect(x - 2, baseY - 2, 4, 2, P.ink);
    p.rect(x - 1, baseY - 4, 2, 2, P.glow);

    // Gantry tower
    const gx = x + bodyW / 2 + 8;
    const gh = bodyH + 9;
    p.rect(gx, baseY - gh, 2, gh, P.steel);
    p.rect(gx + 9, baseY - gh, 2, gh, P.steel);
    for (let y = baseY - gh + 4; y < baseY; y += 9) {
      p.rect(gx, y, 11, 1, P.steel);
    }
    for (let y = baseY - gh + 4; y < baseY - 4; y += 18) {
      p.line(gx + 1, y, gx + 10, y + 9, P.concreteDark, 1);
    }
    p.rect(gx - 3, baseY - gh - 1, 17, 2, P.steel);
    p.rect(gx - 1, baseY - gh - 4, 2, 3, P.red);
    p.rect(gx + 9, baseY - bodyH - 4, 3, 2, P.steel);
    p.rect(gx - 4, baseY - bodyH - 7, 6, 2, P.steel);

    // Arm reaching the rocket
    p.rect(x + bodyW / 2 + 1, baseY - bodyH * 0.62, 8, 1, P.steel);
    p.rect(x + bodyW / 2 + 1, baseY - bodyH * 0.42, 8, 1, P.steel);
  }

  function drawBunker(p, x, baseY, width, height) {
    p.rect(x, baseY - height, width, height, P.concrete);
    p.rect(x, baseY - height, width * 0.45, height, P.concreteDark);
    p.rect(x - 3, baseY - height - 3, width + 6, 3, P.concrete);
    p.rect(x - 3, baseY - height - 4, width + 6, 1, P.concreteDark);
    p.rect(x + width * 0.32, baseY - height * 0.56, width * 0.3, 2, P.ink);
    p.rect(x + width * 0.34, baseY - height * 0.56, width * 0.1, 1, P.glow);
    p.rect(x + width * 0.62, baseY - height * 0.56, width * 0.1, 1, P.glow);
    p.rect(x + width - 4, baseY - height - 6, 1, 3, P.steel);
  }

  function drawRadar(p, x, baseY) {
    p.rect(x - 1, baseY - 12, 2, 12, P.steel);
    p.rect(x - 5, baseY - 1, 10, 2, P.concreteDark);
    p.poly(
      [
        [x - 10, baseY - 20],
        [x + 2, baseY - 26],
        [x + 9, baseY - 19],
        [x - 2, baseY - 12],
      ],
      P.concrete
    );
    p.poly(
      [
        [x - 6, baseY - 19],
        [x + 1, baseY - 23],
        [x + 4, baseY - 18],
        [x - 3, baseY - 15],
      ],
      P.glow
    );
    p.rect(x + 4, baseY - 25, 2, 2, P.red);
  }

  function drawTree(p, x, baseY, sway) {
    p.rect(x - 2, baseY - 28, 4, 28, P.concreteDark);
    p.rect(x - 5, baseY - 1, 10, 2, P.concreteDark);
    const cx = x + sway;
    // Hardy Cold-War pine
    p.poly(
      [
        [cx, baseY - 48],
        [cx - 13, baseY - 29],
        [cx + 13, baseY - 29],
      ],
      P.grass
    );
    p.poly(
      [
        [cx, baseY - 40],
        [cx - 16, baseY - 20],
        [cx + 16, baseY - 20],
      ],
      P.grass
    );
    p.poly(
      [
        [cx, baseY - 32],
        [cx - 18, baseY - 12],
        [cx + 18, baseY - 12],
      ],
      P.grass
    );
    p.rect(cx - 10, baseY - 31, 20, 3, P.ink);
    p.rect(cx - 12, baseY - 22, 24, 2, P.ink);
    p.rect(cx - 14, baseY - 13, 28, 2, P.ink);
    p.rect(cx - 6, baseY - 27, 7, 2, P.glow);
    p.rect(cx + 1, baseY - 38, 4, 2, P.glow);
  }

  EraUtils.register({
    id: 'cold-war',
    name: 'Cold War & Space Age',
    yearRange: '1945–1989',
    representativeYear: 1969,
    palette: P,
    order: 2,

    drawBackdrop(p) {
      const { artW: w, artH: h, groundY: gy } = p;
      const rng = p.rng;
      const b1 = Math.round(gy * 0.44);
      const b2 = Math.round(gy * 0.78);

      p.rect(0, 0, w, b1, P.skyTop);
      p.rect(0, b1, w, b2 - b1, P.skyMid);
      p.rect(0, b2, w, gy - b2, P.skyHorizon);
      p.ditherEdge(b1, P.skyTop, P.skyMid);
      p.ditherEdge(b2, P.skyMid, P.skyHorizon);

      // First stars
      for (let i = 0; i < (p.mobile ? 12 : 26); i++) {
        const x = Math.round(rng() * w);
        const y = Math.round(rng() * b1 * 0.7);
        p.rect(x, y, 1, 1, rng() > 0.8 ? P.glow : P.rocket);
      }

      // Dusk sun low on the horizon
      p.rect(w * 0.78, gy * 0.66, 22, 2, P.glow);
      p.rect(w * 0.78 + 3, gy * 0.66 - 3, 16, 2, P.glow);
      p.rect(w * 0.78 + 5, gy * 0.66 - 5, 12, 2, P.rocket);

      // Distant low ridges and defence skyline
      const horizon = gy - 6;
      p.poly(
        [
          [0, horizon],
          [0, horizon - 14],
          [w * 0.18, horizon - 20],
          [w * 0.4, horizon - 10],
          [w * 0.62, horizon - 23],
          [w * 0.82, horizon - 12],
          [w, horizon - 18],
          [w, horizon],
        ],
        P.concreteDark
      );
      p.rect(0, horizon - 2, w, 2, P.steel);

      // Concrete bunkers
      drawBunker(p, Math.round(w * 0.67), gy - 3, Math.round(w * 0.14), Math.round(gy * 0.16));
      drawBunker(p, Math.round(w * 0.84), gy - 3, Math.round(w * 0.11), Math.round(gy * 0.1));
      drawRadar(p, Math.round(w * 0.88), gy - Math.round(gy * 0.14) - 3);

      // Rocket + gantry
      drawRocket(p, Math.round(w * 0.27), gy - 2);

      // Fence posts and cable
      for (let x = 0; x < w; x += 17) {
        p.rect(x, gy - 15, 1, 15, P.steel);
      }
      p.line(0, gy - 14, w, gy - 14, P.concreteDark, 1);
      p.line(0, gy - 11, w, gy - 11, P.concreteDark, 1);

      // Scrub ground
      p.rect(0, gy, w, h - gy, P.grass);
      p.rect(0, gy, w, 2, P.concrete);
      p.rect(0, gy + 2, w, 3, P.concreteDark);
      p.rect(0, gy + 7, w, h - gy - 7, P.grass);
      p.grain(0, gy + 5, w, h - gy - 5, P.concreteDark, 0.09, 1);
      for (let x = 0; x < w; x += 7) {
        if (rng() > 0.55) p.rect(x, gy - 2, 1, 2, P.grass);
      }
      p.ditherEdge(gy, P.skyHorizon, P.grass);
    },

    drawAmbient(p, timeSec) {
      const { artW: w, groundY: gy } = p;
      const rocketX = Math.round(w * 0.27);
      const puffCount = p.mobile ? 3 : 6;
      for (let i = 0; i < puffCount; i++) {
        const phase = (timeSec * 0.16 + i / puffCount) % 1;
        const x = rocketX - 18 + phase * 26 + Math.sin(i * 2.1) * 2;
        const y = gy - 4 - phase * 26;
        const size = 2 + Math.floor(phase * 5);
        p.rect(x, y, size, size, P.rocket);
        if (phase > 0.35) p.rect(x + 1, y + 1, size - 1, size - 1, P.rocketShade);
      }

      // Rotating radar sweep
      const rx = Math.round(w * 0.88);
      const ry = gy - Math.round(gy * 0.14) - 3 - 20;
      const angle = timeSec * 0.9;
      const ex = rx + Math.cos(angle) * 11;
      const ey = ry + Math.sin(angle) * 6;
      p.line(rx, ry, ex, ey, P.glow, 1);

      // Beacon blink
      if (Math.floor(timeSec * 2) % 2 === 0) {
        p.rect(rx + 4, gy - Math.round(gy * 0.14) - 3 - 28, 2, 2, P.red);
      }

      // Low searchlight glow behind the gantry
      p.rect(w * 0.42, gy * 0.52, 2, 22, P.concreteDark);
    },

    drawTree,
  });
})();
