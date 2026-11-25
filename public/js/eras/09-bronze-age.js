/* ==========================================================================
   Era 9 — Bronze & Iron Age (3000–800 BCE)
   Hazy gold sky, stepped ziggurat, distant pyramid, palms, reed river.
   ========================================================================== */

(function () {
  'use strict';

  const EraUtils = window.Historically.EraUtils;

  const P = {
    skyTop: '#c9994f',
    skyMid: '#e3b96f',
    skyHorizon: '#f3dda0',
    haze: '#f6e6b0',
    ziggurat: '#b47a46',
    zigguratLight: '#d39a5f',
    zigguratDark: '#85512e',
    pyramid: '#c99a5f',
    palm: '#4e6b38',
    palmDark: '#334c29',
    water: '#5b8c88',
    reed: '#8e8b4d',
  };

  function drawPalm(p, x, baseY, sway, tall) {
    const h = tall;
    p.rect(x - 1, baseY - h, 3, h, P.zigguratDark);
    for (let i = 4; i < h; i += 6) {
      p.rect(x - 2 + (i % 3), baseY - i, 4, 1, P.ziggurat);
      p.rect(x + 1, baseY - h + i, 1, 1, P.zigguratLight);
    }
    const cx = x + 1 + sway;
    const cy = baseY - h;
    p.rect(cx - 1, cy - 3, 2, 3, P.zigguratDark);
    // Radial fronds
    p.line(cx, cy, cx - 13, cy - 6, P.palm, 2);
    p.line(cx, cy, cx + 13, cy - 5, P.palm, 2);
    p.line(cx, cy, cx - 9, cy + 3, P.palmDark, 2);
    p.line(cx, cy, cx + 10, cy + 2, P.palmDark, 2);
    p.line(cx, cy, cx - 4, cy - 10, P.palm, 1);
    p.line(cx, cy, cx + 5, cy - 10, P.palmDark, 1);
    p.rect(cx - 14, cy - 7, 3, 2, P.palm);
    p.rect(cx + 11, cy - 6, 3, 2, P.palm);
    p.rect(cx - 10, cy - 2, 3, 2, P.palmDark);
    p.rect(cx + 9, cy - 1, 3, 2, P.palmDark);
    p.rect(cx - 2, cy + 1, 4, 2, P.reed);
  }

  function drawZiggurat(p, cx, baseY, width, height) {
    const tiers = 4;
    for (let tier = 0; tier < tiers; tier++) {
      const tw = width * (1 - tier * 0.19);
      const tx = cx - tw / 2;
      const ty = baseY - (height / tiers) * (tier + 1);
      p.rect(tx, ty, tw, height / tiers + 1, P.ziggurat);
      p.rect(tx, ty, tw * 0.32, height / tiers + 1, P.zigguratLight);
      p.rect(tx + tw - 2, ty, 2, height / tiers + 1, P.zigguratDark);
      p.rect(tx - 1, ty, tw + 2, 1, P.zigguratDark);
      // Brick courses
      for (let by = ty + 3; by < ty + height / tiers; by += 3) {
        p.rect(tx, by, tw, 1, P.zigguratDark);
      }
    }
    // Central staircase
    const stairW = Math.max(4, Math.round(width * 0.1));
    for (let i = 0; i < 22; i++) {
      const sy = baseY - (i / 22) * height;
      p.rect(cx - stairW / 2 - (i < 4 ? 0 : 0), sy, stairW, 1, P.zigguratDark);
      p.rect(cx - stairW / 2, sy, stairW, 1, P.zigguratLight);
    }
    // Shrine at the summit
    const topW = width * 0.28;
    p.rect(cx - topW / 2, baseY - height - 9, topW, 9, P.ziggurat);
    p.rect(cx - topW / 2, baseY - height - 9, topW * 0.4, 9, P.zigguratLight);
    p.rect(cx - topW / 2 - 2, baseY - height - 11, topW + 4, 2, P.zigguratDark);
    p.rect(cx - 2, baseY - height - 14, 3, 3, P.zigguratDark);
    p.rect(cx - 1, baseY - height - 15, 1, 1, P.haze);
    // Entry door
    p.rect(cx - 3, baseY - 7, 6, 7, P.zigguratDark);
  }

  function drawTree(p, x, baseY, sway) {
    drawPalm(p, x - 1, baseY, sway, p.mobile ? 30 : 36);
    // Small second frond cluster ground plant
    p.line(x + 8, baseY - 2, x + 14, baseY - 8, P.palmDark, 1);
    p.line(x + 8, baseY - 2, x + 17, baseY - 4, P.palm, 1);
    p.line(x + 8, baseY - 2, x + 12, baseY - 10, P.palm, 1);
  }

  EraUtils.register({
    id: 'bronze-age',
    name: 'Bronze & Iron Age',
    yearRange: '3000–800 BCE',
    representativeYear: -2000,
    palette: P,
    order: 9,

    drawBackdrop(p) {
      const { artW: w, artH: h, groundY: gy } = p;
      const rng = p.rng;
      const b1 = Math.round(gy * 0.46);
      const b2 = Math.round(gy * 0.8);

      p.rect(0, 0, w, b1, P.skyTop);
      p.rect(0, b1, w, b2 - b1, P.skyMid);
      p.rect(0, b2, w, gy - b2, P.skyHorizon);
      p.ditherEdge(b1, P.skyTop, P.skyMid);
      p.ditherEdge(b2, P.skyMid, P.skyHorizon);

      // Hazy sun
      const sx = Math.round(w * 0.8);
      const sy = Math.round(gy * 0.2);
      p.rect(sx - 12, sy - 3, 24, 6, P.haze);
      p.rect(sx - 7, sy - 7, 14, 14, P.haze);
      p.rect(sx - 5, sy - 5, 10, 10, P.skyHorizon);

      // Distant dunes
      const horizon = gy - 8;
      p.poly(
        [
          [0, horizon],
          [0, horizon - 10],
          [w * 0.24, horizon - 15],
          [w * 0.44, horizon - 7],
          [w * 0.66, horizon - 13],
          [w * 0.86, horizon - 5],
          [w, horizon - 9],
          [w, horizon],
        ],
        P.zigguratLight
      );
      p.poly(
        [
          [0, horizon],
          [0, horizon - 5],
          [w * 0.28, horizon - 8],
          [w * 0.52, horizon - 3],
          [w * 0.74, horizon - 7],
          [w, horizon - 2],
          [w, horizon],
        ],
        P.ziggurat
      );

      // Far-off pyramid
      const px = Math.round(w * 0.84);
      p.poly(
        [
          [px - 22, horizon - 2],
          [px, horizon - 32],
          [px + 24, horizon - 2],
        ],
        P.pyramid
      );
      p.poly(
        [
          [px, horizon - 32],
          [px + 24, horizon - 2],
          [px + 2, horizon - 2],
        ],
        P.zigguratDark
      );
      for (let i = 0; i < 5; i++) {
        p.rect(px - 12 + i * 7, horizon - 8 - i * 4, 4, 1, P.zigguratLight);
      }

      // Palm grove on the horizon
      [0.06, 0.16, 0.3, 0.56, 0.7].forEach((frac, index) => {
        drawPalm(
          p,
          Math.round(w * frac),
          horizon - 1,
          0,
          (p.mobile ? 12 : 16) + (index % 3) * 3
        );
      });

      // Ziggurat in the mid-ground
      drawZiggurat(
        p,
        Math.round(w * 0.27),
        gy - 9,
        Math.round(w * 0.3),
        Math.round(gy * 0.28)
      );

      // Reed river behind the bank
      const riverY = gy - 16;
      p.rect(0, riverY, w, 10, P.water);
      p.rect(0, riverY, w, 2, P.haze);
      for (let x = 2; x < w; x += 10) {
        p.rect(x, riverY + 4, 5, 1, P.haze);
        p.rect(x + 3, riverY + 7, 4, 1, P.zigguratLight);
      }
      // Reeds along the far bank and near bank
      for (let x = 0; x < w; x += 5) {
        if (rng() > 0.38) {
          const rh = 3 + Math.floor(rng() * 6);
          p.rect(x, riverY - rh, 1, rh, P.palmDark);
          if (rng() > 0.5) p.rect(x - 1, riverY - rh, 2, 2, P.reed);
        }
        if (rng() > 0.55) {
          const rh = 3 + Math.floor(rng() * 5);
          p.rect(x, gy - 5 - rh, 1, rh, P.palmDark);
          p.rect(x - 1, gy - 6 - rh, 3, 2, P.reed);
        }
      }

      // Riverbank ground
      p.rect(0, gy - 6, w, h - gy + 6, P.zigguratDark);
      p.rect(0, gy - 6, w, 2, P.ziggurat);
      p.rect(0, gy - 4, w, h - gy + 4, P.zigguratDark);
      p.rect(0, gy, w, h - gy, P.ziggurat);
      p.rect(0, gy, w, 1, P.zigguratLight);
      p.grain(0, gy + 2, w, h - gy - 2, P.zigguratDark, 0.06, 1);
      for (let x = 0; x < w; x += 9) {
        if (rng() > 0.6) p.rect(x, gy + 5, 1, 2, P.reed);
      }
      p.ditherEdge(gy, P.skyHorizon, P.zigguratLight);
    },

    drawAmbient(p, timeSec) {
      const { artW: w, groundY: gy } = p;
      // River ripples
      const riverY = gy - 16;
      for (let i = 0; i < (p.mobile ? 3 : 6); i++) {
        const x = ((timeSec * 4 + i * 37) % (w + 20)) - 10;
        p.rect(x, riverY + 3 + (i % 3) * 2, 6 + (i % 2) * 4, 1, P.haze);
      }

      // Swaying palms
      const step = Math.floor(timeSec * 2) % 3;
      const sway = [0, 1, 0][step];
      drawPalm(p, Math.round(w * 0.58), gy - 7, sway, p.mobile ? 24 : 30);
      if (!p.mobile) drawPalm(p, Math.round(w * 0.9), gy - 6, -sway, 24);

      // Birds
      const bx = ((timeSec * 5 + 20) % (w + 30)) - 15;
      p.rect(bx, gy * 0.3, 2, 1, P.zigguratDark);
      p.rect(bx + 3, gy * 0.3, 2, 1, P.zigguratDark);
      p.rect(bx + 1, gy * 0.3 - 1, 1, 1, P.zigguratDark);

      // Heat shimmer lines
      const shimmer = Math.floor(timeSec * 3) % 4;
      if (shimmer < 2) {
        p.rect(w * 0.36, gy * 0.62, 18, 1, P.haze);
        p.rect(w * 0.62, gy * 0.56, 14, 1, P.haze);
      }
    },

    drawTree,
  });
})();
