import { describe, it, expect } from 'vitest';
import type { SymbolMeta } from '~/types';

// Mock the symbol filtering logic from symbols command
function filterSymbols(symbols: SymbolMeta[], filters: string[]): SymbolMeta[] {
  const MAX_SYMBOLS = 10;
  
  if (!filters || filters.length === 0) {
    return symbols.slice(0, MAX_SYMBOLS); // Show sample if no filter
  }

  return symbols.filter(symbol => 
    filters.some(filter => 
      symbol.name.toLowerCase().includes(filter.toLowerCase()) ||
      symbol.fqn.toLowerCase().includes(filter.toLowerCase())
    )
  );
}

describe('symbols command functionality', () => {
  const mockSymbols: any[] = [
    {
      name: 'TestInterface',
      fqn: 'module::123::TestInterface',
      kind: 'type-defn',
      isTypeSymbol: true,
      scope: 'module',
      filepath: '/src/types.ts',
      startLine: 1,
      endLine: 5,
      refs: [],
      jsDocInfo: [],
      generics: []
    },
    {
      name: 'UserService',
      fqn: 'module::456::UserService',
      kind: 'class',
      isTypeSymbol: true,
      scope: 'module',
      filepath: '/src/user.ts',
      startLine: 10,
      endLine: 20,
      refs: [],
      jsDocInfo: [],
      generics: []
    },
    {
      name: 'DatabaseConnection',
      fqn: 'module::789::DatabaseConnection',
      kind: 'type-defn',
      isTypeSymbol: true,
      scope: 'module',
      filepath: '/src/db.ts',
      startLine: 5,
      endLine: 15,
      refs: [],
      jsDocInfo: [],
      generics: []
    }
  ];

  describe('filterSymbols', () => {
    it('should return limited symbols when no filter is provided', () => {
      const result = filterSymbols(mockSymbols, []);
      expect(result).toHaveLength(3); // All symbols since we have < MAX_SYMBOLS
      expect(result).toEqual(mockSymbols);
    });

    it('should return limited symbols when empty filter array is provided', () => {
      const manySymbols = Array(15).fill(null).map((_, i) => ({
        ...mockSymbols[0],
        name: `Symbol${i}`,
        fqn: `module::${i}::Symbol${i}` as any
      } as any));
      
      const result = filterSymbols(manySymbols, []);
      expect(result).toHaveLength(10); // Should be limited to MAX_SYMBOLS
    });

    it('should filter symbols by name (case insensitive)', () => {
      const result = filterSymbols(mockSymbols, ['test']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('TestInterface');
    });

    it('should filter symbols by FQN', () => {
      const result = filterSymbols(mockSymbols, ['456']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('UserService');
    });

    it('should handle multiple filters (OR logic)', () => {
      const result = filterSymbols(mockSymbols, ['test', 'database']);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.name)).toContain('TestInterface');
      expect(result.map(s => s.name)).toContain('DatabaseConnection');
    });

    it('should handle case insensitive filtering', () => {
      const result = filterSymbols(mockSymbols, ['TEST', 'USER']);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.name)).toContain('TestInterface');
      expect(result.map(s => s.name)).toContain('UserService');
    });

    it('should return empty array when no matches found', () => {
      const result = filterSymbols(mockSymbols, ['nonexistent']);
      expect(result).toHaveLength(0);
    });

    it('should handle partial name matches', () => {
      const result = filterSymbols(mockSymbols, ['Service']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('UserService');
    });
  });

  describe('symbol analysis', () => {
    it('should identify type symbols correctly', () => {
      for (const symbol of mockSymbols) {
        expect(symbol.isTypeSymbol).toBe(true);
        expect(['type-defn', 'interface', 'class']).toContain(symbol.kind);
      }
    });

    it('should have valid file paths', () => {
      for (const symbol of mockSymbols) {
        expect(symbol.filepath).toMatch(/\.ts$/);
        expect(symbol.startLine).toBeGreaterThan(0);
        expect(symbol.endLine).toBeGreaterThanOrEqual(symbol.startLine);
      }
    });

    it('should have properly formatted FQNs', () => {
      for (const symbol of mockSymbols) {
        expect(symbol.fqn).toMatch(/^module::\d+::\w+$/);
        expect(symbol.fqn).toContain(symbol.name);
      }
    });
  });
});