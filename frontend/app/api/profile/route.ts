import { NextResponse } from "next/server"
import { getProfileCache } from "@/lib/store"

const MCP_BASE = process.env.MCP_BASE_URL ?? "http://localhost:18060"

// GET /api/profile — 优先返回本地缓存，缓存不存在时实时拉取
export async function GET() {
  // 优先读本地缓存（由每日定时任务维护）
  const cache = getProfileCache()
  if (cache) {
    return NextResponse.json({ data: { data: cache }, cached: true, updatedAt: cache.updatedAt })
  }

  // 缓存不存在时实时拉取
  try {
    const res = await fetch(`${MCP_BASE}/api/v1/user/me`, { cache: "no-store" })
    if (!res.ok) {
      return NextResponse.json({ error: "未登录或获取失败" }, { status: res.status })
    }
    const json = await res.json()
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ error: "MCP 服务未启动" }, { status: 503 })
  }
}
