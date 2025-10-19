import { describe, it, expect } from 'vitest';
import type { FileDiagnostic } from '~/types';
import type { AsOption } from '~/cli';
import { filterTestFilesByPattern } from '~/utils/testing';

// Mock the diagnostic analysis logic from source command
interface DiagnosticSummary {
  totalFiles: number;
  filesWithErrors: number;
  filesWithWarnings: number;
  totalErrors: number;
  totalWarnings: number;
  errorsByCode: Map<number, number>;
  warningsByCode: Map<number, number>;
}

function analyzeDiagnostics(
  filesDiagnostics: { filepath: string; diagnostics: FileDiagnostic[] }[],
  opt: AsOption<"source">
): DiagnosticSummary {
  const summary: DiagnosticSummary = {
    totalFiles: filesDiagnostics.length,
    filesWithErrors: 0,
    filesWithWarnings: 0,
    totalErrors: 0,
    totalWarnings: 0,
    errorsByCode: new Map(),
    warningsByCode: new Map()
  };

  for (const fileData of filesDiagnostics) {
    let fileHasErrors = false;
    let fileHasWarnings = false;

    for (const diagnostic of fileData.diagnostics) {
      const isWarning = opt.warn.includes(diagnostic.code);
      
      if (isWarning) {
        summary.totalWarnings++;
        fileHasWarnings = true;
        summary.warningsByCode.set(
          diagnostic.code, 
          (summary.warningsByCode.get(diagnostic.code) || 0) + 1
        );
      } else {
        summary.totalErrors++;
        fileHasErrors = true;
        summary.errorsByCode.set(
          diagnostic.code, 
          (summary.errorsByCode.get(diagnostic.code) || 0) + 1
        );
      }
    }

    if (fileHasErrors) summary.filesWithErrors++;
    if (fileHasWarnings) summary.filesWithWarnings++;
  }

  return summary;
}

describe('source command functionality', () => {
  const mockOpt: any = {
    warn: [],
    verbose: false,
    quiet: false,
    config: undefined
  };

  describe('analyzeDiagnostics', () => {
    it('should handle files with no diagnostics', () => {
      const filesDiagnostics = [
        { filepath: 'file1.ts', diagnostics: [] },
        { filepath: 'file2.ts', diagnostics: [] }
      ];

      const result = analyzeDiagnostics(filesDiagnostics as any, mockOpt);

      expect(result.totalFiles).toBe(2);
      expect(result.filesWithErrors).toBe(0);
      expect(result.filesWithWarnings).toBe(0);
      expect(result.totalErrors).toBe(0);
      expect(result.totalWarnings).toBe(0);
      expect(result.errorsByCode.size).toBe(0);
      expect(result.warningsByCode.size).toBe(0);
    });

    it('should count errors correctly', () => {
      const filesDiagnostics = [
{
          filepath: 'file1.ts',
          diagnostics: [
            { code: 2344, msg: 'Type error 1', category: 1, filepath: 'file1.ts', loc: { lineNumber: 1, column: 1, start: 0, length: 10 }},
            { code: 2344, msg: 'Type error 2', category: 1, filepath: 'file1.ts', loc: { lineNumber: 2, column: 1, start: 20, length: 10 }}
          ]
        },
        {
          filepath: 'file2.ts',
          diagnostics: [
            { code: 2322, msg: 'Type error 3', category: 1, filepath: 'file2.ts', loc: { lineNumber: 1, column: 1, start: 0, length: 10 }}
          ]
        }
      ];

      const result = analyzeDiagnostics(filesDiagnostics as any, mockOpt);

      expect(result.totalFiles).toBe(2);
      expect(result.filesWithErrors).toBe(2);
      expect(result.filesWithWarnings).toBe(0);
      expect(result.totalErrors).toBe(3);
      expect(result.totalWarnings).toBe(0);
      expect(result.errorsByCode.get(2344)).toBe(2);
      expect(result.errorsByCode.get(2322)).toBe(1);
    });

    it('should handle warnings when warn codes are specified', () => {
      const warnOpt: AsOption<"source"> = {
        ...mockOpt,
        warn: [6196] // Treat code 6196 as warning
      };

      const filesDiagnostics = [
        {
          filepath: 'file1.ts',
          diagnostics: [
            { code: 2344, msg: 'Type error', category: 1, filepath: 'file1.ts', loc: { lineNumber: 1, column: 1, start: 0, length: 10 }},
            { code: 6196, msg: 'Unused variable', category: 1, filepath: 'file1.ts', loc: { lineNumber: 2, column: 1, start: 20, length: 10 }}
          ]
        }
      ];

      const result = analyzeDiagnostics(filesDiagnostics, warnOpt);

      expect(result.totalFiles).toBe(1);
      expect(result.filesWithErrors).toBe(1);   // File has errors (2344)
      expect(result.filesWithWarnings).toBe(1); // File has warnings (6196)
      expect(result.totalErrors).toBe(1);       // Only 2344 counted as error
      expect(result.totalWarnings).toBe(1);     // Only 6196 counted as warning
      expect(result.errorsByCode.get(2344)).toBe(1);
      expect(result.warningsByCode.get(6196)).toBe(1);
    });

    it('should aggregate error codes correctly', () => {
      const filesDiagnostics = [
        {
          filepath: 'file1.ts',
          diagnostics: [
            { code: 2344, msg: 'Error 1', category: 1, filepath: 'file1.ts', loc: { lineNumber: 1, column: 1, start: 0, length: 10 }},
            { code: 2344, msg: 'Error 2', category: 1, filepath: 'file1.ts', loc: { lineNumber: 2, column: 1, start: 20, length: 10 }},
            { code: 2322, msg: 'Error 3', category: 1, filepath: 'file1.ts', loc: { lineNumber: 3, column: 1, start: 40, length: 10 }}
          ]
        },
        {
          filepath: 'file2.ts',
          diagnostics: [
            { code: 2344, msg: 'Error 4', category: 1, filepath: 'file2.ts', loc: { lineNumber: 1, column: 1, start: 0, length: 10 }},
            { code: 2353, msg: 'Error 5', category: 1, filepath: 'file2.ts', loc: { lineNumber: 2, column: 1, start: 20, length: 10 }}
          ]
        }
      ];

      const result = analyzeDiagnostics(filesDiagnostics as any, mockOpt);

      expect(result.totalErrors).toBe(5);
      expect(result.errorsByCode.get(2344)).toBe(3); // Most frequent
      expect(result.errorsByCode.get(2322)).toBe(1);
      expect(result.errorsByCode.get(2353)).toBe(1);
      expect(result.errorsByCode.size).toBe(3); // 3 different error codes
    });

    it('should handle mixed errors and warnings in same file', () => {
      const mixedOpt: AsOption<"source"> = {
        ...mockOpt,
        warn: [6196, 6133] // Multiple warning codes
      };

      const filesDiagnostics = [
        {
          filepath: 'file1.ts',
          diagnostics: [
            { code: 2344, msg: 'Type error', category: 1, loc: { lineNumber: 1, column: 1, start: 0, length: 10 }},
            { code: 6196, msg: 'Unused variable', category: 1, loc: { lineNumber: 2, column: 1, start: 20, length: 10 }},
            { code: 6133, msg: 'Unused parameter', category: 1, loc: { lineNumber: 3, column: 1, start: 40, length: 10 }},
            { code: 2322, msg: 'Type mismatch', category: 1, loc: { lineNumber: 4, column: 1, start: 60, length: 10 }}
          ]
        }
      ];

      const result = analyzeDiagnostics(filesDiagnostics, mixedOpt);

      expect(result.filesWithErrors).toBe(1);
      expect(result.filesWithWarnings).toBe(1);
      expect(result.totalErrors).toBe(2);     // 2344, 2322
      expect(result.totalWarnings).toBe(2);   // 6196, 6133
      expect(result.errorsByCode.get(2344)).toBe(1);
      expect(result.errorsByCode.get(2322)).toBe(1);
      expect(result.warningsByCode.get(6196)).toBe(1);
      expect(result.warningsByCode.get(6133)).toBe(1);
    });

    it('should handle empty files list', () => {
      const result = analyzeDiagnostics([], mockOpt);

      expect(result.totalFiles).toBe(0);
      expect(result.filesWithErrors).toBe(0);
      expect(result.filesWithWarnings).toBe(0);
      expect(result.totalErrors).toBe(0);
      expect(result.totalWarnings).toBe(0);
    });
  });

  describe('diagnostic code aggregation', () => {
    it('should sort error codes by frequency', () => {
      const filesDiagnostics = [
        {
          filepath: 'file1.ts',
          diagnostics: [
            { code: 2344, msg: 'Error 1', category: 1, loc: { lineNumber: 1, column: 1, start: 0, length: 10 }},
            { code: 2344, msg: 'Error 2', category: 1, loc: { lineNumber: 2, column: 1, start: 20, length: 10 }},
            { code: 2344, msg: 'Error 3', category: 1, loc: { lineNumber: 3, column: 1, start: 40, length: 10 }},
            { code: 2322, msg: 'Error 4', category: 1, loc: { lineNumber: 4, column: 1, start: 60, length: 10 }},
            { code: 2353, msg: 'Error 5', category: 1, loc: { lineNumber: 5, column: 1, start: 80, length: 10 }},
            { code: 2322, msg: 'Error 6', category: 1, loc: { lineNumber: 6, column: 1, start: 100, length: 10 }}
          ]
        }
      ];

      const result = analyzeDiagnostics(filesDiagnostics as any, mockOpt);
      const sortedCodes = Array.from(result.errorsByCode.entries())
        .sort((a, b) => b[1] - a[1]); // Sort by count descending

      expect(sortedCodes[0]).toEqual([2344, 3]); // Most frequent
      expect(sortedCodes[1]).toEqual([2322, 2]); // Second most frequent
      expect(sortedCodes[2]).toEqual([2353, 1]); // Least frequent
    });
  });
});

