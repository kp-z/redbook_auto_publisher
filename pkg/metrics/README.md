# 发布成功率监控统计系统

## 功能说明

本模块提供小红书内容发布的成功率监控和统计功能，记录每次发布的结果、耗时、重试次数等指标。

## 核心功能

### 1. 发布结果记录
- 记录每次发布的成功/失败状态
- 记录重试次数
- 记录发布耗时
- 记录错误信息（失败时）
- 区分内容类型（图文/视频）

### 2. 统计数据
- 总发布次数
- 成功/失败次数
- 实时成功率
- 平均耗时
- 平均重试次数
- 按内容类型统计
- 最近失败记录（最多10条）

### 3. 时间段查询
支持按时间范围查询统计数据，便于分析特定时间段的发布情况。

## API 使用

### 获取全部统计数据

```bash
GET /api/v1/metrics
```

响应示例：
```json
{
  "success": true,
  "data": {
    "total_count": 100,
    "success_count": 95,
    "failure_count": 5,
    "success_rate": 95.0,
    "average_duration": 12.5,
    "average_retry": 0.3,
    "image_count": 70,
    "video_count": 30,
    "last_publish_time": "2024-04-28T15:30:00Z",
    "recent_failures": [
      {
        "timestamp": "2024-04-28T14:20:00Z",
        "error_message": "网络超时",
        "retry_count": 3,
        "content_type": "video"
      }
    ]
  },
  "message": "获取发布统计成功"
}
```

### 按时间段查询

```bash
GET /api/v1/metrics?start=2024-04-28T00:00:00Z&end=2024-04-28T23:59:59Z
```

参数说明：
- `start`: 开始时间（RFC3339 格式）
- `end`: 结束时间（RFC3339 格式）

## 代码集成

### 自动记录

发布功能已自动集成指标记录，无需手动调用：

```go
// service.go 中已自动记录
func (s *XiaohongshuService) publishContent(ctx context.Context, content xiaohongshu.PublishImageContent) error {
    startTime := time.Now()
    m := metrics.GetMetrics()
    
    // ... 执行发布 ...
    
    // 自动记录结果
    m.Record(metrics.PublishResult{
        Success:      err == nil,
        RetryCount:   0,
        Duration:     time.Since(startTime),
        ErrorMessage: ...,
        ContentType:  "image",
    })
    
    return err
}
```

### 手动记录（如需要）

```go
import "github.com/xpzouying/xiaohongshu-mcp/pkg/metrics"

m := metrics.GetMetrics()

// 记录发布结果
m.Record(metrics.PublishResult{
    Success:      true,
    RetryCount:   1,
    Duration:     10 * time.Second,
    ErrorMessage: "",
    ContentType:  "image",
})

// 获取统计数据
stats := m.GetStats()

// 按时间段查询
start := time.Now().Add(-24 * time.Hour)
end := time.Now()
stats = m.GetStatsByTimeRange(start, end)
```

## 数据存储

- 内存存储，保留最近 10000 条记录
- 服务重启后数据清空
- 如需持久化，可扩展实现数据库存储

## 性能考虑

- 使用读写锁保证并发安全
- 自动限制历史记录数量，避免内存溢出
- 统计计算在读锁保护下进行，不影响写入性能
