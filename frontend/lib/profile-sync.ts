import { saveProfileCache } from "./store"

const MCP_BASE = process.env.MCP_BASE_URL ?? "http://localhost:18060"

export async function syncProfile(): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${MCP_BASE}/api/v1/user/me`, { cache: "no-store" })
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
    const json = await res.json()
    const interactions = json.data?.data?.interactions ?? []
    const rawFeeds = json.data?.data?.feeds ?? []
    const feeds = rawFeeds.map((f: any) => ({
      id: f.id,
      title: f.noteCard?.displayTitle ?? "",
      type: f.noteCard?.type ?? "",
      liked_count: parseInt(f.noteCard?.interactInfo?.likedCount ?? "0", 10) || 0,
      cover: f.noteCard?.cover?.urlDefault ?? f.noteCard?.cover?.urlPre ?? "",
    }))
    if (interactions.length > 0) {
      saveProfileCache({ interactions, feeds })
      console.log("[profile-sync] 已更新 profile 缓存:", new Date().toLocaleString("zh-CN"))
    }
    return { success: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.warn("[profile-sync] 同步失败:", error)
    return { success: false, error }
  }
}
