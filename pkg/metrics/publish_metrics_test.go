package metrics

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestPublishMetrics_Record(t *testing.T) {
	m := &PublishMetrics{
		records: make([]PublishResult, 0),
	}

	// 记录成功
	m.Record(PublishResult{
		Success:     true,
		RetryCount:  0,
		Duration:    5 * time.Second,
		ContentType: "image",
	})

	// 记录失败
	m.Record(PublishResult{
		Success:      false,
		RetryCount:   2,
		Duration:     3 * time.Second,
		ErrorMessage: "网络错误",
		ContentType:  "video",
	})

	assert.Equal(t, 2, len(m.records))
}

func TestPublishMetrics_GetStats(t *testing.T) {
	m := &PublishMetrics{
		records: []PublishResult{
			{Success: true, RetryCount: 0, Duration: 5 * time.Second, ContentType: "image", Timestamp: time.Now()},
			{Success: true, RetryCount: 1, Duration: 7 * time.Second, ContentType: "image", Timestamp: time.Now()},
			{Success: false, RetryCount: 3, Duration: 10 * time.Second, ErrorMessage: "超时", ContentType: "video", Timestamp: time.Now()},
			{Success: true, RetryCount: 0, Duration: 4 * time.Second, ContentType: "video", Timestamp: time.Now()},
		},
	}

	stats := m.GetStats()

	assert.Equal(t, 4, stats.TotalCount)
	assert.Equal(t, 3, stats.SuccessCount)
	assert.Equal(t, 1, stats.FailureCount)
	assert.Equal(t, 75.0, stats.SuccessRate)
	assert.Equal(t, 2, stats.ImageCount)
	assert.Equal(t, 2, stats.VideoCount)
	assert.InDelta(t, 6.5, stats.AverageDuration, 0.1)
	assert.InDelta(t, 1.0, stats.AverageRetry, 0.1)
	assert.Equal(t, 1, len(stats.RecentFailures))
	assert.Equal(t, "超时", stats.RecentFailures[0].ErrorMessage)
}

func TestPublishMetrics_GetStatsByTimeRange(t *testing.T) {
	now := time.Now()
	m := &PublishMetrics{
		records: []PublishResult{
			{Success: true, Duration: 5 * time.Second, ContentType: "image", Timestamp: now.Add(-2 * time.Hour)},
			{Success: true, Duration: 6 * time.Second, ContentType: "image", Timestamp: now.Add(-1 * time.Hour)},
			{Success: false, Duration: 8 * time.Second, ContentType: "video", Timestamp: now.Add(-30 * time.Minute)},
			{Success: true, Duration: 4 * time.Second, ContentType: "video", Timestamp: now},
		},
	}

	// 查询最近1小时
	stats := m.GetStatsByTimeRange(now.Add(-1*time.Hour), now.Add(1*time.Minute))

	assert.Equal(t, 3, stats.TotalCount)
	assert.Equal(t, 2, stats.SuccessCount)
	assert.Equal(t, 1, stats.FailureCount)
}

func TestPublishMetrics_Reset(t *testing.T) {
	m := &PublishMetrics{
		records: []PublishResult{
			{Success: true, Duration: 5 * time.Second, ContentType: "image", Timestamp: time.Now()},
		},
	}

	assert.Equal(t, 1, len(m.records))

	m.Reset()

	assert.Equal(t, 0, len(m.records))
}
