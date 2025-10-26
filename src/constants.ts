import { narrow } from "inferred-types";

/**
 * the categories of imports we delineate when running
 * the `imports` command.
 */
export const IMPORT_TYPES = narrow({
    external: {
        name: "External Import",
        desc: "imports of external packages to this repo"
    },

    relativePeerBarrel: {
        name: "Barrel Import (peer)",
        desc: "a barrel import of a symbol within the same directory as the source file"
    },
    relativePeerNamed: {
        name: "Named Import (peer)",
        desc: "a named import of a symbol within the same directory as the source file"
    },
    relativePeerDefault: {
        name: "Default Import (peer)",
        desc: "a default import of a symbol within the same directory as the source file"
    },
    relativePeerHybrid: {
        name: "Hybrid Import (peer)",
        desc: "a hybrid import (name and default) of a symbol within the same directory as the source file"
    },

    relativeParentBarrel: {
        name: "Barrel Import (parent)",
        desc: "a barrel import of a symbol above the source file in the source tree"
    },
    relativeParentNamed: {
        name: "Named Import (parent)",
        desc: "a named import of a symbol above the source file in the source tree"
    },
    relativeParentDefault: {
        name: "Default Import (parent)",
        desc: "a default import of a symbol above the source file in the source tree"
    },
    relativeParentHybrid: {
        name: "Hybrid Import (parent)",
        desc: "a hybrid import (name and default) of a symbol above the source file in the source tree"
    },

    relativeChildBarrel: {
        name: "Barrel Import (child)",
        desc: "a barrel import of a symbol from a direct child directory"
    },
    relativeChildNamed: {
        name: "Named Import (child)",
        desc: "a named import of a symbol from a direct child directory"
    },
    relativeChildDefault: {
        name: "Default Import (child)",
        desc: "a default import of a symbol from a direct child directory"
    },
    relativeChildHybrid: {
        name: "Hybrid Import (child)",
        desc: "a hybrid import (name and default) of a symbol from a direct child directory"
    },

    relativeDeepChildBarrel: {
        name: "Barrel Import (deep child)",
        desc: "a barrel import from a file that is two or more directories under the source file"
    },
    relativeDeepChildNamed: {
        name: "Named Import (deep child)",
        desc: "a barrel import from a file that is two or more directories under the source file"
    },
    relativeDeepChildDefault: {
        name: "Default Import (deep child)",
        desc: "a barrel import from a file that is two or more directories under the source file"
    },
    relativeDeepChildHybrid: {
        name: "Hybrid Import (deep child)",
        desc: "a hybrid import (name  and default) from a file that is two or more directories under the source file"
    },

    aliasBarrel: {
        name: "Barrel Import (alias)",
        desc: "a barrel import from a path alias"
    },
    aliasNamed: {
        name: "Named Import (alias)",
        desc: "a named import from a path alias"
    },
    aliasDefault: {
        name: "Default Import (alias)",
        desc: "a default import from a path alias"
    },
    aliasHybrid: {
        name: "Hybrid Import (alias)",
        desc: "a hybrid (default, named) import from a path alias"
    },

    aliasOffsetBarrel: {
        name: "Barrel Import (alias)",
        desc: "a barrel import from an offset path alias"
    },
    aliasOffsetNamed: {
        name: "Named Import (alias)",
        desc: "a named import from an offset path alias"
    },
    aliasOffsetDefault: {
        name: "Default Import (alias)",
        desc: "a default import from an offset path alias"
    },
    aliasOffsetHybrid: {
        name: "Hybrid Import (alias)",
        desc: "a hybrid (default, named) import from an offset path alias"
    },
});
