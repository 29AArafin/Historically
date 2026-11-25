/* ==========================================================================
   Historically — Era Art Toolkit
   Shared pixel painter, deterministic random, and era registry.
   Every era module draws in "art units"; 1 art unit = 2 buffer pixels.
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.EraUtils = (() => {
  'use strict';

  const U = 2; // buffer pixels per art unit
  const registry = [];

  function snap(value) {
    return Math.round(value);
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

  function makePainter(ctx, options) {
    const artW = options.artW;
    const artH = options.artH;
    const groundY = options.groundY;
    const rng = options.rng;
    const mobile = Boolean(options.mobile);

    function rect(x, y, w, h, color) {
      if (!color || w <= 0 || h <= 0) return;
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x) * U,
        Math.round(y) * U,
        Math.round(w) * U,
        Math.round(h) * U
      );
    }

    // Buffer-pixel rectangle, used for the finest one-pixel details.
    function pxRect(bx, by, bw, bh, color) {
      if (!color || bw <= 0 || bh <= 0) return;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(bx), Math.round(by), Math.round(bw), Math.round(bh));
    }

    function poly(points, color) {
      if (!color || points.length < 3) return;
      ctx.fillStyle = color;
      ctx.beginPath();
      points.forEach(([x, y], index) => {
        const bx = snap(x) * U;
        const by = snap(y) * U;
        if (index === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      });
      ctx.closePath();
      ctx.fill();
    }

    // Chunky pixel line in art units.
    function line(x1, y1, x2, y2, color, thickness = 1) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const steps = Math.max(1, Math.round(Math.max(Math.abs(dx), Math.abs(dy))));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        rect(x1 + dx * t, y1 + dy * t, thickness, thickness, color);
      }
    }

    // Stepped pixel circle made of horizontal rows.
    function circle(cx, cy, radius, color) {
      for (let y = -radius; y <= radius; y++) {
        const half = Math.floor(Math.sqrt(Math.max(0, radius * radius - y * y)));
        if (half <= 0) continue;
        rect(cx - half, cy + y, half * 2, 1, color);
      }
    }

    function ring(cx, cy, radius, color, thickness = 1) {
      const inner = Math.max(0, radius - thickness);
      for (let y = -radius; y <= radius; y++) {
        const outerHalf = Math.floor(Math.sqrt(Math.max(0, radius * radius - y * y)));
        const innerHalf = Math.floor(Math.sqrt(Math.max(0, inner * inner - y * y)));
        if (outerHalf <= innerHalf) continue;
        rect(cx - outerHalf, cy + y, outerHalf - innerHalf, 1, color);
        rect(cx + innerHalf, cy + y, outerHalf - innerHalf, 1, color);
      }
    }

    function ditherEdge(y, upperColor, lowerColor) {
      for (let x = 0; x < artW; x += 2) {
        if ((x / 2) % 2 === 0) {
          rect(x, y - 2, 2, 2, lowerColor);
          if (rng() > 0.58) rect(x, y - 4, 2, 2, lowerColor);
        } else {
          rect(x, y, 2, 2, upperColor);
          if (rng() > 0.62) rect(x, y + 2, 2, 2, upperColor);
        }
      }
    }

    function grain(x, y, w, h, color, density = 0.06, size = 1) {
      const cols = Math.floor(w);
      const rows = Math.floor(h);
      for (let iy = 0; iy < rows; iy += size) {
        for (let ix = 0; ix < cols; ix += size) {
          if (rng() < density) rect(x + ix, y + iy, size, size, color);
        }
      }
    }

    // Blocky cloud built from stacked rectangles.
    function cloud(cx, cy, scale, lightColor, shadeColor) {
      const s = scale;
      rect(cx - 14 * s, cy - 2 * s, 28 * s, 5 * s, shadeColor);
      rect(cx - 18 * s, cy + 1 * s, 36 * s, 3 * s, shadeColor);
      rect(cx - 14 * s, cy - 4 * s, 29 * s, 5 * s, lightColor);
      rect(cx - 8 * s, cy - 7 * s, 18 * s, 4 * s, lightColor);
      rect(cx - 19 * s, cy, 37 * s, 2 * s, lightColor);
      rect(cx + 8 * s, cy + 2 * s, 8 * s, 2 * s, shadeColor);
    }

    return {
      ctx,
      artW,
      artH,
      groundY,
      mobile,
      rng,
      U,
      rect,
      pxRect,
      poly,
      line,
      circle,
      ring,
      ditherEdge,
      grain,
      cloud,
    };
  }

  function register(era) {
    registry.push(era);
  }

  return {
    U,
    snap,
    createRng,
    makePainter,
    register,
    registry,
  };
})();
