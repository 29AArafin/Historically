/* ==========================================================================
   Historically — Main Game Loop Controller
   Orchestrates: WorldCanvas → Camera → PromptPanel → Hud → Transitions
   7 rounds of 25 seconds each, then navigates to results.html.
   ========================================================================== */

(() => {
  'use strict';

  const { GameData, WorldCamera, WorldCanvas, Hud, PromptPanel } = window.Historically;
  const TOTAL_ROUNDS = 7;

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = reducedMotionQuery.matches;
  reducedMotionQuery.addEventListener('change', (e) => { reduceMotion = e.matches; });

  // --- Create subsystems ---
  const canvasEl = document.getElementById('world-canvas');
  const fadeCurtain = document.getElementById('fade-curtain');
  const world = WorldCanvas.createWorldCanvas(canvasEl);
  const camera = WorldCamera.createCamera();
  const panel = PromptPanel.createPromptPanel();

  // --- Game state ---
  let currentRound = 0;
  let score = 0;
  let currentYear = GameData.START_YEAR;
  let roundInProgress = false;
  const roundResults = [];

  // --- Main render loop ---
  let rafId = null;

  function renderLoop(nowMs) {
    camera.update(nowMs);
    world.render(nowMs, camera, reduceMotion);
    hud.tickTimer(nowMs);

    // Keep prompt panel anchored to world depth
    const desiredScreenY = camera.getPanelScreenY(
      currentRound, world.state.artH, world.CANVAS_SCALE
    );
    const availableBottom = hud.getAvailableBottomY();
    panel.updatePosition(desiredScreenY, availableBottom);

    rafId = requestAnimationFrame(renderLoop);
  }

  // --- Round lifecycle ---
  function beginRound() {
    const prompt = GameData.PROMPTS[currentRound];
    if (!prompt) {
      endGame();
      return;
    }

    hud.updateStatus(currentRound + 1, TOTAL_ROUNDS, score);
    panel.hideLandingTier();
    panel.showPrompt(currentRound + 1, TOTAL_ROUNDS, prompt.question, reduceMotion);
    hud.clearInput();
    hud.setInputEnabled(true);
    hud.startTimer(performance.now());
    roundInProgress = true;
  }

  function handleAnswer(answerText) {
    if (!roundInProgress) return;
    roundInProgress = false;

    hud.stopTimer();
    hud.setInputEnabled(false);

    const tier = GameData.gradeAnswer(currentRound, answerText);
    const newYear = currentYear - tier.yearsBack;
    const yearText = GameData.formatYear(newYear);
    score += tier.points;

    roundResults.push({
      question: GameData.PROMPTS[currentRound].question,
      answer: answerText,
      tier: tier,
      points: tier.points,
      year: newYear,
      yearText: yearText,
    });

    // 1. Snap panel shut
    panel.snapShut();

    // 2. Launch falling chip with the typed text
    const chipStartY = window.innerHeight * 0.46;
    panel.launchFallingChip(answerText, chipStartY, reduceMotion);

    // 3. Camera descends through strata to new depth (~2 seconds)
    const descendDelay = reduceMotion ? 50 : 500;
    setTimeout(() => {
      camera.descendToYear(newYear, world.state.artH, reduceMotion, () => {
        // 4. Show rarity tier label at the landing point
        currentYear = newYear;
        hud.updateStatus(currentRound + 1, TOTAL_ROUNDS, score);

        const tierY = camera.getPanelScreenY(
          currentRound + 1, world.state.artH, world.CANVAS_SCALE
        );
        panel.showLandingTier(tier, yearText, Math.min(tierY, window.innerHeight * 0.44));

        // 5. After a beat, advance to the next round
        const advanceDelay = reduceMotion ? 300 : 1400;
        setTimeout(() => {
          currentRound++;
          if (currentRound >= TOTAL_ROUNDS) {
            endGame();
          } else {
            beginRound();
          }
        }, advanceDelay);
      });
    }, descendDelay);
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

    // Store results for results.html to read
    try {
      sessionStorage.setItem(
        'historically_results',
        JSON.stringify({ score, totalPossible: TOTAL_ROUNDS * 100, year: currentYear, rounds: roundResults })
      );
    } catch (_) {
      // sessionStorage unavailable, results page will show defaults
    }

    // Fade to dark, then navigate
    setTimeout(() => {
      fadeCurtain.classList.add('is-visible');
      setTimeout(() => {
        window.location.href = 'results.html';
      }, 500);
    }, reduceMotion ? 100 : 600);
  }

  // --- HUD with submit/timeout callbacks ---
  const hud = Hud.createHud({
    roundSeconds: GameData.ROUND_SECONDS,
    onSubmit: handleAnswer,
    onTimeout: handleTimeout,
  });

  // --- Resize handler ---
  function handleResize() {
    world.resize(window.innerWidth, window.innerHeight);
    camera.snapToYear(currentYear, world.state.artH);
    hud.syncViewportOffset();
  }

  window.addEventListener('resize', handleResize);

  // --- Boot ---
  handleResize();
  camera.snapToYear(GameData.START_YEAR, world.state.artH);
  rafId = requestAnimationFrame(renderLoop);

  // Start the first round after a brief moment
  setTimeout(beginRound, reduceMotion ? 100 : 400);
})();
