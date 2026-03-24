import { generateXhsContent } from "./claude-client"
import { pickRandomImage } from "./helpers"
import { publishContent } from "./xhs-client"
import { getTask, updateTask, appendHistory, type Task } from "./store"

export async function runTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  const task = getTask(taskId)
  if (!task) return { success: false, error: "任务不存在" }
  if (!task.enabled) return { success: false, error: "任务已禁用" }

  // 标记运行中
  updateTask(taskId, { lastRunAt: new Date().toISOString(), lastStatus: "running" })

  try {
    // 1. AI 生成内容
    const { title, content } = await generateXhsContent(task.content.topicPrompt)

    // 2. 选取图片
    const imagePath = pickRandomImage(task.content.imageDir)
    if (!imagePath) throw new Error(`图片目录为空或不存在：${task.content.imageDir}`)

    // 3. 发布
    const result = await publishContent({
      title,
      content,
      images: [imagePath],
      tags: task.content.tags,
      visibility: task.content.visibility,
    })

    if (!result.success) throw new Error(result.error ?? "发布失败")

    // 4. 记录历史
    updateTask(taskId, { lastStatus: "success" })
    appendHistory({
      taskId,
      taskName: task.name,
      runAt: new Date().toISOString(),
      status: "success",
      title,
      content,
      images: [imagePath],
    })

    return { success: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    updateTask(taskId, { lastStatus: "failed" })
    appendHistory({
      taskId,
      taskName: task.name,
      runAt: new Date().toISOString(),
      status: "failed",
      error,
    })
    return { success: false, error }
  }
}
