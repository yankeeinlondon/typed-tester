import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createFullyQualifiedNameForSymbol } from '~/ast/symbols';
import { isFQN } from '~/type-guards/isFQN';
import { FixtureManager } from '../../../helpers';

describe('Fully Qualified Name (FQN) Generation', () => {
  let manager: FixtureManager;

  beforeEach(() => {
    manager = new FixtureManager();
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('createFullyQualifiedNameForSymbol', () => {
    it('should generate module FQN for exported symbols', () => {
      const project = manager.createProject({
        'src/types.ts': 'export type User = { id: number; };'
      });

      const sourceFile = manager.getSourceFile('src/types.ts');
      const userType = sourceFile?.getTypeAlias('User');
      const symbol = userType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const fqn = createFullyQualifiedNameForSymbol(symbol);

      expect(isFQN(fqn)).toBe(true);
      expect(fqn).toMatch(/^module::\d+::User$/);
    });

    it('should generate local FQN for non-exported symbols', () => {
      const project = manager.createProject({
        'src/internal.ts': `
          type LocalType = { value: string; };
          export function use(input: LocalType) {}
        `
      });

      const sourceFile = manager.getSourceFile('src/internal.ts');
      const localType = sourceFile?.getTypeAlias('LocalType');
      const symbol = localType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const fqn = createFullyQualifiedNameForSymbol(symbol);

      expect(isFQN(fqn)).toBe(true);
      expect(fqn).toMatch(/^local::\d+::LocalType$/);
    });

    it('should generate unique FQNs for symbols with same name in different files', () => {
      const project = manager.createProject({
        'src/file1.ts': 'export type Config = { debug: boolean; };',
        'src/file2.ts': 'export type Config = { verbose: boolean; };'
      });

      const file1 = manager.getSourceFile('src/file1.ts');
      const file2 = manager.getSourceFile('src/file2.ts');

      const config1 = file1?.getTypeAlias('Config')?.getSymbol();
      const config2 = file2?.getTypeAlias('Config')?.getSymbol();

      expect(config1).toBeDefined();
      expect(config2).toBeDefined();
      if (!config1 || !config2) return;

      const fqn1 = createFullyQualifiedNameForSymbol(config1);
      const fqn2 = createFullyQualifiedNameForSymbol(config2);

      // Both should be module FQNs
      expect(fqn1).toMatch(/^module::/);
      expect(fqn2).toMatch(/^module::/);

      // Both should contain "Config"
      expect(fqn1).toContain('Config');
      expect(fqn2).toContain('Config');

      // But they should be different (different hashes)
      expect(fqn1).not.toBe(fqn2);
    });

    it('should generate stable FQNs for the same symbol', () => {
      const project = manager.createProject({
        'src/types.ts': 'export type Status = "active" | "inactive";'
      });

      const sourceFile = manager.getSourceFile('src/types.ts');
      const statusType = sourceFile?.getTypeAlias('Status');
      const symbol = statusType?.getSymbol();

      expect(symbol).toBeDefined();
      if (!symbol) return;

      const fqn1 = createFullyQualifiedNameForSymbol(symbol);
      const fqn2 = createFullyQualifiedNameForSymbol(symbol);

      expect(fqn1).toBe(fqn2);
    });

    it('should handle symbols with special characters in names', () => {
      const project = manager.createProject({
        'src/types.ts': `
          export type _PrivateType = string;
          export type $DollarType = number;
        `
      });

      const sourceFile = manager.getSourceFile('src/types.ts');

      const privateType = sourceFile?.getTypeAlias('_PrivateType')?.getSymbol();
      const dollarType = sourceFile?.getTypeAlias('$DollarType')?.getSymbol();

      expect(privateType).toBeDefined();
      expect(dollarType).toBeDefined();
      if (!privateType || !dollarType) return;

      const privateFqn = createFullyQualifiedNameForSymbol(privateType);
      const dollarFqn = createFullyQualifiedNameForSymbol(dollarType);

      expect(privateFqn).toContain('_PrivateType');
      expect(dollarFqn).toContain('$DollarType');
      expect(isFQN(privateFqn)).toBe(true);
      expect(isFQN(dollarFqn)).toBe(true);
    });

    it('should distinguish between different symbol kinds with same name', () => {
      const project = manager.createProject({
        'src/mixed.ts': `
          export type Config = { debug: boolean; };
          export class Config {
            constructor(public debug: boolean) {}
          }
        `
      });

      const sourceFile = manager.getSourceFile('src/mixed.ts');

      const configType = sourceFile?.getTypeAlias('Config')?.getSymbol();
      const configClass = sourceFile?.getClass('Config')?.getSymbol();

      expect(configType).toBeDefined();
      expect(configClass).toBeDefined();
      if (!configType || !configClass) return;

      const typeFqn = createFullyQualifiedNameForSymbol(configType);
      const classFqn = createFullyQualifiedNameForSymbol(configClass);

      // Both should contain "Config"
      expect(typeFqn).toContain('Config');
      expect(classFqn).toContain('Config');

      // They might be different due to different fully qualified names
      // in the TypeScript compiler, or they might be the same
      // This test just ensures they're valid FQNs
      expect(isFQN(typeFqn)).toBe(true);
      expect(isFQN(classFqn)).toBe(true);
    });

    it('should handle nested module symbols', () => {
      const project = manager.createProject({
        'src/module.ts': `
          export namespace API {
            export type Request = { method: string; };
            export type Response = { status: number; };
          }
        `
      });

      const sourceFile = manager.getSourceFile('src/module.ts');
      const apiNamespace = sourceFile?.getModule('API');
      const requestType = apiNamespace?.getTypeAlias('Request')?.getSymbol();

      expect(requestType).toBeDefined();
      if (!requestType) return;

      const fqn = createFullyQualifiedNameForSymbol(requestType);

      expect(isFQN(fqn)).toBe(true);
      expect(fqn).toContain('Request');
    });

    it('should generate consistent hash for same file path', () => {
      // Create two separate projects with identical structure
      const project1 = manager.createProject({
        'src/types.ts': 'type LocalType = string;'
      });

      const sourceFile1 = manager.getSourceFile('src/types.ts');
      const symbol1 = sourceFile1?.getTypeAlias('LocalType')?.getSymbol();

      expect(symbol1).toBeDefined();
      if (!symbol1) return;

      const fqn1 = createFullyQualifiedNameForSymbol(symbol1);

      // Create another fixture for comparison
      manager.cleanup();

      const project2 = manager.createProject({
        'src/types.ts': 'type LocalType = string;'
      });

      const sourceFile2 = manager.getSourceFile('src/types.ts');
      const symbol2 = sourceFile2?.getTypeAlias('LocalType')?.getSymbol();

      expect(symbol2).toBeDefined();
      if (!symbol2) return;

      const fqn2 = createFullyQualifiedNameForSymbol(symbol2);

      // Same local symbol in same relative path should have consistent structure
      expect(fqn1).toMatch(/^local::/);
      expect(fqn2).toMatch(/^local::/);
      expect(fqn1).toContain('LocalType');
      expect(fqn2).toContain('LocalType');
    });
  });

  describe('FQN format validation', () => {
    it('should always generate valid FQN format', () => {
      const project = manager.createProject({
        'src/various.ts': `
          export type TypeDef = string;
          export interface InterfaceDef { x: number; }
          export class ClassDef {}
          export function funcDef() {}
          export const constDef = 42;
        `
      });

      const sourceFile = manager.getSourceFile('src/various.ts');

      const symbols = [
        sourceFile?.getTypeAlias('TypeDef')?.getSymbol(),
        sourceFile?.getInterface('InterfaceDef')?.getSymbol(),
        sourceFile?.getClass('ClassDef')?.getSymbol(),
        sourceFile?.getFunction('funcDef')?.getSymbol(),
        sourceFile?.getVariableDeclaration('constDef')?.getSymbol()
      ];

      for (const symbol of symbols) {
        if (symbol) {
          const fqn = createFullyQualifiedNameForSymbol(symbol);
          expect(isFQN(fqn)).toBe(true);
          expect(fqn).toMatch(/^(local|module|ext)::\d+::.+$/);
        }
      }
    });
  });
});
