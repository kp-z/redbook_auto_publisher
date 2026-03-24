"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TrendingUp, Calendar, Flame, Target } from "lucide-react"

interface ActivityDay {
  date: string
  count: number
}

interface ActivityCalendarProps {
  data: ActivityDay[]
  compact?: boolean
}

export function ActivityCalendar({ data, compact = false }: ActivityCalendarProps) {
  const generateLast90Days = () => {
    const days: ActivityDay[] = []
    const today = new Date()
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const existingData = data.find((d) => d.date === dateStr)
      days.push({ date: dateStr, count: existingData?.count || 0 })
    }
    return days
  }

  const days = generateLast90Days()

  const calculateStreak = () => {
    let streak = 0
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) streak++
      else break
    }
    return streak
  }

  const calculateMaxStreak = () => {
    let maxStreak = 0
    let currentStreak = 0
    for (const day of days) {
      if (day.count > 0) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }
    return maxStreak
  }

  const calculateMonthlyPosts = () => {
    const today = new Date()
    return days
      .filter((day) => {
        const date = new Date(day.date)
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear() && day.count > 0
      })
      .reduce((sum, day) => sum + day.count, 0)
  }

  const calculateActiveDays = () => days.filter((day) => day.count > 0).length

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800"
    if (count === 1) return "bg-red-200 dark:bg-red-900/40"
    if (count === 2) return "bg-red-400 dark:bg-red-700/60"
    return "bg-red-600 dark:bg-red-600"
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
  }

  const streak = calculateStreak()
  const maxStreak = calculateMaxStreak()
  const totalPosts = days.reduce((sum, day) => sum + day.count, 0)
  const monthlyPosts = calculateMonthlyPosts()
  const activeDays = calculateActiveDays()

  const weeks: ActivityDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  if (compact) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Flame className="w-3.5 h-3.5" />
              <span>当前连续</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{streak}</div>
            <div className="text-xs text-gray-500">天</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Target className="w-3.5 h-3.5" />
              <span>最长连续</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">{maxStreak}</div>
            <div className="text-xs text-gray-500">天</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>本月发布</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{monthlyPosts}</div>
            <div className="text-xs text-gray-500">篇</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>活跃天数</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">{activeDays}</div>
            <div className="text-xs text-gray-500">/ 90天</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">过去 90 天的发布记录</div>
          <div className="w-full overflow-x-auto pb-2">
            <TooltipProvider>
              <div className="inline-flex gap-1 min-w-full">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1 flex-1">
                    {week.map((day) => (
                      <Tooltip key={day.date}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-full aspect-square rounded-sm ${getColorClass(day.count)} transition-colors hover:ring-2 hover:ring-red-400 cursor-pointer min-w-[10px]`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{formatDate(day.date)}</p>
                          <p className="text-sm text-gray-500">{day.count === 0 ? "未发布" : `${day.count} 篇笔记`}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>少</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                <div className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900/40" />
                <div className="w-3 h-3 rounded-sm bg-red-400 dark:bg-red-700/60" />
                <div className="w-3 h-3 rounded-sm bg-red-600 dark:bg-red-600" />
              </div>
              <span>多</span>
            </div>
            <div className="text-xs text-gray-500">
              总计 <span className="font-bold text-red-600">{totalPosts}</span> 篇笔记
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold">发布活动</h3>
          <p className="text-sm text-gray-500">过去90天的发布记录</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <div className="font-bold text-2xl text-red-600">{streak}</div>
            <div className="text-gray-500">连续天数</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl text-red-600">{totalPosts}</div>
            <div className="text-gray-500">总发布数</div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto pb-2">
        <TooltipProvider>
          <div className="inline-flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day) => (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-3 h-3 rounded-sm ${getColorClass(day.count)} transition-colors hover:ring-2 hover:ring-red-400 cursor-pointer`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{formatDate(day.date)}</p>
                      <p className="text-sm text-gray-500">{day.count === 0 ? "未发布" : `${day.count} 篇笔记`}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>少</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
          <div className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900/40" />
          <div className="w-3 h-3 rounded-sm bg-red-400 dark:bg-red-700/60" />
          <div className="w-3 h-3 rounded-sm bg-red-600 dark:bg-red-600" />
        </div>
        <span>多</span>
      </div>
    </div>
  )
}
