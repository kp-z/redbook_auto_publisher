"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { AgentMessage } from "@/lib/image-agent"
import type Anthropic from "@anthropic-ai/sdk"

const SUGGESTIONS = [
  "生成一张赛博朋克风格的城市夜景",
  "画一只穿着宇航服的可爱柴犬",
  "生成一张适合小红书封面的美食图片，主题是抹茶蛋糕",
  "画一幅水彩风格的江南古镇",
  "生成一张科技感十足的产品展示背景图，16:9",
]

interface ChatMessage {
  role: "user" | "assistant"
  text: string
  images?: string[]
  model?: string
  cost?: string
  loading?: boolean
}

export default function ImageGenPage() {
  const [input, setInput] = useState("")
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [history, setHistory] = useState<Anthropic.MessageParam[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput("")
    setLoading(true)

    setChat((prev) => [
      ...prev,
      { role: "user", text: msg },
      { role: "assistant", text: "", loading: true },
    ])

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "请求失败")

      const agentMessages: AgentMessage[] = json.messages
      setHistory(json.history)

      setChat((prev) => {
        const withoutLoading = prev.filter((m) => !m.loading)
        const newMsgs: ChatMessage[] = agentMessages.map((m) => ({
          role: m.role,
          text: m.text,
          images: m.images,
          model: m.model,
          cost: m.cost,
        }))
        return [...withoutLoading, ...newMsgs]
      })
    } catch (err) {
      setChat((prev) => [
        ...prev.filter((m) => !m.loading),
        {
          role: "assistant",
          text: `❌ 错误：${err instanceof Error ? err.message : "未知错误"}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-48px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">AI 图片生成</h1>
          <p className="text-gray-500 mt-1">使用 AI 为小红书生成精美图片</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setChat([]); setHistory([]) }}
          className="text-gray-400 hover:text-gray-600"
        >
          清空对话
        </Button>
      </div>

      {/* 对话区 */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {chat.length === 0 && (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">🖼️</p>
            <p className="text-gray-500 mb-6">告诉我你想生成什么图片</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-1.5 hover:border-red-300 hover:text-red-500 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-red-500 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {msg.loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="animate-spin">⏳</span> 生成中，请稍候...
                </div>
              ) : (
                <>
                  {msg.text && (
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  )}
                  {msg.images && msg.images.length > 0 && (
                    <div className={`${msg.text ? "mt-3" : ""} space-y-2`}>
                      {msg.images.map((url, j) => (
                        <div key={j}>
                          <img
                            src={url}
                            alt="生成的图片"
                            className="rounded-xl max-w-full object-cover"
                            style={{ maxHeight: 480 }}
                          />
                          <div className="flex items-center gap-3 mt-2">
                            {msg.model && (
                              <span className="text-xs text-gray-400">{msg.model}</span>
                            )}
                            {msg.cost && (
                              <span className="text-xs text-gray-400">{msg.cost}</span>
                            )}
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-red-500 hover:underline ml-auto"
                            >
                              下载 ↗
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <Card className="border shadow-sm">
        <CardContent className="p-3 flex items-end gap-2">
          <textarea
            className="flex-1 resize-none text-sm outline-none max-h-32 leading-relaxed bg-transparent"
            rows={1}
            placeholder="描述你想要的图片，支持中文..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            style={{ minHeight: 36 }}
          />
          <Button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="bg-red-600 hover:bg-red-700 shrink-0"
            size="sm"
          >
            发送
          </Button>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-400 text-center mt-2">Enter 发送 · Shift+Enter 换行</p>
    </div>
  )
}
