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
    const tierNameEl = document.getElementById('landing-tier-name');
    const tierAnswerEl = document.getElementById('landing-tier-answer');
    const tierPointsEl = document.getElementById('landing-tier-points');
    const tierTravelEl = document.getElementById('landing-tier-travel');
    const tierYearEl = document.getElementById('landing-tier-year');
    const tierEraEl = document.getElementById('landing-tier-era');
    const tierFlavourEl = document.getElementById('landing-tier-flavour');
    const tierContinueEl = document.getElementById('landing-tier-continue');

    const TIER_FADE_OUT_MS = 250;
    let tierShowTimeout = null;
    let tierLeaveTimeout = null;
    let onTierContinue = null;

    tierContinueEl.addEventListener('click', () => {
      if (!onTierContinue) return;
      const callback = onTierContinue;
      onTierContinue = null;
      tierEl.classList.replace('is-showing', 'is-leaving');
      tierLeaveTimeout = setTimeout(() => {
        tierLeaveTimeout = null;
        hideLandingTier();
        callback();
      }, TIER_FADE_OUT_MS);
    });

    let panelVisible = false;

    function showPrompt(roundNum, totalRounds, questionText, reduceMotion) {
      labelEl.textContent = `PROMPT ${roundNum} OF ${totalRounds}`;
      questionEl.textContent = questionText;
      hideLandingTier();
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

    function formatTravel(tier) {
      if (tier.yearsBack <= 0) return 'stayed put';
      return `back ${tier.yearsBack.toLocaleString('en-US')} years`;
    }

    // Tier reveal card. Stays on screen until the player presses Continue.
    function showLandingTier(details) {
      const { tier, era, answer, yearText, delayMs, onContinue } = details;
      hideLandingTier();

      tierEl.dataset.tier = tier.key;
      tierNameEl.textContent = tier.shortLabel;
      const trimmed = (answer || '').trim();
      tierAnswerEl.textContent = trimmed ? `"${trimmed}"` : '"…"';
      tierPointsEl.textContent = `+${tier.points} PTS`;
      tierTravelEl.textContent = formatTravel(tier);
      tierYearEl.textContent = `Now in ${yearText}`;
      tierEraEl.textContent = era.name;
      tierFlavourEl.textContent = tier.flavour || '';
      onTierContinue = onContinue;

      tierShowTimeout = setTimeout(() => {
        tierShowTimeout = null;
        tierEl.hidden = false;
        positionLandingTier();
        void tierEl.offsetWidth;
        tierEl.classList.add('is-showing');
        tierContinueEl.focus({ preventScroll: true });
      }, delayMs || 0);
    }

    function hideLandingTier() {
      if (tierShowTimeout) clearTimeout(tierShowTimeout);
      if (tierLeaveTimeout) clearTimeout(tierLeaveTimeout);
      tierShowTimeout = null;
      tierLeaveTimeout = null;
      onTierContinue = null;
      tierEl.hidden = true;
      tierEl.classList.remove('is-showing', 'is-leaving');
    }

    // Upper-middle of the screen: below the HUD, above the machine when it fits.
    let tierAvoidTopY = Infinity;
    function positionLandingTier(avoidTopY) {
      if (Number.isFinite(avoidTopY)) tierAvoidTopY = avoidTopY;
      if (tierEl.hidden) return;
      const hudEl = document.querySelector('.game-hud');
      const minTop = (hudEl ? hudEl.getBoundingClientRect().bottom : 60) + 10;
      const panelH = tierEl.offsetHeight;
      const desiredTop = window.innerHeight * 0.14;
      const aboveMachine = tierAvoidTopY - panelH - 12;
      const top = Math.max(minTop, Math.min(desiredTop, aboveMachine));
      tierEl.style.top = `${Math.round(top)}px`;
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
      positionLandingTier,
      updatePosition,
    };
  }

  return {
    createPromptPanel,
  };
})();
