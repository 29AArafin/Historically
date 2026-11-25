#!/usr/bin/env node
/* ==========================================================================
   Historically — prompt data generator

   Builds the game's prompts and accepted answers from Wikidata and
   Wikipedia pageviews, instead of writing the answer lists by hand.

   For each prompt in tools/prompts.config.js it:
     1. asks Wikidata (SPARQL) for the candidate answers and their English
        Wikipedia article titles
     2. adds up each article's pageviews over the last 12 full months
     3. sorts by views and gives out tiers in equal bands (most-viewed = common)
     4. collects aliases from Wikipedia redirects and drops any that are too
        short, disambiguation/list pages, or clash with another answer
     5. writes tools/output/prompts.generated.js (same format as the game's
        public/data/prompts.js) and tools/output/review-report.md

   It never touches the game's own data file. Review the output first, then
   copy it over yourself (the terminal summary shows the command).

   Usage (Node.js 18 or later, no npm packages needed):
     node tools/generate-prompts.js                      all prompts
     node tools/generate-prompts.js --only roman-emperor one prompt
     node tools/generate-prompts.js --refresh            ignore the cache
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Settings you may want to change
// ---------------------------------------------------------------------------

// Wikimedia asks every script to identify itself. Put your email in here.
const USER_AGENT = 'Historically/0.1 (contact: 29aarafin@gmail.com)';

// Tier bands, from most-viewed to least-viewed. Percentages must add up to 100.
const TIER_BANDS = [
  { tier: 'common', percent: 20 },
  { tier: 'well', percent: 20 },
  { tier: 'scholar', percent: 20 },
  { tier: 'archivist', percent: 20 },
  { tier: 'lost', percent: 20 },
];

const DEFAULT_MAX_ANSWERS = 60;
const REQUEST_DELAY_MS = 200; // pause between network requests
const MAX_RETRIES = 3; // extra attempts after a failed request
const RETRY_DELAY_MS = 2000; // first retry waits 2s, then 4s, then 8s
const REQUEST_TIMEOUT_MS = 60000;
const MAX_SHORT_ALIAS_LENGTH = 3; // aliases this short or shorter (after normalising) are dropped

// ---------------------------------------------------------------------------
// Paths and API addresses
// ---------------------------------------------------------------------------

const TOOLS_DIR = __dirname;
const CONFIG_FILE = path.join(TOOLS_DIR, 'prompts.config.js');
const CACHE_DIR = path.join(TOOLS_DIR, 'cache');
const OUTPUT_DIR = path.join(TOOLS_DIR, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'prompts.generated.js');
const REPORT_FILE = path.join(OUTPUT_DIR, 'review-report.md');
const GAME_DATA_FILE = path.join('public', 'data', 'prompts.js');

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const PAGEVIEWS_API =
  'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user';
const WIKIPEDIA_ARTICLE_URL = 'https://en.wikipedia.org/wiki/';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Split a list into groups of `size` (the APIs accept up to 50 titles/ids at once).
function chunk(list, size) {
  const groups = [];
  for (let i = 0; i < list.length; i += size) groups.push(list.slice(i, i + size));
  return groups;
}

// Same rules as the game's GameData.normalize (public/js/game-data.js):
// lowercase, strip accents and punctuation, hyphens become spaces, collapse spaces.
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

// Format a Date as YYYYMMDD (UTC), the format the Pageviews API wants.
function ymd(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

// The last 12 full calendar months, e.g. run on 2026-11-25 -> 20251101..20261031.
function lastTwelveMonths(now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1));
  return { start: ymd(start), end: ymd(end) };
}

// "Constantine III (Western Roman emperor)" -> "Constantine III"
function stripDisambiguation(title) {
  return title.replace(/\s*\([^)]*\)\s*$/, '').trim() || title;
}

// Write a JavaScript string literal in single quotes, like the game's data file.
function jsString(text) {
  return `'${String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ')}'`;
}

// Escape text for a Markdown table cell.
function md(text) {
  return String(text).replace(/\|/g, '\\|');
}

// ---------------------------------------------------------------------------
// Network: polite fetching with a cache
// ---------------------------------------------------------------------------

let lastRequestAt = 0;
let networkRequests = 0;
let cacheHits = 0;

/*
 * Fetch JSON from `url`.
 * - Every response is saved in tools/cache/ (one file per URL) and reused next
 *   time, unless --refresh was given.
 * - Waits REQUEST_DELAY_MS between requests and sends our User-Agent.
 * - Retries up to MAX_RETRIES times on network errors, HTTP 429 and 5xx,
 *   waiting longer each time (or as long as the server's Retry-After says).
 * - If allow404 is true, a 404 is cached and returned as null (the Pageviews
 *   API answers 404 when an article has no data).
 */
async function fetchJson(url, { refresh, accept = 'application/json', allow404 = false }) {
  const cacheFile = path.join(CACHE_DIR, `${crypto.createHash('sha1').update(url).digest('hex')}.json`);

  if (!refresh && fs.existsSync(cacheFile)) {
    cacheHits += 1;
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8')).data;
  }

  const saveToCache = (data) => {
    fs.writeFileSync(cacheFile, JSON.stringify({ url, fetchedAt: new Date().toISOString(), data }));
    return data;
  };

  for (let attempt = 0; ; attempt += 1) {
    const wait = lastRequestAt + REQUEST_DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    networkRequests += 1;

    let problem;
    let retryAfterSeconds = 0;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: accept },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) return saveToCache(await response.json());
      if (response.status === 404 && allow404) return saveToCache(null);

      problem = `HTTP ${response.status}`;
      retryAfterSeconds = Number(response.headers.get('retry-after')) || 0;
      // Other 4xx errors (e.g. a broken SPARQL query) won't fix themselves.
      if (response.status !== 429 && response.status < 500) {
        const body = (await response.text()).slice(0, 300);
        throw Object.assign(new Error(`${problem} for ${url}\n${body}`), { fatal: true });
      }
    } catch (error) {
      if (error.fatal) throw error;
      problem = problem || error.message;
    }

    if (attempt >= MAX_RETRIES) {
      throw new Error(`Giving up after ${MAX_RETRIES + 1} attempts (${problem}): ${url}`);
    }
    const delay = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : RETRY_DELAY_MS * 2 ** attempt;
    console.warn(`  ${problem}, retrying in ${Math.round(delay / 1000)}s…`);
    await sleep(delay);
  }
}

// ---------------------------------------------------------------------------
// Step 1: candidates from Wikidata
// ---------------------------------------------------------------------------

// The query may return ?article as a title ("Nero") or a sitelink URL; accept both.
function articleTitleFrom(binding) {
  if (!binding || !binding.value) return null;
  const value = binding.value;
  if (value.startsWith(WIKIPEDIA_ARTICLE_URL)) {
    return decodeURIComponent(value.slice(WIKIPEDIA_ARTICLE_URL.length)).replace(/_/g, ' ');
  }
  return value;
}

async function getCandidates(prompt, options) {
  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(prompt.sparql.trim())}`;
  const data = await fetchJson(url, { ...options, accept: 'application/sparql-results+json' });

  const byItem = new Map(); // QID -> { qid, title }
  const withoutArticle = new Set();
  for (const row of data.results.bindings) {
    if (!row.item) continue;
    const qid = row.item.value.split('/').pop();
    const title = articleTitleFrom(row.article);
    if (!title) {
      withoutArticle.add(qid);
    } else if (!byItem.has(qid)) {
      byItem.set(qid, { qid, title });
    }
  }
  for (const qid of byItem.keys()) withoutArticle.delete(qid);

  return { candidates: [...byItem.values()], skippedNoArticle: [...withoutArticle] };
}

// ---------------------------------------------------------------------------
// Step 2: pageviews for each article
// ---------------------------------------------------------------------------

async function getTotalViews(title, range, options) {
  const article = encodeURIComponent(title.replace(/ /g, '_'));
  const url = `${PAGEVIEWS_API}/${article}/monthly/${range.start}/${range.end}`;
  const data = await fetchJson(url, { ...options, allow404: true });
  if (!data || !Array.isArray(data.items)) return 0; // no data counts as 0
  return data.items.reduce((sum, month) => sum + (month.views || 0), 0);
}

// ---------------------------------------------------------------------------
// Step 3 + 4: sort by views and assign tiers
// ---------------------------------------------------------------------------

function checkTierBands() {
  const total = TIER_BANDS.reduce((sum, band) => sum + band.percent, 0);
  if (Math.abs(total - 100) > 1e-9) {
    throw new Error(`TIER_BANDS percentages add up to ${total}, they must add up to 100.`);
  }
}

// rank 0 is the most-viewed answer. With 60 answers and 20% bands,
// ranks 0-11 are common, 12-23 well, and so on.
function tierForRank(rank, count) {
  let cumulative = 0;
  for (const band of TIER_BANDS) {
    cumulative += band.percent;
    if (rank < Math.round((cumulative / 100) * count)) return band.tier;
  }
  return TIER_BANDS[TIER_BANDS.length - 1].tier;
}

// ---------------------------------------------------------------------------
// Step 5: aliases from Wikipedia redirects
// ---------------------------------------------------------------------------

// Returns Map(article title -> [redirect titles]).
async function getRedirects(titles, options) {
  const redirects = new Map(titles.map((title) => [title, []]));
  for (const group of chunk(titles, 50)) {
    let next = {};
    while (next) {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        formatversion: '2',
        prop: 'redirects',
        rdnamespace: '0',
        rdlimit: 'max',
        titles: group.join('|'),
        ...next,
      });
      const data = await fetchJson(`${WIKIPEDIA_API}?${params}`, options);
      // Wikipedia may tidy a title ("nero" -> "Nero"); map it back to ours.
      const original = new Map((data.query.normalized || []).map((n) => [n.to, n.from]));
      for (const page of data.query.pages || []) {
        const title = original.get(page.title) || page.title;
        if (redirects.has(title) && page.redirects) {
          redirects.get(title).push(...page.redirects.map((r) => r.title));
        }
      }
      next = data.continue || null; // more than 500 redirects come in several pages
    }
  }
  return redirects;
}

/*
 * Pick each answer's aliases from its Wikipedia redirects.
 * Everything is compared after normalize(). A redirect is kept only if:
 *   - it is longer than 3 characters,
 *   - it doesn't contain "disambiguation" or "list of",
 *   - it isn't the answer's own name,
 *   - it isn't the name or alias of any OTHER answer in this prompt
 *     (a clash: both answers drop it, nobody wins).
 * Duplicates within one answer are kept once. Every drop is recorded with its
 * reason in answer.droppedAliases for the review report.
 */
function chooseAliases(answers, redirects) {
  // Pass 1: checks that only need the answer itself.
  for (const answer of answers) {
    const ownName = normalize(answer.name);
    answer.candidates = new Map(); // normalised alias -> first spelling seen
    answer.droppedAliases = [];
    for (const text of redirects.get(answer.title)) {
      const key = normalize(text);
      let reason = null;
      if (key.length <= MAX_SHORT_ALIAS_LENGTH) reason = 'too short';
      else if (key.includes('disambiguation')) reason = 'disambiguation';
      else if (key.includes('list of')) reason = 'list of';
      else if (key === ownName) reason = 'same as the name';

      if (reason) answer.droppedAliases.push({ text, reason });
      else if (!answer.candidates.has(key)) answer.candidates.set(key, text);
    }
  }

  // Pass 2: who uses each normalised name or alias in this prompt?
  const usedBy = new Map(); // normalised text -> Set of answers
  const markUsed = (key, answer) => {
    if (!usedBy.has(key)) usedBy.set(key, new Set());
    usedBy.get(key).add(answer);
  };
  for (const answer of answers) {
    markUsed(normalize(answer.name), answer);
    for (const key of answer.candidates.keys()) markUsed(key, answer);
  }

  // Pass 3: drop anything another answer also uses.
  for (const answer of answers) {
    answer.aliases = [];
    for (const [key, text] of answer.candidates) {
      const others = [...usedBy.get(key)].filter((other) => other !== answer);
      if (others.length) {
        const names = others.map((other) => `"${other.name}"`).join(', ');
        answer.droppedAliases.push({ text, reason: `clashes with ${names}` });
      } else {
        answer.aliases.push(text);
      }
    }
    delete answer.candidates;
  }
}

// ---------------------------------------------------------------------------
// One prompt, start to finish
// ---------------------------------------------------------------------------

async function buildPrompt(prompt, options, range) {
  console.log(`\n[${prompt.id}] ${prompt.question}`);
  const maxAnswers = prompt.maxAnswers || DEFAULT_MAX_ANSWERS;

  const { candidates, skippedNoArticle } = await getCandidates(prompt, options);
  console.log(`  ${candidates.length} candidates with an English article, ${skippedNoArticle.length} skipped without one`);

  console.log(`  Fetching pageviews ${range.start}–${range.end}…`);
  for (const candidate of candidates) {
    candidate.views = await getTotalViews(candidate.title, range, options);
  }

  // Most views first; ties broken by title so the order is always the same.
  candidates.sort((a, b) => b.views - a.views || a.title.localeCompare(b.title));
  const answers = candidates.slice(0, maxAnswers);
  const cutByMax = candidates.slice(maxAnswers);

  // Display name = article title without a "(…)" disambiguator, unless a
  // more-viewed answer already uses that name.
  const usedNames = new Set();
  answers.forEach((answer, rank) => {
    const short = stripDisambiguation(answer.title);
    answer.name = usedNames.has(normalize(short)) ? answer.title : short;
    usedNames.add(normalize(answer.name));
    answer.tier = tierForRank(rank, answers.length);
  });

  console.log(`  Fetching redirects for ${answers.length} answers…`);
  const redirects = await getRedirects(answers.map((a) => a.title), options);
  chooseAliases(answers, redirects);

  return { prompt, answers, cutByMax, skippedNoArticle };
}

// ---------------------------------------------------------------------------
// Step 7: output files
// ---------------------------------------------------------------------------

function writeGeneratedFile(results) {
  const lines = [
    '/* ==========================================================================',
    '   Historically — Daily Prompts & Accepted Answers',
    "   Each answer: display name, tier key (common | well | scholar | archivist |",
    '   lost) and optional aliases (alternate spellings or names). Only answers',
    '   listed here are accepted.',
    `   Generated by tools/generate-prompts.js on ${new Date().toISOString().slice(0, 10)}.`,
    '   ========================================================================== */',
    '',
    'window.Historically = window.Historically || {};',
    '',
    'window.Historically.PROMPTS_DATA = [',
  ];
  for (const { prompt, answers } of results) {
    lines.push('  {');
    lines.push(`    id: ${jsString(prompt.id)},`);
    lines.push(`    question: ${jsString(prompt.question)},`);
    lines.push('    answers: [');
    for (const answer of answers) {
      const aliases = answer.aliases.length ? `, aliases: [${answer.aliases.map(jsString).join(', ')}]` : '';
      lines.push(`      { name: ${jsString(answer.name)}, tier: ${jsString(answer.tier)}${aliases} },`);
    }
    lines.push('    ],');
    lines.push('  },');
  }
  lines.push('];', '');
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'));
}

function writeReport(results, range) {
  const out = [
    '# Historically — generated prompts review',
    '',
    `Generated ${new Date().toISOString()}. Pageviews: English Wikipedia, all-access, user agents, ${range.start}–${range.end}.`,
    '',
  ];
  for (const { prompt, answers, cutByMax, skippedNoArticle } of results) {
    out.push(`## ${prompt.question} (\`${prompt.id}\`)`, '');
    out.push(
      `${answers.length} answers kept, ${cutByMax.length} cut by maxAnswers, ` +
        `${skippedNoArticle.length} skipped (no English article).`,
      ''
    );

    out.push('### Answers', '');
    out.push('| # | Name | Wikidata | Views (12 months) | Tier | Aliases kept |');
    out.push('|---|---|---|---:|---|---|');
    answers.forEach((a, i) => {
      out.push(
        `| ${i + 1} | ${md(a.name)} | ${a.qid} | ${a.views.toLocaleString('en-US')} | ${a.tier} | ` +
          `${a.aliases.map(md).join('; ') || '—'} |`
      );
    });

    out.push('', '### Dropped aliases', '');
    const dropped = answers.flatMap((a) => a.droppedAliases.map((d) => ({ ...d, answer: a.name })));
    if (!dropped.length) out.push('None.');
    for (const d of dropped) out.push(`- **${md(d.answer)}**: "${md(d.text)}" — ${d.reason}`);

    out.push('', '### Answers with 0 views', '');
    const zero = answers.filter((a) => a.views === 0);
    out.push(zero.length ? zero.map((a) => `- ${md(a.name)} (${a.qid}, article "${md(a.title)}")`).join('\n') : 'None.');

    if (cutByMax.length) {
      out.push('', '### Cut by maxAnswers', '');
      out.push(cutByMax.map((c) => `${md(c.title)} (${c.views.toLocaleString('en-US')})`).join(', '));
    }
    if (skippedNoArticle.length) {
      out.push('', '### Skipped: no English Wikipedia article', '');
      out.push(skippedNoArticle.join(', '));
    }
    out.push('');
  }
  fs.writeFileSync(REPORT_FILE, out.join('\n'));
}

// ---------------------------------------------------------------------------
// Command line
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const options = { only: null, refresh: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--refresh') options.refresh = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--only') options.only = argv[++i] || '';
    else if (arg.startsWith('--only=')) options.only = arg.slice('--only='.length);
    else throw new Error(`Unknown option "${arg}". Try --help.`);
  }
  if (options.only === '') throw new Error('--only needs a prompt id, e.g. --only roman-emperor');
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: node tools/generate-prompts.js [--only <prompt-id>] [--refresh]');
    return;
  }
  if (typeof fetch !== 'function') throw new Error('This script needs Node.js 18 or later (built-in fetch).');
  if (USER_AGENT.includes('29aarafin@gmail.com')) {
    console.warn('Note: put your email in USER_AGENT at the top of tools/generate-prompts.js.');
  }
  checkTierBands();

  const config = require(CONFIG_FILE);
  const prompts = options.only ? config.filter((p) => p.id === options.only) : config;
  if (!prompts.length) {
    throw new Error(`No prompt with id "${options.only}". Ids in the config: ${config.map((p) => p.id).join(', ')}`);
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const range = lastTwelveMonths();
  const results = [];
  for (const prompt of prompts) results.push(await buildPrompt(prompt, options, range));

  writeGeneratedFile(results);
  writeReport(results, range);

  // Short summary
  console.log('\nSummary');
  for (const { prompt, answers, cutByMax, skippedNoArticle } of results) {
    const perTier = TIER_BANDS.map((b) => `${b.tier} ${answers.filter((a) => a.tier === b.tier).length}`).join(', ');
    const aliasCount = answers.reduce((sum, a) => sum + a.aliases.length, 0);
    const droppedCount = answers.reduce((sum, a) => sum + a.droppedAliases.length, 0);
    const clashes = answers.reduce(
      (sum, a) => sum + a.droppedAliases.filter((d) => d.reason.startsWith('clashes')).length,
      0
    );
    console.log(`  ${prompt.id}: ${answers.length} answers (${perTier})`);
    console.log(`    ${cutByMax.length} cut by maxAnswers, ${skippedNoArticle.length} without an English article, ` +
      `${answers.filter((a) => a.views === 0).length} with 0 views`);
    console.log(`    aliases: ${aliasCount} kept, ${droppedCount} dropped (${clashes} clashed with another answer)`);
    console.log(`    top 5: ${answers.slice(0, 5).map((a) => `${a.name} (${a.views.toLocaleString('en-US')})`).join(', ')}`);
  }
  console.log(`\n  ${networkRequests} network requests, ${cacheHits} answered from the cache`);
  console.log(`  Wrote ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log(`  Wrote ${path.relative(process.cwd(), REPORT_FILE)}`);
  console.log(`\nAfter reviewing, copy it into the game with:\n  cp tools/output/prompts.generated.js ${GAME_DATA_FILE}`);
  if (results.length < 7) {
    console.log(`  Careful: the game plays 7 prompts and this file has ${results.length}. Generate all 7 before copying.`);
  }
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
