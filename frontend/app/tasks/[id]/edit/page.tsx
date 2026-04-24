"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { TaskForm, type TaskPayload } from "@/components/task-form"
import type { Task } from "@/lib/store"

export default function EditTaskPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tasks/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.push("/")
        else setTask(data)
      })
      .finally(() => setLoading(false))
  }, [id, router])

  async function handleSave(data: TaskPayload) {
    const res = await fetch(`/api/tasks/${id}/run`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("保存失败")
    router.push("/")
  }

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
        <h1 className="text-3xl font-bold">编辑任务</h1>
        <p className="text-gray-500 mt-1">修改任务配置</p>
      </div>
      {task && <TaskForm initialData={task} onSave={handleSave} />}
    </div>
  )
}
