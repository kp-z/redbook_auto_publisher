import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ZCOOL_XiaoWei } from "next/font/google"
import { SidebarDock } from "@/components/sidebar-dock"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const artFont = ZCOOL_XiaoWei({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-art",
  display: "swap",
})

export const metadata: Metadata = {
  title: "小红书自动化",
  description: "小红书内容自动发布管理",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`h-full antialiased ${artFont.variable}`} suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>
        <Toaster />
        <SidebarDock />

        {/* 移动端顶部 Header */}
        <header className="sticky top-0 z-10 border-b border-border bg-card lg:hidden">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="小红书" className="h-8 w-auto" />
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
        </ThemeProvider>
      </body>
    </html>
  )
}
