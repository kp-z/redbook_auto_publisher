import { NextRequest, NextResponse } from "next/server"
import { runImageAgent } from "@/lib/image-agent"
import type Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  const { message, history = [] } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 })
  }

  try {
    const { messages, updatedHistory } = await runImageAgent(
      message,
      history as Anthropic.MessageParam[]
    )
    return NextResponse.json({ messages, history: updatedHistory })
  } catch (err) {
    console.error("Image agent error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "生成失败，请重试" },
      { status: 500 }
    )
  }
}
