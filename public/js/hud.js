/* ==========================================================================
   Historically — Corner HUD, Bottom Answer Input & 25-Second Timer
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.Hud = (() => {
  'use strict';

  function createHud({ roundSeconds, onSubmit, onTimeout }) {
    const roundEl = document.getElementById('hud-round');
    const scoreEl = document.getElementById('hud-score');
    const yearEl = document.getElementById('hud-year');
    const eraNameEl = document.getElementById('hud-era-name');
    const timerMetaEl = document.getElementById('timer-meta');
    const timerClockEl = document.getElementById('timer-clock');
    const timerFillEl = document.getElementById('timer-fill');
    const formEl = document.getElementById('answer-form');
    const inputEl = document.getElementById('answer-input');
    const dockEl = document.getElementById('answer-dock');

    let timerEndMs = 0;
    let timerRunning = false;
    let timedOut = false;

    function updateStatus(roundNum, totalRounds, score) {
      roundEl.textContent = `${roundNum}/${totalRounds}`;
      scoreEl.textContent = `SCORE ${score}`;
    }

    function updateEra(yearText, eraName, shortName) {
      yearEl.textContent = yearText;
      const compact = window.innerWidth <= 640;
      eraNameEl.textContent = (compact && shortName ? shortName : eraName).toUpperCase();
    }

    function setInputEnabled(enabled) {
      inputEl.disabled = !enabled;
      if (enabled) {
        inputEl.focus({ preventScroll: true });
      }
    }

    function clearInput() {
      inputEl.value = '';
    }

    function startTimer(nowMs) {
      timerEndMs = nowMs + roundSeconds * 1000;
      timerRunning = true;
      timedOut = false;
      updateTimerDisplay(roundSeconds);
    }

    function stopTimer() {
      timerRunning = false;
    }

    function updateTimerDisplay(secondsLeft) {
      const clamped = Math.max(0, secondsLeft);
      const whole = Math.ceil(clamped);
      const formatted = `0:${String(whole).padStart(2, '0')}`;
      timerClockEl.textContent = formatted;

      const ratio = Math.max(0, Math.min(1, clamped / roundSeconds));
      timerFillEl.style.transform = `scaleX(${ratio})`;

      const urgent = whole <= 5;
      timerMetaEl.classList.toggle('is-urgent', urgent);
      timerFillEl.classList.toggle('is-urgent', urgent);
    }

    function tickTimer(nowMs) {
      if (!timerRunning || timedOut) return;
      const remaining = (timerEndMs - nowMs) / 1000;
      if (remaining <= 0) {
        timedOut = true;
        timerRunning = false;
        updateTimerDisplay(0);
        if (onTimeout) onTimeout();
        return;
      }
      updateTimerDisplay(remaining);
    }

    // Keep docked input above mobile virtual keyboard when open
    function syncViewportOffset() {
      if (!window.visualViewport) return;
      const vv = window.visualViewport;
      const kbOffset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kb-offset', `${Math.round(kbOffset)}px`);
    }

    function getAvailableBottomY() {
      const dockRect = dockEl.getBoundingClientRect();
      return dockRect.top;
    }

    formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!timerRunning || inputEl.disabled) return;
      const value = inputEl.value.trim();
      if (!value) return;
      stopTimer();
      clearInput();
      if (onSubmit) onSubmit(value);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncViewportOffset);
      window.visualViewport.addEventListener('scroll', syncViewportOffset);
    }

    return {
      updateStatus,
      updateEra,
      setInputEnabled,
      clearInput,
      startTimer,
      stopTimer,
      tickTimer,
      syncViewportOffset,
      getAvailableBottomY,
    };
  }

  return {
    createHud,
  };
})();
