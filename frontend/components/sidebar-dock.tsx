"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Image, History, CheckCircle, XCircle, Plus, Activity, Settings } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "仪表板" },
  { href: "/image-gen", icon: Image, label: "AI 图片" },
  { href: "/history", icon: History, label: "历史记录" },
  { href: "/mcp", icon: Activity, label: "MCP 状态" },
  { href: "/settings", icon: Settings, label: "设置" },
]

const CACHE_KEY = "xhs_user_cache"

export function SidebarDock() {
  const pathname = usePathname()
  const [avatar, setAvatar] = useState("")
  const [nickname, setNickname] = useState("用户")
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    // 先从 localStorage 读缓存，避免头像闪烁
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null")
      if (cached?.avatar) setAvatar(cached.avatar)
      if (cached?.nickname) setNickname(cached.nickname)
      if (cached?.loggedIn != null) setLoggedIn(cached.loggedIn)
    } catch { /* ignore */ }

    // 后台刷新最新数据
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.avatar) setAvatar(data.avatar)
        if (data.nickname) setNickname(data.nickname)
        setLoggedIn(data.loggedIn ?? false)
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      })
      .catch(() => {})
  }, [])

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 z-20 h-screen w-20 flex-col items-center border-r border-sidebar-border bg-sidebar py-6 text-sidebar-foreground">
      {/* 用户头像 */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center relative mb-2">
        {avatar ? (
          <img src={avatar} alt={nickname} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/40 dark:to-pink-900/40 flex items-center justify-center">
            <span className="text-sm font-bold text-red-600">XHS</span>
          </div>
        )}
        {loggedIn ? (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
            <CheckCircle className="w-2.5 h-2.5 text-white" />
          </div>
        ) : (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
            <XCircle className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* 导航 */}
      <nav className="flex-1 flex flex-col items-center gap-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                active
                  ? "bg-red-50 dark:bg-red-950/20 text-red-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              }`}
            >
              <Icon className="w-5 h-5" />
            </Link>
          )
        })}

        <Link
          href="/tasks/new"
          title="新建任务"
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </nav>

      <Separator className="w-10 mb-6" />

      {/* 主题切换 */}
      <ThemeToggle />
    </aside>
  )
}
