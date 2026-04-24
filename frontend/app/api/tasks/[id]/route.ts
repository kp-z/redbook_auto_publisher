import { NextRequest, NextResponse } from "next/server"
import { getTask } from "@/lib/store"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const task = getTask(id)
  if (!task) return NextResponse.json({ error: "任务不存在" }, { status: 404 })
  return NextResponse.json(task)
}
