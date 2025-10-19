import { describe, it, expect } from 'vitest';
import { isFileDiagnostic } from '~/type-guards/isFileDiagnostic';
import { isTsMorphDiagnostic, isTsDiagnostic } from '~/type-guards/isDiagnostic';
import { createMockBuilder } from '../../helpers';
import { DiagnosticCategory } from 'ts-morph';

describe('Diagnostic Type Guards', () => {
  const builder = createMockBuilder();

  describe('isFileDiagnostic', () => {
    it('should return true for valid FileDiagnostic structure', () => {
      const fileDiagnostic = {
        file: '/src/index.ts',
        diagnostics: [
          builder.createDiagnostic({
            code: 2307,
            msg: 'Cannot find module'
          })
        ]
      };

      expect(isFileDiagnostic(fileDiagnostic)).toBe(true);
    });

    it('should return true with empty diagnostics array', () => {
      const fileDiagnostic = {
        file: '/src/index.ts',
        diagnostics: []
      };

      expect(isFileDiagnostic(fileDiagnostic)).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isFileDiagnostic(null)).toBe(false);
      expect(isFileDiagnostic(undefined)).toBe(false);
      expect(isFileDiagnostic(42)).toBe(false);
      expect(isFileDiagnostic('string')).toBe(false);
      expect(isFileDiagnostic([])).toBe(false);
    });

    it('should return false for objects missing file property', () => {
      const invalid = {
        diagnostics: []
      };

      expect(isFileDiagnostic(invalid)).toBe(false);
    });

    it('should return false for objects missing diagnostics property', () => {
      const invalid = {
        file: '/src/index.ts'
      };

      expect(isFileDiagnostic(invalid)).toBe(false);
    });

    it('should return false when file is not a string', () => {
      const invalid = {
        file: 123,
        diagnostics: []
      };

      expect(isFileDiagnostic(invalid)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isFileDiagnostic({})).toBe(false);
    });

    it('should handle file paths with various formats', () => {
      const unixPath = { file: '/usr/local/file.ts', diagnostics: [] };
      const windowsPath = { file: 'C:\\Users\\file.ts', diagnostics: [] };
      const relativePath = { file: './src/file.ts', diagnostics: [] };

      expect(isFileDiagnostic(unixPath)).toBe(true);
      expect(isFileDiagnostic(windowsPath)).toBe(true);
      expect(isFileDiagnostic(relativePath)).toBe(true);
    });
  });

  describe('isTsMorphDiagnostic', () => {
    it('should return true for ts-morph Diagnostic-like objects', () => {
      const mockDiagnostic = {
        getCode: () => 2307,
        getStart: () => 0,
        getLength: () => 10,
        getMessageText: () => 'Cannot find module',
        getCategory: () => DiagnosticCategory.Error
      };

      expect(isTsMorphDiagnostic(mockDiagnostic)).toBe(true);
    });

    it('should return false for objects missing getCode method', () => {
      const invalid = {
        getStart: () => 0,
        getMessageText: () => 'Error'
      };

      expect(isTsMorphDiagnostic(invalid)).toBe(false);
    });

    it('should return false for objects where getCode is not a function', () => {
      const invalid = {
        getCode: 2307, // Not a function
        getStart: () => 0
      };

      expect(isTsMorphDiagnostic(invalid)).toBe(false);
    });

    it('should return false for objects missing getStart', () => {
      const invalid = {
        getCode: () => 2307
      };

      expect(isTsMorphDiagnostic(invalid)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isTsMorphDiagnostic(null)).toBe(false);
      expect(isTsMorphDiagnostic(undefined)).toBe(false);
      expect(isTsMorphDiagnostic(42)).toBe(false);
      expect(isTsMorphDiagnostic('string')).toBe(false);
      expect(isTsMorphDiagnostic([])).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isTsMorphDiagnostic({})).toBe(false);
    });
  });

  describe('isTsDiagnostic', () => {
    it('should return true for TypeScript Diagnostic objects', () => {
      const tsDiagnostic = {
        code: 2307,
        category: DiagnosticCategory.Error,
        messageText: 'Cannot find module',
        file: undefined,
        start: 0,
        length: 10
      };

      expect(isTsDiagnostic(tsDiagnostic)).toBe(true);
    });

    it('should return true with minimal required properties', () => {
      const minimal = {
        code: 2322
      };

      expect(isTsDiagnostic(minimal)).toBe(true);
    });

    it('should return false for objects where code is not a number', () => {
      const invalid = {
        code: '2307' // String instead of number
      };

      expect(isTsDiagnostic(invalid)).toBe(false);
    });

    it('should return false for objects missing code property', () => {
      const invalid = {
        category: DiagnosticCategory.Error,
        messageText: 'Error'
      };

      expect(isTsDiagnostic(invalid)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isTsDiagnostic(null)).toBe(false);
      expect(isTsDiagnostic(undefined)).toBe(false);
      expect(isTsDiagnostic(42)).toBe(false);
      expect(isTsDiagnostic('string')).toBe(false);
      expect(isTsDiagnostic([])).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isTsDiagnostic({})).toBe(false);
    });

    it('should handle all TypeScript diagnostic codes', () => {
      const codes = [2307, 2322, 2339, 2344, 2345, 6133, 6196];

      for (const code of codes) {
        const diagnostic = { code };
        expect(isTsDiagnostic(diagnostic)).toBe(true);
      }
    });
  });

  describe('Diagnostic guard distinctions', () => {
    it('should distinguish ts-morph Diagnostic from TS Diagnostic', () => {
      const tsMorphDiag = {
        getCode: () => 2307,
        getStart: () => 0
      };

      const tsDiag = {
        code: 2307,
        start: 0
      };

      expect(isTsMorphDiagnostic(tsMorphDiag)).toBe(true);
      expect(isTsDiagnostic(tsMorphDiag)).toBe(false);

      expect(isTsMorphDiagnostic(tsDiag)).toBe(false);
      expect(isTsDiagnostic(tsDiag)).toBe(true);
    });

    it('should distinguish FileDiagnostic from both TS diagnostic types', () => {
      const fileDiag = {
        file: '/src/index.ts',
        diagnostics: []
      };

      const tsDiag = {
        code: 2307
      };

      const tsMorphDiag = {
        getCode: () => 2307,
        getStart: () => 0
      };

      expect(isFileDiagnostic(fileDiag)).toBe(true);
      expect(isFileDiagnostic(tsDiag)).toBe(false);
      expect(isFileDiagnostic(tsMorphDiag)).toBe(false);
    });
  });
});
