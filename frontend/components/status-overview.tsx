"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, TrendingUp, Users, Heart, FileText, Footprints, Sparkles, ChevronRight, X } from "lucide-react"

interface FeedItem {
  id: string
  title: string
  type: string
  liked_count: number
  cover?: string
}

interface StatusOverviewProps {
  totalPosts: number
  activeTasks: number
  totalTasks: number
  stats?: {
    followers: number
    follows: number
    interaction: number
    feeds?: FeedItem[]
  }
}

function formatNum(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function StatusOverview({
  totalPosts,
  activeTasks,
  totalTasks,
  stats = { followers: 0, follows: 0, interaction: 0, feeds: [] },
}: StatusOverviewProps) {
  const [showFeeds, setShowFeeds] = useState(false)
  const taskProgress = totalTasks > 0 ? (activeTasks / totalTasks) * 100 : 0
  const feeds = stats.feeds ?? []

  return (
    <>
      {/* 总发布数 */}
      <Card className="min-h-0 h-full overflow-hidden">
        <CardHeader className="shrink-0 pt-4 pb-2 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">总发布数</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 px-4 pb-4 flex flex-col justify-center">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-red-600">{totalPosts}</span>
              <span className="text-xs text-gray-400">篇</span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              持续增长中
            </p>
            {feeds.length > 0 && (
              <button
                onClick={() => setShowFeeds(true)}
                className="pt-0.5 text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5 transition-colors"
              >
                <FileText className="w-3 h-3" />
                查看最近笔记
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 运行任务 */}
      <Card className="min-h-0 h-full overflow-hidden">
        <CardHeader className="shrink-0 pt-4 pb-2 px-4">
          <CardTitle className="text-sm font-medium text-gray-500">运行任务</CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 px-4 pb-4 flex flex-col justify-center">
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{activeTasks}</span>
              <span className="text-base text-gray-400">/ {totalTasks}</span>
            </div>
            <div className="space-y-1">
              <Progress value={taskProgress} className="h-1.5" />
              <p className="text-xs text-gray-500">{activeTasks} 个任务正在运行</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 粉丝 & 关注 */}
      <Card className="min-h-0 h-full overflow-hidden">
        <CardHeader className="shrink-0 pt-4 pb-2 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">粉丝 & 关注</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 px-4 pb-4 flex flex-col justify-center">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{formatNum(stats.followers)}</span>
              <span className="text-xs text-gray-400">粉丝</span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Footprints className="w-3 h-3 text-purple-400" />
              关注 {formatNum(stats.follows)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 获赞与收藏 */}
      <Card className="min-h-0 h-full overflow-hidden">
        <CardHeader className="shrink-0 pt-4 pb-2 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">获赞与收藏</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-red-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 px-4 pb-4 flex flex-col justify-center">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{formatNum(stats.interaction)}</span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              来自小红书互动
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 最近笔记滑出面板 */}
      {showFeeds && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowFeeds(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-sm">最近笔记</h2>
                <Badge variant="outline" className="text-xs">{feeds.length}</Badge>
              </div>
              <button
                onClick={() => setShowFeeds(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {feeds.map((feed) => (
                <div key={feed.id} className="px-5 py-3.5">
                  <p className="text-sm font-medium leading-snug line-clamp-2 text-gray-800 dark:text-gray-200">
                    {feed.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">
                      {feed.type === "video" ? "视频" : "图文"}
                    </Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Heart className="w-3 h-3 text-red-400" />
                      {formatNum(feed.liked_count)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
