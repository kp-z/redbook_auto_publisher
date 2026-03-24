import fs from "fs"
import path from "path"
import crypto from "crypto"

const DATA_DIR = path.join(process.cwd(), "data")
const TASKS_FILE = path.join(DATA_DIR, "tasks.json")
const HISTORY_FILE = path.join(DATA_DIR, "history.json")

// 确保 data 目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export type TriggerType = "cron" | "manual" | "webhook"
export type Visibility = "公开可见" | "仅自己可见" | "仅互关好友可见"
export type TaskStatus = "success" | "failed" | "running"

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
