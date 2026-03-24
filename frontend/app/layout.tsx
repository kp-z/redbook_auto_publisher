import type { Metadata } from "next"
import Link from "next/link"
import { Plus, Sparkles } from "lucide-react"
import { SidebarDock } from "@/components/sidebar-dock"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "小红书自动化",
  description: "小红书内容自动发布管理",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Toaster />
        <SidebarDock />

        {/* 移动端顶部 Header */}
        <header className="lg:hidden bg-white dark:bg-gray-900 border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">小红书自动发布</h1>
                  <p className="text-sm text-gray-500">AI 驱动的内容管理平台</p>
                </div>
              </div>
              <Link
                href="/tasks/new"
                className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                新建任务
              </Link>
            </div>
          </div>
        </header>

        {/* 主内容区（桌面端左移 80px 避让 Sidebar） */}
        <main className="lg:ml-20">{children}</main>
      </body>
    </html>
  )
}
