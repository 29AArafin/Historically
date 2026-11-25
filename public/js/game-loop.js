/* ==========================================================================
   Historically — Main Game Loop
   Orchestrates: grounded era scene → time-travel state machine → HUD/panel.
   7 rounds of 25 seconds each, then navigates to results.html.
   ========================================================================== */

(() => {
  'use strict';

  const { GameData, Eras, SceneRenderer, TimeTravel, Hud, PromptPanel, AudioFX } = window.Historically;
  const TOTAL_ROUNDS = 7;
  const TIER_REVEAL_DELAY_MS = 500;
  const COMPACT_LAYOUT_WIDTH = 780;

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = reducedMotionQuery.matches;
  reducedMotionQuery.addEventListener('change', (event) => {
    reduceMotion = event.matches;
  });

  // --- DOM & subsystems ---
  const canvasEl = document.getElementById('world-canvas');
  const dockEl = document.getElementById('answer-dock');
  const fadeCurtain = document.getElementById('fade-curtain');
  const travelCounterEl = document.getElementById('travel-counter');
  const travelCounterYearEl = document.getElementById('travel-counter-year');
  const travelCounterSuffixEl = document.getElementById('travel-counter-suffix');

  const world = SceneRenderer.createScene(canvasEl);
  const panel = PromptPanel.createPromptPanel();
  const hud = Hud.createHud({
    roundSeconds: GameData.ROUND_SECONDS,
    onSubmit: handleAnswer,
    onTimeout: handleTimeout,
  });

  // --- Game state ---
  let currentRound = 0;
  let score = 0;
  let currentYear = GameData.START_YEAR;
  let currentEra = Eras.eraIndexForYear(currentYear);
  let roundInProgress = false;
  let pendingTier = null;
  let pendingAnswer = '';
  let advanceWhenIdle = false;
  let resizeTimeout = null;
  const roundResults = [];

  // --- Time-travel state machine ---
  const travel = TimeTravel.createTimeTravel({
    getCurrentEra: () => currentEra,
    getCurrentYear: () => currentYear,
    isReduced: () => reduceMotion,
    onChargeStart: () => {
      AudioFX.unlock();
      AudioFX.playCharge(travel.CHARGE_MS);
    },
    onVortexStart: ({ sameEra, distance }) => {
      if (sameEra) {
        AudioFX.playJitter();
      } else {
        AudioFX.playVortex(travel.state.durations.vortex + distance * 20);
      }
    },
    onArrive: handleArrival,
    onComplete: () => {
      travelCounterEl.hidden = true;
      travelCounterEl.classList.remove('is-rolling');
      if (advanceWhenIdle) {
        advanceWhenIdle = false;
        advanceAfterArrival();
      }
    },
  });

  // --- Initial era ---
  updateEraHud();
  world.setEra(currentEra, { instant: true });
  hud.updateStatus(1, TOTAL_ROUNDS, score);

  function updateEraHud() {
    const era = Eras.get(currentEra);
    hud.updateEra(GameData.formatYear(currentYear), era.name, era.shortName);
  }

  function refreshTimelineVisibility() {
    world.setTimelineVisible(
      !roundInProgress || window.innerWidth >= COMPACT_LAYOUT_WIDTH
    );
  }

  // --- Main render loop ---
  function renderLoop(nowMs) {
    travel.update(nowMs);
    const view = travel.getView(nowMs);
    world.render(nowMs, view, reduceMotion);
    hud.tickTimer(nowMs);
    updateTravelCounter(view);

    const bottom = hud.getAvailableBottomY();
    panel.updatePosition(window.innerHeight * 0.34, bottom, world.getMachineScreenTop());
    panel.positionLandingTier(world.getMachineScreenTop());

    requestAnimationFrame(renderLoop);
  }

  function splitYear(year) {
    const text = GameData.formatYear(year);
    const match = /^(.+)\s(CE|BCE)$/.exec(text);
    return match ? { year: match[1], suffix: match[2] } : { year: text, suffix: '' };
  }

  function updateTravelCounter(view) {
    if (!view.active) {
      if (!travelCounterEl.hidden) {
        travelCounterEl.hidden = true;
        travelCounterEl.classList.remove('is-rolling');
      }
      return;
    }

    const parts = splitYear(view.year);
    travelCounterYearEl.textContent = parts.year;
    travelCounterSuffixEl.textContent = parts.suffix;
    travelCounterEl.hidden = false;
    travelCounterEl.classList.toggle(
      'is-rolling',
      !reduceMotion && view.phase === 'vortex' && !view.sameEra
    );
  }

  // --- Round lifecycle ---
  function beginRound() {
    const prompt = GameData.PROMPTS[currentRound];
    if (!prompt) {
      endGame();
      return;
    }

    hud.updateStatus(currentRound + 1, TOTAL_ROUNDS, score);
    updateEraHud();
    panel.hideLandingTier();
    panel.showPrompt(currentRound + 1, TOTAL_ROUNDS, prompt.question, reduceMotion);
    hud.clearInput();
    hud.setInputEnabled(true);
    hud.startTimer(performance.now());
    roundInProgress = true;
    refreshTimelineVisibility();
  }

  function handleAnswer(answerText) {
    if (!roundInProgress) return;
    roundInProgress = false;

    hud.stopTimer();
    hud.setInputEnabled(false);
    panel.snapShut();
    refreshTimelineVisibility();

    const tier = GameData.gradeAnswer(currentRound, answerText);
    const newYear = currentYear - tier.yearsBack;
    const destinationEra = Eras.eraIndexForYear(newYear);
    const yearText = GameData.formatYear(newYear);
    const era = Eras.get(destinationEra);

    score += tier.points;
    roundResults.push({
      question: GameData.PROMPTS[currentRound].question,
      answer: answerText,
      tier,
      points: tier.points,
      year: newYear,
      yearText,
      eraId: era.id,
      eraName: era.name,
    });

    pendingTier = tier;
    pendingAnswer = answerText;
    AudioFX.unlock();
    const started = travel.travelTo(destinationEra, newYear);
    if (!started) {
      // Defensive fallback: the state machine should always be idle here.
      currentYear = newYear;
      currentEra = destinationEra;
      world.setEra(currentEra, { reduceMotion });
      advanceAfterArrival();
    }
  }

  function handleArrival(result) {
    currentEra = result.toEra;
    currentYear = result.toYear;
    const era = Eras.get(currentEra);
    const tier = pendingTier || GameData.TIERS.common;

    world.setEra(currentEra, { reduceMotion });
    world.setTimelineVisible(true);
    hud.updateStatus(currentRound + 1, TOTAL_ROUNDS, score);
    updateEraHud();
    AudioFX.playArrive();

    panel.showLandingTier({
      tier,
      era,
      answer: pendingAnswer,
      yearText: GameData.formatYear(currentYear),
      delayMs: TIER_REVEAL_DELAY_MS,
      onContinue: continueAfterReveal,
    });
  }

  // The arrive phase can outlast the reveal; wait for it so the next jump can start.
  function continueAfterReveal() {
    if (travel.state.phase !== 'idle') {
      advanceWhenIdle = true;
      return;
    }
    advanceAfterArrival();
  }

  function advanceAfterArrival() {
    panel.hideLandingTier();
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) {
      endGame();
    } else {
      beginRound();
    }
  }

  function handleTimeout() {
    if (!roundInProgress) return;
    handleAnswer('');
  }

  function endGame() {
    roundInProgress = false;
    hud.setInputEnabled(false);
    panel.snapShut();
    panel.hideLandingTier();
    travelCounterEl.hidden = true;
    world.setTimelineVisible(false);

    try {
      sessionStorage.setItem(
        'historically_results',
        JSON.stringify({
          score,
          totalPossible: TOTAL_ROUNDS * 100,
          year: currentYear,
          era: Eras.get(currentEra).name,
          rounds: roundResults,
        })
      );
    } catch (_) {
      // sessionStorage unavailable; the results page can fall back.
    }

    setTimeout(() => {
      fadeCurtain.classList.add('is-visible');
      setTimeout(() => {
        window.location.href = 'results.html';
      }, 500);
    }, reduceMotion ? 100 : 650);
  }

  // --- Resize / mobile keyboard handling ---
  function resizeScene() {
    world.resize(window.innerWidth, window.innerHeight, hud.getAvailableBottomY());
    world.setEra(currentEra, { instant: true });
    hud.syncViewportOffset();
    updateEraHud();
    refreshTimelineVisibility();
    if (dockEl) {
      panel.updatePosition(
        window.innerHeight * 0.34,
        dockEl.getBoundingClientRect().top,
        world.getMachineScreenTop()
      );
    }
  }

  function scheduleResize() {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeTimeout = null;
      resizeScene();
    }, 120);
  }

  window.addEventListener('resize', scheduleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleResize);
    window.visualViewport.addEventListener('scroll', scheduleResize);
  }

  // --- Audio controls ---
  AudioFX.bindUnlock();
  AudioFX.bindToggle(document.getElementById('mute-toggle'));

  // --- Optional preview hooks for art review: play.html?debug=1&era=5 ---
  const params = new URLSearchParams(window.location.search);
  const previewEraParam = params.has('debug') && params.has('era')
    ? Number(params.get('era'))
    : NaN;

  if (params.has('debug')) {
    window.__historically = {
      world,
      panel,
      hud,
      previewEra(index) {
        travel.state.phase = 'idle';
        hud.stopTimer();
        roundInProgress = false;
        const nextEra = Math.max(0, Math.min(Eras.count - 1, Math.round(index)));
        currentEra = nextEra;
        currentYear = Eras.get(nextEra).representativeYear;
        panel.snapShut();
        panel.hideLandingTier();
        world.setEra(nextEra, { instant: true });
        world.setTimelineVisible(true);
        updateEraHud();
        return { index: nextEra, year: currentYear, name: Eras.get(nextEra).name };
      },
      travelToEra(index, year) {
        const nextEra = Math.max(0, Math.min(Eras.count - 1, Math.round(index)));
        const targetYear = Number.isFinite(year)
          ? Math.round(year)
          : Eras.get(nextEra).representativeYear;
        pendingTier = null;
        return travel.travelTo(nextEra, targetYear);
      },
      travelState: () => ({ ...travel.state }),
    };
  }

  // --- Boot ---
  resizeScene();
  world.setEra(currentEra, { instant: true });
  requestAnimationFrame(renderLoop);

  if (Number.isInteger(previewEraParam)) {
    window.__historically.previewEra(previewEraParam);
    if (params.get('panel') === '1') {
      panel.showPrompt(1, TOTAL_ROUNDS, GameData.PROMPTS[0].question, reduceMotion);
      world.setTimelineVisible(window.innerWidth >= COMPACT_LAYOUT_WIDTH);
    }
  } else {
    setTimeout(beginRound, reduceMotion ? 100 : 400);
  }
})();
