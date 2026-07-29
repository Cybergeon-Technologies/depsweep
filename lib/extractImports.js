/*!
 * extractImports.js — pulls package names out of import/require
 * statements in a source file's content. Relative imports (./, ../, /)
 * are ignored since they're not npm packages.
 */

const IMPORT_PATTERNS = [
  /import\s+(?:[\w*\s{},]+from\s+)?['"]([^'"]+)['"]/g,       // import X from '...' / import '...'
  /export\s+(?:[\w*\s{},]+from\s+)?['"]([^'"]+)['"]/g,       // export ... from '...'
  /require\(\s*['"]([^'"]+)['"]\s*\)/g,                       // require('...')
  /import\(\s*['"]([^'"]+)['"]\s*\)/g,                        // dynamic import('...')
];

function specifierToPackageName(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) return null; // relative or absolute path
  if (specifier.startsWith('node:')) return specifier; // node:fs etc — treated as builtin by caller
  const parts = specifier.split('/');
  if (specifier.startsWith('@')) {
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return parts[0];
}

function extractImports(content) {
  const found = new Set();
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const pkg = specifierToPackageName(match[1]);
      if (pkg) found.add(pkg);
    }
  }
  return found;
}

module.exports = { extractImports, specifierToPackageName };
