import fs from "fs";
import path from "path";

export interface RuntimeConfig {
  version: number;
  installedAt: string;
  databaseUrl: string;
  jwtSecret: string;
}

const CONFIG_FILE_NAME = "config.json";

let runtimeConfigCache: RuntimeConfig | null | undefined;

export function getDataDir(): string {
  return process.env.MEMOIR_DATA_DIR || path.join(process.cwd(), "data");
}

export function getRuntimeConfigPath(): string {
  return path.join(getDataDir(), CONFIG_FILE_NAME);
}

export function clearRuntimeConfigCache() {
  runtimeConfigCache = undefined;
}

export function readRuntimeConfig(): RuntimeConfig | null {
  if (runtimeConfigCache !== undefined) {
    return runtimeConfigCache;
  }

  const configPath = getRuntimeConfigPath();
  if (!fs.existsSync(configPath)) {
    runtimeConfigCache = null;
    return runtimeConfigCache;
  }

  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<RuntimeConfig>;

  if (!parsed.databaseUrl || !parsed.jwtSecret || !parsed.installedAt) {
    throw new Error("运行时配置文件不完整");
  }

  runtimeConfigCache = {
    version: parsed.version || 1,
    installedAt: parsed.installedAt,
    databaseUrl: parsed.databaseUrl,
    jwtSecret: parsed.jwtSecret,
  };

  return runtimeConfigCache;
}

export function writeRuntimeConfig(config: RuntimeConfig) {
  const dataDir = getDataDir();
  fs.mkdirSync(dataDir, { recursive: true });

  const configPath = getRuntimeConfigPath();
  const tempPath = `${configPath}.tmp`;
  const content = `${JSON.stringify(config, null, 2)}\n`;

  fs.writeFileSync(tempPath, content, { mode: 0o600 });
  fs.renameSync(tempPath, configPath);
  clearRuntimeConfigCache();
}

export function getConfiguredDatabaseUrl(): string | null {
  const envDatabaseUrl = process.env.DATABASE_URL?.trim();
  if (
    envDatabaseUrl &&
    envDatabaseUrl !== "postgresql://placeholder:placeholder@localhost:5432/placeholder" &&
    envDatabaseUrl !== "postgresql://user:password@localhost:5432/memoir"
  ) {
    return envDatabaseUrl;
  }

  return readRuntimeConfig()?.databaseUrl || null;
}

export function getConfiguredJwtSecret(): string | null {
  const envJwtSecret = process.env.JWT_SECRET?.trim();
  if (
    envJwtSecret &&
    envJwtSecret !== "your-secret-key-change-in-production" &&
    envJwtSecret !== "replace-with-a-long-random-secret"
  ) {
    return envJwtSecret;
  }

  return readRuntimeConfig()?.jwtSecret || null;
}

export function hasRuntimeConfig(): boolean {
  return readRuntimeConfig() !== null;
}
