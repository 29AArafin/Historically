/* ==========================================================================
   Historically — In-World Prompt Panel & Era Title Card
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.PromptPanel = (() => {
  'use strict';

  function createPromptPanel() {
    const anchorEl = document.getElementById('prompt-anchor');
    const labelEl = document.getElementById('prompt-label');
    const questionEl = document.getElementById('prompt-question');
    const tierEl = document.getElementById('landing-tier');
    const tierTitleEl = document.getElementById('landing-tier-title');
    const tierEraEl = document.getElementById('landing-tier-era');
    const tierMetaEl = document.getElementById('landing-tier-meta');

    let panelVisible = false;

    function showPrompt(roundNum, totalRounds, questionText, reduceMotion) {
      labelEl.textContent = `PROMPT ${roundNum} OF ${totalRounds}`;
      questionEl.textContent = questionText;
      tierEl.hidden = true;
      tierEl.classList.remove('is-showing');
      panelVisible = true;

      anchorEl.classList.remove('is-hidden', 'is-entering');
      if (!reduceMotion) {
        void anchorEl.offsetWidth;
        anchorEl.classList.add('is-entering');
      }
    }

    function snapShut() {
      panelVisible = false;
      anchorEl.classList.remove('is-entering');
      anchorEl.classList.add('is-hidden');
    }

    function showLandingTier(tier, era, yearText, reduceMotion) {
      tierTitleEl.textContent = tier.points > 0 ? `${tier.shortLabel} · +${tier.points} PTS` : tier.shortLabel;
      tierEraEl.textContent = era.name;
      tierMetaEl.textContent = `${yearText} · ${era.yearRange}`;
      tierEl.hidden = false;
      tierEl.classList.remove('is-showing');
      if (!reduceMotion) {
        void tierEl.offsetWidth;
        tierEl.classList.add('is-showing');
      }
    }

    function hideLandingTier() {
      tierEl.hidden = true;
      tierEl.classList.remove('is-showing');
    }

    // Keep the panel in the sky above the machine and clear of HUD / keyboard.
    function updatePosition(desiredY, availableBottomY, avoidTopY) {
      if (!panelVisible) return;
      const panelH = anchorEl.offsetHeight || 150;
      const minY = 92 + panelH / 2;
      const dockMax = availableBottomY - panelH / 2 - 14;
      const machineMax = Number.isFinite(avoidTopY)
        ? avoidTopY - panelH / 2 - 12
        : Infinity;
      const maxY = Math.max(minY, Math.min(dockMax, machineMax));
      const clampedY = Math.max(minY, Math.min(maxY, desiredY));
      anchorEl.style.top = `${Math.round(clampedY)}px`;
    }

    return {
      showPrompt,
      snapShut,
      showLandingTier,
      hideLandingTier,
      updatePosition,
    };
  }

  return {
    createPromptPanel,
  };
})();
