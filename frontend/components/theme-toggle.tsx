"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"

const themes = ["light", "dark", "system"] as const
type Theme = (typeof themes)[number]

const icons: Record<Theme, React.ElementType> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-12 h-12" />

  const current = (theme as Theme) ?? "system"
  const next = themes[(themes.indexOf(current) + 1) % themes.length]
  const Icon = icons[current]

  return (
    <button
      onClick={() => setTheme(next)}
      title={`当前：${current === "light" ? "亮色" : current === "dark" ? "暗色" : "跟随系统"}`}
      className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}
