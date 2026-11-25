/* ==========================================================================
   Historically — Time Travel State Machine
   idle -> charge -> vortex -> arrive -> idle
   Reduced motion performs a single quick cross-dissolve with a year jump.
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.TimeTravel = (() => {
  'use strict';

  const CHARGE_MS = 600;
  const ARRIVE_MS = 900;
  const JITTER_MS = 380;
  const JITTER_ARRIVE_MS = 360;
  const REDUCED_MS = 460;

  function easeInQuad(t) {
    return t * t;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function createTimeTravel(options) {
    const getCurrentEra = options.getCurrentEra || (() => 0);
    const getCurrentYear = options.getCurrentYear || (() => 2026);
    const isReduced = options.isReduced || (() => false);
    const onChargeStart = options.onChargeStart || (() => {});
    const onVortexStart = options.onVortexStart || (() => {});
    const onArrive = options.onArrive || (() => {});
    const onComplete = options.onComplete || (() => {});

    const state = {
      phase: 'idle',
      fromEra: 0,
      toEra: 0,
      fromYear: 2026,
      toYear: 2026,
      startedAt: 0,
      phaseStartedAt: 0,
      durations: { charge: CHARGE_MS, vortex: 1800, arrive: ARRIVE_MS },
      sameEra: false,
      reduced: false,
      distance: 0,
      arrived: false,
      completed: false,
    };

    function travelTo(toEra, toYear) {
      if (state.phase !== 'idle') return false;

      const fromEra = getCurrentEra();
      const fromYear = getCurrentYear();
      const safeToEra = Math.max(0, Math.round(toEra));
      const safeToYear = Number.isFinite(toYear) ? Math.round(toYear) : fromYear;
      const sameEra = safeToEra === fromEra;
      const distance = Math.abs(safeToEra - fromEra);
      const reduced = isReduced();

      state.fromEra = fromEra;
      state.toEra = safeToEra;
      state.fromYear = Math.round(fromYear);
      state.toYear = safeToYear;
      state.sameEra = sameEra;
      state.distance = distance;
      state.reduced = reduced;
      state.arrived = false;
      state.completed = false;
      state.startedAt = performance.now();
      state.phaseStartedAt = state.startedAt;

      if (reduced) {
        state.phase = 'arrive';
        state.durations = { charge: 0, vortex: 0, arrive: REDUCED_MS };
        // The counter jumps immediately under reduced motion.
        state.arrived = true;
        onArrive({
          fromEra,
          toEra: safeToEra,
          fromYear: state.fromYear,
          toYear: safeToYear,
          sameEra,
          reduced: true,
        });
        return true;
      }

      state.phase = 'charge';
      state.durations = {
        charge: CHARGE_MS,
        vortex: sameEra ? JITTER_MS : Math.min(2500, 1250 + distance * 150),
        arrive: sameEra ? JITTER_ARRIVE_MS : ARRIVE_MS,
      };
      onChargeStart({ fromEra, toEra: safeToEra, distance, sameEra });
      return true;
    }

    function update(nowMs) {
      if (state.phase === 'idle') return;

      const elapsed = nowMs - state.phaseStartedAt;
      const duration = state.durations[state.phase];

      if (elapsed < duration) return;

      if (state.phase === 'charge') {
        state.phase = 'vortex';
        state.phaseStartedAt += duration;
        onVortexStart({
          fromEra: state.fromEra,
          toEra: state.toEra,
          distance: state.distance,
          sameEra: state.sameEra,
        });
        return;
      }

      if (state.phase === 'vortex') {
        state.phase = 'arrive';
        state.phaseStartedAt += duration;
        state.arrived = true;
        onArrive({
          fromEra: state.fromEra,
          toEra: state.toEra,
          fromYear: state.fromYear,
          toYear: state.toYear,
          sameEra: state.sameEra,
          reduced: state.reduced,
        });
        return;
      }

      if (state.phase === 'arrive') {
        state.phase = 'idle';
        if (!state.completed) {
          state.completed = true;
          onComplete({
            fromEra: state.fromEra,
            toEra: state.toEra,
            toYear: state.toYear,
            sameEra: state.sameEra,
            reduced: state.reduced,
          });
        }
      }
    }

    function getView(nowMs) {
      if (state.phase === 'idle') {
        return {
          phase: 'idle',
          active: false,
          phaseProgress: 1,
          progress: 1,
          year: state.toYear,
          energy: 0,
          charge: 0,
          scramble: 0,
          flash: 0,
          fromEra: state.fromEra,
          toEra: state.toEra,
          fromYear: state.fromYear,
          toYear: state.toYear,
          sameEra: state.sameEra,
          reduced: state.reduced,
          distance: state.distance,
        };
      }

      const elapsed = nowMs - state.phaseStartedAt;
      const duration = Math.max(1, state.durations[state.phase]);
      const phaseProgress = clamp01(elapsed / duration);
      const overallElapsed = nowMs - state.startedAt;
      const overallDuration =
        state.durations.charge + state.durations.vortex + state.durations.arrive;
      const progress = state.reduced ? phaseProgress : clamp01(overallElapsed / overallDuration);

      let year = state.fromYear;
      let energy = 0;
      let charge = 0;
      let scramble = 0;
      let flash = 0;

      if (state.reduced) {
        year = state.toYear;
        flash = state.phase === 'arrive' ? (1 - phaseProgress) * 0.45 : 0;
      } else if (state.phase === 'charge') {
        charge = phaseProgress;
        energy = 0.3 + phaseProgress * 0.7;
      } else if (state.phase === 'vortex') {
        charge = 1;
        energy = 1;
        scramble = phaseProgress;
        const eased = easeInQuad(phaseProgress);
        year = Math.round(state.fromYear + (state.toYear - state.fromYear) * eased);
      } else if (state.phase === 'arrive') {
        year = state.toYear;
        energy = Math.max(0, 1 - phaseProgress * 2.4);
        charge = Math.max(0, 1 - phaseProgress * 3);
        flash = Math.max(0, 1 - phaseProgress * 2.8);
      }

      return {
        phase: state.phase,
        active: true,
        phaseProgress,
        progress,
        year,
        energy,
        charge,
        scramble,
        flash,
        fromEra: state.fromEra,
        toEra: state.toEra,
        fromYear: state.fromYear,
        toYear: state.toYear,
        sameEra: state.sameEra,
        reduced: state.reduced,
        distance: state.distance,
        elapsed,
      };
    }

    function isActive() {
      return state.phase !== 'idle';
    }

    return {
      state,
      travelTo,
      update,
      getView,
      isActive,
      CHARGE_MS,
      ARRIVE_MS,
      REDUCED_MS,
    };
  }

  return { createTimeTravel };
})();
