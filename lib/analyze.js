/*!
 * analyze.js — compares package.json's declared dependencies against
 * what's actually imported in source, producing "unused" and "missing"
 * lists.
 */
const path = require('path');
const nodeBuiltins = require('module').builtinModules;

// Packages commonly referenced only via config files, CLI scripts, or
// build tooling — never directly imported in source — so flagging them
// as "unused" would almost always be a false positive. Kept short and
// conservative on purpose; anything not on this list still gets flagged,
// and a real "unused" finding should be double-checked before removing.
const COMMONLY_INDIRECT = new Set([
  'typescript', 'eslint', 'prettier', 'jest', 'mocha', 'nodemon',
  'webpack', 'vite', 'babel-core', '@babel/core', 'ts-node', 'tsx',
  'husky', 'lint-staged', 'nyc', 'cross-env', 'rimraf', 'concurrently',
  'wrangler', 'vercel', 'netlify-cli', 'pm2', 'dotenv-cli',
]);

function isBuiltin(pkgName) {
  const bare = pkgName.replace(/^node:/, '');
  return nodeBuiltins.includes(bare);
}

function analyze({ used, declaredDeps, declaredDevDeps }) {
  const allDeclared = new Set([...Object.keys(declaredDeps), ...Object.keys(declaredDevDeps)]);

  const unused = [...allDeclared].filter(
    (pkg) => !used.has(pkg) && !COMMONLY_INDIRECT.has(pkg)
  ).sort();

  const missing = [...used].filter(
    (pkg) => !allDeclared.has(pkg) && !isBuiltin(pkg)
  ).sort();

  return { unused, missing, totalDeclared: allDeclared.size, totalUsed: used.size };
}

module.exports = { analyze, isBuiltin };
