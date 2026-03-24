"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { HistoryRecord } from "@/lib/store"

const STATUS_CONFIG = {
  success: { label: "成功", className: "bg-green-500/10 text-green-700 border-green-500/20" },
  failed: { label: "失败", className: "bg-red-500/10 text-red-700 border-red-500/20" },
  running: { label: "运行中", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
}

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        setRecords(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">发布历史</h1>
        <p className="text-gray-500 mt-1">查看所有任务的发布记录</p>
      </div>

      {records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-lg">还没有发布记录</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((r) => {
            const statusConfig = STATUS_CONFIG[r.status]
            return (
              <Card key={r.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium truncate">{r.taskName}</span>
                        <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                      </div>
                      {r.title && (
                        <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                          📌 {r.title}
                        </p>
                      )}
                      {r.content && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.content}</p>
                      )}
                      {r.error && (
                        <p className="text-xs text-red-500 mt-1 truncate">❌ {r.error}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                      {new Date(r.runAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
