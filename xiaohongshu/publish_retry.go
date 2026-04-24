package xiaohongshu

import (
	"context"
	"time"

	"github.com/avast/retry-go/v4"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
)

// RetryConfig 重试配置
type RetryConfig struct {
	MaxAttempts uint
	Delay       time.Duration
	MaxDelay    time.Duration
}

// DefaultRetryConfig 默认重试配置
var DefaultRetryConfig = RetryConfig{
	MaxAttempts: 3,
	Delay:       2 * time.Second,
	MaxDelay:    10 * time.Second,
}

// PublishWithRetry 带重试的发布图文
func (p *PublishAction) PublishWithRetry(ctx context.Context, content PublishImageContent, config RetryConfig) error {
	var lastErr error

	err := retry.Do(
		func() error {
			err := p.Publish(ctx, content)
			if err != nil {
				lastErr = err
				logrus.Warnf("发布失败，准备重试: %v", err)
				return err
			}
			return nil
		},
		retry.Attempts(config.MaxAttempts),
		retry.Delay(config.Delay),
		retry.MaxDelay(config.MaxDelay),
		retry.DelayType(retry.BackOffDelay),
		retry.OnRetry(func(n uint, err error) {
			logrus.Infof("第 %d 次重试发布 (共 %d 次)", n+1, config.MaxAttempts)
		}),
		retry.Context(ctx),
	)

	if err != nil {
		return errors.Wrapf(lastErr, "发布失败，已重试 %d 次", config.MaxAttempts)
	}

	return nil
}

// PublishVideoWithRetry 带重试的发布视频
func (p *PublishAction) PublishVideoWithRetry(ctx context.Context, content PublishVideoContent, config RetryConfig) error {
	var lastErr error

	err := retry.Do(
		func() error {
			err := p.PublishVideo(ctx, content)
			if err != nil {
				lastErr = err
				logrus.Warnf("视频发布失败，准备重试: %v", err)
				return err
			}
			return nil
		},
		retry.Attempts(config.MaxAttempts),
		retry.Delay(config.Delay),
		retry.MaxDelay(config.MaxDelay),
		retry.DelayType(retry.BackOffDelay),
		retry.OnRetry(func(n uint, err error) {
			logrus.Infof("第 %d 次重试视频发布 (共 %d 次)", n+1, config.MaxAttempts)
		}),
		retry.Context(ctx),
	)

	if err != nil {
		return errors.Wrapf(lastErr, "视频发布失败，已重试 %d 次", config.MaxAttempts)
	}

	return nil
}
