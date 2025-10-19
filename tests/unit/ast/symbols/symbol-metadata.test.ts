import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  asSymbolMeta,
  asSymbolReference,
  getSymbolName,
  getSymbolScope,
  isExternalSymbol
} from '~/ast/symbols';
import { FixtureManager } from '../../../helpers';

describe('Symbol Metadata Functions', () => {
  let manager: FixtureManager;

  beforeEach(() => {
    manager = new FixtureManager();
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('asSymbolMeta', () => {
    it('should convert a Symbol to SymbolMeta', () => {
      const project = manager.createProject({
        'src/types.ts': `
          export type User = {
            id: number;
            name: string;
          };
        `
      });

      const sourceFile = manager.getSourceFile('src/types.ts');
      const userType = sourceFile?.getTypeAlias('User');
      const symbol = userType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const meta = asSymbolMeta(symbol);

      expect(meta.name).toBe('User');
      expect(meta.scope).toBe('module'); // Exported
      expect(meta.isTypeSymbol).toBe(true);
      expect(meta.isVariable).toBe(false);
      expect(meta.isFunction).toBe(false);
      expect(meta.kind).toBe('type-defn');
      expect(meta.fqn).toMatch(/^module::/);
      expect(meta.fqn).toContain('User');
    });

    it('should handle class symbols', () => {
      const project = manager.createProject({
        'src/service.ts': `
          export class UserService {
            getUser(id: number) {
              return null;
            }
          }
        `
      });

      const sourceFile = manager.getSourceFile('src/service.ts');
      const userClass = sourceFile?.getClass('UserService');
      const symbol = userClass?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const meta = asSymbolMeta(symbol);

      expect(meta.name).toBe('UserService');
      // NOTE: Known limitation - classes are classified as 'property' due to
      // getSymbol() on ClassDeclaration returning typeof constructor type
      expect(meta.kind).toBe('property');
      expect(meta.scope).toBe('module');
      expect(meta.isTypeSymbol).toBe(false);
    });

    it('should handle function symbols', () => {
      const project = manager.createProject({
        'src/utils.ts': `
          export function calculateTotal(items: number[]): number {
            return items.reduce((sum, item) => sum + item, 0);
          }
        `
      });

      const sourceFile = manager.getSourceFile('src/utils.ts');
      const calcFunc = sourceFile?.getFunction('calculateTotal');
      const symbol = calcFunc?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const meta = asSymbolMeta(symbol);

      expect(meta.name).toBe('calculateTotal');
      expect(meta.kind).toBe('function');
      expect(meta.isFunction).toBe(true);
    });

    it('should handle local (non-exported) symbols', () => {
      const project = manager.createProject({
        'src/utils.ts': `
          type LocalType = {
            value: string;
          };

          export function useLocal(input: LocalType) {
            return input.value;
          }
        `
      });

      const sourceFile = manager.getSourceFile('src/utils.ts');
      const localType = sourceFile?.getTypeAlias('LocalType');
      const symbol = localType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const meta = asSymbolMeta(symbol);

      expect(meta.name).toBe('LocalType');
      expect(meta.scope).toBe('local'); // Not exported
      expect(meta.fqn).toMatch(/^local::/);
    });

    it('should capture generics', () => {
      const project = manager.createProject({
        'src/generic.ts': `
          export type Result<T, E = Error> =
            | { success: true; data: T }
            | { success: false; error: E };
        `
      });

      const sourceFile = manager.getSourceFile('src/generic.ts');
      const resultType = sourceFile?.getTypeAlias('Result');
      const symbol = resultType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const meta = asSymbolMeta(symbol);

      expect(meta.generics).toHaveLength(2);
      expect(meta.generics[0].name).toBe('T');
      expect(meta.generics[1].name).toBe('E');
    });
  });

  describe('asSymbolReference', () => {
    it('should create SymbolReference from Symbol', () => {
      const project = manager.createProject({
        'src/types.ts': 'export type Status = "active" | "inactive";'
      });

      const sourceFile = manager.getSourceFile('src/types.ts');
      const statusType = sourceFile?.getTypeAlias('Status');
      const symbol = statusType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const ref = asSymbolReference(symbol);

      expect(ref.name).toBe('Status');
      expect(ref.kind).toBe('type-defn');
      expect(ref.fqn).toMatch(/^module::/);
      expect(ref.fqn).toContain('Status');
    });

    it('should create SymbolReference from SymbolMeta', () => {
      const project = manager.createProject({
        'src/types.ts': 'export type Status = "active" | "inactive";'
      });

      const sourceFile = manager.getSourceFile('src/types.ts');
      const statusType = sourceFile?.getTypeAlias('Status');
      const symbol = statusType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const meta = asSymbolMeta(symbol);
      const ref = asSymbolReference(meta);

      expect(ref.name).toBe('Status');
      expect(ref.kind).toBe('type-defn');
      expect(ref.fqn).toBe(meta.fqn);
    });
  });

  describe('getSymbolName', () => {
    it('should get name from Symbol', () => {
      const project = manager.createProject({
        'src/index.ts': 'export const APP_NAME = "MyApp";'
      });

      const sourceFile = manager.getSourceFile('src/index.ts');
      const appNameVar = sourceFile?.getVariableDeclaration('APP_NAME');
      const symbol = appNameVar?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      expect(getSymbolName(symbol)).toBe('APP_NAME');
    });

    it('should get name from SymbolMeta', () => {
      const project = manager.createProject({
        'src/index.ts': 'export const APP_NAME = "MyApp";'
      });

      const sourceFile = manager.getSourceFile('src/index.ts');
      const appNameVar = sourceFile?.getVariableDeclaration('APP_NAME');
      const symbol = appNameVar?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const meta = asSymbolMeta(symbol);
      expect(getSymbolName(meta)).toBe('APP_NAME');
    });
  });

  describe('getSymbolScope', () => {
    it('should return "module" for exported symbols', () => {
      const project = manager.createProject({
        'src/types.ts': 'export type User = { id: number; };'
      });

      const sourceFile = manager.getSourceFile('src/types.ts');
      const userType = sourceFile?.getTypeAlias('User');
      const symbol = userType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      expect(getSymbolScope(symbol)).toBe('module');
    });

    it('should return "local" for non-exported symbols', () => {
      const project = manager.createProject({
        'src/utils.ts': `
          type InternalConfig = { debug: boolean; };
          export function init(config: InternalConfig) {}
        `
      });

      const sourceFile = manager.getSourceFile('src/utils.ts');
      const configType = sourceFile?.getTypeAlias('InternalConfig');
      const symbol = configType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      expect(getSymbolScope(symbol)).toBe('local');
    });
  });

  describe('isExternalSymbol', () => {
    it('should return false for project symbols', () => {
      const project = manager.createProject({
        'src/types.ts': 'export type User = { id: number; };'
      });

      const sourceFile = manager.getSourceFile('src/types.ts');
      const userType = sourceFile?.getTypeAlias('User');
      const symbol = userType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      expect(isExternalSymbol(symbol)).toBe(false);
    });
  });

  describe('Symbol metadata integrity', () => {
    it('should preserve all properties through conversion', () => {
      const project = manager.createProject({
        'src/complete.ts': `
          /**
           * A complete type with all metadata
           * @example const user: CompleteType = { id: 1 };
           */
          export type CompleteType<T extends string = "default"> = {
            id: number;
            value: T;
          };
        `
      });

      const sourceFile = manager.getSourceFile('src/complete.ts');
      const completeType = sourceFile?.getTypeAlias('CompleteType');
      const symbol = completeType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const meta = asSymbolMeta(symbol);

      // Check all essential properties
      expect(meta.name).toBe('CompleteType');
      expect(meta.scope).toBe('module');
      expect(meta.isTypeSymbol).toBe(true);
      expect(meta.kind).toBe('type-defn');
      expect(meta.generics).toHaveLength(1);
      expect(meta.generics[0].name).toBe('T');
      expect(meta.jsDocs).toHaveLength(1);
      expect(meta.jsDocs[0].comment).toContain('complete type');
      expect(meta.filepath).toContain('src/complete.ts');
      expect(meta.startLine).toBeGreaterThan(0);
      expect(meta.endLine).toBeGreaterThan(meta.startLine!);
      expect(meta.fqn).toMatch(/^module::\d+::CompleteType$/);
    });
  });
});
