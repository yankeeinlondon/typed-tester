/**
 * Fixture file for testing import categorization
 *
 * This file has EXACTLY known imports that we can test against.
 * If the test fails, the categorization logic is broken.
 */

// EXTERNAL IMPORTS (3 total)
import chalk from "chalk";
import type { SourceFile } from "ts-morph";
import { normalize } from "pathe";

// ALIAS IMPORTS - named (2 total)
import { someUtil } from "~/utils";
import type { SomeType } from "~/types";

// ALIAS OFFSET IMPORTS - named (2 total)
import { deepUtil } from "~/utils/deep/nested";
import { anotherDeep } from "~/helpers/sub/path";

// RELATIVE PEER IMPORTS - named (2 total)
import { peerFunction } from "./peer-file";
import type { PeerType } from "./another-peer";

// RELATIVE PARENT IMPORTS - named (1 total)
import { parentFunction } from "../parent-file";

// RELATIVE CHILD IMPORTS - named (1 total)
import { childFunction } from "./subdir/child-file";

// RELATIVE PARENT IMPORTS - default (1 total)
import ParentDefault from "../parent-default";

// RELATIVE PEER IMPORTS - default (1 total)
import PeerDefault from "./peer-default";

/**
 * EXPECTED CATEGORIZATION:
 *
 * external: 3
 * relativeAliasNamed: 2
 * relativeAliasOffsetNamed: 2
 * relativePeerNamed: 2
 * relativeParentNamed: 1
 * relativeChildNamed: 1
 * relativeParentDefault: 1
 * relativePeerDefault: 1
 *
 * TOTAL: 13 imports
 */

export function testFunction() {
  return "This is just a fixture file for testing imports";
}
