"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, User, Wrench, RefreshCw, ChevronDown, ChevronRight } from "lucide-react"

interface McpStatus {
  host: string
  port: number
  mcpEndpoint: string
  healthy: boolean
  loggedIn: boolean
  user: { nickname: string; avatar: string }
}

interface Param {
  field: string
  required: boolean
  desc: string
}

interface ReturnField {
  field: string
  desc: string
}

interface ToolDef {
  name: string
  desc: string
  readonly: boolean
  params: Param[]
  returns: ReturnField[]
}

const TOOLS: ToolDef[] = [
  {
    name: "check_login_status",
    desc: "检查小红书登录状态",
    readonly: true,
    params: [],
    returns: [
      { field: "is_logged_in", desc: "是否已登录" },
      { field: "username", desc: "已登录的用户名" },
    ],
  },
  {
    name: "get_login_qrcode",
    desc: "获取登录二维码（返回 Base64 图片和超时时间）",
    readonly: true,
    params: [],
    returns: [
      { field: "image (Base64)", desc: "二维码图片（Base64 编码）" },
      { field: "expires_at", desc: "二维码超时时间" },
    ],
  },
  {
    name: "delete_cookies",
    desc: "删除 cookies 文件，重置登录状态。删除后需要重新登录",
    readonly: false,
    params: [],
    returns: [{ field: "result", desc: "操作结果文本" }],
  },
  {
    name: "publish_content",
    desc: "发布小红书图文内容",
    readonly: false,
    params: [
      { field: "title", required: true, desc: "标题（最多 20 个中文字或英文单词）" },
      { field: "content", required: true, desc: "正文内容（不含话题标签）" },
      { field: "images[]", required: true, desc: "图片路径列表（HTTP/HTTPS 链接或本地绝对路径）" },
      { field: "tags[]", required: false, desc: "话题标签列表，如 [美食, 旅行]" },
      { field: "schedule_at", required: false, desc: "定时发布时间，ISO8601 格式，支持 1 小时至 14 天内" },
      { field: "is_original", required: false, desc: "是否声明原创" },
      { field: "visibility", required: false, desc: "可见范围：公开可见 / 仅自己可见 / 仅互关好友可见" },
      { field: "products[]", required: false, desc: "带货商品关键词列表" },
    ],
    returns: [{ field: "result", desc: "发布结果文本（含笔记链接）" }],
  },
  {
    name: "publish_with_video",
    desc: "发布小红书视频内容（仅支持本地单个视频文件）",
    readonly: false,
    params: [
      { field: "title", required: true, desc: "标题（最多 20 个中文字或英文单词）" },
      { field: "content", required: true, desc: "正文内容（不含话题标签）" },
      { field: "video", required: true, desc: "本地视频绝对路径（单个 .mp4 文件）" },
      { field: "tags[]", required: false, desc: "话题标签列表" },
      { field: "schedule_at", required: false, desc: "定时发布时间，ISO8601 格式" },
      { field: "visibility", required: false, desc: "可见范围：公开可见 / 仅自己可见 / 仅互关好友可见" },
      { field: "products[]", required: false, desc: "带货商品关键词列表" },
    ],
    returns: [{ field: "result", desc: "发布结果文本（含笔记链接）" }],
  },
  {
    name: "list_feeds",
    desc: "获取首页 Feeds 列表",
    readonly: true,
    params: [],
    returns: [
      { field: "feeds[].id", desc: "笔记 ID" },
      { field: "feeds[].xsecToken", desc: "访问令牌（用于后续查询详情/用户主页）" },
      { field: "feeds[].noteCard.displayTitle", desc: "笔记标题" },
      { field: "feeds[].noteCard.type", desc: "类型：normal（图文）/ video（视频）" },
      { field: "feeds[].noteCard.cover", desc: "封面图信息（URL、宽高）" },
      { field: "feeds[].noteCard.interactInfo.likedCount", desc: "点赞数" },
      { field: "feeds[].noteCard.user.userId", desc: "作者用户 ID" },
      { field: "feeds[].noteCard.user.nickname", desc: "作者昵称" },
    ],
  },
  {
    name: "search_feeds",
    desc: "搜索小红书内容（需要已登录）",
    readonly: true,
    params: [
      { field: "keyword", required: true, desc: "搜索关键词" },
      { field: "filters.sort_by", required: false, desc: "排序：综合 / 最新 / 最多点赞 / 最多评论 / 最多收藏" },
      { field: "filters.note_type", required: false, desc: "笔记类型：不限 / 视频 / 图文" },
      { field: "filters.publish_time", required: false, desc: "发布时间：不限 / 一天内 / 一周内 / 半年内" },
      { field: "filters.search_scope", required: false, desc: "搜索范围：不限 / 已看过 / 未看过 / 已关注" },
      { field: "filters.location", required: false, desc: "位置：不限 / 同城 / 附近" },
    ],
    returns: [
      { field: "feeds[].id", desc: "笔记 ID" },
      { field: "feeds[].xsecToken", desc: "访问令牌" },
      { field: "feeds[].noteCard.displayTitle", desc: "笔记标题" },
      { field: "feeds[].noteCard.type", desc: "类型：normal / video" },
      { field: "feeds[].noteCard.cover", desc: "封面图信息" },
      { field: "feeds[].noteCard.interactInfo.likedCount", desc: "点赞数" },
      { field: "feeds[].noteCard.user", desc: "作者信息（userId、nickname）" },
    ],
  },
  {
    name: "get_feed_detail",
    desc: "获取笔记详情，含内容、图片、作者、互动数据及评论列表",
    readonly: true,
    params: [
      { field: "feed_id", required: true, desc: "笔记 ID，从 Feed 列表获取" },
      { field: "xsec_token", required: true, desc: "访问令牌，从 Feed 列表获取" },
      { field: "load_all_comments", required: false, desc: "是否加载全部评论（默认 false，仅前 10 条）" },
      { field: "limit", required: false, desc: "加载评论数量上限（仅 load_all_comments=true 时生效，默认 20）" },
      { field: "click_more_replies", required: false, desc: "是否展开二级回复" },
      { field: "reply_limit", required: false, desc: "跳过回复数超过此值的评论（默认 10）" },
      { field: "scroll_speed", required: false, desc: "滚动速度：slow / normal / fast" },
    ],
    returns: [
      { field: "note.noteId", desc: "笔记 ID" },
      { field: "note.title", desc: "标题" },
      { field: "note.desc", desc: "正文内容" },
      { field: "note.type", desc: "类型：normal / video" },
      { field: "note.time", desc: "发布时间戳" },
      { field: "note.ipLocation", desc: "IP 属地" },
      { field: "note.user", desc: "作者信息（userId、nickname、avatar）" },
      { field: "note.interactInfo", desc: "互动数据：likedCount / collectedCount / commentCount / sharedCount" },
      { field: "note.imageList[]", desc: "图片列表（URL、宽高）" },
      { field: "comments.list[]", desc: "评论列表：content / likeCount / ipLocation / subComments[]" },
      { field: "comments.hasMore", desc: "是否有更多评论" },
    ],
  },
  {
    name: "user_profile",
    desc: "获取指定用户主页，返回基本信息、关注粉丝量及笔记列表",
    readonly: true,
    params: [
      { field: "user_id", required: true, desc: "用户 ID，从 Feed 列表的 noteCard.user.userId 获取" },
      { field: "xsec_token", required: true, desc: "访问令牌，从 Feed 列表的 xsecToken 获取" },
    ],
    returns: [
      { field: "userBasicInfo.nickname", desc: "昵称" },
      { field: "userBasicInfo.redId", desc: "小红书号" },
      { field: "userBasicInfo.desc", desc: "个人简介" },
      { field: "userBasicInfo.ipLocation", desc: "IP 属地" },
      { field: "userBasicInfo.gender", desc: "性别（0 未知 / 1 男 / 2 女）" },
      { field: "userBasicInfo.images", desc: "头像 URL（360px）" },
      { field: "userBasicInfo.imageb", desc: "头像 URL（540px 大图）" },
      { field: "interactions[].type", desc: "互动类型：follows / fans / interaction" },
      { field: "interactions[].name", desc: "显示名：关注 / 粉丝 / 获赞与收藏" },
      { field: "interactions[].count", desc: "数量" },
      { field: "feeds[]", desc: "该用户最近笔记列表（含 id、标题、类型、点赞数、封面图）" },
    ],
  },
  {
    name: "post_comment_to_feed",
    desc: "发表评论到小红书笔记",
    readonly: false,
    params: [
      { field: "feed_id", required: true, desc: "笔记 ID" },
      { field: "xsec_token", required: true, desc: "访问令牌" },
      { field: "content", required: true, desc: "评论内容" },
    ],
    returns: [{ field: "result", desc: "操作结果文本" }],
  },
  {
    name: "reply_comment_in_feed",
    desc: "回复小红书笔记下的指定评论",
    readonly: false,
    params: [
      { field: "feed_id", required: true, desc: "笔记 ID" },
      { field: "xsec_token", required: true, desc: "访问令牌" },
      { field: "comment_id", required: false, desc: "目标评论 ID（comment_id 和 user_id 至少填一个）" },
      { field: "user_id", required: false, desc: "目标评论的用户 ID" },
      { field: "content", required: true, desc: "回复内容" },
    ],
    returns: [{ field: "result", desc: "操作结果文本" }],
  },
  {
    name: "like_feed",
    desc: "为指定笔记点赞或取消点赞",
    readonly: false,
    params: [
      { field: "feed_id", required: true, desc: "笔记 ID" },
      { field: "xsec_token", required: true, desc: "访问令牌" },
      { field: "unlike", required: false, desc: "true 为取消点赞，false/不填为点赞" },
    ],
    returns: [{ field: "result", desc: "操作结果文本" }],
  },
  {
    name: "favorite_feed",
    desc: "收藏指定笔记或取消收藏",
    readonly: false,
    params: [
      { field: "feed_id", required: true, desc: "笔记 ID" },
      { field: "xsec_token", required: true, desc: "访问令牌" },
      { field: "unfavorite", required: false, desc: "true 为取消收藏，false/不填为收藏" },
    ],
    returns: [{ field: "result", desc: "操作结果文本" }],
  },
]

function ToolCard({ tool }: { tool: ToolDef }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className="mt-0.5 text-gray-400 shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">{tool.name}</span>
            <Badge
              variant={tool.readonly ? "secondary" : "outline"}
              className={`text-xs ${tool.readonly ? "" : "border-orange-300 text-orange-600"}`}
            >
              {tool.readonly ? "只读" : "写入"}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{tool.desc}</p>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t bg-gray-50/50 dark:bg-gray-800/20">
          {/* 输入参数 */}
          <div className="pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">输入参数</p>
            {tool.params.length === 0 ? (
              <p className="text-xs text-gray-400 italic">无需参数</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700/50">
                      <th className="text-left px-2 py-1.5 text-gray-600 dark:text-gray-400 font-medium w-1/3">字段</th>
                      <th className="text-center px-2 py-1.5 text-gray-600 dark:text-gray-400 font-medium w-12">必填</th>
                      <th className="text-left px-2 py-1.5 text-gray-600 dark:text-gray-400 font-medium">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tool.params.map((p, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-gray-700/50">
                        <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300">{p.field}</td>
                        <td className="px-2 py-1.5 text-center">
                          {p.required ? (
                            <span className="text-red-500 font-medium">✓</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-gray-500">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 返回数据 */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">返回数据</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <th className="text-left px-2 py-1.5 text-gray-600 dark:text-gray-400 font-medium w-1/3">字段</th>
                    <th className="text-left px-2 py-1.5 text-gray-600 dark:text-gray-400 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {tool.returns.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700/50">
                      <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300">{r.field}</td>
                      <td className="px-2 py-1.5 text-gray-500">{r.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function McpPage() {
  const [status, setStatus] = useState<McpStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch("/api/mcp-status")
      setStatus(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
      </div>
    )
  }

  if (!status) return null

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      {/* 顶部状态栏 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status.healthy ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="font-semibold text-sm">MCP Server</p>
                <p className="text-xs text-gray-500">{status.host}:{status.port}</p>
              </div>
              <Badge variant={status.healthy ? "default" : "destructive"} className="ml-2">
                {status.healthy ? "运行中" : "离线"}
              </Badge>
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              刷新
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 登录状态 + 端点 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <User className="w-4 h-4" />
              登录状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${status.loggedIn ? "bg-green-500" : "bg-red-400"}`} />
              <span className="font-semibold text-sm">{status.loggedIn ? "已登录" : "未登录"}</span>
            </div>
            {status.loggedIn && status.user.nickname && (
              <div className="flex items-center gap-2 mt-2">
                {status.user.avatar && (
                  <img src={status.user.avatar} alt={status.user.nickname} className="w-8 h-8 rounded-full object-cover" />
                )}
                <span className="text-sm text-gray-700">{status.user.nickname}</span>
              </div>
            )}
            {!status.loggedIn && <p className="text-xs text-gray-400 mt-1">请先扫码登录小红书</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">MCP 端点</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300 break-all">
              {status.mcpEndpoint}
            </p>
            <p className="text-xs text-gray-400 mt-2">支持 POST / GET · JSON 响应</p>
          </CardContent>
        </Card>
      </div>

      {/* 工具列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            可用工具
            <Badge variant="secondary" className="ml-1">{TOOLS.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
