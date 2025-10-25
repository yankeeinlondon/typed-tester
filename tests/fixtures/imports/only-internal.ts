// File with only internal imports (no external)

import { helper1 } from "./helpers";
import { MyClass } from "./MyClass";
import type { LocalType } from "./types";
import * as utils from "./utils";
import { config } from "~/config";
import { BaseClass } from "../base/BaseClass";

const h = helper1;
const m = new MyClass();
const u = utils;
const c = config;
const b = new BaseClass();
