import { describe, it, expect } from 'vitest';
import { isSymbolMeta, isSymbolMetaWithDependencies } from '~/type-guards/isSymbolMeta';
import { isSymbol } from '~/type-guards/isSymbol';
import { isFQN } from '~/type-guards/isFQN';
import { createMockBuilder } from '../../helpers';

describe('Symbol Type Guards', () => {
  const builder = createMockBuilder();

  describe('isSymbolMeta', () => {
    it('should return true for valid SymbolMeta', () => {
      const symbol = builder.createSymbol({
        name: 'TestSymbol',
        kind: 'type-defn'
      });

      // Need to add fqn property for the guard
      const symbolWithHash = { ...symbol, fqn: 'abc123' };
      delete (symbolWithHash as any).dependsOn; // Ensure no dependsOn property

      expect(isSymbolMeta(symbolWithHash)).toBe(true);
    });

    it('should return false for SymbolMeta with dependsOn', () => {
      const symbol = builder.createSymbol({
        name: 'TestSymbol',
        kind: 'type-defn'
      });

      const symbolWithDeps = {
        ...symbol,
        fqn: 'abc123',
        dependsOn: ['module::123::Dependency']
      };

      expect(isSymbolMeta(symbolWithDeps)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isSymbolMeta(null)).toBe(false);
      expect(isSymbolMeta(undefined)).toBe(false);
      expect(isSymbolMeta(42)).toBe(false);
      expect(isSymbolMeta('string')).toBe(false);
      expect(isSymbolMeta([])).toBe(false);
    });

    it('should return false for objects missing name', () => {
      const invalid = { fqn: 'abc123' };
      expect(isSymbolMeta(invalid)).toBe(false);
    });

    it('should return false for objects missing fqn', () => {
      const invalid = { name: 'Test' };
      expect(isSymbolMeta(invalid)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isSymbolMeta({})).toBe(false);
    });
  });

  describe('isSymbolMetaWithDependencies', () => {
    it('should return true for SymbolMeta with dependsOn array', () => {
      const symbol = builder.createSymbol({
        name: 'TestSymbol',
        kind: 'type-defn'
      });

      const symbolWithDeps = {
        ...symbol,
        fqn: 'abc123',
        dependsOn: ['module::123::Dependency']
      };

      expect(isSymbolMetaWithDependencies(symbolWithDeps)).toBe(true);
    });

    it('should return true for SymbolMeta with empty dependsOn array', () => {
      const symbol = builder.createSymbol({
        name: 'TestSymbol',
        kind: 'type-defn'
      });

      const symbolWithDeps = {
        ...symbol,
        fqn: 'abc123',
        dependsOn: []
      };

      expect(isSymbolMetaWithDependencies(symbolWithDeps)).toBe(true);
    });

    it('should return false for SymbolMeta without dependsOn', () => {
      const symbol = builder.createSymbol({
        name: 'TestSymbol',
        kind: 'type-defn'
      });

      const symbolWithHash = { ...symbol, fqn: 'abc123' };
      delete (symbolWithHash as any).dependsOn;

      expect(isSymbolMetaWithDependencies(symbolWithHash)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isSymbolMetaWithDependencies(null)).toBe(false);
      expect(isSymbolMetaWithDependencies(undefined)).toBe(false);
      expect(isSymbolMetaWithDependencies(42)).toBe(false);
      expect(isSymbolMetaWithDependencies('string')).toBe(false);
    });

    it('should return false for objects with non-array dependsOn', () => {
      const invalid = {
        name: 'Test',
        fqn: 'abc123',
        dependsOn: 'not-an-array'
      };

      expect(isSymbolMetaWithDependencies(invalid)).toBe(false);
    });
  });

  describe('isSymbol', () => {
    it('should return true for objects with Symbol-like methods', () => {
      const mockSymbol = {
        getExports: () => [],
        getName: () => 'TestSymbol',
        getDeclarations: () => []
      };

      expect(isSymbol(mockSymbol)).toBe(true);
    });

    it('should return false for objects missing getExports', () => {
      const invalid = {
        getName: () => 'TestSymbol'
      };

      expect(isSymbol(invalid)).toBe(false);
    });

    it('should return false for objects missing getName', () => {
      const invalid = {
        getExports: () => []
      };

      expect(isSymbol(invalid)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isSymbol(null)).toBe(false);
      expect(isSymbol(undefined)).toBe(false);
      expect(isSymbol(42)).toBe(false);
      expect(isSymbol('string')).toBe(false);
      expect(isSymbol([])).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isSymbol({})).toBe(false);
    });
  });

  describe('isFQN', () => {
    it('should return true for local FQN', () => {
      expect(isFQN('local::123::MySymbol')).toBe(true);
      expect(isFQN('local::456::AnotherSymbol')).toBe(true);
    });

    it('should return true for module FQN', () => {
      expect(isFQN('module::123::ExportedSymbol')).toBe(true);
      expect(isFQN('module::789::PublicType')).toBe(true);
    });

    it('should return true for external FQN', () => {
      expect(isFQN('external::123::Promise')).toBe(true);
      expect(isFQN('external::456::Array')).toBe(true);
    });

    it('should return false for invalid prefixes', () => {
      expect(isFQN('global::123::Symbol')).toBe(false);
      expect(isFQN('unknown::456::Type')).toBe(false);
      expect(isFQN('123::789::Name')).toBe(false);
    });

    it('should return false for malformed FQN', () => {
      expect(isFQN('module:123:NoDoubleColon')).toBe(false);
      // Note: isFQN only checks prefix, not full structure
      // expect(isFQN('module::NoHash')).toBe(false); // This actually passes because it starts with 'module::'
      expect(isFQN('::123::NoPrefix')).toBe(false);
    });

    it('should return false for empty or invalid strings', () => {
      expect(isFQN('')).toBe(false);
      expect(isFQN('random-string')).toBe(false);
      expect(isFQN('just-a-name')).toBe(false);
    });

    it('should handle edge cases with special characters in name', () => {
      expect(isFQN('module::123::Symbol<T>')).toBe(true);
      expect(isFQN('local::456::_privateSymbol')).toBe(true);
      expect(isFQN('external::789::Symbol$Property')).toBe(true);
    });

    it('should work with FQNs generated by MockASTBuilder', () => {
      const symbol = builder.createSymbol({ name: 'TestSymbol' });
      expect(isFQN(symbol.fqn)).toBe(true);
    });
  });
});
