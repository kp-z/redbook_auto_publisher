"use client"

import { useRouter } from "next/navigation"
import { TaskForm, type TaskPayload } from "@/components/task-form"

export default function NewTaskPage() {
  const router = useRouter()

  async function handleSave(data: TaskPayload) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("保存失败")
    router.push("/")
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">新建任务</h1>
        <p className="text-gray-500 mt-1">配置一个新的自动发布任务</p>
      </div>
      <TaskForm onSave={handleSave} />
    </div>
  )
}
