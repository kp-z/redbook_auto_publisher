"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Image, History, CheckCircle, XCircle, Plus } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface SidebarDockProps {
  isLoggedIn?: boolean
}

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "仪表板" },
  { href: "/image-gen", icon: Image, label: "AI 图片" },
  { href: "/history", icon: History, label: "历史记录" },
]

export function SidebarDock({ isLoggedIn = true }: SidebarDockProps) {
  const pathname = usePathname()
  const [avatar, setAvatar] = useState("")
  const [nickname, setNickname] = useState("用户")

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.avatar) setAvatar(data.avatar)
        if (data.nickname) setNickname(data.nickname)
      })
      .catch(() => {})
  }, [])

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-6 bg-white dark:bg-gray-900 border-r z-20">
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

      {/* 用户头像 */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt={nickname}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/40 dark:to-pink-900/40 flex items-center justify-center">
              <span className="text-lg font-bold text-red-600">XHS</span>
            </div>
          )}
          {isLoggedIn ? (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          ) : (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
              <XCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
