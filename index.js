#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// ─── Config ────────────────────────────────────────────────────────────────

const TODO_PATTERN = /\b(TODO|FIXME|HACK|XXX|TEMP|WORKAROUND)\b[:\s]*(.*)/i;

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'vendor',
  '.next', '.nuxt', 'coverage', '__pycache__', '.cache',
  'out', 'tmp', '.turbo', '.svelte-kit',
]);

const CODE_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.kt', '.swift',
  '.c', '.cpp', '.h', '.hpp', '.cs', '.php',
  '.vue', '.svelte', '.astro',
  '.sh', '.bash', '.zsh',
  '.css', '.scss', '.less', '.sass',
  '.html', '.htm',
  '.yaml', '.yml', '.toml', '.ini', '.env',
  '.sql',
]);

// ─── Age commentary ────────────────────────────────────────────────────────

const AGE_COMMENTS = {
  fresh:    ["Fresh. There's still hope.", "New arrival. Someone actually intends to fix this.", "Practically newborn. Don't get attached."],
  milky:    ["Starting to age. Like milk.", "The optimism is fading.", "Someone said \"I'll fix this soon.\" Soon was months ago."],
  seasonal: ["This TODO has seen seasons change.", "It survived a summer, an autumn, and still here.", "Four seasons. Zero fixes."],
  toddler:  ["Old enough to walk.", "This TODO learned to crawl before anyone fixed it.", "If this were a child, it would know how to talk by now."],
  schoolkid:["This TODO is old enough to be in second grade.", "A whole child grew up while this sat here.", "This TODO has survived more code reviews than most developers."],
  veteran:  ["This TODO has survived multiple framework wars.", "This FIXME has survived 3 framework migrations.", "Built different. Still broken."],
  monument: ["This TODO is a historical monument. Preserve it.", "Nothing is more permanent than a temporary hack.", "Archaeologists will study this one day. They already are."],
};

function getAgeComment(years) {
  const months = years * 12;
  let pool;
  if (months < 1)       pool = AGE_COMMENTS.fresh;
  else if (months < 6)  pool = AGE_COMMENTS.milky;
  else if (months < 12) pool = AGE_COMMENTS.seasonal;
  else if (years < 2)   pool = AGE_COMMENTS.toddler;
  else if (years < 3)   pool = AGE_COMMENTS.schoolkid;
  else if (years < 5)   pool = AGE_COMMENTS.veteran;
  else                  pool = AGE_COMMENTS.monument;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Verdicts ──────────────────────────────────────────────────────────────

function getVerdict(avgYears, total) {
  if (total === 0)      return '"Clean. Suspiciously clean. Are you hiding something?"';
  if (avgYears < 0.5)   return '"Young debt. Still shapeable. Fix it before it fossilizes."';
  if (avgYears < 1)     return '"The debt is accumulating interest. Pay it down."';
  if (avgYears < 2)     return '"Your codebase has commitment issues."';
  if (avgYears < 3)     return '"These TODOs have seen things. Dark things."';
  if (avgYears < 5)     return '"Your codebase is a time capsule of broken promises."';
  return '"Your codebase is an archaeological dig site.\n         Future developers will study these ruins."';
}

// ─── File scanning ─────────────────────────────────────────────────────────

function* walkDir(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(full);
    } else if (entry.isFile() && CODE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      yield full;
    }
  }
}

function findTodosInFile(filePath) {
  let lines;
  try { lines = fs.readFileSync(filePath, 'utf8').split('\n'); }
  catch { return []; }

  const results = [];
  for (let i = 0; i < lines.length; i++) {
    const match = TODO_PATTERN.exec(lines[i]);
    if (match) {
      results.push({
        file:    filePath,
        line:    i + 1,
        keyword: match[1].toUpperCase(),
        text:    match[2].trim() || '(no description)',
      });
    }
  }
  return results;
}

// ─── Git integration ───────────────────────────────────────────────────────

let _isGitRepo = null;

function checkGitRepo(cwd) {
  if (_isGitRepo !== null) return _isGitRepo;
  const r = spawnSync('git', ['rev-parse', '--git-dir'], { cwd, encoding: 'utf8' });
  _isGitRepo = r.status === 0;
  return _isGitRepo;
}

function getLineBlameDate(filePath, lineNum, cwd) {
  try {
    const r = spawnSync(
      'git', ['blame', '-L', `${lineNum},${lineNum}`, '--porcelain', '--', filePath],
      { cwd, encoding: 'utf8', timeout: 8000 }
    );
    if (r.status !== 0 || !r.stdout) return null;
    const m = r.stdout.match(/^author-time (\d+)/m);
    if (!m) return null;
    return new Date(parseInt(m[1], 10) * 1000);
  } catch {
    return null;
  }
}

// ─── Formatting helpers ────────────────────────────────────────────────────

function formatAge(years) {
  if (years < 1 / 12) {
    const days = Math.round(years * 365);
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  if (years < 1) {
    const months = Math.round(years * 12);
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  const y = Math.floor(years);
  const m = Math.round((years - y) * 12);
  if (m === 0) return `${y} year${y !== 1 ? 's' : ''}`;
  return `${y}y ${m}m`;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function relPath(filePath, base) {
  return path.relative(base, filePath) || filePath;
}

const HR = '\u2501'.repeat(42);

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log([
      '',
      '  todo-archaeologist \u2014 dig up your codebase\'s broken promises',
      '',
      '  Usage:',
      '    todo-archaeologist [path] [options]',
      '',
      '  Options:',
      '    --shame   Show only TODOs older than 1 year',
      '    --stats   Show aggregate statistics only (no timeline)',
      '    --help    Show this help',
      '',
    ].join('\n'));
    process.exit(0);
  }

  const shameMode = args.includes('--shame');
  const statsOnly = args.includes('--stats');
  const targetArg = args.find(a => !a.startsWith('--'));
  const targetDir = path.resolve(targetArg || '.');

  if (!fs.existsSync(targetDir)) {
    console.error(`Error: path does not exist: ${targetDir}`);
    process.exit(1);
  }

  const gitEnabled = checkGitRepo(targetDir);
  const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

  // ── Collect TODOs
  const todos = [];
  for (const filePath of walkDir(targetDir)) {
    for (const todo of findTodosInFile(filePath)) {
      if (gitEnabled) {
        todo.date = getLineBlameDate(filePath, todo.line, targetDir);
      } else {
        todo.date = null;
      }
      todo.ageYears = todo.date ? (Date.now() - todo.date.getTime()) / MS_PER_YEAR : null;
      todos.push(todo);
    }
  }

  // ── Filter for --shame (>= 1 year)
  const displayed = shameMode
    ? todos.filter(t => t.ageYears !== null && t.ageYears >= 1)
    : todos;

  // ── Sort: dated oldest first, undated at end
  displayed.sort((a, b) => {
    if (a.date && b.date) return a.date - b.date;
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  // ── Compute stats
  const dated = todos.filter(t => t.ageYears !== null);
  const totalDebtYears = dated.reduce((s, t) => s + t.ageYears, 0);
  const avgYears = dated.length ? totalDebtYears / dated.length : 0;
  const oldest = dated.reduce((m, t) => (!m || t.ageYears > m.ageYears ? t : m), null);

  const byKeyword = {};
  const byFile = {};
  for (const t of todos) {
    byKeyword[t.keyword] = (byKeyword[t.keyword] || 0) + 1;
    byFile[t.file] = (byFile[t.file] || 0) + 1;
  }
  const topKeyword = Object.entries(byKeyword).sort((a, b) => b[1] - a[1])[0];
  const worstFile  = Object.entries(byFile).sort((a, b) => b[1] - a[1])[0];

  // ── Header
  console.log('');
  console.log('\x1b[33m\x1b[1m  \uD83C\uDFDB\uFE0F  TODO ARCHAEOLOGIST\x1b[0m');
  console.log(`  ${HR}`);
  console.log('');
  console.log(`  Excavation site: \x1b[36m${relPath(targetDir, process.cwd()) || '.'}\x1b[0m`);
  console.log(`  Artifacts found: \x1b[33m${todos.length}\x1b[0m`);
  if (shameMode) console.log(`  \x1b[31m[\u2014shame mode: showing only TODOs \u2265 1 year old]\x1b[0m`);
  if (!gitEnabled) console.log(`  \x1b[90m[no git repo \u2014 age detection disabled]\x1b[0m`);

  // ── Timeline
  if (!statsOnly) {
    console.log('');
    console.log('\x1b[33m  Timeline of Broken Promises:\x1b[0m');
    console.log(`  ${HR}`);

    if (displayed.length === 0) {
      console.log('');
      if (shameMode) console.log('  \x1b[32mNo TODOs older than 1 year. Respect.\x1b[0m');
      else           console.log('  \x1b[32mNo artifacts found. Clean or well-hidden.\x1b[0m');
    }

    for (const t of displayed) {
      const rel = relPath(t.file, targetDir);
      const loc = `${rel}:${t.line}`;
      console.log('');
      if (t.date) {
        console.log(`  \x1b[90m\uD83E\uDDB4 ${formatDate(t.date)}\x1b[0m  \x1b[36m${loc}\x1b[0m`);
      } else {
        console.log(`  \x1b[90m\uD83E\uDDB4 (undated)\x1b[0m     \x1b[36m${loc}\x1b[0m`);
      }
      console.log(`     \x1b[33m${t.keyword}:\x1b[0m ${t.text}`);
      if (t.ageYears !== null) {
        const comment = getAgeComment(t.ageYears);
        console.log(`     \x1b[90mAge: ${formatAge(t.ageYears)} \u2014 "${comment}"\x1b[0m`);
      }
    }
  }

  // ── Stats
  console.log('');
  console.log('\x1b[33m  Statistics:\x1b[0m');
  console.log(`  ${HR}`);
  console.log(`  Total artifacts:    \x1b[33m${todos.length}\x1b[0m`);
  if (oldest) {
    console.log(`  Oldest:             \x1b[31m${formatAge(oldest.ageYears)}\x1b[0m  (${relPath(oldest.file, targetDir)}:${oldest.line})`);
    console.log(`  Average age:        ${avgYears < 0.08 ? '<1 month' : formatAge(avgYears)}`);
    console.log(`  Technical debt age: \x1b[31m${formatAge(totalDebtYears)}\x1b[0m`);
  } else {
    console.log('  Age data:           unavailable (no git or no dated TODOs)');
  }
  if (topKeyword) console.log(`  Most common type:   ${topKeyword[0]} (${topKeyword[1]})`);
  if (worstFile)  console.log(`  Worst file:         ${relPath(worstFile[0], targetDir)} (${worstFile[1]} TODOs)`);

  console.log('');
  console.log(`  \x1b[33mVerdict:\x1b[0m ${getVerdict(avgYears, todos.length)}`);
  console.log('');
}

main();
