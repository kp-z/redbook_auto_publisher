import fs from "fs"
import path from "path"
import crypto from "crypto"

const DATA_DIR = path.join(process.cwd(), "data")
const TASKS_FILE = path.join(DATA_DIR, "tasks.json")
const HISTORY_FILE = path.join(DATA_DIR, "history.json")
const PROFILE_CACHE_FILE = path.join(DATA_DIR, "profile-cache.json")

// 确保 data 目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export type TriggerType = "cron" | "manual" | "webhook"
export type Visibility = "公开可见" | "仅自己可见" | "仅互关好友可见"
export type TaskStatus = "success" | "failed" | "running"

export interface ProjectConfig {
  name: string
  repoPath: string
  frontendUrl: string
}

export interface Task {
  id: string
  name: string
  trigger: {
    type: TriggerType
    cron?: string        // "0 9 * * *"
    webhookToken?: string
  }
  content: {
    topicPrompt: string  // 给 Claude 的提示词
    imageDir: string     // 本地图片目录，随机选取
    tags: string[]
    visibility: Visibility
    projects?: ProjectConfig[]  // AI 开发日报扫描的项目列表
  }
  enabled: boolean
  createdAt: string
  lastRunAt?: string
  lastStatus?: TaskStatus
}

export interface HistoryRecord {
  id: string
  taskId: string
  taskName: string
  runAt: string
  status: TaskStatus
  title?: string
  content?: string
  images?: string[]
  error?: string
}

// ---- Task CRUD ----

export function getTasks(): Task[] {
  ensureDataDir()
  if (!fs.existsSync(TASKS_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8"))
  } catch {
    return []
  }
}

export function getTask(id: string): Task | undefined {
  return getTasks().find((t) => t.id === id)
}

export function saveTask(task: Omit<Task, "id" | "createdAt">): Task {
  const tasks = getTasks()
  const newTask: Task = {
    ...task,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  tasks.push(newTask)
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2))
  return newTask
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) return null
  tasks[idx] = { ...tasks[idx], ...updates }
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2))
  return tasks[idx]
}

export const PROFILE_SYNC_TASK_ID = "__profile_sync__"
export const DEV_DAILY_TASK_ID = "__dev_daily__"

export function ensureProfileSyncTask() {
  const tasks = getTasks()
  if (tasks.find((t) => t.id === PROFILE_SYNC_TASK_ID)) return
  const task: Task = {
    id: PROFILE_SYNC_TASK_ID,
    name: "Profile 数据同步",
    trigger: { type: "cron", cron: "0 20 * * *" },
    content: {
      topicPrompt: "定时获取粉丝数、获赞与收藏数，更新 Dashboard",
      imageDir: "",
      tags: [],
      visibility: "公开可见",
    },
    enabled: true,
    createdAt: new Date().toISOString(),
  }
  tasks.push(task)
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2))
}

const DEV_DAILY_DEFAULT_PROJECTS: ProjectConfig[] = [
  { name: "Claude Manager", repoPath: "/Users/kp/项目/Proj/claude_manager", frontendUrl: "http://localhost:5173" },
  { name: "StockRadar", repoPath: "/Users/kp/项目/Proj/stockradar-backend", frontendUrl: "http://localhost:31749" },
  { name: "小红书 MCP", repoPath: "/Users/kp/项目/Proj/xiaohongshu-mcp", frontendUrl: "http://localhost:3000" },
]

const DEV_DAILY_DEFAULT_PROMPT = `你是一位程序员博主，每天在小红书分享今天的开发进展。这条小红书是由 AI 定时自动扫描 git commit 并生成的。

以下是今天各项目的 git commit 记录：

{{commits}}

要求：
- title：不超过20字，必须包含"AI 开发日报"或"AI 自动发布"，可以用 emoji 点缀
- content：不超过1000字，口语化，按项目分段总结今天做了什么
- 以第一人称分享，像是程序员的碎碎念
- 在末尾注明"本条内容由 AI 自动生成并发布"
- 适当使用 emoji 和换行增加可读性`

export function ensureDevDailyTask() {
  const tasks = getTasks()
  const existing = tasks.find((t) => t.id === DEV_DAILY_TASK_ID)

  if (existing) {
    // 迁移：把 frontmatter 中的 projects 提取到独立字段
    let needsSave = false
    if (!existing.content.projects || existing.content.projects.length === 0) {
      const fmMatch = existing.content.topicPrompt.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (fmMatch) {
        // 从旧 frontmatter 解析 projects
        const fmContent = fmMatch[1]
        const projects: ProjectConfig[] = []
        const blocks = fmContent.split(/\n\s+-\s+name:\s+/).slice(1)
        for (const block of blocks) {
          const lines = ("name: " + block).split("\n")
          let name = "", repo = "", url = ""
          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith("name:")) name = trimmed.slice(5).trim()
            else if (trimmed.startsWith("repo:")) repo = trimmed.slice(5).trim()
            else if (trimmed.startsWith("url:")) url = trimmed.slice(4).trim()
          }
          if (name && repo) projects.push({ name, repoPath: repo, frontendUrl: url })
        }
        existing.content.projects = projects.length > 0 ? projects : DEV_DAILY_DEFAULT_PROJECTS
        existing.content.topicPrompt = fmMatch[2].trim()
      } else {
        existing.content.projects = DEV_DAILY_DEFAULT_PROJECTS
      }
      needsSave = true
    }
    if (!existing.content.topicPrompt.includes("{{commits}}")) {
      existing.content.topicPrompt = DEV_DAILY_DEFAULT_PROMPT
      needsSave = true
    }
    if (needsSave) {
      fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2))
    }
    return
  }

  const task: Task = {
    id: DEV_DAILY_TASK_ID,
    name: "AI 开发日报",
    trigger: { type: "cron", cron: "0 21 * * *" },
    content: {
      topicPrompt: DEV_DAILY_DEFAULT_PROMPT,
      imageDir: "",
      tags: ["AI开发日报", "程序员日常", "独立开发", "AI自动发布", "代码人生"],
      visibility: "公开可见",
      projects: DEV_DAILY_DEFAULT_PROJECTS,
    },
    enabled: true,
    createdAt: new Date().toISOString(),
  }
  tasks.push(task)
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2))
}

export function deleteTask(id: string): boolean {
  const tasks = getTasks()
  const filtered = tasks.filter((t) => t.id !== id)
  if (filtered.length === tasks.length) return false
  fs.writeFileSync(TASKS_FILE, JSON.stringify(filtered, null, 2))
  return true
}

// ---- History ----

export function getHistory(): HistoryRecord[] {
  ensureDataDir()
  if (!fs.existsSync(HISTORY_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"))
  } catch {
    return []
  }
}

export function appendHistory(record: Omit<HistoryRecord, "id">): HistoryRecord {
  const history = getHistory()
  const newRecord: HistoryRecord = { ...record, id: crypto.randomUUID() }
  // 最多保留 200 条
  history.unshift(newRecord)
  if (history.length > 200) history.splice(200)
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
  return newRecord
}

// ---- Profile Cache ----

export interface FeedItem {
  id: string
  title: string
  type: string
  liked_count: number
  cover?: string
}

export interface ProfileCache {
  updatedAt: string
  interactions: { type: string; name: string; count: string }[]
  feeds: FeedItem[]
}

export function getProfileCache(): ProfileCache | null {
  ensureDataDir()
  if (!fs.existsSync(PROFILE_CACHE_FILE)) return null
  try {
    return JSON.parse(fs.readFileSync(PROFILE_CACHE_FILE, "utf-8"))
  } catch {
    return null
  }
}

export function saveProfileCache(data: Omit<ProfileCache, "updatedAt">): ProfileCache {
  ensureDataDir()
  const cache: ProfileCache = { ...data, updatedAt: new Date().toISOString() }
  fs.writeFileSync(PROFILE_CACHE_FILE, JSON.stringify(cache, null, 2))
  return cache
}
