"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, FolderGit2 } from "lucide-react"
import type { Task, ProjectConfig } from "@/lib/store"
import { cronToFields, fieldsToCron, humanizeCron, type CronVisualFields } from "@/lib/cron-humanize"

const WEEKDAY_OPTIONS = [
  { label: "周一", value: "1" },
  { label: "周二", value: "2" },
  { label: "周三", value: "3" },
  { label: "周四", value: "4" },
  { label: "周五", value: "5" },
  { label: "周六", value: "6" },
  { label: "周日", value: "0" },
]

type TriggerType = "manual" | "cron" | "webhook"

export interface TaskPayload {
  name: string
  trigger: { type: TriggerType; cron?: string }
  content: {
    topicPrompt: string
    imageDir: string
    tags: string[]
    visibility: string
    projects?: ProjectConfig[]
  }
  enabled: boolean
}

interface TaskFormProps {
  initialData?: Task
  onSave: (data: TaskPayload) => Promise<void>
}

function isDevDailyTask(task?: Task): boolean {
  return task?.id?.startsWith("__dev_daily") ?? false
}

export function TaskForm({ initialData, onSave }: TaskFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState(initialData?.name ?? "")
  const [triggerType, setTriggerType] = useState<TriggerType>(initialData?.trigger.type ?? "manual")
  const [cronFields, setCronFields] = useState<CronVisualFields>(() => cronToFields(initialData?.trigger.cron))
  const [topicPrompt, setTopicPrompt] = useState(initialData?.content.topicPrompt ?? "")
  const [imageDir, setImageDir] = useState(initialData?.content.imageDir ?? "")
  const [tags, setTags] = useState(initialData?.content.tags.join(", ") ?? "")
  const [visibility, setVisibility] = useState<string>(initialData?.content.visibility ?? "公开可见")

  const isDevDaily = isDevDailyTask(initialData)
  const [projects, setProjects] = useState<ProjectConfig[]>(
    initialData?.content.projects ?? []
  )

  function addProject() {
    setProjects((prev) => [...prev, { name: "", repoPath: "", frontendUrl: "" }])
  }

  function removeProject(index: number) {
    setProjects((prev) => prev.filter((_, i) => i !== index))
  }

  function updateProject(index: number, field: keyof ProjectConfig, value: string) {
    setProjects((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!name.trim()) { setError("请填写任务名称"); return }
    if (!topicPrompt.trim()) { setError("请填写内容主题"); return }
    const isSystemTask = initialData?.id?.startsWith("__") ?? false
    if (!isSystemTask && !imageDir.trim()) { setError("请填写图片目录"); return }

    if (isDevDaily) {
      const validProjects = projects.filter((p) => p.name.trim() && p.repoPath.trim())
      if (validProjects.length === 0) { setError("请至少配置一个扫描项目"); return }
    }

    const cron = triggerType === "cron" ? fieldsToCron(cronFields) : undefined
    if (triggerType === "cron" && !cron) { setError("请填写有效的发布时间规则"); return }

    setSaving(true)
    try {
      const validProjects = projects.filter((p) => p.name.trim() && p.repoPath.trim())
      await onSave({
        name: name.trim(),
        trigger: { type: triggerType, ...(triggerType === "cron" ? { cron } : {}) },
        content: {
          topicPrompt: topicPrompt.trim(),
          imageDir: imageDir.trim(),
          tags: tags.split(/[,，\s]+/).filter(Boolean),
          visibility,
          ...(isDevDaily ? { projects: validProjects } : {}),
        },
        enabled: initialData?.enabled ?? true,
      })
    } catch {
      setError("保存失败，请重试")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 & 触发方式 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">任务名称</Label>
              <Input
                id="name"
                placeholder="例：每日美食分享"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>触发方式</Label>
              <div className="flex gap-2 items-center h-9">
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
            </div>
          </div>

          <div>
            {triggerType === "cron" && (
              <div className="space-y-3">
                <Label>发布时间</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">频率</Label>
                    <select
                      value={cronFields.mode}
                      onChange={(e) => setCronFields((prev) => ({ ...prev, mode: e.target.value as CronVisualFields["mode"] }))}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="daily">每天</option>
                      <option value="weekly">每周</option>
                      <option value="monthly">每月</option>
                      <option value="custom">自定义</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">时间（24h）</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        value={cronFields.hour}
                        onChange={(e) => setCronFields((prev) => ({ ...prev, hour: e.target.value }))}
                      />
                      <span className="text-sm text-gray-500">:</span>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={cronFields.minute}
                        onChange={(e) => setCronFields((prev) => ({ ...prev, minute: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {cronFields.mode === "weekly" && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">星期</Label>
                    <select
                      value={cronFields.weekday}
                      onChange={(e) => setCronFields((prev) => ({ ...prev, weekday: e.target.value }))}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      {WEEKDAY_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {cronFields.mode === "monthly" && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">每月日期</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={cronFields.monthday}
                      onChange={(e) => setCronFields((prev) => ({ ...prev, monthday: e.target.value }))}
                    />
                  </div>
                )}

                {cronFields.mode === "custom" && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Cron 表达式</Label>
                    <Input
                      className="font-mono"
                      placeholder="例：0 9 * * 1-5"
                      value={cronFields.custom}
                      onChange={(e) => setCronFields((prev) => ({ ...prev, custom: e.target.value }))}
                    />
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  预览：{humanizeCron(fieldsToCron(cronFields) || cronFields.custom || "—")}
                </p>
              </div>
            )}

            {triggerType === "webhook" && (
              <p className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                保存后会自动生成 Webhook URL，向该 URL 发送 POST 请求即可触发任务。
              </p>
            )}
          </div>

        </CardContent>
      </Card>

      {/* 工作区配置 */}
      {isDevDaily && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderGit2 className="h-4 w-4" />
              工作区
            </CardTitle>
            <CardDescription>指定任务可以访问的本地项目目录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.map((project, index) => (
              <div key={index} className="relative rounded-lg border p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">项目 {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeProject(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="删除项目"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">项目名称</Label>
                    <Input
                      placeholder="Claude Manager"
                      value={project.name}
                      onChange={(e) => updateProject(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">项目目录（绝对路径）</Label>
                    <Input
                      className="font-mono text-sm"
                      placeholder="/Users/kp/项目/Proj/my-project"
                      value={project.repoPath}
                      onChange={(e) => updateProject(index, "repoPath", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProject}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-1" />
              添加项目
            </Button>

            {projects.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg">
                未配置工作区时，将使用默认项目目录（Claude Manager、StockRadar、小红书 MCP）
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 内容配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">内容配置</CardTitle>
          <CardDescription>配置 AI 生成内容的提示词和图片来源</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">
              {isDevDaily ? "AI 生成提示词（支持 {{commits}} 占位符）" : "内容主题（Claude 生成提示词）"}
            </Label>
            <Textarea
              id="prompt"
              rows={12}
              placeholder={isDevDaily
                ? "描述你想要的日报风格，AI 会根据 git commit 自动生成内容。\n使用 {{commits}} 表示提交记录的插入位置。"
                : "例：今日值得尝试的一道家常菜，要突出简单快手、美味健康"
              }
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
            />
            {isDevDaily && !topicPrompt.includes("{{commits}}") && topicPrompt.trim() && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                提示词中未包含 {"{{commits}}"}，系统会自动在末尾追加 commit 记录
              </p>
            )}
          </div>

          {!isDevDaily && (
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
          )}

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
  )
}
