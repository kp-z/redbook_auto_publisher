import { NextRequest, NextResponse } from "next/server"
import { getTasks, saveTask, deleteTask } from "@/lib/store"
import { generateWebhookToken } from "@/lib/helpers"

export async function GET() {
  return NextResponse.json(getTasks())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // 如果是 webhook 触发，自动生成 token
  if (body.trigger?.type === "webhook" && !body.trigger.webhookToken) {
    body.trigger.webhookToken = generateWebhookToken()
  }
  const task = saveTask(body)
  return NextResponse.json(task, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const ok = deleteTask(id)
  return NextResponse.json({ success: ok })
}
