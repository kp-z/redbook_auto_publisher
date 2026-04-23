"use client"

import Link from "next/link"
import type { Task } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Clock,
  Folder,
  Globe,
  Lock,
  Users,
  Trash2,
  XCircle,
  Loader2,
  Pause,
  Play,
  Webhook,
  Hand,
  Pencil,
} from "lucide-react"
import { humanizeCron } from "@/lib/cron-humanize"

const PROFILE_SYNC_TASK_ID = "__profile_sync__"

// 空值占位符
const DASH = <span className="text-xs text-gray-300 dark:text-gray-600">—</span>

interface TaskCardProps {
  task: Task
  isRunning?: boolean
  onToggle: (task: Task) => void
  onDelete: (task: Task) => void
  onRunNow: (task: Task) => void
  totalPosts?: number
}

export function TaskCard({ task, isRunning, onToggle, onDelete, onRunNow, totalPosts = 0 }: TaskCardProps) {
  const isProfileSync = task.id === PROFILE_SYNC_TASK_ID
  const status = isRunning ? "running" : task.enabled ? "running" : task.lastStatus === "failed" ? "error" : "paused"
  const getSwitchClassByStatus = () => {
    switch (status) {
      case "running":
        return "data-[state=checked]:bg-green-500 dark:data-[state=checked]:bg-green-500"
      case "paused":
        return "data-[state=unchecked]:bg-yellow-400 dark:data-[state=unchecked]:bg-yellow-500"
      case "error":
        return "data-[state=unchecked]:bg-red-500 dark:data-[state=unchecked]:bg-red-500"
    }
  }

  const getStatusBadge = () => {
    if (isRunning) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 shrink-0">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          {isProfileSync ? "同步中" : "发布中"}
        </Badge>
      )
    }
    switch (status) {
      case "running":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 shrink-0">
            运行中
          </Badge>
        )
      case "paused":
        return (
          <Badge variant="outline" className="text-gray-500 shrink-0">
            <Pause className="w-3 h-3 mr-1" />
            已暂停
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 shrink-0">
            <XCircle className="w-3 h-3 mr-1" />
            错误
          </Badge>
        )
    }
  }

  const getTriggerLabel = () => {
    switch (task.trigger.type) {
      case "cron":
        return (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">{humanizeCron(task.trigger.cron ?? "")}</span>
          </span>
        )
      case "webhook":
        return (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Webhook className="w-3 h-3 shrink-0" />
            <span className="font-mono truncate">/webhook/{task.trigger.webhookToken?.slice(0, 6)}…</span>
          </span>
        )
      case "manual":
        return (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Hand className="w-3 h-3 shrink-0" />
            手动触发
          </span>
        )
    }
  }

  const getVisibilityLabel = () => {
    switch (task.content.visibility) {
      case "公开可见":
        return (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Globe className="w-3 h-3 text-blue-400" />
            公开
          </span>
        )
      case "仅自己可见":
        return (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Lock className="w-3 h-3 text-gray-400" />
            仅自己
          </span>
        )
      case "仅互关好友可见":
        return (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="w-3 h-3 text-purple-400" />
            互关
          </span>
        )
      default:
        return DASH
    }
  }

  const getImageDirLabel = () => {
    if (!task.content.imageDir) return DASH
    const parts = task.content.imageDir.replace(/\\/g, "/").split("/").filter(Boolean)
    const name = parts[parts.length - 1] ?? task.content.imageDir
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <Folder className="w-3 h-3 text-yellow-500 shrink-0" />
        <span className="truncate max-w-[80px]">{name}</span>
      </span>
    )
  }

  const getTagsLabel = () => {
    const tags = task.content.tags
    if (!tags || tags.length === 0) return <span className="text-xs text-gray-400">无</span>
    const visible = tags.slice(0, 2)
    const extra = tags.length - 2
    const summary = `${visible.join(" / ")}${extra > 0 ? ` +${extra}` : ""}`
    return (
      <span className="max-w-[112px] truncate text-xs text-gray-500">{summary}</span>
    )
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    return new Intl.DateTimeFormat("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr))
  }

  const getLastRunLabel = () => {
    if (!task.lastRunAt) return DASH
    const dot =
      task.lastStatus === "success"
        ? <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        : task.lastStatus === "failed"
        ? <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        : <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
    return (
      <div className="flex items-center gap-1.5">
        {dot}
        <span className="max-w-[92px] truncate text-xs text-gray-400">{formatDate(task.lastRunAt)}</span>
      </div>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      {/* last:pb-0 覆盖 CardContent 默认 [&:last-child]:pb-6，避免与内层 py 叠出底部多一块空白 */}
      <CardContent className="!p-0 last:!pb-0">
        <div className="grid min-w-0 items-center gap-x-2 gap-y-2 px-4 py-3 md:grid-cols-[32px_minmax(130px,2fr)_68px_56px_minmax(68px,0.9fr)_56px_minmax(90px,1fr)] lg:grid-cols-[32px_minmax(170px,2.2fr)_68px_56px_minmax(72px,0.9fr)_minmax(84px,1fr)_minmax(96px,1fr)_56px_minmax(108px,1.2fr)]">
          {/* 开关 */}
          <div className="w-9 shrink-0 flex items-center">
            <Switch
              checked={task.enabled}
              onCheckedChange={() => onToggle(task)}
              disabled={isRunning}
              className={getSwitchClassByStatus()}
            />
          </div>

          {/* 任务名 + 触发方式 */}
          <div className="min-w-0">
            <div className="min-w-0">
              <span className="font-medium text-sm truncate block">{task.name}</span>
            </div>
            <div className="mt-0.5 truncate">{getTriggerLabel()}</div>
          </div>

          {/* 状态 */}
          <div className="flex h-full min-w-0 items-center justify-center">
            {getStatusBadge()}
          </div>

          {/* 可见性 */}
          <div className="hidden h-full min-w-0 items-center justify-center md:flex">
            {isProfileSync ? DASH : getVisibilityLabel()}
          </div>

          {/* 图片目录 */}
          <div className="hidden h-full min-w-0 items-center justify-center md:flex">
            {isProfileSync ? DASH : getImageDirLabel()}
          </div>

          {/* 标签 */}
          <div className="hidden h-full min-w-0 items-center justify-center lg:flex">
            {isProfileSync ? DASH : getTagsLabel()}
          </div>

          {/* 上次运行 */}
          <div className="hidden h-full min-w-0 items-center justify-center lg:flex">
            {getLastRunLabel()}
          </div>

          {/* 发布数 */}
          <div className="flex h-full min-w-0 flex-col items-center justify-center text-center">
            <div className="text-base font-bold text-red-600">{totalPosts}</div>
            <div className="text-xs whitespace-nowrap text-gray-400">
              {isProfileSync ? "已同步" : "已发布"}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex h-full min-w-0 items-center justify-end gap-1 overflow-hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRunNow(task)}
              disabled={isRunning}
              className="h-7 shrink-0 px-2"
            >
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span className="ml-1 hidden xl:inline text-xs">
                {isRunning ? (isProfileSync ? "同步中" : "发布中") : (isProfileSync ? "立即同步" : "立即执行")}
              </span>
            </Button>
            <Link href={`/tasks/${task.id}/edit`} className="shrink-0">
              <Button variant="outline" size="sm" className="h-7 w-7 shrink-0 p-0">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(task)}
              className="h-7 w-7 shrink-0 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
