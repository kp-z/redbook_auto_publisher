import { NextResponse } from "next/server"

const XHS_BASE = process.env.XHS_API_BASE ?? "http://localhost:18060"

const MCP_TOOLS = [
  { name: "check_login_status", desc: "检查登录状态" },
  { name: "get_login_qrcode", desc: "获取登录二维码" },
  { name: "publish_content", desc: "发布图文笔记" },
  { name: "publish_video", desc: "发布视频笔记" },
  { name: "search_feeds", desc: "搜索笔记" },
  { name: "list_feeds", desc: "获取笔记列表" },
  { name: "get_feed_detail", desc: "获取笔记详情" },
  { name: "get_user_profile", desc: "获取用户资料" },
  { name: "post_comment", desc: "发表评论" },
  { name: "reply_comment", desc: "回复评论" },
  { name: "like_feed", desc: "点赞笔记" },
  { name: "favorite_feed", desc: "收藏笔记" },
]

function parseHostPort(base: string): { host: string; port: number } {
  try {
    const url = new URL(base)
    return { host: url.hostname, port: parseInt(url.port) || 18060 }
  } catch {
    return { host: "localhost", port: 18060 }
  }
}

export async function GET() {
  const { host, port } = parseHostPort(XHS_BASE)
  const mcpEndpoint = `${XHS_BASE}/mcp`

  try {
    const [healthRes, meRes] = await Promise.allSettled([
      fetch(`${XHS_BASE}/health`, { cache: "no-store", signal: AbortSignal.timeout(3000) }),
      fetch(`${XHS_BASE}/api/v1/user/me`, { cache: "no-store", signal: AbortSignal.timeout(3000) }),
    ])

    const healthy =
      healthRes.status === "fulfilled" && healthRes.value.ok

    let loggedIn = false
    let user = { nickname: "", avatar: "" }
    if (meRes.status === "fulfilled" && meRes.value.ok) {
      const j = await meRes.value.json()
      const info = j?.data?.data?.userBasicInfo ?? {}
      user = { nickname: info.nickname ?? "", avatar: info.images ?? "" }
      loggedIn = !!info.nickname
    }

    return NextResponse.json({
      host,
      port,
      mcpEndpoint,
      healthy,
      loggedIn,
      user,
      tools: MCP_TOOLS,
    })
  } catch {
    return NextResponse.json({
      host,
      port,
      mcpEndpoint,
      healthy: false,
      loggedIn: false,
      user: { nickname: "", avatar: "" },
      tools: MCP_TOOLS,
    })
  }
}
