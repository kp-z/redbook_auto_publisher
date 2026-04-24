import { execFileSync } from "child_process"
import fs from "fs"
import path from "path"
import { publishContent } from "./xhs-client"
import { generateWithFluxDev } from "./image-api-clients"
import { getTask, DEV_DAILY_TASK_ID } from "./store"
import type { ProjectConfig } from "./store"

// 默认扫描项目：当任务中未配置 projects 时自动使用
const DEFAULT_PROJECTS: ProjectConfig[] = [
  {
    name: "Claude Manager",
    repoPath: "/Users/kp/项目/Proj/claude_manager",
    frontendUrl: "http://localhost:5173",
  },
  {
    name: "StockRadar",
    repoPath: "/Users/kp/项目/Proj/stockradar-backend",
    frontendUrl: "http://localhost:31749",
  },
  {
    name: "小红书 MCP",
    repoPath: "/Users/kp/项目/Proj/xiaohongshu-mcp",
    frontendUrl: "http://localhost:3000",
  },
]

interface CommitInfo {
  hash: string
  message: string
  author: string
  date: string
}

interface ProjectCommits {
  project: ProjectConfig
  commits: CommitInfo[]
}

// 截图保存目录
const SCREENSHOT_DIR = path.join(process.cwd(), "data", "screenshots")

/**
 * 解析 topicPrompt 中的 frontmatter 和 prompt 模板
 * frontmatter 格式：--- ... --- 块中包含 projects 列表
 */
function parseTopicPrompt(topicPrompt: string): {
  projects: ProjectConfig[]
  promptTemplate: string
} {
  const fmMatch = topicPrompt.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!fmMatch) {
    return { projects: [], promptTemplate: topicPrompt }
  }

  const fmContent = fmMatch[1]
  const promptTemplate = fmMatch[2].trim()

  // 简易 YAML 解析：提取 projects 列表
  const projects: ProjectConfig[] = []
  const projectBlocks = fmContent.split(/\n\s+-\s+name:\s+/).slice(1)

  for (const block of projectBlocks) {
    const lines = ("name: " + block).split("\n")
    let name = ""
    let repo = ""
    let url = ""
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith("name:")) name = trimmed.slice(5).trim()
      else if (trimmed.startsWith("repo:")) repo = trimmed.slice(5).trim()
      else if (trimmed.startsWith("url:")) url = trimmed.slice(4).trim()
    }
    if (name && repo) {
      projects.push({ name, repoPath: repo, frontendUrl: url })
    }
  }

  return { projects, promptTemplate }
}

function formatCommitSections(allCommits: ProjectCommits[]): string {
  return allCommits
    .filter((pc) => pc.commits.length > 0)
    .map((pc) => {
      const lines = pc.commits.map((c) => `- ${c.hash} ${c.message}`)
      return `项目：${pc.project.name}\n${lines.join("\n")}`
    })
    .join("\n\n")
}

function buildImagePrompt(allCommits: ProjectCommits[]): string {
  const changes = allCommits
    .filter((pc) => pc.commits.length > 0)
    .map((pc) => {
      const messages = pc.commits
        .slice(0, 4)
        .map((c) => c.message.replace(/[`#*_>-]/g, "").trim())
        .filter(Boolean)
        .join("；")
      return `${pc.project.name}：${messages}`
    })
    .filter(Boolean)

  const summary = changes.join("；").slice(0, 500)
  return `科技感插画风，小红书程序员开发日报封面，展示今天的开发修改内容：${summary}。画面包含代码编辑器、提交记录、界面改版或功能优化元素，深色界面，精致 UI，适合中文科技内容分享封面。`
}

function normalizeContent(content: string): string {
  const plain = content
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return plain.startsWith("🤖 由 Agent 自动总结发布")
    ? plain
    : `🤖 由 Agent 自动总结发布\n\n${plain}`
}

/**
 * 扫描单个项目当天的 git commit
 */
function scanGitCommits(repoPath: string): CommitInfo[] {
  try {
    const output = execFileSync("git", [
      "-C", repoPath,
      "log",
      "--since=midnight",
      "--format=%h|%s|%an|%ai",
      "--no-merges",
    ], { encoding: "utf-8", timeout: 10000 })

    return output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, message, author, date] = line.split("|")
        return { hash, message, author, date }
      })
  } catch {
    console.warn(`[dev-daily] git 扫描失败: ${repoPath}`)
    return []
  }
}

/**
 * 用 Anthropic SDK 生成开发日报内容
 */
async function generateDevSummary(
  allCommits: ProjectCommits[],
  promptTemplate: string
): Promise<{ title: string; content: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("缺少 ANTHROPIC_API_KEY，无法生成 AI 开发日报")
  }

  const prompt = `${promptTemplate.replace("{{commits}}", formatCommitSections(allCommits))}

额外要求：
1. 输出内容必须是适合小红书发布的自然中文。
2. 正文必须是纯文本，禁止使用 Markdown、代码块、标题符号、列表符号。
3. 正文开头必须加上“🤖 由 Agent 自动总结发布”。
4. 正文请加入丰富但不过度的 emoji，让内容更有活力。
5. 图片将优先使用 AI 生成图片，图片提示词会基于当天修改内容自动总结，所以正文无需再单独解释配图策略。`

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1200,
    temperature: 0.7,
    system:
      "你是一名擅长撰写小红书开发日报的中文内容助手。你必须只输出 JSON，不要输出任何额外解释。",
    messages: [
      {
        role: "user",
        content: `${prompt}

请严格输出 JSON，格式如下：
{"title":"标题","content":"正文"}

要求：
- title 不超过 20 个字，可以使用 emoji
- content 必须是纯文本，禁止使用任何 Markdown 语法
- content 必须以“🤖 由 Agent 自动总结发布”开头
- content 使用自然中文，分段清晰，并加入丰富但不过度的 emoji`,
      },
    ],
  })

  const text = response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim()

  let parsed: { title?: string; content?: string }
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("Anthropic 返回内容不是有效 JSON：" + text.slice(0, 200))
  }

  if (!parsed?.title || !parsed?.content) {
    throw new Error("Anthropic 返回格式异常：" + text.slice(0, 200))
  }

  return {
    title: String(parsed.title).slice(0, 20),
    content: normalizeContent(String(parsed.content)).slice(0, 1000),
  }
}

/**
 * 检测前端是否在运行
 */
async function isFrontendRunning(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}

/**
 * 用 Playwright 截图
 */
async function takePlaywrightScreenshot(
  url: string,
  savePath: string
): Promise<string | null> {
  try {
    const { chromium } = await import("playwright")
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 720 },
      })
      await page.goto(url, { waitUntil: "networkidle", timeout: 15000 })
      await page.screenshot({ path: savePath, type: "png" })
      return savePath
    } finally {
      await browser.close()
    }
  } catch (err) {
    console.warn(`[dev-daily] Playwright 截图失败 ${url}:`, err)
    return null
  }
}

/**
 * 获取图片：AI 生成优先 → Playwright 截图 → 静态兜底
 */
async function captureImages(
  projects: ProjectConfig[],
  allCommits: ProjectCommits[]
): Promise<string[]> {
  const images: string[] = []

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const aiPrompt = buildImagePrompt(allCommits)

  try {
    const result = await generateWithFluxDev(aiPrompt, "4:3")
    if (result.imageUrls.length > 0) {
      images.push(result.imageUrls[0])
      console.log(`[dev-daily] 使用 AI 生成日报配图 (${result.cost})`)
      return images
    }
  } catch (err) {
    console.warn("[dev-daily] AI 日报配图生成失败:", err)
  }

  for (const project of projects) {
    if (!project.frontendUrl) continue

    const safeName = project.name.replace(/\s+/g, "-").toLowerCase()
    const screenshotPath = path.join(
      SCREENSHOT_DIR,
      `${today}-${safeName}.png`
    )

    const running = await isFrontendRunning(project.frontendUrl)
    if (!running) continue

    const result = await takePlaywrightScreenshot(
      project.frontendUrl,
      screenshotPath
    )
    if (result) {
      images.push(result)
      break
    }
  }

  if (images.length === 0) {
    const logoPath = path.join(process.cwd(), "public", "logo.png")
    if (fs.existsSync(logoPath)) {
      images.push(logoPath)
      console.log("[dev-daily] 使用兜底 logo")
    }
  }

  return images
}

/**
 * 主入口：运行 AI 开发日报任务
 */
export async function runDevDaily(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 0. 从任务配置读取项目列表和 prompt 模板
    const task = getTask(DEV_DAILY_TASK_ID)
    if (!task) throw new Error("任务不存在")

    // 优先用结构化的 projects 字段，其次解析 frontmatter，最后用默认值
    let projects: ProjectConfig[]
    if (task.content.projects && task.content.projects.length > 0) {
      projects = task.content.projects
    } else {
      const parsed = parseTopicPrompt(task.content.topicPrompt)
      projects = parsed.projects.length > 0 ? parsed.projects : DEFAULT_PROJECTS
    }

    const promptTemplate = task.content.topicPrompt.includes("{{commits}}")
      ? task.content.topicPrompt
      : task.content.topicPrompt + "\n\n以下是今天各项目的 git commit 记录：\n\n{{commits}}"

    // 1. 扫描所有项目的 commit
    const allCommits: ProjectCommits[] = projects.map((project) => ({
      project,
      commits: scanGitCommits(project.repoPath),
    }))

    const totalCommits = allCommits.reduce(
      (sum, pc) => sum + pc.commits.length,
      0
    )

    // 无 commit 则跳过
    if (totalCommits === 0) {
      console.log("[dev-daily] 今天无 commit，跳过发布")
      return { success: true }
    }

    console.log(`[dev-daily] 扫描到 ${totalCommits} 条 commit，开始生成日报`)

    // 2. 用 Anthropic SDK 生成总结
    const { title, content } = await generateDevSummary(allCommits, promptTemplate)

    // 3. 获取图片
    const activeProjects = allCommits
      .filter((pc) => pc.commits.length > 0)
      .map((pc) => pc.project)
    const images = await captureImages(activeProjects, allCommits)

    if (images.length === 0) {
      throw new Error("无可用图片，无法发布")
    }

    // 4. 读取任务配置的 tags
    const tags = task.content.tags ?? [
      "AI开发日报",
      "程序员日常",
      "独立开发",
      "AI自动发布",
    ]

    // 5. 发布到小红书
    const result = await publishContent({
      title,
      content,
      images,
      tags,
      visibility: "公开可见",
    })

    if (!result.success) {
      throw new Error(result.error ?? "发布失败")
    }

    console.log(`[dev-daily] 发布成功: ${title}`)
    return { success: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error(`[dev-daily] 失败: ${error}`)
    return { success: false, error }
  }
}
