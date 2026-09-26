import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * Comprueba en código las dos convenciones de
 * `.claude/skills/convenciones-codigo/SKILL.md` que no se pudieron expresar
 * de forma fiable como reglas de ESLint: "las pages solo renderizan" y
 * "máximo 7 props por componente".
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '..', 'src');
const MAX_PROPS = 7;
const FORBIDDEN_IN_PAGES = ['useState(', 'useEffect(', 'fetch('];

function listFilesWithExtension(dir: string, extension: string): string[] {
  return readdirSync(dir, { recursive: true })
    .filter((entry): entry is string => typeof entry === 'string' && entry.endsWith(extension))
    .map((entry) => path.join(dir, entry));
}

describe('convención: las pages solo renderizan', () => {
  const pageFiles = listFilesWithExtension(path.join(SRC_DIR, 'pages'), '.tsx');

  it('hay al menos una page para revisar (si esto falla, ajusta SRC_DIR)', () => {
    expect(pageFiles.length).toBeGreaterThan(0);
  });

  it.each(pageFiles)('%s no usa useState/useEffect/fetch directamente', (file) => {
    const source = readFileSync(file, 'utf8');
    for (const forbidden of FORBIDDEN_IN_PAGES) {
      expect(source, `${path.basename(file)} no debería llamar a "${forbidden}" — esa lógica va en un hook.`).not.toContain(forbidden);
    }
  });
});

describe('convención: máximo 7 props por componente', () => {
  const propsFile = path.join(SRC_DIR, 'types', 'props.ts');
  const source = readFileSync(propsFile, 'utf8');
  const sourceFile = ts.createSourceFile(propsFile, source, ts.ScriptTarget.Latest, true);

  const interfaces: ts.InterfaceDeclaration[] = [];
  sourceFile.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node)) {
      interfaces.push(node);
    }
  });

  it('hay al menos una interface de props para revisar', () => {
    expect(interfaces.length).toBeGreaterThan(0);
  });

  it.each(interfaces.map((node) => [node.name.text, node.members.length] as const))(
    '%s tiene %i props (máximo 7)',
    (_name, memberCount) => {
      expect(memberCount).toBeLessThanOrEqual(MAX_PROPS);
    },
  );
});
