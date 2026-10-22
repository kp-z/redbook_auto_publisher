package metrics

import (
	"sync"
	"time"
)

// PublishResult 发布结果
type PublishResult struct {
	Success      bool          // 是否成功
	RetryCount   int           // 重试次数
	Duration     time.Duration // 耗时
	ErrorMessage string        // 错误信息（失败时）
	Timestamp    time.Time     // 时间戳
	ContentType  string        // 内容类型：image/video
}

// PublishMetrics 发布指标统计
type PublishMetrics struct {
	mu      sync.RWMutex
	records []PublishResult // 历史记录
}

var (
	globalMetrics *PublishMetrics
	once          sync.Once
)

// GetMetrics 获取全局指标实例
func GetMetrics() *PublishMetrics {
	once.Do(func() {
		globalMetrics = &PublishMetrics{
			records: make([]PublishResult, 0, 1000),
		}
	})
	return globalMetrics
}

// Record 记录一次发布结果
func (m *PublishMetrics) Record(result PublishResult) {
	m.mu.Lock()
	defer m.mu.Unlock()

	result.Timestamp = time.Now()
	m.records = append(m.records, result)

	// 保留最近 10000 条记录
	if len(m.records) > 10000 {
		m.records = m.records[len(m.records)-10000:]
	}
}

// Stats 统计数据
type Stats struct {
	TotalCount      int           `json:"total_count"`       // 总发布次数
	SuccessCount    int           `json:"success_count"`     // 成功次数
	FailureCount    int           `json:"failure_count"`     // 失败次数
	SuccessRate     float64       `json:"success_rate"`      // 成功率
	AverageDuration float64       `json:"average_duration"`  // 平均耗时（秒）
	AverageRetry    float64       `json:"average_retry"`     // 平均重试次数
	ImageCount      int           `json:"image_count"`       // 图文发布次数
	VideoCount      int           `json:"video_count"`       // 视频发布次数
	LastPublishTime string        `json:"last_publish_time"` // 最后发布时间
	RecentFailures  []FailureInfo `json:"recent_failures"`   // 最近失败记录（最多10条）
}

// FailureInfo 失败信息
type FailureInfo struct {
	Timestamp    string `json:"timestamp"`
	ErrorMessage string `json:"error_message"`
	RetryCount   int    `json:"retry_count"`
	ContentType  string `json:"content_type"`
}

// GetStats 获取统计数据
func (m *PublishMetrics) GetStats() Stats {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return m.calculateStats(m.records)
}

// GetStatsByTimeRange 按时间段获取统计数据
func (m *PublishMetrics) GetStatsByTimeRange(start, end time.Time) Stats {
	m.mu.RLock()
	defer m.mu.RUnlock()

	filtered := make([]PublishResult, 0)
	for _, r := range m.records {
		if (r.Timestamp.Equal(start) || r.Timestamp.After(start)) &&
			(r.Timestamp.Equal(end) || r.Timestamp.Before(end)) {
			filtered = append(filtered, r)
		}
	}

	return m.calculateStats(filtered)
}

// calculateStats 计算统计数据
func (m *PublishMetrics) calculateStats(records []PublishResult) Stats {
	stats := Stats{
		TotalCount: len(records),
	}

	if len(records) == 0 {
		return stats
	}

	var totalDuration time.Duration
	var totalRetry int
	var failures []FailureInfo

	for _, r := range records {
		if r.Success {
			stats.SuccessCount++
		} else {
			stats.FailureCount++
			// 收集失败信息
			failures = append(failures, FailureInfo{
				Timestamp:    r.Timestamp.Format(time.RFC3339),
				ErrorMessage: r.ErrorMessage,
				RetryCount:   r.RetryCount,
				ContentType:  r.ContentType,
			})
		}

		totalDuration += r.Duration
		totalRetry += r.RetryCount

		if r.ContentType == "image" {
			stats.ImageCount++
		} else if r.ContentType == "video" {
			stats.VideoCount++
		}
	}

	// 计算成功率
	if stats.TotalCount > 0 {
		stats.SuccessRate = float64(stats.SuccessCount) / float64(stats.TotalCount) * 100
	}

	// 计算平均耗时（秒）
	if stats.TotalCount > 0 {
		stats.AverageDuration = totalDuration.Seconds() / float64(stats.TotalCount)
	}

	// 计算平均重试次数
	if stats.TotalCount > 0 {
		stats.AverageRetry = float64(totalRetry) / float64(stats.TotalCount)
	}

	// 最后发布时间
	if len(records) > 0 {
		stats.LastPublishTime = records[len(records)-1].Timestamp.Format(time.RFC3339)
	}

	// 最近失败记录（最多10条）
	if len(failures) > 10 {
		failures = failures[len(failures)-10:]
	}
	stats.RecentFailures = failures

	return stats
}

// Reset 重置统计数据
func (m *PublishMetrics) Reset() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.records = make([]PublishResult, 0, 1000)
}
