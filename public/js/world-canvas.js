/* ==========================================================================
   Historically — Procedural Pixel-Art World Canvas & Depth Ruler
   Renders the continuous vertical world (sky -> surface -> deep earth strata)
   and draws the right-edge era ruler + sliding pink "YOU" marker on canvas.
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.WorldCanvas = (() => {
  'use strict';

  const PALETTE = window.Historically.PALETTE;
  const Camera = window.Historically.WorldCamera;

  // Palette-matched constants & rendering scale
  const CANVAS_SCALE = 2; // Half-resolution buffer for crisp pixels + tiny bitmap text
  const U = 2;            // 1 scene art unit = 2x2 buffer pixels
  const SEED = 20261125;
  const STEPPED_FPS = 10;

  const CLOUDS = [
    { xFrac: 0.08, y: 14, speed: 2.2, rects: [[4, 0, 14, 4], [0, 4, 24, 6], [6, 6, 16, 4]] },
    { xFrac: 0.38, y: 26, speed: 1.5, rects: [[4, 0, 12, 4], [0, 4, 20, 4], [6, 6, 12, 2]] },
    { xFrac: 0.64, y: 10, speed: 1.9, rects: [[6, 0, 16, 4], [0, 2, 28, 6], [4, 6, 20, 4]] },
    { xFrac: 0.85, y: 34, speed: 1.2, rects: [[4, 0, 10, 4], [0, 2, 18, 4]] },
  ];

  const LEAF_OFFSETS = [
    { dx: -14, startY: -34, speedY: 7, phase: 0.0 },
    { dx: 10, startY: -40, speedY: 5.5, phase: 2.1 },
    { dx: -2, startY: -28, speedY: 6.2, phase: 4.3 },
    { dx: 16, startY: -32, speedY: 5.0, phase: 6.0 },
  ];

  // Minimal 3x5 bitmap glyphs (each row is 3 bits) for crisp canvas ruler labels
  const GLYPHS = {
    '0': [7, 5, 5, 5, 7], '1': [2, 6, 2, 2, 7], '2': [7, 1, 7, 4, 7],
    '3': [7, 1, 7, 1, 7], '4': [5, 5, 7, 1, 1], '5': [7, 4, 7, 1, 7],
    '6': [7, 4, 7, 5, 7], '7': [7, 1, 1, 2, 2], '8': [7, 5, 7, 5, 7],
    '9': [7, 5, 7, 1, 7],
    A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [7, 4, 4, 4, 7],
    D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7], G: [7, 4, 5, 5, 7],
    I: [7, 2, 2, 2, 7], L: [4, 4, 4, 4, 7], M: [5, 7, 7, 5, 5],
    N: [5, 7, 7, 7, 5], O: [7, 5, 5, 5, 7], R: [6, 5, 6, 5, 5],
    S: [7, 4, 7, 1, 7], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7],
    Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7], '.': [0, 0, 0, 0, 2],
    ' ': [0, 0, 0, 0, 0],
  };

  function snap(v) {
    return Math.round(v / 2) * 2;
  }

  function createRng(seed) {
    let a = seed >>> 0;
    return function next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Draw rectangle in art units (scaled by U into buffer pixels)
  function artRect(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x) * U, Math.round(y) * U, Math.round(w) * U, Math.round(h) * U);
  }

  function artPoly(c, points, color) {
    c.fillStyle = color;
    c.beginPath();
    points.forEach(([px, py], i) => {
      const bx = snap(px) * U;
      const by = snap(py) * U;
      if (i === 0) c.moveTo(bx, by);
      else c.lineTo(bx, by);
    });
    c.closePath();
    c.fill();
  }

  // Draw crisp 3x5 bitmap text directly in buffer coordinates
  function drawBitmapText(c, text, rightX, topY, color, alignRight = true) {
    const str = text.toUpperCase();
    const charStep = 4;
    const totalW = str.length * charStep - 1;
    let cursorX = alignRight ? Math.round(rightX - totalW) : Math.round(rightX);
    const py = Math.round(topY);

    c.fillStyle = color;
    for (let i = 0; i < str.length; i++) {
      const glyph = GLYPHS[str[i]] || GLYPHS[' '];
      for (let row = 0; row < 5; row++) {
        const bits = glyph[row];
        for (let col = 0; col < 3; col++) {
          if (bits & (4 >> col)) {
            c.fillRect(cursorX + col, py + row, 1, 1);
          }
        }
      }
      cursorX += charStep;
    }
  }

  function createWorldCanvas(canvasEl) {
    const ctx = canvasEl.getContext('2d', { alpha: false });
    const staticCanvas = document.createElement('canvas');
    const staticCtx = staticCanvas.getContext('2d', { alpha: false });

    const state = {
      bufW: 640,
      bufH: 400,
      artW: 320,
      artH: 200,
      worldArtH: Camera.SURFACE_Y + Camera.MAX_DEPTH + 180,
      sunX: 256,
      sunY: 24,
      machineX: 116,
      treeX: 198,
    };

    // Sky: pale blue top to warm cream horizon
    function drawSky(c, artW, groundY, rng) {
      const band1 = snap(groundY * 0.42);
      const band2 = snap(groundY * 0.78);

      artRect(c, 0, 0, artW, band1, PALETTE.skyTop);
      artRect(c, 0, band1, artW, band2 - band1, PALETTE.skyMid);
      artRect(c, 0, band2, artW, groundY - band2, PALETTE.skyHorizon);

      for (let x = 0; x < artW; x += 2) {
        if ((x / 2) % 2 === 0) {
          artRect(c, x, band1 - 2, 2, 2, PALETTE.skyMid);
          artRect(c, x, band2 - 2, 2, 2, PALETTE.skyHorizon);
        } else {
          artRect(c, x, band1, 2, 2, PALETTE.skyTop);
          artRect(c, x, band2, 2, 2, PALETTE.skyMid);
        }
        if (rng() > 0.72) artRect(c, x, band1 + 2, 2, 2, PALETTE.skyTop);
        if (rng() > 0.72) artRect(c, x, band2 + 2, 2, 2, PALETTE.skyMid);
      }
    }

    // Sun: blocky pixel sun
    function drawSun(c, sx, sy) {
      artRect(c, sx - 10, sy - 6, 20, 12, PALETTE.sunGlow);
      artRect(c, sx - 6, sy - 10, 12, 20, PALETTE.sunGlow);
      artRect(c, sx - 8, sy - 8, 16, 16, PALETTE.sunGlow);
      artRect(c, sx - 6, sy - 6, 12, 12, PALETTE.sunCore);
      artRect(c, sx - 8, sy - 4, 16, 8, PALETTE.sunCore);
      artRect(c, sx - 4, sy - 8, 8, 16, PALETTE.sunCore);
    }

    // Deep earth strata from surface all the way to Stone Age void
    function drawDeepStrata(c, artW, worldArtH, groundY, rng) {
      const b1 = groundY + 6;
      const b2 = groundY + 140; // Industrial
      const b3 = groundY + 250; // Renaissance -> Middle Ages
      const b4 = groundY + 410; // Classical -> Bronze
      const b5 = groundY + 560; // Prehistoric void

      artRect(c, 0, b1, artW, b2 - b1, PALETTE.dirtTop);
      artRect(c, 0, b2, artW, b3 - b2, PALETTE.strataMid);
      artRect(c, 0, b3, artW, b4 - b3, PALETTE.strataDeep);
      artRect(c, 0, b4, artW, b5 - b4, PALETTE.ink);
      artRect(c, 0, b5, artW, worldArtH - b5, PALETTE.strataVoid);

      const transitions = [
        { y: b2, upper: PALETTE.dirtTop, lower: PALETTE.strataMid },
        { y: b3, upper: PALETTE.strataMid, lower: PALETTE.strataDeep },
        { y: b4, upper: PALETTE.strataDeep, lower: PALETTE.ink },
        { y: b5, upper: PALETTE.ink, lower: PALETTE.strataVoid },
      ];

      transitions.forEach(({ y, upper, lower }) => {
        for (let x = 0; x < artW; x += 2) {
          if ((x / 2) % 2 === 0) {
            artRect(c, x, y - 2, 2, 2, lower);
            if (rng() > 0.5) artRect(c, x, y - 4, 2, 2, lower);
          } else {
            artRect(c, x, y, 2, 2, upper);
            if (rng() > 0.6) artRect(c, x, y + 2, 2, 2, upper);
          }
        }
      });

      // Seeded geological grain & mineral flecks
      for (let x = 0; x < artW; x += 2) {
        for (let y = b1 + 2; y < worldArtH - 4; y += 2) {
          const roll = rng();
          if (y < b2 && roll > 0.94) {
            artRect(c, x, y, 2, 2, PALETTE.strataMid);
          } else if (y >= b2 && y < b3 && roll > 0.95) {
            artRect(c, x, y, 2, 2, PALETTE.strataDeep);
          } else if (y >= b3 && y < b4 && roll > 0.96) {
            artRect(c, x, y, 2, 2, PALETTE.pottery);
          } else if (y >= b4 && roll > 0.975) {
            artRect(c, x, y, 2, 2, PALETTE.steelDark);
          }
        }
      }

      // Buried relics scattered along the vertical descent
      // 1. Coin (modern/industrial topsoil)
      const coinX = snap(artW * 0.22);
      const coinY = groundY + 78;
      artRect(c, coinX - 2, coinY - 4, 6, 8, PALETTE.ink);
      artRect(c, coinX - 4, coinY - 2, 10, 4, PALETTE.ink);
      artRect(c, coinX - 2, coinY - 2, 6, 4, PALETTE.brassMid);
      artRect(c, coinX, coinY - 2, 2, 4, PALETTE.sunGlow);

      // 2. Pottery shard (renaissance/medieval)
      const potX = snap(artW * 0.72);
      const potY = groundY + 215;
      artPoly(c, [[potX - 4, potY - 4], [potX + 6, potY - 2], [potX + 4, potY + 4], [potX - 2, potY + 4]], PALETTE.ink);
      artRect(c, potX - 2, potY - 2, 6, 4, PALETTE.pottery);
      artRect(c, potX, potY - 2, 2, 2, PALETTE.brassLight);

      // 3. Classical amphora / pillar fragment (classical strata)
      const colX = snap(artW * 0.26);
      const colY = groundY + 375;
      artRect(c, colX - 6, colY - 6, 12, 12, PALETTE.strataVoid);
      artRect(c, colX - 4, colY - 4, 8, 8, PALETTE.steelMid);
      artRect(c, colX - 2, colY - 4, 2, 8, PALETTE.cloudShade);

      // 4. Prehistoric bone (bronze/stone age)
      const boneX = snap(artW * 0.48);
      const boneY = groundY + 510;
      artRect(c, boneX - 6, boneY - 4, 4, 4, PALETTE.strataVoid);
      artRect(c, boneX + 4, boneY - 4, 4, 4, PALETTE.strataVoid);
      artRect(c, boneX - 6, boneY, 4, 4, PALETTE.strataVoid);
      artRect(c, boneX + 4, boneY, 4, 4, PALETTE.strataVoid);
      artRect(c, boneX - 4, boneY - 2, 10, 4, PALETTE.cloudLight);
      artRect(c, boneX - 6, boneY - 2, 2, 2, PALETTE.cloudLight);
      artRect(c, boneX + 6, boneY - 2, 2, 2, PALETTE.cloudLight);
    }

    // Ground grass strip, tufts & pixel flowers
    function drawGround(c, artW, groundY, machineX, treeX, rng) {
      artRect(c, 0, groundY, artW, 2, PALETTE.grassLight);
      artRect(c, 0, groundY + 2, artW, 4, PALETTE.grassDark);

      for (let x = 0; x < artW; x += 2) {
        if (rng() > 0.55) artRect(c, x, groundY + 6, 2, 2, PALETTE.grassDark);
        if (Math.abs(x - machineX) < 16 || Math.abs(x - treeX) < 8) continue;

        const roll = rng();
        if (roll > 0.84) {
          artRect(c, x, groundY - 2, 2, 2, PALETTE.grassLight);
          if (roll > 0.92) artRect(c, x + 2, groundY - 4, 2, 4, PALETTE.grassDark);
        } else if (roll < 0.045) {
          artRect(c, x, groundY - 2, 2, 2, PALETTE.grassDark);
          artRect(c, x, groundY - 4, 2, 2, roll < 0.022 ? PALETTE.flowerPink : PALETTE.sunCore);
        }
      }
    }

    // Brass-and-steel time machine hull
    function drawTimeMachineStatic(c, cx, baseY) {
      artRect(c, cx - 16, baseY, 32, 2, PALETTE.ink);
      artRect(c, cx - 1, baseY - 50, 2, 8, PALETTE.ink);
      artRect(c, cx, baseY - 48, 2, 6, PALETTE.steelMid);
      artRect(c, cx - 2, baseY - 52, 4, 2, PALETTE.ink);

      artPoly(c, [[cx - 12, baseY - 12], [cx - 8, baseY - 12], [cx - 14, baseY], [cx - 18, baseY]], PALETTE.ink);
      artPoly(c, [[cx + 8, baseY - 12], [cx + 12, baseY - 12], [cx + 18, baseY], [cx + 14, baseY]], PALETTE.ink);
      artRect(c, cx - 18, baseY - 2, 6, 2, PALETTE.steelDark);
      artRect(c, cx + 12, baseY - 2, 6, 2, PALETTE.steelDark);
      artRect(c, cx - 14, baseY - 8, 4, 6, PALETTE.steelMid);
      artRect(c, cx + 10, baseY - 8, 4, 6, PALETTE.steelMid);

      artPoly(
        c,
        [
          [cx - 8, baseY - 42], [cx + 8, baseY - 42],
          [cx + 16, baseY - 34], [cx + 16, baseY - 14],
          [cx + 10, baseY - 8], [cx - 10, baseY - 8],
          [cx - 16, baseY - 14], [cx - 16, baseY - 34],
        ],
        PALETTE.ink
      );

      artPoly(
        c,
        [
          [cx - 6, baseY - 40], [cx + 6, baseY - 40],
          [cx + 14, baseY - 32], [cx + 14, baseY - 26],
          [cx - 14, baseY - 26], [cx - 14, baseY - 32],
        ],
        PALETTE.brassMid
      );
      artRect(c, cx - 8, baseY - 38, 10, 4, PALETTE.brassLight);
      artRect(c, cx + 8, baseY - 34, 4, 8, PALETTE.steelDark);

      artRect(c, cx - 14, baseY - 24, 28, 12, PALETTE.steelMid);
      artRect(c, cx + 8, baseY - 24, 6, 12, PALETTE.steelDark);
      artRect(c, cx - 10, baseY - 12, 20, 2, PALETTE.steelDark);
      artRect(c, cx - 14, baseY - 26, 28, 2, PALETTE.brassLight);

      artRect(c, cx - 12, baseY - 24, 2, 2, PALETTE.brassLight);
      artRect(c, cx + 10, baseY - 24, 2, 2, PALETTE.brassLight);
      artRect(c, cx - 12, baseY - 14, 2, 2, PALETTE.steelDark);
      artRect(c, cx + 10, baseY - 14, 2, 2, PALETTE.steelDark);

      // Round glass porthole
      artRect(c, cx - 4, baseY - 38, 8, 10, PALETTE.steelDark);
      artRect(c, cx - 6, baseY - 36, 12, 6, PALETTE.steelDark);
      artRect(c, cx - 2, baseY - 36, 4, 6, PALETTE.cyanMid);
      artRect(c, cx - 4, baseY - 34, 8, 4, PALETTE.cyanMid);
      artRect(c, cx - 2, baseY - 36, 2, 2, PALETTE.cloudLight);
    }

    function drawTreeTrunk(c, tx, baseY) {
      artRect(c, tx - 8, baseY, 16, 2, PALETTE.ink);
      artPoly(
        c,
        [[tx - 4, baseY - 28], [tx + 4, baseY - 28], [tx + 6, baseY - 4], [tx + 10, baseY], [tx - 10, baseY], [tx - 6, baseY - 4]],
        PALETTE.ink
      );
      artRect(c, tx - 4, baseY - 26, 8, 24, PALETTE.dirtTop);
      artRect(c, tx - 4, baseY - 26, 2, 22, PALETTE.brassMid);
      artRect(c, tx + 2, baseY - 24, 2, 20, PALETTE.strataDeep);
      artRect(c, tx - 8, baseY - 2, 16, 2, PALETTE.dirtTop);
    }

    function buildStaticWorld() {
      const rng = createRng(SEED);
      const { artW, worldArtH, sunX, sunY, machineX, treeX } = state;
      const groundY = Camera.SURFACE_Y;

      staticCanvas.width = artW * U;
      staticCanvas.height = worldArtH * U;
      staticCtx.imageSmoothingEnabled = false;

      drawSky(staticCtx, artW, groundY, rng);
      drawSun(staticCtx, sunX, sunY);
      drawDeepStrata(staticCtx, artW, worldArtH, groundY, rng);
      drawGround(staticCtx, artW, groundY, machineX, treeX, rng);
      drawTimeMachineStatic(staticCtx, machineX, groundY);
      drawTreeTrunk(staticCtx, treeX, groundY);
    }

    function drawClouds(c, timeSec, scrollY, reduceMotion) {
      const { artW } = state;
      if (scrollY > Camera.SURFACE_Y + 10) return;

      CLOUDS.forEach((cloud) => {
        const wrapW = artW + 40;
        const baseX = cloud.xFrac * wrapW + (reduceMotion ? 0 : timeSec * cloud.speed);
        const cx = snap((baseX % wrapW) - 28);
        const cy = snap(cloud.y - scrollY);

        cloud.rects.forEach(([rx, ry, rw, rh]) => {
          artRect(c, cx + rx, cy + ry + 2, rw, rh, PALETTE.cloudShade);
          artRect(c, cx + rx, cy + ry, rw, rh, PALETTE.cloudLight);
        });
      });
    }

    function drawTimeMachineGlow(c, timeSec, scrollY, reduceMotion) {
      const baseY = Camera.SURFACE_Y - scrollY;
      if (baseY < -10 || baseY > state.artH + 60) return;

      const cx = state.machineX;
      const pulse = Math.sin(timeSec * 2.6);
      const flicker = !reduceMotion && Math.sin(timeSec * 17.3) > 0.94;
      const ringColor = !flicker && pulse > -0.2 ? PALETTE.cyanBright : PALETTE.cyanMid;

      artRect(c, cx - 4, baseY - 24, 8, 12, PALETTE.ink);
      artRect(c, cx - 6, baseY - 22, 12, 8, PALETTE.ink);
      artRect(c, cx - 2, baseY - 22, 4, 2, ringColor);
      artRect(c, cx - 2, baseY - 14, 4, 2, ringColor);
      artRect(c, cx - 4, baseY - 20, 2, 6, ringColor);
      artRect(c, cx + 2, baseY - 20, 2, 6, ringColor);
      artRect(c, cx - 2, baseY - 20, 4, 6, PALETTE.steelDark);
      artRect(c, cx - 1, baseY - 19, 2, 2, PALETTE.cyanBright);
      artRect(c, cx - 2, baseY - 52, 4, 2, pulse > 0.35 ? PALETTE.cyanBright : PALETTE.cyanMid);
    }

    function drawTreeCanopy(c, timeSec, scrollY, reduceMotion) {
      const baseY = Camera.SURFACE_Y - scrollY;
      if (baseY < -10 || baseY > state.artH + 70) return;

      const tx = state.treeX;
      let sway = 0;
      if (!reduceMotion) {
        const stepped = Math.floor(timeSec * STEPPED_FPS) / STEPPED_FPS;
        sway = Math.round(Math.sin(stepped * 1.4));
      }

      artRect(c, tx - 20 + sway, baseY - 40, 40, 16, PALETTE.leafDark);
      artRect(c, tx - 14 + sway, baseY - 52, 28, 14, PALETTE.leafDark);
      artRect(c, tx - 8 + sway, baseY - 56, 16, 6, PALETTE.leafDark);

      artRect(c, tx - 18 + sway, baseY - 42, 34, 12, PALETTE.grassDark);
      artRect(c, tx - 12 + sway, baseY - 52, 24, 12, PALETTE.grassDark);
      artRect(c, tx - 6 + sway, baseY - 56, 12, 6, PALETTE.grassDark);

      artRect(c, tx - 10 + sway, baseY - 46, 16, 6, PALETTE.grassLight);
      artRect(c, tx + 2 + sway, baseY - 50, 10, 8, PALETTE.grassLight);
      artRect(c, tx - 4 + sway, baseY - 56, 10, 4, PALETTE.grassLight);
      artRect(c, tx + 8 + sway, baseY - 38, 8, 6, PALETTE.grassLight);

      if (!reduceMotion) {
        LEAF_OFFSETS.forEach((leaf, index) => {
          const cycle = (timeSec * leaf.speedY + leaf.phase * 5) % 60;
          if (cycle < 36) {
            const lx = Math.round(tx + leaf.dx + Math.round(Math.sin(timeSec * 2 + index) * 2));
            const ly = Math.round(baseY + leaf.startY + cycle);
            if (ly < baseY) {
              artRect(c, lx, ly, 2, 2, index % 2 === 0 ? PALETTE.grassLight : PALETTE.grassDark);
            }
          }
        });
      }
    }

    // Thin vertical depth ruler + sliding pink "YOU" marker along right edge
    function drawDepthRuler(c, camera) {
      const { bufW, bufH } = state;
      const scrollY = camera.state.scrollY;
      const rulerX = bufW - 7;

      // Vertical spine line
      c.fillStyle = PALETTE.steelMid;
      c.fillRect(rulerX, 18, 1, bufH - 46);

      const compactLabels = bufW < 260;

      Camera.ERA_STOPS.forEach((stop) => {
        const sy = Math.round((Camera.SURFACE_Y + stop.depth - scrollY) * U);
        if (sy < 14 || sy > bufH - 22) return;

        c.fillStyle = PALETTE.cloudShade;
        c.fillRect(rulerX - 4, sy, 6, 1);

        const shortText = compactLabels ? stop.label.split(' . ')[0] : stop.label;
        drawBitmapText(c, shortText, rulerX - 7, sy - 2, PALETTE.steelMid, true);
      });

      // Sliding pink "YOU" marker
      const rawYouY = Math.round((Camera.SURFACE_Y + camera.state.depth - scrollY) * U);
      const youY = Math.max(20, Math.min(bufH - 34, rawYouY));

      c.fillStyle = PALETTE.ink;
      c.fillRect(rulerX - 24, youY - 4, 18, 9);
      c.fillStyle = PALETTE.flowerPink;
      c.fillRect(rulerX - 23, youY - 3, 16, 7);
      c.fillRect(rulerX - 6, youY - 1, 4, 3);
      c.fillRect(rulerX - 2, youY, 2, 1);
      drawBitmapText(c, 'YOU', rulerX - 9, youY - 2, PALETTE.cloudLight, true);
    }

    function resize(viewportW, viewportH) {
      const bufW = Math.max(180, Math.ceil(viewportW / CANVAS_SCALE));
      const bufH = Math.max(220, Math.ceil(viewportH / CANVAS_SCALE));
      const artW = Math.ceil(bufW / U);
      const artH = Math.ceil(bufH / U);

      state.bufW = bufW;
      state.bufH = bufH;
      state.artW = artW;
      state.artH = artH;
      state.sunX = snap(artW * (artW < 140 ? 0.8 : 0.78));
      state.sunY = snap(Camera.SURFACE_Y * 0.28);

      const centerX = snap(artW / 2);
      const spread = artW < 140 ? 22 : 40;
      state.machineX = snap(centerX - spread);
      state.treeX = snap(centerX + spread);

      canvasEl.width = bufW;
      canvasEl.height = bufH;
      canvasEl.style.width = `${bufW * CANVAS_SCALE}px`;
      canvasEl.style.height = `${bufH * CANVAS_SCALE}px`;
      ctx.imageSmoothingEnabled = false;

      buildStaticWorld();
    }

    function render(nowMs, camera, reduceMotion) {
      const timeSec = nowMs / 1000;
      const scrollY = camera.state.scrollY;
      const srcY = Math.max(
        0,
        Math.min(staticCanvas.height - state.bufH, Math.round(scrollY * U))
      );

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        staticCanvas,
        0,
        srcY,
        state.bufW,
        state.bufH,
        0,
        0,
        state.bufW,
        state.bufH
      );

      // Ambient palette shift: subtly darken strata backdrop as depth increases
      const depthDarkness = camera.getDepthRatio() * 0.38;
      if (depthDarkness > 0.02) {
        ctx.fillStyle = `rgba(20, 13, 18, ${depthDarkness.toFixed(2)})`;
        ctx.fillRect(0, 0, state.bufW, state.bufH);
      }

      drawClouds(ctx, timeSec, scrollY, reduceMotion);
      drawTreeCanopy(ctx, timeSec, scrollY, reduceMotion);
      drawTimeMachineGlow(ctx, timeSec, scrollY, reduceMotion);
      drawDepthRuler(ctx, camera);
    }

    return {
      CANVAS_SCALE,
      state,
      resize,
      render,
    };
  }

  return {
    createWorldCanvas,
  };
})();
