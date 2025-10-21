import { createKindError } from "@yankeeinlondon/kind-error";

export const WriteFailure = createKindError("WriteFailure", { type: "write-failure", library: "typed-tester" });

export const InvalidDiagnosticCode = createKindError("InvalidDiagnosticCode", { library: "typed-tester" });

export const InvalidDiagnosticMessage = createKindError("InvalidDiagnosticMessage", { library: "typed-tester" });

export const InvalidFilePath = createKindError("InvalidFilePath", { library: "typed-tester" });
