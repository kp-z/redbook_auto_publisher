"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Save, CheckCircle2, AlertCircle } from "lucide-react"

export default function SettingsPage() {
  const [anthropicApiKey, setAnthropicApiKey] = useState("")
  const [replicateApiToken, setReplicateApiToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.anthropicApiKey === "已配置") setAnthropicApiKey("••••••••")
        if (data.replicateApiToken === "已配置") setReplicateApiToken("••••••••")
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload: Record<string, string> = {}
      // 只有用户修改过的字段才提交（不是占位符）
      if (anthropicApiKey && anthropicApiKey !== "••••••••") {
        payload.anthropicApiKey = anthropicApiKey
      }
      if (replicateApiToken && replicateApiToken !== "••••••••") {
        payload.replicateApiToken = replicateApiToken
      }

      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("保存失败")
      toast.success("配置已保存")
      setTestResult(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败")
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "test connection" }),
      })

      if (res.ok) {
        setTestResult("success")
        toast.success("API Key 验证成功")
      } else {
        setTestResult("error")
        const data = await res.json()
        toast.error(data.error || "API Key 验证失败")
      }
    } catch (err) {
      setTestResult("error")
      toast.error("连接失败")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">设置</h1>
        <p className="text-muted-foreground">配置 API Key 和其他系统参数</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API 配置</CardTitle>
          <CardDescription>配置第三方服务的 API Key，用于 AI 内容生成和图片生成</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Anthropic API Key */}
          <div className="space-y-2">
            <Label htmlFor="anthropic-key">Anthropic API Key</Label>
            <Input
              id="anthropic-key"
              type="password"
              placeholder="sk-ant-..."
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              用于 Claude AI 生成小红书内容。获取地址：
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:underline ml-1"
              >
                Anthropic Console
              </a>
            </p>
          </div>

          {/* Replicate API Token */}
          <div className="space-y-2">
            <Label htmlFor="replicate-token">Replicate API Token</Label>
            <Input
              id="replicate-token"
              type="password"
              placeholder="r8_..."
              value={replicateApiToken}
              onChange={(e) => setReplicateApiToken(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              用于 AI 图片生成。获取地址：
              <a
                href="https://replicate.com/account/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:underline ml-1"
              >
                Replicate Account
              </a>
            </p>
          </div>

          {/* 测试结果提示 */}
          {testResult === "success" && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>API Key 验证成功</span>
            </div>
          )}
          {testResult === "error" && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>API Key 验证失败，请检查配置</span>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {loading ? "保存中..." : "保存配置"}
            </Button>
            <Button onClick={handleTest} disabled={testing} variant="outline">
              {testing ? "测试中..." : "测试连接"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
