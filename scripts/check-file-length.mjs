#!/usr/bin/env node
/**
 * Verifica la convención "ningún archivo de código supera las 300 líneas"
 * (ver CLAUDE.md y .claude/skills/convenciones-codigo/SKILL.md).
 *
 * ESLint (`max-lines`) ya cubre `.ts`/`.tsx` dentro de cada paquete; este script
 * cubre lo que ESLint no toca: `.sql`, `.css`, `.mjs`/`.cjs` y `.md` de docs.
 * Se cuentan las líneas totales del archivo (no se descuentan comentarios ni
 * líneas en blanco, a diferencia de la regla de ESLint) porque en SQL/CSS no
 * hay tanto "ruido" de comentarios que valga la pena filtrar.
 *
 * Uso: `node scripts/check-file-length.mjs`
 */

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const MAX_LINES = 300;
const EXTENSIONS = ['.sql', '.css', '.mjs', '.cjs'];
const IGNORED_DIRS = ['node_modules/', 'dist/', 'build/', 'coverage/'];

function listTrackedFiles() {
  const output = execSync('git ls-files', { encoding: 'utf8' });
  return output.split('\n').filter((line) => line.length > 0);
}

function isCandidate(path) {
  if (IGNORED_DIRS.some((dir) => path.includes(dir))) {
    return false;
  }
  return EXTENSIONS.some((ext) => path.endsWith(ext));
}

function countLines(path) {
  const content = readFileSync(path, 'utf8');
  if (content.length === 0) {
    return 0;
  }
  return content.split('\n').length;
}

function main() {
  const files = listTrackedFiles().filter(isCandidate);
  const offenders = [];

  for (const file of files) {
    const lines = countLines(file);
    if (lines > MAX_LINES) {
      offenders.push({ file, lines });
    }
  }

  if (offenders.length === 0) {
    console.log(`✓ Todos los archivos .sql/.css/.mjs/.cjs están dentro del límite de ${MAX_LINES} líneas.`);
    return;
  }

  console.error(`✗ ${offenders.length} archivo(s) superan las ${MAX_LINES} líneas:\n`);
  for (const { file, lines } of offenders) {
    console.error(`  ${file} (${lines} líneas)`);
  }
  console.error('\nSepara la lógica en archivos más pequeños (ver CLAUDE.md).');
  process.exitCode = 1;
}

main();
