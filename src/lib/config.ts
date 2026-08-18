import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const APP_NAME = "LeetTrack";

export interface AppConfig {
  dataDir: string | null;
}

const EMPTY_CONFIG: AppConfig = { dataDir: null };

export function getConfigDir(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, APP_NAME);
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(xdg, "leettrack");
}

export function getConfigFilePath(): string {
  return path.join(getConfigDir(), "config.json");
}

export function readConfig(): AppConfig {
  const file = getConfigFilePath();
  if (!fs.existsSync(file)) {
    return EMPTY_CONFIG;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<AppConfig>;
    const dataDir = typeof parsed.dataDir === "string" && parsed.dataDir.length > 0
      ? parsed.dataDir
      : null;
    return { dataDir };
  } catch {
    return EMPTY_CONFIG;
  }
}

export function writeConfig(config: AppConfig): void {
  const dir = getConfigDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getConfigFilePath(), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export function setConfiguredDataDir(dataDir: string): void {
  writeConfig({ dataDir: path.resolve(dataDir) });
}

export function clearConfiguredDataDir(): void {
  writeConfig({ dataDir: null });
}

export function getEnvDataDir(): string | null {
  const fromEnv = process.env.LEETTRACK_DATA_DIR;
  return fromEnv && fromEnv.length > 0 ? path.resolve(fromEnv) : null;
}

export function isDataDirLockedByEnv(): boolean {
  return getEnvDataDir() !== null;
}

export function getConfiguredDataDir(): string | null {
  return getEnvDataDir() ?? readConfig().dataDir;
}
