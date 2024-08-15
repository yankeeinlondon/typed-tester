import { 
  JSDocLink, 
  JSDocLinkCode, 
  JSDocLinkPlain, 
  JSDocText, 
  ts 
} from "ts-morph";

/**
 * specifies the scope of where the symbol is available:
 * 
 * - `local`: defined in a file and not exported so isolated to use within that file
 * - `module`: a symbol that _is_ exported by the repo being analyzed and
 * available anywhere the symbol is imported
 * - `external`: a symbol defined in an external repo/module 
 */
export type SymbolScope = "local" |  "module" | "external";

/**
 * Describes a generic parameter
 */
export type TypeGeneric = {
  name: string;
  type: string;
}

/**
 * The union type which represents all the _keys_ to the `ts.SymbolFlags` enumeration.
 */
export type SymbolFlagKey = keyof {
  [K in keyof typeof ts.SymbolFlags]: K
};

export type SymbolKind = 
| "type-defn" // a type's definition
| "type-constraint" // this is a "type" which is defined in an external repo
| "external-type"
| "property"
| "scalar"
| "container"
| "class"
| "instance"
| "union-or-intersection"
| "property" // the property on an object (or maybe other container)
| "other";

/**
 * **SymbolMeta**
 * 
 * Key meta-data for a `Symbol` which is serializable
 * (unlike a **ts-morph** `Symbol`).
 * 
 * **Note:** this is the _type_ to use in the cache and is meant to
 * contain all relevant data on Symbols that this plugin would
 * want to report on.
 */
export type SymbolMeta<
  TKind extends SymbolKind = SymbolKind
> = {
  /** symbol name */
  name: string;
  /** 
   * The fully qualified name of the dependency aims to provide
   * a unique-assured token for caching and explicit referencing.
   * The scope of the symbol will depend on it's format:
   * 
   * - a locally defined symbol within the repo being analyzed will look
   * like: `local::<filepath-hash>::<name>`
   * - an module you are exporting in the repo being analyzed will look
   * like: `module::<fqn-hash>::<name>`
   * - any reference to an external symbol will be: `ext::<source-hash>::<name>`
   */
  fqn: string;
  /**
   * The scope for which the symbol is available (`local`, 
   * `module`, `external`).
   */
  scope: SymbolScope;
  /**
   * The file path to the symbol's definition.
   * 
   * **Note:** if the symbol is a "type" then this should always
   * be resolved but for some other _kinds_ of `Symbol` it is optional
   */
  filepath: string;

  reExportPaths?: string[];

  startLine: TKind extends "type-defn" ? number : number | undefined;
  endLine: TKind extends "type-defn" ? number : number | undefined;
  /** 
   * The `symbol.getFlags()` returns a bitwise operation that
   * isn't very human intelligible; this reverse engineers the
   * `SymbolFlags` enumeration keys which went into generating 
   * this number.
   */
  flags: SymbolFlagKey[];

  /**
   * The generic symbols used by the symbol
   */
  generics: TypeGeneric[];

  jsDocs: JsDocInfo[];

  /**
   * Broad brush representation of the _kind_ of symbol this is
   * based largely on which Symbol flags were found.
   */
  kind: TKind;

  /**
   * An array of symbols which this symbol is directly dependant
   * on.
   * 
   * Note: the names are the `fqn` references which are guaranteed
   * to be unique. 
   */
  deps: string[];

  /** the hash of the symbol */
  symbolHash: number;
  /** the epoch date of when this symbol was last hashed */
  updated: number;
}


export type JsDocTag = {
  tagName: string;
  comment: string | (JSDocText | JSDocLink | JSDocLinkCode | JSDocLinkPlain | undefined)[] | undefined;
}

export type JsDocInfo = {
  comment: string;
  tags: JsDocTag[];
}
