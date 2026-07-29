/*!
 * walkSource.js — walks a project directory, reading source files and
 * collecting every package name referenced across the codebase.
 */
const fs = require('fs');
const path = require('path');
const { extractImports } = require('./extractImports');

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out']);
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue']);

function walk(dir, files) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
}

/**
 * @returns {{ used: Set<string>, usageByFile: Map<string, string[]>, fileCount: number }}
 */
function collectUsedPackages(rootDir) {
  const files = [];
  walk(rootDir, files);

  const used = new Set();
  const usageByFile = new Map();

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const imports = extractImports(content);
    if (imports.size > 0) {
      usageByFile.set(file, [...imports]);
      imports.forEach((pkg) => used.add(pkg));
    }
  }

  return { used, usageByFile, fileCount: files.length };
}

module.exports = { collectUsedPackages };
