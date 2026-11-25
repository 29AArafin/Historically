/* ==========================================================================
   Historically — Synthesized Sound Effects
   Web Audio only; unlocked by the first user gesture, mutable from the HUD.
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.AudioFX = (() => {
  'use strict';

  const STORAGE_KEY = 'historically_muted';
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let muted = false;
  let unlocked = false;
  let toggleButton = null;

  try {
    muted = window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch (_) {
    muted = false;
  }

  function updateButton() {
    if (!toggleButton) return;
    toggleButton.textContent = muted ? 'SFX OFF' : 'SFX ON';
    toggleButton.setAttribute('aria-pressed', muted ? 'true' : 'false');
    toggleButton.setAttribute('aria-label', muted ? 'Unmute sound effects' : 'Mute sound effects');
    toggleButton.classList.toggle('is-muted', muted);
  }

  function setMuted(value) {
    muted = Boolean(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch (_) {
      // Storage unavailable; the toggle still works for this session.
    }
    if (master) master.gain.value = muted ? 0 : 0.22;
    updateButton();
  }

  function ensureContext() {
    if (ctx) return ctx;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    ctx = new AudioContextClass();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.22;
    master.connect(ctx.destination);
    return ctx;
  }

  function unlock() {
    if (unlocked) return;
    const audio = ensureContext();
    if (!audio) return;
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    unlocked = true;
  }

  function getNoise() {
    if (!ctx) return null;
    if (noiseBuffer) return noiseBuffer;
    const length = Math.floor(ctx.sampleRate * 2.5);
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.92 + white * 0.08;
      data[i] = last;
    }
    return noiseBuffer;
  }

  function ready() {
    if (muted) return null;
    const audio = ensureContext();
    if (!audio) return null;
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    unlocked = true;
    return audio;
  }

  function tone({ type = 'sine', from = 220, to = 80, duration = 0.5, gain = 0.1, delay = 0 }) {
    const audio = ready();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.06, duration * 0.2));
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp);
    amp.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function noiseSweep({ duration = 2, from = 420, to = 2800, gain = 0.15, delay = 0 }) {
    const audio = ready();
    if (!audio) return;
    const buffer = getNoise();
    if (!buffer) return;
    const start = audio.currentTime + delay;
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + duration * 0.45);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, from * 0.6), start + duration);
    const amp = audio.createGain();
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + duration * 0.25);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    source.start(start);
    source.stop(start + duration + 0.03);
  }

  function playCharge(durationMs) {
    const duration = Math.max(0.3, durationMs / 1000);
    tone({ type: 'sawtooth', from: 58, to: 190, duration, gain: 0.055 });
    tone({ type: 'sine', from: 120, to: 380, duration, gain: 0.035 });
    noiseSweep({ duration: duration * 0.9, from: 180, to: 900, gain: 0.045 });
  }

  function playVortex(durationMs) {
    const duration = Math.max(0.6, durationMs / 1000);
    noiseSweep({ duration, from: 700, to: 3200, gain: 0.17 });
    tone({ type: 'sawtooth', from: 220, to: 55, duration: duration * 0.9, gain: 0.04 });
    tone({ type: 'triangle', from: 360, to: 120, duration: duration * 0.7, gain: 0.025, delay: duration * 0.2 });
  }

  function playArrive() {
    tone({ type: 'sine', from: 82, to: 34, duration: 0.42, gain: 0.22 });
    tone({ type: 'square', from: 140, to: 60, duration: 0.16, gain: 0.05 });
    noiseSweep({ duration: 0.3, from: 900, to: 160, gain: 0.08 });
  }

  function playJitter() {
    tone({ type: 'square', from: 340, to: 220, duration: 0.16, gain: 0.055 });
    tone({ type: 'triangle', from: 680, to: 440, duration: 0.12, gain: 0.03 });
  }

  function bindToggle(button) {
    toggleButton = button;
    if (!button) return;
    updateButton();
    button.addEventListener('click', (event) => {
      event.preventDefault();
      unlock();
      setMuted(!muted);
    });
  }

  function bindUnlock() {
    const unlockOnce = () => {
      unlock();
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
    window.addEventListener('pointerdown', unlockOnce, { once: false });
    window.addEventListener('keydown', unlockOnce, { once: false });
  }

  return {
    bindToggle,
    bindUnlock,
    unlock,
    setMuted,
    isMuted: () => muted,
    playCharge,
    playVortex,
    playArrive,
    playJitter,
  };
})();
