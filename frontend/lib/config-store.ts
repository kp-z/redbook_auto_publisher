import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const CONFIG_FILE = path.join(DATA_DIR, "config.json")

// 确保 data 目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export interface AppConfig {
  anthropicApiKey?: string
  replicateApiToken?: string
}

export function getConfig(): AppConfig {
  ensureDataDir()
  if (!fs.existsSync(CONFIG_FILE)) {
    return {}
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
  } catch {
    return {}
  }
}

export function saveConfig(config: Partial<AppConfig>): AppConfig {
  ensureDataDir()
  const current = getConfig()
  const updated = { ...current, ...config }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2))
  return updated
}
