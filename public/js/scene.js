/* ==========================================================================
   Historically — Procedural Pixel-Art Landing Scene
   Draws all scene art onto a low-res <canvas> scaled up with crisp pixels.
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     Palette (23 colors total — keep <= 24 for a cohesive retro look)
     ------------------------------------------------------------------------ */
  const PALETTE = {
    // Sky & sun
    skyTop: '#6ea8d9',
    skyMid: '#a8d0e6',
    skyHorizon: '#f5e2c4',
    sunCore: '#ffe885',
    sunGlow: '#f7c55c',

    // Clouds & bone relic
    cloudLight: '#fff8eb',
    cloudShade: '#d8e4ed',

    // Grass, flowers & tree canopy (3 greens)
    grassLight: '#6ab04c',
    grassDark: '#3d7a37',
    leafDark: '#27592d',
    flowerPink: '#f06595',

    // Time machine (brass & steel shades + dark outline + cyan glow)
    brassLight: '#e6c27a',
    brassMid: '#b88940',
    steelMid: '#7c8b99',
    steelDark: '#44505e',
    ink: '#1a1d26',
    cyanBright: '#72f5ff',
    cyanMid: '#26b6c9',

    // Earth cross-section strata & buried relics
    dirtTop: '#7a5234',
    strataMid: '#593a27',
    strataDeep: '#3b251c',
    pottery: '#b55d42',
    strataVoid: '#140d12',
  };

  /* ------------------------------------------------------------------------
     Scene Layout & Tweakable Coordinates
     ------------------------------------------------------------------------ */
  const CONFIG = {
    desktopScale: 4,      // Quarter-resolution on desktop (4x4 CSS px per pixel)
    mobileScale: 3,       // 3x3 CSS px on narrow screens so machine + tree both fit
    mobileBreakpoint: 560,
    groundRatio: 0.7,     // Ground sits ~70% down the screen
    seed: 20261125,       // Fixed seed so static pixel grain & tufts never change
    steppedFps: 10,       // Discrete frame rate for stepped canopy sway
  };

  // Cloud definitions: arrays of [offsetX, offsetY, width, height] rectangles
  const CLOUDS = [
    {
      xFrac: 0.08,
      yFrac: 0.16,
      speed: 2.2,
      rects: [
        [4, 0, 14, 4],
        [0, 4, 24, 6],
        [6, 6, 16, 4],
      ],
    },
    {
      xFrac: 0.36,
      yFrac: 0.28,
      speed: 1.5,
      rects: [
        [4, 0, 12, 4],
        [0, 4, 20, 4],
        [6, 6, 12, 2],
      ],
    },
    {
      xFrac: 0.62,
      yFrac: 0.12,
      speed: 1.9,
      rects: [
        [6, 0, 16, 4],
        [0, 2, 28, 6],
        [4, 6, 20, 4],
      ],
    },
    {
      xFrac: 0.84,
      yFrac: 0.36,
      speed: 1.2,
      rects: [
        [4, 0, 10, 4],
        [0, 2, 18, 4],
      ],
    },
    {
      xFrac: 0.22,
      yFrac: 0.44,
      speed: 2.6,
      rects: [
        [6, 0, 10, 4],
        [0, 4, 22, 4],
        [2, 6, 16, 2],
      ],
    },
  ];

  // Falling leaf particles (initialized deterministically per scene)
  const LEAF_OFFSETS = [
    { dx: -14, startY: -34, speedY: 7, phase: 0.0 },
    { dx: 10, startY: -40, speedY: 5.5, phase: 2.1 },
    { dx: -2, startY: -28, speedY: 6.2, phase: 4.3 },
    { dx: 16, startY: -32, speedY: 5.0, phase: 6.0 },
  ];

  /* ------------------------------------------------------------------------
     DOM References & State
     ------------------------------------------------------------------------ */
  const stage = document.getElementById('scene-stage');
  const canvas = document.getElementById('scene-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const staticCanvas = document.createElement('canvas');
  const staticCtx = staticCanvas.getContext('2d', { alpha: false });

  const beginBtn = document.getElementById('begin-btn');
  const fadeCurtain = document.getElementById('fade-curtain');
  const howToggle = document.getElementById('how-toggle');
  const howModal = document.getElementById('how-modal');
  const modalClose = document.getElementById('modal-close');

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = reducedMotionQuery.matches;

  const sceneState = {
    w: 320,
    h: 200,
    scale: CONFIG.desktopScale,
    groundY: 140,
    sunX: 250,
    sunY: 32,
    machineX: 116,
    machineY: 140,
    treeX: 196,
    treeY: 140,
    flashUntil: 0,
    isLaunching: false,
    rafId: null,
  };

  /* ------------------------------------------------------------------------
     Utility Helpers: Grid Snapping & Seeded PRNG
     ------------------------------------------------------------------------ */
  // Snap coordinates to an even grid so pixel edges stay razor sharp
  function snap(value) {
    return Math.round(value / 2) * 2;
  }

  // Mulberry32 deterministic PRNG (never use Math.random for static scenery)
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

  // Helper to draw a snapped rectangle
  function pxRect(targetCtx, x, y, w, h, color) {
    targetCtx.fillStyle = color;
    targetCtx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Helper to draw a snapped polygon from [x, y] pairs
  function pxPoly(targetCtx, points, color) {
    targetCtx.fillStyle = color;
    targetCtx.beginPath();
    points.forEach(([px, py], index) => {
      const sx = snap(px);
      const sy = snap(py);
      if (index === 0) targetCtx.moveTo(sx, sy);
      else targetCtx.lineTo(sx, sy);
    });
    targetCtx.closePath();
    targetCtx.fill();
  }

  /* ------------------------------------------------------------------------
     Static Scenery Drawing (cached once onto staticCanvas)
     ------------------------------------------------------------------------ */

  // Sky: stepped gradient from pale blue at top to warm cream at horizon
  function drawSky(c, w, groundY, rng) {
    const band1 = snap(groundY * 0.42);
    const band2 = snap(groundY * 0.78);

    pxRect(c, 0, 0, w, band1, PALETTE.skyTop);
    pxRect(c, 0, band1, w, band2 - band1, PALETTE.skyMid);
    pxRect(c, 0, band2, w, groundY - band2, PALETTE.skyHorizon);

    // Subtle seeded pixel dithering along sky transitions
    for (let x = 0; x < w; x += 2) {
      if ((x / 2) % 2 === 0) {
        pxRect(c, x, band1 - 2, 2, 2, PALETTE.skyMid);
        pxRect(c, x, band2 - 2, 2, 2, PALETTE.skyHorizon);
      } else {
        pxRect(c, x, band1, 2, 2, PALETTE.skyTop);
        pxRect(c, x, band2, 2, 2, PALETTE.skyMid);
      }
      if (rng() > 0.72) {
        pxRect(c, x, band1 + 2, 2, 2, PALETTE.skyTop);
      }
      if (rng() > 0.72) {
        pxRect(c, x, band2 + 2, 2, 2, PALETTE.skyMid);
      }
    }
  }

  // Sun: blocky pixel sun in the upper-right sky
  function drawSun(c, sx, sy) {
    pxRect(c, sx - 10, sy - 6, 20, 12, PALETTE.sunGlow);
    pxRect(c, sx - 6, sy - 10, 12, 20, PALETTE.sunGlow);
    pxRect(c, sx - 8, sy - 8, 16, 16, PALETTE.sunGlow);

    pxRect(c, sx - 6, sy - 6, 12, 12, PALETTE.sunCore);
    pxRect(c, sx - 8, sy - 4, 16, 8, PALETTE.sunCore);
    pxRect(c, sx - 4, sy - 8, 8, 16, PALETTE.sunCore);
  }

  // Earth cross-section: horizontal strata layers + dithering + buried relics
  function drawStrata(c, w, h, groundY, rng) {
    const depth = h - groundY;
    const layer1Y = groundY + 6;
    const layer2Y = snap(groundY + depth * 0.32);
    const layer3Y = snap(groundY + depth * 0.62);
    const layer4Y = snap(groundY + depth * 0.84);

    // Base strata fills
    pxRect(c, 0, layer1Y, w, layer2Y - layer1Y, PALETTE.dirtTop);
    pxRect(c, 0, layer2Y, w, layer3Y - layer2Y, PALETTE.strataMid);
    pxRect(c, 0, layer3Y, w, layer4Y - layer3Y, PALETTE.strataDeep);
    pxRect(c, 0, layer4Y, w, h - layer4Y, PALETTE.strataVoid);

    // Dithered borders between strata layers
    const borders = [
      { y: layer2Y, upper: PALETTE.dirtTop, lower: PALETTE.strataMid },
      { y: layer3Y, upper: PALETTE.strataMid, lower: PALETTE.strataDeep },
      { y: layer4Y, upper: PALETTE.strataDeep, lower: PALETTE.strataVoid },
    ];

    borders.forEach(({ y, upper, lower }) => {
      for (let x = 0; x < w; x += 2) {
        if ((x / 2) % 2 === 0) {
          pxRect(c, x, y - 2, 2, 2, lower);
          if (rng() > 0.5) pxRect(c, x, y - 4, 2, 2, lower);
        } else {
          pxRect(c, x, y, 2, 2, upper);
          if (rng() > 0.65) pxRect(c, x, y + 2, 2, 2, upper);
        }
      }
    });

    // Seeded soil grain & pebbles across strata
    for (let x = 0; x < w; x += 2) {
      for (let y = layer1Y + 2; y < h - 2; y += 2) {
        const roll = rng();
        if (roll > 0.94 && y < layer3Y) {
          pxRect(c, x, y, 2, 2, PALETTE.strataDeep);
        } else if (roll < 0.03 && y < layer2Y) {
          pxRect(c, x, y, 2, 2, PALETTE.brassMid);
        } else if (roll > 0.97 && y >= layer3Y && y < layer4Y) {
          pxRect(c, x, y, 2, 2, PALETTE.strataVoid);
        }
      }
    }

    // Buried relic 1: Ancient gold coin (left-mid strata)
    const coinX = snap(w * 0.24);
    const coinY = snap(layer2Y + (layer3Y - layer2Y) * 0.45);
    pxRect(c, coinX - 2, coinY - 4, 6, 8, PALETTE.ink);
    pxRect(c, coinX - 4, coinY - 2, 10, 4, PALETTE.ink);
    pxRect(c, coinX - 2, coinY - 2, 6, 4, PALETTE.brassMid);
    pxRect(c, coinX, coinY - 2, 2, 4, PALETTE.sunGlow);

    // Buried relic 2: Terracotta pottery shard (right strata)
    const potX = snap(w * 0.74);
    const potY = snap(layer2Y + (layer3Y - layer2Y) * 0.6);
    pxPoly(
      c,
      [
        [potX - 4, potY - 4],
        [potX + 6, potY - 2],
        [potX + 4, potY + 4],
        [potX - 2, potY + 4],
      ],
      PALETTE.ink
    );
    pxRect(c, potX - 2, potY - 2, 6, 4, PALETTE.pottery);
    pxRect(c, potX, potY - 2, 2, 2, PALETTE.brassLight);

    // Buried relic 3: Prehistoric bone (deep center-left strata)
    const boneX = snap(w * 0.46);
    const boneY = snap(layer3Y + (layer4Y - layer3Y) * 0.45);
    pxRect(c, boneX - 6, boneY - 4, 4, 4, PALETTE.ink);
    pxRect(c, boneX + 4, boneY - 4, 4, 4, PALETTE.ink);
    pxRect(c, boneX - 6, boneY, 4, 4, PALETTE.ink);
    pxRect(c, boneX + 4, boneY, 4, 4, PALETTE.ink);
    pxRect(c, boneX - 4, boneY - 2, 10, 4, PALETTE.cloudLight);
    pxRect(c, boneX - 6, boneY - 2, 2, 2, PALETTE.cloudLight);
    pxRect(c, boneX + 6, boneY - 2, 2, 2, PALETTE.cloudLight);
    pxRect(c, boneX - 4, boneY - 4, 2, 2, PALETTE.cloudShade);
    pxRect(c, boneX + 4, boneY + 2, 2, 2, PALETTE.cloudShade);
  }

  // Ground line: grass strip, seeded tufts, and small pixel flowers
  function drawGround(c, w, groundY, machineX, treeX, rng) {
    pxRect(c, 0, groundY, w, 2, PALETTE.grassLight);
    pxRect(c, 0, groundY + 2, w, 4, PALETTE.grassDark);

    // Seeded uneven grass edge, tufts, and pixel flowers
    for (let x = 0; x < w; x += 2) {
      if (rng() > 0.55) {
        pxRect(c, x, groundY + 6, 2, 2, PALETTE.grassDark);
      }

      // Skip tufts directly underneath the machine and trunk footprints
      const nearMachine = Math.abs(x - machineX) < 16;
      const nearTrunk = Math.abs(x - treeX) < 8;
      if (nearMachine || nearTrunk) continue;

      const roll = rng();
      if (roll > 0.84) {
        pxRect(c, x, groundY - 2, 2, 2, PALETTE.grassLight);
        if (roll > 0.92) {
          pxRect(c, x + 2, groundY - 4, 2, 4, PALETTE.grassDark);
        }
      } else if (roll < 0.045) {
        // Tiny pixel flower
        pxRect(c, x, groundY - 2, 2, 2, PALETTE.grassDark);
        pxRect(c, x, groundY - 4, 2, 2, roll < 0.022 ? PALETTE.flowerPink : PALETTE.sunCore);
      }
    }
  }

  // Time Machine: static brass-and-steel pod with porthole, antenna, rivets, and landing legs
  function drawTimeMachineStatic(c, cx, baseY) {
    // Ground shadow
    pxRect(c, cx - 16, baseY, 32, 2, PALETTE.ink);

    // Small top antenna
    pxRect(c, cx - 1, baseY - 50, 2, 8, PALETTE.ink);
    pxRect(c, cx, baseY - 48, 2, 6, PALETTE.steelMid);
    pxRect(c, cx - 2, baseY - 52, 4, 2, PALETTE.ink);

    // Landing legs (left & right angled steel struts + pads)
    pxPoly(
      c,
      [
        [cx - 12, baseY - 12],
        [cx - 8, baseY - 12],
        [cx - 14, baseY],
        [cx - 18, baseY],
      ],
      PALETTE.ink
    );
    pxPoly(
      c,
      [
        [cx + 8, baseY - 12],
        [cx + 12, baseY - 12],
        [cx + 18, baseY],
        [cx + 14, baseY],
      ],
      PALETTE.ink
    );
    pxRect(c, cx - 18, baseY - 2, 6, 2, PALETTE.steelDark);
    pxRect(c, cx + 12, baseY - 2, 6, 2, PALETTE.steelDark);
    pxRect(c, cx - 14, baseY - 8, 4, 6, PALETTE.steelMid);
    pxRect(c, cx + 10, baseY - 8, 4, 6, PALETTE.steelMid);

    // Outer dark silhouette of rounded brass-and-steel pod
    pxPoly(
      c,
      [
        [cx - 8, baseY - 42],
        [cx + 8, baseY - 42],
        [cx + 16, baseY - 34],
        [cx + 16, baseY - 14],
        [cx + 10, baseY - 8],
        [cx - 10, baseY - 8],
        [cx - 16, baseY - 14],
        [cx - 16, baseY - 34],
      ],
      PALETTE.ink
    );

    // Upper brass dome (3 shades: light, mid, dark steel shadow)
    pxPoly(
      c,
      [
        [cx - 6, baseY - 40],
        [cx + 6, baseY - 40],
        [cx + 14, baseY - 32],
        [cx + 14, baseY - 26],
        [cx - 14, baseY - 26],
        [cx - 14, baseY - 32],
      ],
      PALETTE.brassMid
    );
    pxRect(c, cx - 8, baseY - 38, 10, 4, PALETTE.brassLight);
    pxRect(c, cx + 8, baseY - 34, 4, 8, PALETTE.steelDark);

    // Lower steel hull & riveted brass belt
    pxRect(c, cx - 14, baseY - 24, 28, 12, PALETTE.steelMid);
    pxRect(c, cx + 8, baseY - 24, 6, 12, PALETTE.steelDark);
    pxRect(c, cx - 10, baseY - 12, 20, 2, PALETTE.steelDark);
    pxRect(c, cx - 14, baseY - 26, 28, 2, PALETTE.brassLight);

    // Rivets along panel seams
    pxRect(c, cx - 12, baseY - 24, 2, 2, PALETTE.brassLight);
    pxRect(c, cx + 10, baseY - 24, 2, 2, PALETTE.brassLight);
    pxRect(c, cx - 12, baseY - 14, 2, 2, PALETTE.steelDark);
    pxRect(c, cx + 10, baseY - 14, 2, 2, PALETTE.steelDark);

    // Round glass porthole (upper center, notched corners for pixel roundness)
    pxRect(c, cx - 4, baseY - 38, 8, 10, PALETTE.steelDark);
    pxRect(c, cx - 6, baseY - 36, 12, 6, PALETTE.steelDark);
    pxRect(c, cx - 2, baseY - 36, 4, 6, PALETTE.cyanMid);
    pxRect(c, cx - 4, baseY - 34, 8, 4, PALETTE.cyanMid);
    pxRect(c, cx - 2, baseY - 36, 2, 2, PALETTE.cloudLight);
  }

  // Tree: static thick trunk and roots
  function drawTreeTrunk(c, tx, baseY) {
    // Root shadow
    pxRect(c, tx - 8, baseY, 16, 2, PALETTE.ink);

    // Trunk outline & body
    pxPoly(
      c,
      [
        [tx - 4, baseY - 28],
        [tx + 4, baseY - 28],
        [tx + 6, baseY - 4],
        [tx + 10, baseY],
        [tx - 10, baseY],
        [tx - 6, baseY - 4],
      ],
      PALETTE.ink
    );
    pxRect(c, tx - 4, baseY - 26, 8, 24, PALETTE.dirtTop);
    pxRect(c, tx - 4, baseY - 26, 2, 22, PALETTE.brassMid);
    pxRect(c, tx + 2, baseY - 24, 2, 20, PALETTE.strataDeep);
    pxRect(c, tx - 8, baseY - 2, 16, 2, PALETTE.dirtTop);
  }

  function buildStaticScene() {
    const rng = createRng(CONFIG.seed);
    const { w, h, groundY, sunX, sunY, machineX, machineY, treeX, treeY } = sceneState;

    staticCanvas.width = w;
    staticCanvas.height = h;
    staticCtx.imageSmoothingEnabled = false;

    drawSky(staticCtx, w, groundY, rng);
    drawSun(staticCtx, sunX, sunY);
    drawStrata(staticCtx, w, h, groundY, rng);
    drawGround(staticCtx, w, groundY, machineX, treeX, rng);
    drawTimeMachineStatic(staticCtx, machineX, machineY);
    drawTreeTrunk(staticCtx, treeX, treeY);
  }

  /* ------------------------------------------------------------------------
     Animated Scene Elements (drawn each frame on top of staticCanvas)
     ------------------------------------------------------------------------ */

  // Clouds: drifting arrays of [x, y, w, h] pixel rectangles
  function drawClouds(c, timeSec) {
    const { w, groundY } = sceneState;
    CLOUDS.forEach((cloud) => {
      const wrapW = w + 40;
      const baseX = cloud.xFrac * wrapW + (reduceMotion ? 0 : timeSec * cloud.speed);
      const cx = snap((baseX % wrapW) - 28);
      const cy = snap(cloud.yFrac * groundY);

      cloud.rects.forEach(([rx, ry, rw, rh]) => {
        pxRect(c, cx + rx, cy + ry + 2, rw, rh, PALETTE.cloudShade);
        pxRect(c, cx + rx, cy + ry, rw, rh, PALETTE.cloudLight);
      });
    });
  }

  // Time Machine idle glow: pulsing cyan chronometer ring & antenna tip (no bobbing)
  function drawTimeMachineGlow(c, timeSec, nowMs) {
    const { machineX: cx, machineY: baseY, flashUntil } = sceneState;
    const isFlashing = nowMs < flashUntil;

    // Gentle pulse with occasional subtle flicker
    const pulse = Math.sin(timeSec * 2.6);
    const flicker = !reduceMotion && Math.sin(timeSec * 17.3) > 0.94;
    const brightCore = isFlashing || (!flicker && pulse > -0.2);
    const ringColor = isFlashing || brightCore ? PALETTE.cyanBright : PALETTE.cyanMid;

    // Glowing cyan chronometer ring/dial on front panel (notched pixel circle)
    pxRect(c, cx - 4, baseY - 24, 8, 12, PALETTE.ink);
    pxRect(c, cx - 6, baseY - 22, 12, 8, PALETTE.ink);

    // Outer cyan ring perimeter
    pxRect(c, cx - 2, baseY - 22, 4, 2, ringColor);
    pxRect(c, cx - 2, baseY - 14, 4, 2, ringColor);
    pxRect(c, cx - 4, baseY - 20, 2, 6, ringColor);
    pxRect(c, cx + 2, baseY - 20, 2, 6, ringColor);

    // Inner dark dial face with glowing center core
    pxRect(c, cx - 2, baseY - 20, 4, 6, PALETTE.steelDark);
    pxRect(c, cx - 1, baseY - 19, 2, 2, PALETTE.cyanBright);

    // Extra launch ring flash when "Begin Journey" is clicked
    if (isFlashing) {
      pxRect(c, cx - 6, baseY - 24, 12, 2, PALETTE.cyanBright);
      pxRect(c, cx - 6, baseY - 12, 12, 2, PALETTE.cyanBright);
      pxRect(c, cx - 8, baseY - 22, 2, 8, PALETTE.cyanBright);
      pxRect(c, cx + 6, baseY - 22, 2, 8, PALETTE.cyanBright);
    }

    // Antenna tip beacon
    pxRect(
      c,
      cx - 2,
      baseY - 52,
      4,
      2,
      isFlashing || pulse > 0.35 ? PALETTE.cyanBright : PALETTE.cyanMid
    );
  }

  // Tree Canopy: layered blocky canopy in 3 greens with stepped sway & falling leaves
  function drawTreeCanopy(c, timeSec) {
    const { treeX: tx, treeY: baseY, groundY } = sceneState;

    // Stepped (discrete) sway offset: -1, 0, or +1 pixel
    let sway = 0;
    if (!reduceMotion) {
      const steppedTime = Math.floor(timeSec * CONFIG.steppedFps) / CONFIG.steppedFps;
      sway = Math.round(Math.sin(steppedTime * 1.4));
    }

    // Darkest green base layer
    pxRect(c, tx - 20 + sway, baseY - 40, 40, 16, PALETTE.leafDark);
    pxRect(c, tx - 14 + sway, baseY - 52, 28, 14, PALETTE.leafDark);
    pxRect(c, tx - 8 + sway, baseY - 56, 16, 6, PALETTE.leafDark);

    // Mid green foliage clusters
    pxRect(c, tx - 18 + sway, baseY - 42, 34, 12, PALETTE.grassDark);
    pxRect(c, tx - 12 + sway, baseY - 52, 24, 12, PALETTE.grassDark);
    pxRect(c, tx - 6 + sway, baseY - 56, 12, 6, PALETTE.grassDark);

    // Brightest green sun-facing highlights (upper-right & crown)
    pxRect(c, tx - 10 + sway, baseY - 46, 16, 6, PALETTE.grassLight);
    pxRect(c, tx + 2 + sway, baseY - 50, 10, 8, PALETTE.grassLight);
    pxRect(c, tx - 4 + sway, baseY - 56, 10, 4, PALETTE.grassLight);
    pxRect(c, tx + 8 + sway, baseY - 38, 8, 6, PALETTE.grassLight);

    // Falling leaves (disabled under prefers-reduced-motion)
    if (!reduceMotion) {
      const fallSpan = 36;
      LEAF_OFFSETS.forEach((leaf, index) => {
        const cycle = (timeSec * leaf.speedY + leaf.phase * 5) % (fallSpan + 24);
        if (cycle < fallSpan) {
          const lx = Math.round(tx + leaf.dx + Math.round(Math.sin(timeSec * 2 + index) * 2));
          const ly = Math.round(baseY + leaf.startY + cycle);
          if (ly < groundY) {
            pxRect(c, lx, ly, 2, 2, index % 2 === 0 ? PALETTE.grassLight : PALETTE.grassDark);
          }
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
     Responsive Sizing & Main Render Loop
     ------------------------------------------------------------------------ */
  function resizeScene() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = vw < CONFIG.mobileBreakpoint ? CONFIG.mobileScale : CONFIG.desktopScale;

    const w = Math.max(116, Math.ceil(vw / scale));
    const h = Math.max(150, Math.ceil(vh / scale));

    sceneState.scale = scale;
    sceneState.w = w;
    sceneState.h = h;
    sceneState.groundY = snap(h * CONFIG.groundRatio);
    sceneState.sunX = snap(w * (w < 160 ? 0.84 : 0.8));
    sceneState.sunY = snap(sceneState.groundY * (w < 160 ? 0.5 : 0.22));

    const centerX = snap(w / 2);
    const spread = w < 160 ? 28 : 42;
    sceneState.machineX = snap(centerX - spread);
    sceneState.machineY = sceneState.groundY;
    sceneState.treeX = snap(centerX + spread);
    sceneState.treeY = sceneState.groundY;

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w * scale}px`;
    canvas.style.height = `${h * scale}px`;
    ctx.imageSmoothingEnabled = false;

    buildStaticScene();
    renderFrame(performance.now());
  }

  function renderFrame(nowMs) {
    if (sceneState.rafId !== null) {
      cancelAnimationFrame(sceneState.rafId);
      sceneState.rafId = null;
    }

    const timeSec = nowMs / 1000;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(staticCanvas, 0, 0);

    drawClouds(ctx, timeSec);
    drawTreeCanopy(ctx, timeSec);
    drawTimeMachineGlow(ctx, timeSec, nowMs);

    if (!reduceMotion || nowMs < sceneState.flashUntil) {
      sceneState.rafId = requestAnimationFrame(renderFrame);
    }
  }

  /* ------------------------------------------------------------------------
     Interactions: "Begin Journey" Launch & "How to Play" Modal
     ------------------------------------------------------------------------ */
  if (beginBtn) {
    beginBtn.addEventListener('click', (event) => {
      event.preventDefault();
      if (sceneState.isLaunching) return;
      sceneState.isLaunching = true;

      const targetHref = beginBtn.getAttribute('href') || 'play.html';
      const now = performance.now();
      sceneState.flashUntil = now + 500;

      if (reduceMotion) {
        renderFrame(now);
      } else {
        stage.classList.add('is-shaking');
      }

      setTimeout(() => {
        fadeCurtain.classList.add('is-visible');
      }, 180);

      setTimeout(() => {
        window.location.href = targetHref;
      }, 560);
    });
  }

  function openModal() {
    howModal.hidden = false;
    howToggle.setAttribute('aria-expanded', 'true');
    modalClose.focus();
  }

  function closeModal() {
    howModal.hidden = true;
    howToggle.setAttribute('aria-expanded', 'false');
    howToggle.focus();
  }

  if (howToggle && howModal && modalClose) {
    howToggle.addEventListener('click', openModal);
    modalClose.addEventListener('click', closeModal);
    howModal.addEventListener('click', (event) => {
      if (event.target === howModal) closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !howModal.hidden) {
        closeModal();
      }
    });
  }

  reducedMotionQuery.addEventListener('change', (event) => {
    reduceMotion = event.matches;
    renderFrame(performance.now());
  });

  window.addEventListener('resize', resizeScene);
  resizeScene();
})();
