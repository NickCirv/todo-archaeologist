```
  ╔══════════════════════════════════════════════════╗
  ║   🏛️  TODO ARCHAEOLOGIST                         ║
  ║   Excavating the ruins of broken promises        ║
  ╚══════════════════════════════════════════════════╝
```

Zero-dependency Node.js CLI that digs through your codebase, finds every TODO/FIXME/HACK, uses `git blame` to date them, and presents your technical debt as the archaeological ruin it truly is.

## Install

```bash
npm install -g todo-archaeologist
```

Or run without installing:

```bash
npx todo-archaeologist [path]
```

## Usage

```bash
# Scan current directory

[![npm version](https://img.shields.io/npm/v/todo-archaeologist.svg)](https://www.npmjs.com/package/todo-archaeologist)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14-brightgreen.svg)](https://nodejs.org)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-blue.svg)](https://www.npmjs.com/package/todo-archaeologist)
todo-archaeologist

# Scan a specific path
todo-archaeologist ./src

# Show only TODOs older than 1 year (the hall of shame)
todo-archaeologist --shame

# Show stats only, no timeline
todo-archaeologist --stats

# Combine
todo-archaeologist ./src --shame --stats
```

## Example Output

```
  🏛️  TODO ARCHAEOLOGIST
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Excavation site: ./src
  Artifacts found: 23

  Timeline of Broken Promises:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🦴 2019-03-14  src/utils.js:47
     TODO: refactor this later
     Age: 7 years — "This TODO is a historical monument. Preserve it."

  🦴 2020-11-02  src/auth.js:123
     FIXME: handle edge case
     Age: 5 years — "This FIXME has survived 3 framework migrations."

  🦴 2021-06-15  src/api.js:89
     HACK: temporary workaround
     Age: 4 years — "Nothing is more permanent than a temporary hack."

  Statistics:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total artifacts:    23
  Oldest:             7 years  (src/utils.js:47)
  Average age:        2y 4m
  Technical debt age: 53 years
  Most common type:   TODO (15)
  Worst file:         src/utils.js (7 TODOs)

  Verdict: "Your codebase is an archaeological dig site.
           Future developers will study these ruins."
```

## Age Commentary

| Age | Verdict |
|-----|---------|
| < 1 month | "Fresh. There's still hope." |
| 1–6 months | "Starting to age. Like milk." |
| 6–12 months | "This TODO has seen seasons change." |
| 1–2 years | "Old enough to walk." |
| 2–3 years | "This TODO is old enough to be in second grade." |
| 3–5 years | "This TODO has survived multiple framework wars." |
| 5+ years | "This TODO is a historical monument. Preserve it." |

## Detected Keywords

`TODO` · `FIXME` · `HACK` · `XXX` · `TEMP` · `WORKAROUND`

## Skipped Directories

`node_modules` · `.git` · `dist` · `build` · `vendor` · `.next` · `.nuxt` · `coverage` · `out` · `tmp`

## Technical Details

- **Zero dependencies** — pure Node.js stdlib (`fs`, `path`, `child_process`)
- **Git-aware** — uses `git blame --porcelain` to date each TODO line precisely
- **Graceful fallback** — works without git (skips age detection, shows file-only results)
- **30+ file types** — JS/TS, Python, Ruby, Go, Rust, Java, PHP, CSS, HTML, YAML, SQL, and more
- **Single file** — `index.js` under 300 lines
- **Node 14+** — uses generators, optional catch binding

## You Might Also Like

- **github.com/NickCirv** — more tools for developers who ship

## Contributing

PRs welcome! If you have a funny idea or improvement:

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-idea`)
3. Commit your changes
4. Push to the branch (`git push origin feature/amazing-idea`)
5. Open a Pull Request

Found a bug? [Open an issue](https://github.com/NickCirv/todo-archaeologist/issues).

---

If this made you mass-exhale through your nose, mass-hit that star button.
