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

  // Daily 7 prompts with sample rarity lookup lists
  const PROMPTS = [
    {
      question: 'Name a Roman emperor',
      common: ['nero', 'augustus', 'caesar', 'julius caesar', 'caligula', 'constantine', 'trajan', 'hadrian', 'marcus aurelius'],
      well: ['tiberius', 'claudius', 'vespasian', 'titus', 'domitian', 'commodus', 'diocletian', 'septimius severus'],
      scholar: ['nerva', 'antoninus pius', 'caracalla', 'aurelian', 'julian', 'justinian', 'theodosius'],
      archivist: ['galba', 'otho', 'vitellius', 'pertinax', 'elagabalus', 'gallienus', 'probus', 'valerian'],
    },
    {
      question: 'Name a famous explorer',
      common: ['columbus', 'christopher columbus', 'magellan', 'ferdinand magellan', 'marco polo', 'vasco da gama', 'cook', 'james cook'],
      well: ['drake', 'francis drake', 'vespucci', 'amerigo vespucci', 'cortes', 'leif erikson', 'amundsen', 'shackleton'],
      scholar: ['cartier', 'jacques cartier', 'hudson', 'henry hudson', 'cabot', 'tasman', 'ibn battuta'],
      archivist: ['zheng he', 'pytheas', 'hanno', 'xuanzang', 'zhang qian', 'bering', 'vitus bering'],
    },
    {
      question: 'Name a battle from the Napoleonic Wars',
      common: ['waterloo', 'trafalgar'],
      well: ['austerlitz', 'borodino', 'leipzig', 'jena'],
      scholar: ['wagram', 'marengo', 'friedland', 'eylau', 'ulm', 'salamanca'],
      archivist: ['auerstedt', 'rivoli', 'aspern', 'essling', 'bautzen', 'lutzen', 'talavera'],
    },
    {
      question: 'Name a female ruler from before 1500',
      common: ['cleopatra', 'joan of arc', 'boudica', 'boudicca'],
      well: ['hatshepsut', 'nefertiti', 'eleanor of aquitaine', 'isabella', 'empress dowager'],
      scholar: ['wu zetian', 'theodora', 'zenobia', 'tomoe gozen', 'aethelflaed'],
      archivist: ['enheduanna', 'pulcheria', 'irene of athens', 'tamar', 'razzia', 'razia sultana', 'himiko'],
    },
    {
      question: 'Name a scientist from before 1700',
      common: ['galileo', 'galileo galilei', 'newton', 'isaac newton', 'archimedes', 'da vinci', 'leonardo da vinci', 'copernicus'],
      well: ['kepler', 'johannes kepler', 'boyle', 'robert boyle', 'hooke', 'robert hooke', 'pascal', 'harvey', 'aristotle'],
      scholar: ['tycho brahe', 'brahe', 'eratosthenes', 'hypatia', 'al-khwarizmi', 'avicenna', 'ibn sina'],
      archivist: ['ibn al-haytham', 'alhazen', 'shen kuo', 'zhang heng', 'aryabhata', 'brahmagupta', 'al-biruni'],
    },
    {
      question: 'Name a Greek philosopher',
      common: ['socrates', 'plato', 'aristotle'],
      well: ['pythagoras', 'epicurus', 'diogenes', 'democritus', 'heraclitus'],
      scholar: ['thales', 'zeno', 'parmenides', 'empedocles', 'protagoras', 'gorgias'],
      archivist: ['hippias', 'chrysippus', 'pyrrho', 'speusippus', 'xenophanes', 'antisthenes'],
    },
    {
      question: 'Name an Egyptian pharaoh',
      common: ['tutankhamun', 'king tut', 'tut', 'cleopatra', 'ramses', 'ramesses', 'ramesses ii'],
      well: ['khufu', 'cheops', 'hatshepsut', 'akhenaten', 'khafre', 'menkaure'],
      scholar: ['thutmose iii', 'thutmose', 'seti i', 'amenhotep iii', 'djoser', 'narmer'],
      archivist: ['sneferu', 'senusret', 'amentemhat', 'psamtik', 'mentuhotep', 'horemheb'],
    },
  ];

  function normalize(text) {
    return text.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ');
  }

  function gradeAnswer(roundIndex, rawAnswer) {
    const clean = normalize(rawAnswer);
    if (!clean) {
      return TIERS.timeout;
    }

    const prompt = PROMPTS[roundIndex] || PROMPTS[0];
    if (prompt.common.includes(clean)) return TIERS.common;
    if (prompt.well.includes(clean)) return TIERS.well;
    if (prompt.scholar.includes(clean)) return TIERS.scholar;
    if (prompt.archivist.includes(clean)) return TIERS.archivist;

    // Very short answers default to Scholar's Pick; distinct obscure answers earn Lost to Time
    return clean.length < 4 ? TIERS.scholar : TIERS.lost;
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
    gradeAnswer,
    formatYear,
  };
})();
