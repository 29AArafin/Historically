/* ==========================================================================
   Historically — Grounded Era Scene Renderer
   Caches one low-res backdrop per era, then animates weather, smoke, flags,
   tree sway, the machine's portal ring, the timeline and time-travel FX.
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.SceneRenderer = (() => {
  'use strict';

  const U = 2;
  const SEED = 20261125;
  const GLYPHS = {
    '0': [7, 5, 5, 5, 7], '1': [2, 6, 2, 2, 7], '2': [7, 1, 7, 4, 7],
    '3': [7, 1, 7, 1, 7], '4': [5, 5, 7, 1, 1], '5': [7, 4, 7, 1, 7],
    '6': [7, 4, 7, 5, 7], '7': [7, 1, 1, 2, 2], '8': [7, 5, 7, 5, 7],
    '9': [7, 5, 7, 1, 7],
    A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [7, 4, 4, 4, 7],
    D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4],
    G: [7, 4, 5, 5, 7], H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7],
    J: [1, 1, 1, 5, 7], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7],
    M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5], O: [7, 5, 5, 5, 7],
    P: [6, 5, 6, 4, 4], Q: [7, 5, 5, 7, 1], R: [6, 5, 6, 5, 5],
    S: [7, 4, 7, 1, 7], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7],
    V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5],
    Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
    '.': [0, 0, 0, 0, 2], '-': [0, 0, 7, 0, 0], ':': [0, 2, 0, 2, 0],
    ' ': [0, 0, 0, 0, 0],
  };

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

  function hash2(x, y) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function drawBitmapText(c, text, x, y, color, shadowColor) {
    const str = String(text).toUpperCase();
    let cursor = Math.round(x);
    const top = Math.round(y);
    if (shadowColor) {
      c.fillStyle = shadowColor;
      for (let i = 0; i < str.length; i++) {
        const glyph = GLYPHS[str[i]] || GLYPHS[' '];
        for (let row = 0; row < 5; row++) {
          const bits = glyph[row];
          for (let col = 0; col < 3; col++) {
            if (bits & (4 >> col)) c.fillRect(cursor + col + 1, top + row + 1, 1, 1);
          }
        }
        cursor += 4;
      }
      cursor = Math.round(x);
    }
    c.fillStyle = color;
    for (let i = 0; i < str.length; i++) {
      const glyph = GLYPHS[str[i]] || GLYPHS[' '];
      for (let row = 0; row < 5; row++) {
        const bits = glyph[row];
        for (let col = 0; col < 3; col++) {
          if (bits & (4 >> col)) c.fillRect(cursor + col, top + row, 1, 1);
        }
      }
      cursor += 4;
    }
    return str.length * 4 - 1;
  }

  function createScene(canvas, options) {
    const Eras = window.Historically.Eras;
    const EraUtils = window.Historically.EraUtils;
    const Machine = window.Historically.TimeMachine;
    const ctx = canvas.getContext('2d', { alpha: false });

    const state = {
      artW: 320,
      artH: 200,
      bufW: 640,
      bufH: 400,
      artPx: 4,
      mobile: false,
      groundY: 144,
      machineX: 160,
      treeX: 200,
      currentEra: 0,
      caches: [],
      cacheKey: '',
      mainPainter: null,
      ringPhase: 0,
      lastNow: 0,
      flux: [],
      dissolve: [],
      timeline: { from: 0, to: 0, startedAt: 0, duration: 0 },
      timelineVisible: true,
      timelineAlpha: 1,
    };

    // Precomputed vortex particles and dissolve blocks (deterministic).
    (function buildParticles() {
      const rng = createRng(SEED + 71);
      for (let i = 0; i < 120; i++) {
        state.flux.push({
          angle: rng() * Math.PI * 2,
          offset: rng(),
          speed: 0.45 + rng() * 1.6,
          size: rng() > 0.6 ? 3 : 2,
          color: i % 4,
          dir: rng() > 0.5 ? 1 : -1,
          wobble: rng() * 6,
        });
      }
      for (let i = 0; i < 260; i++) {
        const w = 6 + Math.floor(rng() * 10);
        const h = 6 + Math.floor(rng() * 10);
        state.dissolve.push({
          x: Math.floor(rng() * 1000),
          y: Math.floor(rng() * 1000),
          w,
          h,
          order: rng(),
        });
      }
    })();

    function buildCache(era, index) {
      const cache = document.createElement('canvas');
      cache.width = state.bufW;
      cache.height = state.bufH;
      const cacheCtx = cache.getContext('2d', { alpha: false });
      cacheCtx.imageSmoothingEnabled = false;
      const rng = createRng(SEED + (index + 1) * 1009);
      const painter = EraUtils.makePainter(cacheCtx, {
        artW: state.artW,
        artH: state.artH,
        groundY: state.groundY,
        rng,
        mobile: state.mobile,
      });
      era.drawBackdrop(painter);

      // Scale the shared dissolve blocks into this cache.
      const blocks = state.dissolve.map((block) => ({
        x: Math.floor((block.x / 1000) * state.bufW),
        y: Math.floor((block.y / 1000) * state.bufH),
        w: Math.min(state.bufW, block.w),
        h: Math.min(state.bufH, block.h),
        order: block.order,
      }));

      return { canvas: cache, blocks, era };
    }

    function rebuild() {
      const all = [];
      for (let i = 0; i < Eras.count; i++) {
        all.push(buildCache(Eras.get(i), i));
      }
      state.caches = all;
      state.cacheKey = `${state.artW}x${state.artH}:${state.groundY}:${state.mobile ? 1 : 0}`;
    }

    function makeMainPainter() {
      state.mainPainter = EraUtils.makePainter(ctx, {
        artW: state.artW,
        artH: state.artH,
        groundY: state.groundY,
        rng: createRng(SEED + 33),
        mobile: state.mobile,
      });
    }

    function resize(viewportW, viewportH, maxGroundCss) {
      const mobile = viewportW < 640;
      let artPx = mobile ? 3 : 4;
      if (!mobile && viewportH > 1150) artPx = 5;
      if (!mobile && viewportH < 560) artPx = 3;

      const artW = Math.max(112, Math.ceil(viewportW / artPx));
      const artH = Math.max(150, Math.ceil(viewportH / artPx));
      const bufW = artW * U;
      const bufH = artH * U;

      const dockLimit = Number.isFinite(maxGroundCss) && maxGroundCss > 120
        ? maxGroundCss - 20
        : viewportH * 0.78;
      const groundCss = Math.min(viewportH * 0.74, dockLimit);
      let groundY = Math.round(groundCss / artPx);
      groundY = Math.round(clamp(groundY, artH * 0.54, artH * 0.82));

      const centerX = Math.round(artW / 2);
      const spread = mobile ? 33 : Math.round(artW * 0.13);
      const machineX = centerX;
      const treeX = Math.min(artW - (mobile ? 18 : 26), centerX + spread);

      state.artW = artW;
      state.artH = artH;
      state.bufW = bufW;
      state.bufH = bufH;
      state.artPx = artPx;
      state.mobile = mobile;
      state.groundY = groundY;
      state.machineX = machineX;
      state.treeX = treeX;

      canvas.width = bufW;
      canvas.height = bufH;
      canvas.style.width = `${artW * artPx}px`;
      canvas.style.height = `${artH * artPx}px`;
      ctx.imageSmoothingEnabled = false;

      makeMainPainter();
      rebuild();
    }

    function setEra(index, opts) {
      const options = opts || {};
      const clamped = clamp(Math.round(index), 0, Eras.count - 1);
      const previous = state.currentEra;
      state.currentEra = clamped;
      if (options.instant) {
        state.timeline = {
          from: clamped,
          to: clamped,
          startedAt: performance.now(),
          duration: 0,
        };
        return;
      }
      state.timeline = {
        from: previous,
        to: clamped,
        startedAt: performance.now(),
        duration: options.reduceMotion ? 0 : 620,
      };
    }

    function drawStatic(cache) {
      ctx.drawImage(cache.canvas, 0, 0);
    }

    function drawGlitched(cache, nowSec, scramble) {
      drawStatic(cache);
      const frame = Math.floor(nowSec * 22);
      const sliceH = 14;
      ctx.imageSmoothingEnabled = false;
      for (let y = 0; y < state.bufH; y += sliceH) {
        const roll = hash2(y * 3 + 1, frame * 13 + 7);
        let offset = 0;
        if (roll < 0.16 + scramble * 0.3) {
          offset = Math.round(((hash2(y + 17, frame + 3) - 0.5) * (10 + scramble * 22)) / 2) * 2;
        }
        ctx.drawImage(
          cache.canvas,
          0,
          y,
          state.bufW,
          Math.min(sliceH, state.bufH - y),
          offset,
          y,
          state.bufW,
          Math.min(sliceH, state.bufH - y)
        );
      }

      // Scanline tears
      const tears = state.mobile ? 4 : 7;
      for (let i = 0; i < tears; i++) {
        const ty = Math.floor(hash2(i * 9, frame * 5) * state.bufH);
        const th = 2 + Math.floor(hash2(i + 4, frame) * 4);
        const colors = [
          'rgba(114, 245, 255, 0.22)',
          'rgba(240, 101, 149, 0.18)',
          'rgba(20, 13, 18, 0.42)',
          'rgba(255, 248, 235, 0.14)',
        ];
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(0, ty, state.bufW, th);
      }
    }

    function drawGhost(cache, nowSec, alpha, blockAlpha) {
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = alpha;
      ctx.drawImage(cache.canvas, 0, 0);

      const frame = Math.floor(nowSec * 13);
      ctx.globalAlpha = blockAlpha;
      for (let i = 0; i < cache.blocks.length; i++) {
        const block = cache.blocks[i];
        if ((i + frame) % 3 !== 0) continue;
        ctx.drawImage(
          cache.canvas,
          block.x,
          block.y,
          block.w,
          block.h,
          block.x,
          block.y,
          block.w,
          block.h
        );
      }
      ctx.globalAlpha = 1;
    }

    function drawReducedDissolve(fromCache, toCache, progress) {
      drawStatic(fromCache);
      ctx.globalAlpha = clamp(progress, 0, 1);
      ctx.drawImage(toCache.canvas, 0, 0);
      ctx.globalAlpha = 1;
    }

    function drawTimeline(nowMs) {
      if (state.timelineAlpha <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = state.timelineAlpha;

      const bufH = state.bufH;
      const top = 74;
      const bottom = Math.min(bufH - 34, state.groundY * U + 30);
      const span = Math.max(80, bottom - top);
      const axisX = 8;
      const tickY = (index) => top + (index / (Eras.count - 1)) * span;

      // Slim rail and title
      ctx.fillStyle = 'rgba(26, 29, 38, 0.36)';
      ctx.fillRect(0, top - 24, 68, span + 40);
      ctx.fillStyle = 'rgba(124, 139, 153, 0.75)';
      ctx.fillRect(axisX, top - 2, 1, span + 4);

      drawBitmapText(ctx, 'TIMELINE', 5, top - 22, '#ffe885', '#1a1d26');

      const tl = state.timeline;
      let markerPos = tl.to;
      if (tl.duration > 0) {
        const raw = clamp((nowMs - tl.startedAt) / tl.duration, 0, 1);
        const stepped = Math.ceil(raw * 8) / 8;
        markerPos = tl.from + (tl.to - tl.from) * stepped;
      }

      for (let i = 0; i < Eras.count; i++) {
        const era = Eras.get(i);
        const y = Math.round(tickY(i));
        const isCurrent = i === Math.round(markerPos);
        ctx.fillStyle = isCurrent ? '#ffe885' : 'rgba(216, 228, 237, 0.82)';
        ctx.fillRect(axisX, y, isCurrent ? 7 : 4, 1);

        drawBitmapText(
          ctx,
          Eras.formatShortYear(era.representativeYear),
          19,
          y - 2,
          isCurrent ? '#ffe885' : 'rgba(216, 228, 237, 0.88)',
          'rgba(20, 13, 18, 0.85)'
        );
      }

      // Pink YOU marker slides on the stepped timeline
      const markerY = Math.round(tickY(markerPos));
      ctx.fillStyle = '#1a1d26';
      ctx.fillRect(2, markerY - 4, 10, 9);
      ctx.fillStyle = '#f06595';
      ctx.fillRect(3, markerY - 3, 8, 7);
      ctx.fillRect(11, markerY - 1, 3, 3);
      drawBitmapText(
        ctx,
        'YOU',
        19,
        Math.max(top - 10, markerY - 13),
        '#f06595',
        'rgba(20, 13, 18, 0.9)'
      );

      ctx.restore();
    }

    function drawRing(cx, cy, rx, ry, color, thickness) {
      const segments = 34;
      ctx.fillStyle = color;
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.round((cx + Math.cos(angle) * rx) / 2) * 2;
        const y = Math.round((cy + Math.sin(angle) * ry) / 2) * 2;
        ctx.fillRect(x - thickness / 2, y - thickness / 2, thickness, thickness);
      }
    }

    function drawChargeDust(view, nowSec) {
      const count = state.mobile ? 5 : 9;
      const baseX = state.machineX;
      const baseY = state.groundY;
      for (let i = 0; i < count; i++) {
        const phase = ((view.charge * 1.6 + i * 0.19) % 1);
        const dir = i % 2 === 0 ? 1 : -1;
        const x = baseX + dir * (12 + phase * 20);
        const y = baseY - phase * 7;
        const size = 2 + Math.floor(phase * 4);
        ctx.fillStyle = `rgba(216, 228, 237, ${0.55 - phase * 0.35})`;
        ctx.fillRect(Math.round(x * U), Math.round(y * U), size * U, 2 * U);
        ctx.fillStyle = `rgba(124, 139, 153, ${0.35 - phase * 0.22})`;
        ctx.fillRect(Math.round((x + 2) * U), Math.round((y + 2) * U), (size - 1) * U, U);
      }

      const sparks = state.mobile ? 5 : 10;
      const colors = ['#72f5ff', '#fff8eb', '#ffe885', '#f06595'];
      for (let i = 0; i < sparks; i++) {
        const phase = ((nowSec * 1.9 + i * 0.27) % 1);
        const dir = i % 2 === 0 ? 1 : -1;
        const x = baseX + dir * (14 + phase * 24);
        const y = baseY - 2 - phase * 24 + phase * phase * 13;
        const size = i % 3 === 0 ? 2 : 1;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(Math.round(x * U), Math.round(y * U), size * U, size * U);
      }
    }

    function drawArrivalDust(view) {
      if (view.phase !== 'arrive' || view.reduced) return;
      const p = clamp(view.phaseProgress / 0.7, 0, 1);
      if (p <= 0) return;
      const cx = state.machineX * U;
      const cy = state.groundY * U;
      const rx = (12 + p * 46) * U;
      const ry = (2 + p * 9) * U;
      ctx.globalAlpha = 1 - p * 0.75;
      drawRing(cx, cy, rx, ry, '#d8e4ed', 2);
      drawRing(cx, cy, rx * 0.72, ry * 0.7, '#7c8b99', 2);
      ctx.globalAlpha = 1;
    }

    function drawVortex(view, nowSec) {
      if (view.sameEra) {
        // Quick in-place flicker: no swirl, just a hot ring and broad scan tears.
        const flicker = Math.floor(view.phaseProgress * 14) % 3;
        ctx.fillStyle = flicker === 0
          ? 'rgba(114, 245, 255, 0.16)'
          : flicker === 1
            ? 'rgba(240, 101, 149, 0.13)'
            : 'rgba(255, 248, 235, 0.08)';
        ctx.fillRect(0, 0, state.bufW, state.bufH);
        const cx = state.machineX * U;
        const cy = (state.groundY - 24) * U;
        drawRing(cx, cy, (8 + view.phaseProgress * 34) * U, (6 + view.phaseProgress * 18) * U, 'rgba(114, 245, 255, 0.72)', 2);
        drawRing(cx, cy, (18 + view.phaseProgress * 48) * U, (12 + view.phaseProgress * 27) * U, 'rgba(240, 101, 149, 0.4)', 2);
        return;
      }

      const cx = state.machineX * U;
      const cy = (state.groundY - 24) * U;
      const maxR = Math.hypot(state.bufW, state.bufH) * 0.56;
      const ramp = clamp(view.progress * 1.2, 0, 1);

      // Rings racing inward
      const ringColors = [
        'rgba(114, 245, 255, 0.55)',
        'rgba(240, 101, 149, 0.45)',
        'rgba(255, 248, 235, 0.55)',
        'rgba(38, 182, 201, 0.5)',
      ];
      for (let i = 0; i < 4; i++) {
        const cycle = (view.scramble * 1.8 + i * 0.23 + nowSec * 0.25) % 1;
        const radius = maxR * (1 - cycle) * (0.35 + ramp * 0.65);
        const ry = radius * 0.56;
        drawRing(cx, cy, Math.max(6, radius), Math.max(4, ry), ringColors[i], 2);
      }

      // Pixel streaks spiralling into the machine
      const count = state.mobile ? 54 : 96;
      const colors = ['#72f5ff', '#f06595', '#fff8eb', '#26b6c9'];
      for (let i = 0; i < count; i++) {
        const particle = state.flux[i % state.flux.length];
        const cycle =
          (particle.offset + view.scramble * (1.3 + particle.speed) + nowSec * 0.35) % 1;
        const radius = maxR * Math.pow(1 - cycle, 1.45) * (0.55 + ramp * 0.65);
        if (radius < 3) continue;
        const angle =
          particle.angle +
          view.scramble * 3.2 * particle.dir +
          cycle * 4.2 +
          nowSec * (0.8 + particle.speed * 0.3);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius * 0.58;
        const tx = -Math.sin(angle) * particle.dir;
        const ty = Math.cos(angle) * 0.58 * particle.dir;
        const length = 2 + Math.floor(particle.speed * 3);
        ctx.fillStyle = colors[particle.color];
        for (let seg = 0; seg < length; seg++) {
          const sx = Math.round((x + tx * seg * 2.2) / 2) * 2;
          const sy = Math.round((y + ty * seg * 2.2) / 2) * 2;
          ctx.fillRect(sx, sy, particle.size, particle.size);
        }
      }

      // Bright center collapse
      const core = 4 + view.progress * 9;
      ctx.fillStyle = 'rgba(114, 245, 255, 0.45)';
      ctx.fillRect(cx - core, cy - core * 0.6, core * 2, core * 1.2);
      ctx.fillStyle = '#72f5ff';
      ctx.fillRect(cx - core / 2, cy - core * 0.3, core, core * 0.6);
      ctx.fillStyle = '#fff8eb';
      ctx.fillRect(cx - 2, cy - 2, 4, 4);

      // Occasional whiteout frames keep the rush disorienting but brief
      if (hash2(Math.floor(nowSec * 20), 9) > 0.82) {
        ctx.fillStyle = 'rgba(255, 248, 235, 0.11)';
        ctx.fillRect(0, 0, state.bufW, state.bufH);
      }
    }

    function drawCollapse(view) {
      if (view.phase !== 'arrive' || view.reduced) return;
      const p = clamp(view.phaseProgress / 0.28, 0, 1);
      if (p >= 1) return;
      const cx = state.machineX * U;
      const cy = (state.groundY - 24) * U;
      const radius = (8 + p * 120) * U;
      ctx.globalAlpha = 1 - p;
      drawRing(cx, cy, radius, radius * 0.58, '#72f5ff', 2);
      drawRing(cx, cy, radius * 0.82, radius * 0.5, '#ffe885', 2);
      ctx.globalAlpha = 1;
    }

    function drawFlash(view) {
      const flash = clamp(view.flash, 0, 1);
      if (flash <= 0.005) return;
      ctx.fillStyle = `rgba(231, 253, 255, ${flash * 0.92})`;
      ctx.fillRect(0, 0, state.bufW, state.bufH);
      ctx.fillStyle = `rgba(114, 245, 255, ${flash * 0.22})`;
      ctx.fillRect(0, 0, state.bufW, state.bufH);
    }

    function render(nowMs, view, reduceMotion) {
      const dt = state.lastNow ? Math.min(0.1, (nowMs - state.lastNow) / 1000) : 0.016;
      state.lastNow = nowMs;
      const timeSec = nowMs / 1000;

      const timelineTarget = state.timelineVisible ? 1 : 0;
      if (state.timelineAlpha !== timelineTarget) {
        const speed = reduceMotion ? 24 : 10;
        state.timelineAlpha +=
          (timelineTarget - state.timelineAlpha) * Math.min(1, dt * speed);
        if (Math.abs(timelineTarget - state.timelineAlpha) < 0.01) {
          state.timelineAlpha = timelineTarget;
        }
      }

      let ringSpeed = 0.8;
      if (!reduceMotion && view.active) {
        if (view.phase === 'charge') ringSpeed = 7 + view.charge * 18;
        else if (view.phase === 'vortex') ringSpeed = view.sameEra ? 16 : 24;
        else if (view.phase === 'arrive') ringSpeed = 5;
      }
      state.ringPhase = (state.ringPhase + dt * ringSpeed) % 48;

      const fromCache = state.caches[view.active ? view.fromEra : state.currentEra] || state.caches[0];
      const toCache = state.caches[view.active ? view.toEra : state.currentEra] || fromCache;
      const currentCache = state.caches[state.currentEra] || fromCache;
      const arriveRevealed = view.active && view.phase === 'arrive';
      const reducedActive = view.active && view.reduced;

      let shakeX = 0;
      let shakeY = 0;
      const shakePattern = [[-1, 0], [1, 1], [0, -1], [2, 0], [-2, 1], [1, -1]];
      if (!reduceMotion && view.active) {
        if (view.phase === 'arrive' && view.phaseProgress < 0.24) {
          const s = shakePattern[Math.floor(nowMs / 32) % shakePattern.length];
          const amp = 2 - view.phaseProgress * 6;
          shakeX = Math.round(s[0] * Math.max(1, amp));
          shakeY = Math.round(s[1] * Math.max(1, amp));
        } else if (view.phase === 'vortex' && !view.sameEra) {
          const s = shakePattern[Math.floor(nowMs / 70) % shakePattern.length];
          shakeX = s[0];
          shakeY = s[1];
        }
      }

      ctx.save();
      ctx.translate(shakeX * U, shakeY * U);

      if (reducedActive) {
        const p = clamp(view.phaseProgress, 0, 1);
        drawReducedDissolve(fromCache, toCache, p);
      } else if (view.active && view.phase === 'vortex' && !view.sameEra) {
        drawGlitched(fromCache, timeSec, view.scramble);
        const ghostIndex = Eras.eraIndexForYear(view.year);
        if (ghostIndex !== view.fromEra) {
          drawGhost(state.caches[ghostIndex], timeSec, 0.16, 0.42);
        }
      } else if (arriveRevealed) {
        drawStatic(toCache);
      } else {
        drawStatic(currentCache);
      }

      // Ambient layer (clouds, smoke, flags, birds, fire)
      const ambientEra = view.active && view.phase === 'arrive' ? Eras.get(view.toEra) : Eras.get(state.currentEra);
      if (ambientEra && state.mainPainter) {
        ambientEra.drawAmbient(state.mainPainter, timeSec, { mobile: state.mobile });
      }

      const treeEra = view.active && view.phase === 'arrive' ? Eras.get(view.toEra) : Eras.get(state.currentEra);
      if (treeEra && state.mainPainter) {
        const stepped = reduceMotion ? 0 : Math.round(Math.sin(Math.floor(timeSec * 10) / 10 * 1.4));
        treeEra.drawTree(state.mainPainter, state.treeX, state.groundY, stepped);
      }

      // Machine pose
      let machineDX = 0;
      let machineDY = 0;
      if (!reduceMotion && view.active) {
        if (view.phase === 'charge') {
          const amp = view.charge > 0.62 ? 2 : 1;
          machineDX = Math.round(Math.sin(Math.floor(nowMs / 42) * 2.1) * amp);
          machineDY = Math.round(Math.cos(Math.floor(nowMs / 36) * 1.7) * amp);
          drawChargeDust(view, timeSec);
        } else if (view.phase === 'vortex' && view.sameEra) {
          machineDY = -Math.round(Math.sin(view.phaseProgress * Math.PI) * 3);
        } else if (view.phase === 'arrive') {
          if (view.phaseProgress < 0.16) {
            machineDY = -6;
          } else if (view.phaseProgress < 0.3) {
            machineDY = -2;
          }
        }
      }

      Machine.draw(ctx, {
        x: state.machineX,
        baseY: state.groundY,
        timeSec,
        ringPhase: state.ringPhase,
        energy: reduceMotion ? 0 : view.energy,
        charge: reduceMotion ? 0 : view.charge,
        offsetX: machineDX,
        offsetY: machineDY,
        reduceMotion,
      });

      if (!reduceMotion && view.active && view.phase === 'vortex' && !view.sameEra) {
        drawVortex(view, timeSec);
      }
      if (!reduceMotion && view.active && view.phase === 'vortex' && view.sameEra) {
        drawVortex(view, timeSec);
      }
      if (!reduceMotion && view.active && view.phase === 'arrive') {
        drawArrivalDust(view);
        drawCollapse(view);
      }

      ctx.restore();

      drawFlash(view);
      drawTimeline(nowMs);
    }

    function setTimelineVisible(visible) {
      state.timelineVisible = Boolean(visible);
    }

    function getGroundScreenY() {
      return state.groundY * state.artPx;
    }

    function getMachineScreenTop() {
      return (state.groundY - 56) * state.artPx;
    }

    return {
      state,
      resize,
      render,
      setEra,
      setTimelineVisible,
      getGroundScreenY,
      getMachineScreenTop,
    };
  }

  return { createScene };
})();
