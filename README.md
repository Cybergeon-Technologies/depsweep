# depsweep

Find unused and undeclared dependencies in a JS/Node project. Zero dependencies, no config required.

## The problem

Every project accumulates dead weight over time — a package gets added for one experiment, the experiment gets ripped out, the `package.json` entry doesn't. Multiply that by a year of development and you've got a slower install, a bigger bundle, and security scanners flagging CVEs in packages nothing actually uses anymore.

The opposite bug is worse: code imports a package that was never added to `package.json`, and it works — because something else pulled it in as a transitive dependency. It works right up until that other package changes its own dependencies, and your build breaks with no obvious cause.

depsweep finds both, in one pass, with no setup beyond having a `package.json`.

## Install

```bash
npm install --save-dev depsweep
```

Or run it without installing:

```bash
npx depsweep .
```

## Usage

```bash
depsweep              # scan the current directory
depsweep ./packages/api
depsweep . --json     # machine-readable output, for scripting
```

```
Scanned 42 source file(s), 18 declared dependencies.

Declared but never imported (2):
  - left-pad
  - moment
  If any of these are used indirectly (CLI scripts, config files), that's expected — double-check before removing.

Imported but not declared in package.json (1):
  - chalk
  These work today because something else pulled them in as a transitive dependency — a version bump elsewhere could silently break your build.
```

Exit code `0` when clean, `1` when something was found — safe to use in CI. A ready-to-use workflow is included at `.github/workflows/depsweep.yml`.

## How it works

depsweep walks your source tree (`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.vue`, skipping `node_modules`, `dist`, `build`, etc.), extracts every `import` / `require()` / dynamic `import()` specifier, and resolves each one to a package name. It then compares that set against `dependencies` + `devDependencies` in `package.json`.

Node builtins (`fs`, `path`, `http`, ...) are always excluded from "missing." A short list of packages that are almost always used indirectly rather than imported — `typescript`, `eslint`, `webpack`, `jest`, and similar build/lint/test tooling — is excluded from "unused" by default, since flagging those is nearly always a false positive.

## False positives — read this before deleting anything

Static analysis can't see everything:

- A package loaded by *string reference* in a config file (an ESLint plugin name, a Babel preset, a Webpack loader) won't show up as "used," even though removing it would break your build. depsweep flags it as unused; that doesn't mean it's safe to remove without checking your config files first.
- A package only referenced in a script under `"scripts"` in `package.json` (a CLI tool) also won't be detected as used in source.
- Type-only packages (`@types/*`) are generally not imported in runtime code and will often show as unused — that's expected for most of them.

Treat depsweep's output as a prioritized list to review, not an automatic deletion list.

## Why this exists

Most dependency-checking tools either require a config file before they'll run, or come bundled inside a much larger linting suite. depsweep is one small, standalone tool that does this one job with zero setup — point it at a project and read the output.

Built by [Cybergeon Technologies](https://github.com/Cybergeon-Technologies).

## License

MIT © Cybergeon Technologies — see [LICENSE](LICENSE).
