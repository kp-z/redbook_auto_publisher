"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityCalendar } from "@/components/activity-calendar"
import { StatusOverview } from "@/components/status-overview"
import { TaskCard } from "@/components/task-card"
import type { Task, HistoryRecord } from "@/lib/store"

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [runningId, setRunningId] = useState<string | null>(null)

  async function fetchTasks() {
    const res = await fetch("/api/tasks")
    setTasks(await res.json())
  }

  async function fetchHistory() {
    const res = await fetch("/api/history")
    setHistory(await res.json())
  }

  useEffect(() => {
    Promise.all([fetchTasks(), fetchHistory()]).finally(() => setLoading(false))
  }, [])

  async function toggleEnabled(task: Task) {
    await fetch(`/api/tasks/${task.id}/run`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !task.enabled }),
    })
    fetchTasks()
    toast.success(task.enabled ? "任务已暂停" : "任务已启动", {
      description: task.enabled ? `"${task.name}" 已停止运行` : `"${task.name}" 将按计划自动发布`,
    })
  }

  async function runNow(task: Task) {
    setRunningId(task.id)
    const res = await fetch(`/api/tasks/${task.id}/run`, { method: "POST" })
    const json = await res.json()
    setRunningId(null)
    if (json.success) {
      toast.success("发布成功！", { description: `"${task.name}" 已成功发布` })
    } else {
      toast.error("发布失败", { description: json.error ?? "请检查配置后重试" })
    }
    await Promise.all([fetchTasks(), fetchHistory()])
  }

  async function deleteTask(task: Task) {
    if (!confirm(`确认删除任务"${task.name}"？`)) return
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id }),
    })
    fetchTasks()
    toast.success("任务已删除", { description: `"${task.name}" 已从任务列表中移除` })
  }

  // 从历史记录生成热力图数据
  const activityData = (() => {
    const counts: Record<string, number> = {}
    for (const record of history) {
      if (record.status === "success") {
        const date = record.runAt.split("T")[0]
        counts[date] = (counts[date] || 0) + 1
      }
    }
    return Object.entries(counts).map(([date, count]) => ({ date, count }))
  })()

  // 从历史记录统计每个任务的发布数
  const taskPostCounts = (() => {
    const counts: Record<string, number> = {}
    for (const record of history) {
      if (record.status === "success") {
        counts[record.taskId] = (counts[record.taskId] || 0) + 1
      }
    }
    return counts
  })()

  const activeTasks = tasks.filter((t) => t.enabled).length
  const totalPosts = history.filter((r) => r.status === "success").length

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 桌面端标题栏 */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-art)" }}>小红书自动发布</h1>
          <p className="text-gray-500 mt-1">AI 驱动的内容管理平台</p>
        </div>
        <Link
          href="/tasks/new"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建任务
        </Link>
      </div>

      {/* 统计概览 + 热力图 */}
      <div className="grid gap-4 lg:grid-cols-[2.4fr_1fr_1fr]">
        <Card className="lg:row-span-2 flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-sm font-medium text-gray-500">发布活动</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ActivityCalendar data={activityData} compact={true} />
          </CardContent>
        </Card>

        <StatusOverview
          totalPosts={totalPosts}
          activeTasks={activeTasks}
          totalTasks={tasks.length}
        />
      </div>

      {/* 任务列表 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-art)" }}>自动发布任务</h2>
            <p className="text-gray-500 text-sm mt-1">管理和监控所有自动发布任务</p>
          </div>
        </div>

        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isRunning={runningId === task.id}
                totalPosts={taskPostCounts[task.id] || 0}
                onToggle={toggleEnabled}
                onDelete={deleteTask}
                onRunNow={runNow}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardHeader className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <CardTitle>还没有任务</CardTitle>
              <CardDescription className="mt-2">
                创建您的第一个自动发布任务，让 AI 帮您管理内容
              </CardDescription>
              <div className="mt-6">
                <Link
                  href="/tasks/new"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  创建第一个任务
                </Link>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}
