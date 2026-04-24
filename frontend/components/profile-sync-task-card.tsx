"use client"

import { Badge } from "@/components/ui/badge"
import { Clock, RefreshCw } from "lucide-react"

interface ProfileSyncTaskCardProps {
  updatedAt?: string
}

export function ProfileSyncTaskCard({ updatedAt }: ProfileSyncTaskCardProps) {
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
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* 开关占位 + 任务名 + 状态 Badge */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-5" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">Profile 数据同步</span>
            {updatedAt ? (
              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                已同步
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                待同步
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <RefreshCw className="w-3 h-3 text-gray-300 shrink-0" />
            <p className="text-xs text-gray-400 truncate max-w-[200px]">
              定时获取粉丝数、获赞与收藏数，更新 Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* 触发方式 */}
      <div className="min-w-[140px] hidden md:block">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          每天 20:00
        </span>
      </div>

      {/* 上次运行 */}
      <div className="min-w-[100px] hidden lg:block">
        <span className="text-xs text-gray-400">{formatDate(updatedAt)}</span>
      </div>

      {/* 已发布数占位 */}
      <div className="min-w-[60px] hidden sm:block" />

      {/* 操作按钮占位（对齐 TaskCard） */}
      <div className="flex gap-2 shrink-0 invisible">
        <div className="h-8 w-20" />
        <div className="h-8 w-8" />
      </div>
    </div>
  )
}
