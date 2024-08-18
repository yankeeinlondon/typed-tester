
import { AsOption } from "./cli";
import { GlobalMetrics } from "./reporting/globalMetrics";





export const summarizeGlobalErrorsAndWarnings = (opts: AsOption<"test">) => {
  const cache = getCache();
  let err_count = 0;
  let err_files = 0;
  let warn_count = 0;
  let warn_files = 0;

  for (const file of Object.keys(cache)) {
    const diag = getCacheEntry(file);
    const f_err = diag.diagnostics.filter(i => !opts?.warn?.includes(String(i.code)) );
    const f_warn = diag.diagnostics.filter(i => opts?.warn?.includes(String(i.code)) );

    err_count += f_err.length;
    if(f_err.length>0) {
      err_files++;
    }
    warn_count += f_warn.length;
    if(f_warn.length>0) {
      warn_files++;
    }
  }

  return {
    code: err_count > 0 ? 1 : 0,
    file_count: Object.keys(cache).length,
    err_count,
    err_files,
    warn_count,
    warn_files
  } as GlobalMetrics
}
