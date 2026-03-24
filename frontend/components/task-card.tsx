"use client"

import type { Task } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  FileText,
  Trash2,
  XCircle,
  Loader2,
  Pause,
  Play,
  Webhook,
  Hand,
} from "lucide-react"

interface TaskCardProps {
  task: Task
  isRunning?: boolean
  onToggle: (task: Task) => void
  onDelete: (task: Task) => void
  onRunNow: (task: Task) => void
  totalPosts?: number
}

export function TaskCard({ task, isRunning, onToggle, onDelete, onRunNow, totalPosts = 0 }: TaskCardProps) {
  // 从 task 数据推断展示状态
  const status = isRunning ? "running" : task.enabled ? "running" : task.lastStatus === "failed" ? "error" : "paused"

  const getStatusBadge = () => {
    if (isRunning) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          发布中
        </Badge>
      )
    }
    switch (status) {
      case "running":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            运行中
          </Badge>
        )
      case "paused":
        return (
          <Badge variant="outline" className="text-gray-500">
            <Pause className="w-3 h-3 mr-1" />
            已暂停
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
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
            <Clock className="w-3 h-3" />
            {task.trigger.cron}
          </span>
        )
      case "webhook":
        return (
          <span className="flex items-center gap-1 text-xs text-gray-400 font-mono truncate max-w-[180px]">
            <Webhook className="w-3 h-3 shrink-0" />
            /api/webhook/{task.trigger.webhookToken?.slice(0, 8)}...
          </span>
        )
      case "manual":
        return (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Hand className="w-3 h-3" />
            手动触发
          </span>
        )
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    return new Intl.DateTimeFormat("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr))
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          {/* 左侧：任务信息 */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={task.enabled}
                onCheckedChange={() => onToggle(task)}
                disabled={isRunning}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg truncate">{task.name}</h3>
                  {getStatusBadge()}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {getTriggerLabel()}
                  {task.lastRunAt && (
                    <span className="text-xs text-gray-400">上次: {formatDate(task.lastRunAt)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 提示词预览 */}
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
                {task.content.topicPrompt || "暂无提示词"}
              </p>
            </div>
          </div>

          {/* 右侧：统计和操作 */}
          <div className="flex items-center gap-6">
            <Separator orientation="vertical" className="h-16" />

            {/* 统计 */}
            <div className="text-center min-w-[80px]">
              <div className="text-3xl font-bold text-red-600">{totalPosts}</div>
              <div className="text-xs text-gray-500 mt-1">已发布</div>
            </div>

            <Separator orientation="vertical" className="h-16" />

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRunNow(task)}
                disabled={isRunning}
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-1" />
                )}
                {isRunning ? "发布中" : "立即执行"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(task)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
