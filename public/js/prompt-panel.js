/* ==========================================================================
   Historically — In-World Prompt Panel, Falling Chip & Landing Tier Label
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.PromptPanel = (() => {
  'use strict';

  function createPromptPanel() {
    const anchorEl = document.getElementById('prompt-anchor');
    const labelEl = document.getElementById('prompt-label');
    const questionEl = document.getElementById('prompt-question');
    const chipEl = document.getElementById('falling-chip');
    const tierEl = document.getElementById('landing-tier');
    const tierTitleEl = document.getElementById('landing-tier-title');
    const tierMetaEl = document.getElementById('landing-tier-meta');

    let panelVisible = false;

    function showPrompt(roundNum, totalRounds, questionText, reduceMotion) {
      labelEl.textContent = `PROMPT ${roundNum} OF ${totalRounds}`;
      questionEl.textContent = questionText;
      tierEl.hidden = true;
      panelVisible = true;

      anchorEl.classList.remove('is-hidden', 'is-entering');
      if (!reduceMotion) {
        // Trigger stepped fade-in cleanly
        void anchorEl.offsetWidth;
        anchorEl.classList.add('is-entering');
      }
    }

    function snapShut() {
      panelVisible = false;
      anchorEl.classList.remove('is-entering');
      anchorEl.classList.add('is-hidden');
    }

    function launchFallingChip(answerText, startY, reduceMotion) {
      if (reduceMotion || !answerText) return;
      chipEl.textContent = answerText;
      chipEl.style.top = `${Math.round(startY)}px`;
      chipEl.hidden = false;
      chipEl.classList.remove('is-falling');
      void chipEl.offsetWidth;
      chipEl.classList.add('is-falling');

      setTimeout(() => {
        chipEl.hidden = true;
        chipEl.classList.remove('is-falling');
      }, 1150);
    }

    function showLandingTier(tier, yearText, centerY) {
      tierTitleEl.textContent = tier.shortLabel;
      tierMetaEl.textContent =
        tier.points > 0 ? `+${tier.points} PTS · ${yearText}` : `0 PTS · ${yearText}`;
      tierEl.style.top = `${Math.round(centerY)}px`;
      tierEl.hidden = false;
    }

    function hideLandingTier() {
      tierEl.hidden = true;
    }

    // Keep panel anchored to world depth while staying clear of HUD & mobile keyboard
    function updatePosition(desiredY, availableBottomY) {
      if (!panelVisible) return;
      const panelH = anchorEl.offsetHeight || 150;
      const minY = 58 + panelH / 2;
      const maxY = Math.max(minY, availableBottomY - panelH / 2 - 14);
      const clampedY = Math.max(minY, Math.min(maxY, desiredY));
      anchorEl.style.top = `${Math.round(clampedY)}px`;
    }

    return {
      showPrompt,
      snapShut,
      launchFallingChip,
      showLandingTier,
      hideLandingTier,
      updatePosition,
    };
  }

  return {
    createPromptPanel,
  };
})();
