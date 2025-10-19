import type {
  SymbolMeta,
  SymbolKind,
  SymbolScope,
  FQN,
  SymbolReference,
  JsDocInfo,
  TypeGeneric
} from '~/types/symbol-ast-types';
import type { FileDiagnostic } from '~/types/file-ast-types';
import type { TestFile, TestBlock, TypeTest } from '~/types/testing-types';
import { DiagnosticCategory } from 'ts-morph';

/**
 * **MockASTBuilder**
 *
 * Factory for creating mock AST objects for testing without requiring
 * full TypeScript project setup. Provides sensible defaults and allows
 * override of specific properties.
 *
 * @example
 * ```typescript
 * const builder = new MockASTBuilder();
 *
 * const symbol = builder.createSymbol({
 *   name: 'UserService',
 *   kind: 'class'
 * });
 *
 * const diagnostic = builder.createDiagnostic({
 *   code: 2307,
 *   msg: 'Cannot find module'
 * });
 * ```
 */
export class MockASTBuilder {
  private symbolCounter = 0;
  private hashCounter = 1000;

  /**
   * Create a mock SymbolMeta object
   *
   * @param overrides - Properties to override defaults
   * @returns Mock SymbolMeta
   */
  createSymbol<TKind extends SymbolKind = SymbolKind>(
    overrides: Partial<SymbolMeta<TKind>> = {}
  ): SymbolMeta<TKind> {
    const id = this.symbolCounter++;
    const name = overrides.name || `Symbol${id}`;
    const kind = (overrides.kind || 'type-defn') as TKind;
    const scope = overrides.scope || 'module';
    const hash = this.hashCounter++;

    const fqn: FQN = overrides.fqn || `${scope}::${hash}::${name}` as FQN;

    return {
      name,
      fqn,
      scope,
      filepath: overrides.filepath || `/src/file${id}.ts`,
      isTypeSymbol: overrides.isTypeSymbol ?? true,
      isVariable: overrides.isVariable ?? false,
      isFunction: overrides.isFunction ?? false,
      startLine: overrides.startLine ?? 1,
      endLine: overrides.endLine ?? 10,
      flags: overrides.flags || ['TypeAlias'],
      generics: overrides.generics || [],
      jsDocs: overrides.jsDocs || [],
      kind,
      refs: overrides.refs || [],
      ...overrides
    } as SymbolMeta<TKind>;
  }

  /**
   * Create a mock SymbolReference
   *
   * @param overrides - Properties to override defaults
   * @returns Mock SymbolReference
   */
  createSymbolReference(overrides: Partial<SymbolReference> = {}): SymbolReference {
    const id = this.symbolCounter++;
    const name = overrides.name || `Ref${id}`;
    const kind = overrides.kind || 'type-defn';
    const scope = 'module';
    const hash = this.hashCounter++;

    return {
      name,
      kind,
      fqn: overrides.fqn || `${scope}::${hash}::${name}` as FQN,
      ...overrides
    };
  }

  /**
   * Create a mock FileDiagnostic
   *
   * @param overrides - Properties to override defaults
   * @returns Mock FileDiagnostic
   */
  createDiagnostic(overrides: Partial<FileDiagnostic> = {}): FileDiagnostic {
    return {
      code: overrides.code || 2307,
      category: overrides.category || DiagnosticCategory.Error,
      msg: overrides.msg || 'Type error',
      filepath: overrides.filepath || '/src/test.ts',
      loc: {
        lineNumber: overrides.loc?.lineNumber || 1,
        column: overrides.loc?.column || 1,
        start: overrides.loc?.start ?? 0,
        length: overrides.loc?.length ?? 10,
        ...overrides.loc
      },
      ...overrides
    };
  }

  /**
   * Create a mock TypeTest
   *
   * @param overrides - Properties to override defaults
   * @returns Mock TypeTest
   */
  createTypeTest(overrides: Partial<TypeTest> = {}): TypeTest {
    const id = this.symbolCounter++;

    return {
      filepath: overrides.filepath || '/tests/test.test.ts',
      description: overrides.description || `Test ${id}`,
      startLine: overrides.startLine || 1,
      endLine: overrides.endLine || 5,
      skip: overrides.skip || false,
      diagnostics: overrides.diagnostics || [],
      symbols: overrides.symbols || [],
      ...overrides
    };
  }

  /**
   * Create a mock TestBlock
   *
   * @param overrides - Properties to override defaults
   * @returns Mock TestBlock
   */
  createTestBlock(overrides: Partial<TestBlock> = {}): TestBlock {
    const id = this.symbolCounter++;

    return {
      filepath: overrides.filepath || '/tests/test.test.ts',
      description: overrides.description || `Test Block ${id}`,
      startLine: overrides.startLine || 1,
      endLine: overrides.endLine || 20,
      skip: overrides.skip || false,
      diagnostics: overrides.diagnostics || [],
      tests: overrides.tests || [this.createTypeTest()],
      ...overrides
    };
  }

  /**
   * Create a mock TestFile
   *
   * @param overrides - Properties to override defaults
   * @returns Mock TestFile
   */
  createTestFile(overrides: Partial<TestFile> = {}): TestFile {
    const id = this.symbolCounter++;

    return {
      filepath: overrides.filepath || `/tests/test${id}.test.ts`,
      importSymbols: overrides.importSymbols || [],
      skip: overrides.skip || false,
      skippedTests: overrides.skippedTests || 0,
      blocks: overrides.blocks || [this.createTestBlock()],
      duration: overrides.duration || 100,
      testLines: overrides.testLines || 50,
      ...overrides
    };
  }

  /**
   * Create a mock JsDocInfo
   *
   * @param overrides - Properties to override defaults
   * @returns Mock JsDocInfo
   */
  createJsDocInfo(overrides: Partial<JsDocInfo> = {}): JsDocInfo {
    return {
      comment: overrides.comment || 'JSDoc comment',
      tags: overrides.tags || [],
      ...overrides
    };
  }

  /**
   * Create a mock TypeGeneric
   *
   * @param overrides - Properties to override defaults
   * @returns Mock TypeGeneric
   */
  createTypeGeneric(overrides: Partial<TypeGeneric> = {}): TypeGeneric {
    return {
      name: overrides.name || 'T',
      type: overrides.type || 'string',
      ...overrides
    };
  }

  /**
   * Create a fully qualified name (FQN)
   *
   * @param scope - Symbol scope
   * @param name - Symbol name
   * @returns Fully qualified name
   */
  createFQN(scope: 'local' | 'module' | 'ext', name: string): FQN {
    const hash = this.hashCounter++;
    return `${scope}::${hash}::${name}` as FQN;
  }

  /**
   * Reset internal counters (useful between tests)
   */
  reset(): void {
    this.symbolCounter = 0;
    this.hashCounter = 1000;
  }
}

/**
 * Create preset symbol collections for common testing scenarios
 */
export class MockSymbolPresets {
  private builder = new MockASTBuilder();

  /**
   * Create a set of related symbols simulating a user service module
   */
  createUserServiceModule(): {
    types: SymbolMeta[];
    classes: SymbolMeta[];
    functions: SymbolMeta[];
  } {
    return {
      types: [
        this.builder.createSymbol({
          name: 'User',
          kind: 'type-defn',
          filepath: '/src/types/user.ts'
        }),
        this.builder.createSymbol({
          name: 'UserRole',
          kind: 'type-defn',
          filepath: '/src/types/user.ts'
        })
      ],
      classes: [
        this.builder.createSymbol({
          name: 'UserService',
          kind: 'class',
          filepath: '/src/services/user.ts',
          isTypeSymbol: false
        })
      ],
      functions: [
        this.builder.createSymbol({
          name: 'validateUser',
          kind: 'function',
          filepath: '/src/utils/validation.ts',
          isFunction: true,
          isTypeSymbol: false
        })
      ]
    };
  }

  /**
   * Create symbols with dependency relationships
   */
  createDependencyChain(): SymbolMeta[] {
    const base = this.builder.createSymbol({
      name: 'BaseType',
      kind: 'type-defn'
    });

    const derived = this.builder.createSymbol({
      name: 'DerivedType',
      kind: 'type-defn',
      refs: [{ name: 'BaseType', kind: 'type-defn', fqn: base.fqn }]
    });

    const consumer = this.builder.createSymbol({
      name: 'Consumer',
      kind: 'type-defn',
      refs: [{ name: 'DerivedType', kind: 'type-defn', fqn: derived.fqn }]
    });

    return [base, derived, consumer];
  }

  /**
   * Create test file with errors
   */
  createTestFileWithErrors(): TestFile {
    const diagnostic1 = this.builder.createDiagnostic({
      code: 2307,
      msg: 'Cannot find module',
      loc: { lineNumber: 5, column: 1, start: 100, length: 10 }
    });

    const diagnostic2 = this.builder.createDiagnostic({
      code: 2322,
      msg: 'Type mismatch',
      loc: { lineNumber: 10, column: 5, start: 200, length: 15 }
    });

    return this.builder.createTestFile({
      blocks: [
        this.builder.createTestBlock({
          diagnostics: [diagnostic1, diagnostic2],
          tests: [
            this.builder.createTypeTest({
              description: 'failing test',
              diagnostics: [diagnostic1]
            }),
            this.builder.createTypeTest({
              description: 'another failing test',
              diagnostics: [diagnostic2]
            })
          ]
        })
      ]
    });
  }

  /**
   * Create external symbols (from node_modules)
   */
  createExternalSymbols(): SymbolMeta[] {
    return [
      this.builder.createSymbol({
        name: 'Promise',
        scope: 'external',
        kind: 'external-type',
        filepath: 'node_modules/typescript/lib/lib.es2015.promise.d.ts'
      }),
      this.builder.createSymbol({
        name: 'Array',
        scope: 'external',
        kind: 'external-type',
        filepath: 'node_modules/typescript/lib/lib.es5.d.ts'
      })
    ];
  }
}

/**
 * Create a mock AST builder instance
 */
export function createMockBuilder(): MockASTBuilder {
  return new MockASTBuilder();
}

/**
 * Create a mock symbol presets instance
 */
export function createMockPresets(): MockSymbolPresets {
  return new MockSymbolPresets();
}
