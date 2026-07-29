#!/usr/bin/env node
/*!
 * depsweep — find unused and undeclared dependencies in a JS/Node project.
 *
 * Usage:
 *   depsweep [path]          Scan a project (default: current directory)
 *   depsweep --json          Machine-readable output
 *   depsweep --help
 */
const fs = require('fs');
const path = require('path');
const { collectUsedPackages } = require('../lib/walkSource');
const { analyze } = require('../lib/analyze');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

function printHelp() {
  console.log(`
depsweep — find unused and undeclared dependencies in a JS/Node project

Usage:
  depsweep [path]        Scan a project (default: current directory)
  depsweep --json         Machine-readable output
  depsweep --help
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const jsonOutput = args.includes('--json');
  const positional = args.find((a) => !a.startsWith('--'));
  const rootDir = path.resolve(positional || '.');

  const pkgJsonPath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    console.error(`${RED}depsweep: no package.json found at ${pkgJsonPath}${RESET}`);
    process.exit(2);
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const declaredDeps = pkgJson.dependencies || {};
  const declaredDevDeps = pkgJson.devDependencies || {};

  const { used, fileCount } = collectUsedPackages(rootDir);
  const result = analyze({ used, declaredDeps, declaredDevDeps });

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.unused.length || result.missing.length ? 1 : 0);
  }

  console.log(`${DIM}Scanned ${fileCount} source file(s), ${result.totalDeclared} declared dependenc${result.totalDeclared === 1 ? 'y' : 'ies'}.${RESET}\n`);

  if (result.unused.length === 0 && result.missing.length === 0) {
    console.log(`${GREEN}✓ No unused or missing dependencies found.${RESET}`);
    process.exit(0);
  }

  if (result.unused.length > 0) {
    console.log(`${YELLOW}Declared but never imported (${result.unused.length}):${RESET}`);
    result.unused.forEach((pkg) => console.log(`  ${YELLOW}-${RESET} ${pkg}`));
    console.log(`${DIM}  If any of these are used indirectly (CLI scripts, config files), that's expected — double-check before removing.${RESET}\n`);
  }

  if (result.missing.length > 0) {
    console.log(`${RED}Imported but not declared in package.json (${result.missing.length}):${RESET}`);
    result.missing.forEach((pkg) => console.log(`  ${RED}-${RESET} ${pkg}`));
    console.log(`${DIM}  These work today because something else pulled them in as a transitive dependency — a version bump elsewhere could silently break your build.${RESET}\n`);
  }

  process.exit(1);
}

main();
