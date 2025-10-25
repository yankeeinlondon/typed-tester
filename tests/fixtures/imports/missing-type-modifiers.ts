// File with type-only imports missing the 'type' keyword

// Should have 'type' modifier - only used as type annotation
import { UserType } from "./user-types";

// Should have 'type' modifier - only used as interface
import { ConfigOptions } from "./config";

// Should have 'type' modifier - only used in type position
import { ResponseData } from "./api";

// These are used only as types
const user: UserType = { id: 1, name: "Test" };
const config: ConfigOptions = { debug: true };
type ApiResponse = ResponseData;
