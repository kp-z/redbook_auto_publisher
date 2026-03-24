"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const CRON_PRESETS = [
  { label: "每天早上 9 点", value: "0 9 * * *" },
  { label: "每天下午 3 点", value: "0 15 * * *" },
  { label: "每天晚上 8 点", value: "0 20 * * *" },
  { label: "每周一早上 9 点", value: "0 9 * * 1" },
  { label: "自定义", value: "custom" },
]

type TriggerType = "manual" | "cron" | "webhook"

export default function NewTaskPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [triggerType, setTriggerType] = useState<TriggerType>("manual")
  const [cronPreset, setCronPreset] = useState("0 9 * * *")
  const [customCron, setCustomCron] = useState("")
  const [topicPrompt, setTopicPrompt] = useState("")
  const [imageDir, setImageDir] = useState("")
  const [tags, setTags] = useState("")
  const [visibility, setVisibility] = useState("公开可见")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!name.trim()) { setError("请填写任务名称"); return }
    if (!topicPrompt.trim()) { setError("请填写内容主题"); return }
    if (!imageDir.trim()) { setError("请填写图片目录"); return }

    const cron = cronPreset === "custom" ? customCron : cronPreset
    setSaving(true)

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        trigger: {
          type: triggerType,
          ...(triggerType === "cron" ? { cron } : {}),
        },
        content: {
          topicPrompt: topicPrompt.trim(),
          imageDir: imageDir.trim(),
          tags: tags.split(/[,，\s]+/).filter(Boolean),
          visibility,
        },
        enabled: true,
      }),
    })

    setSaving(false)
    if (!res.ok) { setError("保存失败，请重试"); return }
    router.push("/")
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">新建任务</h1>
        <p className="text-gray-500 mt-1">配置一个新的自动发布任务</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">任务名称</Label>
              <Input
                id="name"
                placeholder="例：每日美食分享"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 触发方式 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">触发方式</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              {(["manual", "cron", "webhook"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTriggerType(t)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                    triggerType === t
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-red-300"
                  }`}
                >
                  {{ manual: "手动触发", cron: "定时触发", webhook: "Webhook" }[t]}
                </button>
              ))}
            </div>

            {triggerType === "cron" && (
              <div className="space-y-2">
                <Label>定时规则</Label>
                {CRON_PRESETS.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cron"
                      value={p.value}
                      checked={cronPreset === p.value}
                      onChange={() => setCronPreset(p.value)}
                      className="accent-red-500"
                    />
                    <span className="text-sm">{p.label}</span>
                    {p.value !== "custom" && (
                      <code className="text-xs text-gray-400">{p.value}</code>
                    )}
                  </label>
                ))}
                {cronPreset === "custom" && (
                  <Input
                    className="font-mono"
                    placeholder="例：0 9 * * 1-5"
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                  />
                )}
              </div>
            )}

            {triggerType === "webhook" && (
              <p className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                保存后会自动生成 Webhook URL，向该 URL 发送 POST 请求即可触发任务。
              </p>
            )}
          </CardContent>
        </Card>

        {/* 内容配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">内容配置</CardTitle>
            <CardDescription>配置 AI 生成内容的提示词和图片来源</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">内容主题（Claude 生成提示词）</Label>
              <Textarea
                id="prompt"
                rows={3}
                placeholder="例：今日值得尝试的一道家常菜，要突出简单快手、美味健康"
                value={topicPrompt}
                onChange={(e) => setTopicPrompt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageDir">图片目录（本地绝对路径）</Label>
              <Input
                id="imageDir"
                className="font-mono"
                placeholder="/Users/kp/Pictures/xhs-images"
                value={imageDir}
                onChange={(e) => setImageDir(e.target.value)}
              />
              <p className="text-xs text-gray-400">目录中的图片会随机选取一张作为配图</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">话题标签（可选，逗号分隔）</Label>
              <Input
                id="tags"
                placeholder="美食, 家常菜, 健康饮食"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>可见范围</Label>
              <div className="flex gap-4">
                {["公开可见", "仅自己可见", "仅互关好友可见"].map((v) => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="visibility"
                      value={v}
                      checked={visibility === v}
                      onChange={() => setVisibility(v)}
                      className="accent-red-500"
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700">
            {saving ? "保存中..." : "保存任务"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/")}>
            取消
          </Button>
        </div>
      </form>
    </div>
  )
}
