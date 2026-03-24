import { NextRequest, NextResponse } from "next/server"
import { getTasks } from "@/lib/store"
import { runTask } from "@/lib/runner"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const tasks = getTasks()
  const task = tasks.find(
    (t) => t.trigger.type === "webhook" && t.trigger.webhookToken === token
  )
  if (!task) {
    return NextResponse.json({ error: "无效的 webhook token" }, { status: 404 })
  }
  // 异步执行，立即返回
  runTask(task.id).catch(console.error)
  return NextResponse.json({ success: true, taskId: task.id, taskName: task.name })
}
