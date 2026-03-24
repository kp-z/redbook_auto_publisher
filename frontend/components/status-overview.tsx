import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookOpen, TrendingUp, Users, Heart, MessageCircle, Eye } from "lucide-react"

interface StatusOverviewProps {
  totalPosts: number
  activeTasks: number
  totalTasks: number
  stats?: {
    views: number
    likes: number
    comments: number
    followers: number
  }
}

export function StatusOverview({
  totalPosts,
  activeTasks,
  totalTasks,
  stats = { views: 0, likes: 0, comments: 0, followers: 0 },
}: StatusOverviewProps) {
  const taskProgress = totalTasks > 0 ? (activeTasks / totalTasks) * 100 : 0

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 发布统计 */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">总发布数</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-red-600">{totalPosts}</div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              持续增长中
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 任务状态 */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500">运行任务</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{activeTasks}</span>
              <span className="text-lg text-gray-400">/ {totalTasks}</span>
            </div>
            <div className="space-y-1">
              <Progress value={taskProgress} className="h-1.5" />
              <p className="text-xs text-gray-500">{activeTasks} 个任务正在运行</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 浏览量 */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">总浏览量</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-3xl font-bold">{(stats.views / 1000).toFixed(1)}k</div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-500" />
              {(stats.likes / 1000).toFixed(1)}k 点赞
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 粉丝数 */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">粉丝数量</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-3xl font-bold">{(stats.followers / 1000).toFixed(1)}k</div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-blue-500" />
              {stats.comments} 评论
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
