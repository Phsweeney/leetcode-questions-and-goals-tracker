import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Redirect the application config directory into a throwaway location so a test
// can never read or overwrite the real data folder pointer on this machine.
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "leettrack-config-"));
process.env.APPDATA = sandbox;
process.env.XDG_CONFIG_HOME = sandbox;
delete process.env.LEETTRACK_DATA_DIR;
