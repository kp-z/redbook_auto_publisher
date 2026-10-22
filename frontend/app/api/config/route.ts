import { NextRequest, NextResponse } from "next/server"
import { getConfig, saveConfig } from "@/lib/config-store"

export async function GET() {
  const config = getConfig()
  // 返回时隐藏敏感信息，只显示是否已配置
  return NextResponse.json({
    anthropicApiKey: config.anthropicApiKey ? "已配置" : "",
    replicateApiToken: config.replicateApiToken ? "已配置" : "",
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const updated = saveConfig(body)
  return NextResponse.json({
    anthropicApiKey: updated.anthropicApiKey ? "已配置" : "",
    replicateApiToken: updated.replicateApiToken ? "已配置" : "",
  })
}
