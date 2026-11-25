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

  // Template for another prompt. Copy it, uncomment it and change the IDs.
  // Q37110 = "pharaoh". Check any ID at https://www.wikidata.org/wiki/Q37110
  // {
  //   id: 'pharaoh',
  //   question: 'Name an Egyptian pharaoh',
  //   sparql: `
  //     SELECT DISTINCT ?item ?article WHERE {
  //       ?item wdt:P39 wd:Q37110 .
  //       ?sitelink schema:about ?item ;
  //                 schema:isPartOf <https://en.wikipedia.org/> ;
  //                 schema:name ?article .
  //     }
  //   `,
  //   maxAnswers: 60,
  // },
];
