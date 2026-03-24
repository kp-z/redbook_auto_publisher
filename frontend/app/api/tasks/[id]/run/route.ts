import { NextRequest, NextResponse } from "next/server"
import { updateTask } from "@/lib/store"
import { runTask } from "@/lib/runner"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await runTask(id)
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const updated = updateTask(id, body)
  if (!updated) return NextResponse.json({ error: "任务不存在" }, { status: 404 })
  return NextResponse.json(updated)
}
