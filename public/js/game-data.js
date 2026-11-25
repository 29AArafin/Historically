/* ==========================================================================
   Historically — Game Data, Palette & Rarity Scoring
   ========================================================================== */

window.Historically = window.Historically || {};

window.Historically.GameData = (() => {
  'use strict';

  const ROUND_SECONDS = 25;
  const START_YEAR = 2026;

  // Rarity tiers matching the core game rules
  const TIERS = {
    common: {
      key: 'common',
      name: 'Common Knowledge',
      shortLabel: 'COMMON',
      points: 10,
      yearsBack: 20,
      flavour: 'Everyone has been here. Barely a step back.',
    },
    well: {
      key: 'well',
      name: 'Well Known',
      shortLabel: 'WELL KNOWN',
      points: 30,
      yearsBack: 100,
      flavour: 'A familiar road into the past.',
    },
    scholar: {
      key: 'scholar',
      name: "Scholar's Pick",
      shortLabel: "SCHOLAR'S PICK",
      points: 55,
      yearsBack: 300,
      flavour: 'Sharp recall. The centuries slip by.',
    },
    archivist: {
      key: 'archivist',
      name: "Archivist's Find",
      shortLabel: "ARCHIVIST'S FIND",
      points: 80,
      yearsBack: 800,
      flavour: 'Buried deep. Few ever dig this far.',
    },
    lost: {
      key: 'lost',
      name: 'Lost to Time',
      shortLabel: 'LOST TO TIME',
      points: 100,
      yearsBack: 2000,
      flavour: 'Almost nobody remembers this. Welcome to the ancient past.',
    },
    timeout: {
      key: 'timeout',
      name: 'Time Up',
      shortLabel: 'TIME UP',
      points: 0,
      yearsBack: 0,
      flavour: 'The clock ran out. The machine stayed put.',
    },
  };

  // Prompts and accepted answers live in data/prompts.js.
  const PROMPTS = window.Historically.PROMPTS_DATA || [];

  // Trim, lowercase, strip accents and punctuation, collapse spaces.
  // Hyphens, slashes and underscores count as spaces ("Ku-Baba" -> "ku baba").
  function normalize(text) {
    return String(text || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/æ/g, 'ae')
      .replace(/œ/g, 'oe')
      .replace(/[-_/]/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Per prompt: normalised name or alias -> answer entry. Built on first use.
  const answerIndex = new Map();

  function getAnswerIndex(promptId) {
    if (answerIndex.has(promptId)) return answerIndex.get(promptId);
    const prompt = PROMPTS.find((p) => p.id === promptId);
    const index = new Map();
    if (prompt) {
      prompt.answers.forEach((entry) => {
        [entry.name, ...(entry.aliases || [])].forEach((label) => {
          const key = normalize(label);
          if (key && !index.has(key)) index.set(key, entry);
        });
      });
    }
    answerIndex.set(promptId, index);
    return index;
  }

  /*
   * Checks a raw answer against the CURRENT prompt's accepted answers only.
   * The whole normalised input must equal a normalised name or alias, so
   * partial text and substrings never match.
   *
   * Returns { valid: true, answer, tier } or { valid: false }.
   *   answer: the dataset display name; tier: an entry from TIERS.
   *
   * Examples (prompt 'explorer'):
   *   checkAnswer('explorer', 'Zheng He')      -> { valid: true, answer: 'Zheng He', tier: TIERS.archivist }  exact
   *   checkAnswer('explorer', 'cheng ho')      -> { valid: true, answer: 'Zheng He', tier: TIERS.archivist }  alias
   *   checkAnswer('explorer', '  MAGELLAN ')   -> { valid: true, answer: 'Ferdinand Magellan', tier: TIERS.common }  case/spacing
   *   checkAnswer('explorer', 'hernan cortes') -> { valid: true, answer: 'Hernán Cortés', tier: TIERS.well }  accents
   *   checkAnswer('explorer', 'magel')         -> { valid: false }  partial text
   *   checkAnswer('explorer', 'spanish s')     -> { valid: false }  not in dataset
   *   checkAnswer('explorer', 'Nero')          -> { valid: false }  answer from another prompt
   *   checkAnswer('explorer', '   ')           -> { valid: false }  empty input
   */
  function checkAnswer(promptId, rawInput) {
    const key = normalize(rawInput);
    if (!key) return { valid: false };
    const entry = getAnswerIndex(promptId).get(key);
    if (!entry || !TIERS[entry.tier]) return { valid: false };
    return { valid: true, answer: entry.name, tier: TIERS[entry.tier] };
  }

  function formatYear(year) {
    if (year < 0) {
      return `${Math.abs(year)} BCE`;
    }
    if (year === 0) {
      return '1 BCE';
    }
    return `${year} CE`;
  }

  return {
    ROUND_SECONDS,
    START_YEAR,
    PROMPTS,
    TIERS,
    normalize,
    checkAnswer,
    formatYear,
  };
})();
