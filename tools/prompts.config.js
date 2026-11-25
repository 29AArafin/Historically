/* ==========================================================================
   Historically — prompt generator config
   One entry per prompt. tools/generate-prompts.js reads this file.

   Each entry has:
     id          short slug, used as the prompt id in the game (e.g. 'roman-emperor')
     question    the text shown to the player
     sparql      a Wikidata SPARQL query that returns:
                   ?item     the Wikidata item (e.g. wd:Q1413 for Nero)
                   ?article  the title of the item's English Wikipedia article
                 Get ?article from the sitelink to https://en.wikipedia.org/
                 (see the pattern below). Items without an English article
                 are skipped.
     maxAnswers  optional; keep at most this many answers, the most-viewed
                 ones (default 60)
     stripPrefixes  optional; e.g. ['Battle of ']. Also offers each title and
                 redirect without that prefix as an alias ("Waterloo").

   Every query below gets ?article the same way (the ?sitelink lines).
   "wikibase:sitelinks" = how many Wikipedias have an article on the item;
   a minimum keeps out very obscure items and keeps the run short.

   Try a query first at https://query.wikidata.org/ before adding it here.
   ========================================================================== */

module.exports = [
  {
    id: 'roman-emperor',
    question: 'Name a Roman emperor',
    // Q842606 = "Roman emperor" (the position). P39 = "position held".
    sparql: `
      SELECT DISTINCT ?item ?article WHERE {
        ?item wdt:P39 wd:Q842606 .
        ?sitelink schema:about ?item ;
                  schema:isPartOf <https://en.wikipedia.org/> ;
                  schema:name ?article .
      }
    `,
    maxAnswers: 60,
  },

  {
    id: 'explorer',
    question: 'Name a famous explorer',
    // P106 = occupation, Q11900058 = explorer. Born before 1900, on 40+ Wikipedias.
    sparql: `
      SELECT DISTINCT ?item ?article WHERE {
        ?item wdt:P106 wd:Q11900058 ;
              wdt:P569 ?born ;
              wikibase:sitelinks ?links .
        FILTER(YEAR(?born) < 1900 && ?links >= 40)
        ?sitelink schema:about ?item ;
                  schema:isPartOf <https://en.wikipedia.org/> ;
                  schema:name ?article .
      }
    `,
    maxAnswers: 60,
  },

  {
    id: 'napoleonic-battle',
    question: 'Name a battle from the Napoleonic Wars',
    // Q78994 = Napoleonic Wars, Q178561 = battle (or a kind of battle, such
    // as naval battle). P361 = "part of"; the "*" also follows sub-wars
    // (e.g. War of the Third Coalition). 10+ Wikipedias.
    sparql: `
      SELECT DISTINCT ?item ?article WHERE {
        ?war wdt:P361* wd:Q78994 .
        ?item wdt:P361 ?war ;
              wdt:P31/wdt:P279* wd:Q178561 ;
              wikibase:sitelinks ?links .
        FILTER(?links >= 10)
        ?sitelink schema:about ?item ;
                  schema:isPartOf <https://en.wikipedia.org/> ;
                  schema:name ?article .
      }
    `,
    maxAnswers: 60,
    stripPrefixes: ['Battle of the ', 'Battle of '],
  },

  {
    id: 'female-ruler',
    question: 'Name a female ruler from before 1500',
    // Women (P21 = Q6581072) who held a position that is a kind of monarch
    // (Q116), died before 1500, on 15+ Wikipedias. Consort positions (queen
    // consort, empress consort, etc.) don't count as ruling.
    sparql: `
      SELECT DISTINCT ?item ?article WHERE {
        ?item wdt:P21 wd:Q6581072 ;
              wdt:P39 ?position ;
              wdt:P570 ?died ;
              wikibase:sitelinks ?links .
        ?position wdt:P279* wd:Q116 .
        FILTER(YEAR(?died) < 1500 && ?links >= 15)
        FILTER NOT EXISTS {
          VALUES ?consort { wd:Q719039 wd:Q7723211 wd:Q58589442 wd:Q595038
                            wd:Q74236034 wd:Q81299243 wd:Q754089 }
          ?position wdt:P279* ?consort .
        }
        ?sitelink schema:about ?item ;
                  schema:isPartOf <https://en.wikipedia.org/> ;
                  schema:name ?article .
      }
    `,
    maxAnswers: 60,
  },

  {
    id: 'early-scientist',
    question: 'Name a scientist from before 1700',
    // Occupation is scientist or a common science (physicist, astronomer,
    // mathematician, chemist, botanist, naturalist, zoologist, biologist),
    // born before 1700, on 50+ Wikipedias.
    sparql: `
      SELECT DISTINCT ?item ?article WHERE {
        VALUES ?job { wd:Q901 wd:Q169470 wd:Q11063 wd:Q170790 wd:Q593644
                      wd:Q2374149 wd:Q18805 wd:Q350979 wd:Q864503 }
        ?item wdt:P106 ?job ;
              wdt:P569 ?born ;
              wikibase:sitelinks ?links .
        FILTER(YEAR(?born) < 1700 && ?links >= 50)
        ?sitelink schema:about ?item ;
                  schema:isPartOf <https://en.wikipedia.org/> ;
                  schema:name ?article .
      }
    `,
    maxAnswers: 60,
  },

  {
    id: 'greek-philosopher',
    question: 'Name a Greek philosopher',
    // Philosophers (Q4964182) who wrote/spoke Ancient Greek (P1412 = Q35497),
    // born before 100 CE, not Roman citizens (P27 = Q1747689), 15+ Wikipedias.
    sparql: `
      SELECT DISTINCT ?item ?article WHERE {
        ?item wdt:P106 wd:Q4964182 ;
              wdt:P1412 wd:Q35497 ;
              wdt:P569 ?born ;
              wikibase:sitelinks ?links .
        FILTER(YEAR(?born) < 100 && ?links >= 15)
        FILTER NOT EXISTS { ?item wdt:P27 wd:Q1747689 }
        ?sitelink schema:about ?item ;
                  schema:isPartOf <https://en.wikipedia.org/> ;
                  schema:name ?article .
      }
    `,
    maxAnswers: 60,
  },

  {
    id: 'pharaoh',
    question: 'Name an Egyptian pharaoh',
    // Q37110 = pharaoh (the position), humans only (Q5), 25+ Wikipedias.
    // This includes Persian and Ptolemaic rulers of Egypt, who held the title.
    sparql: `
      SELECT DISTINCT ?item ?article WHERE {
        ?item wdt:P39 wd:Q37110 ;
              wdt:P31 wd:Q5 ;
              wikibase:sitelinks ?links .
        FILTER(?links >= 25)
        ?sitelink schema:about ?item ;
                  schema:isPartOf <https://en.wikipedia.org/> ;
                  schema:name ?article .
      }
    `,
    maxAnswers: 60,
  },
];
