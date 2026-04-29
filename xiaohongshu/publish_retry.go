package xiaohongshu

import (
	"context"
	"time"

	"github.com/avast/retry-go/v4"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"

	publishErrors "github.com/xpzouying/xiaohongshu-mcp/errors"
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

// PublishWithRetry 带重试的发布图文（使用智能重试策略）
func (p *PublishAction) PublishWithRetry(ctx context.Context, content PublishImageContent, config RetryConfig) error {
	var lastErr error

	err := retry.Do(
		func() error {
			err := p.Publish(ctx, content)
			if err != nil {
				lastErr = err
				logrus.Warnf("发布失败: %v", err)

				// 检查是否为可重试错误
				if !publishErrors.IsRetryable(err) {
					logrus.Errorf("不可重试错误，停止重试: %v", err)
					return retry.Unrecoverable(err)
				}

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

// PublishWithSmartRetry 带智能重试策略的发布图文
func (p *PublishAction) PublishWithSmartRetry(ctx context.Context, content PublishImageContent) error {
	var lastErr error
	var currentStrategy publishErrors.RetryStrategy

	err := retry.Do(
		func() error {
			err := p.Publish(ctx, content)
			if err != nil {
				lastErr = err
				logrus.Warnf("发布失败: %v", err)

				// 获取错误的重试策略
				strategy, retryable := publishErrors.GetRetryStrategy(err)
				if !retryable {
					logrus.Errorf("不可重试错误，停止重试: %v", err)
					return retry.Unrecoverable(err)
				}

				currentStrategy = strategy
				logrus.Infof("使用重试策略: 初始延迟=%v, 最大延迟=%v, 最大次数=%d",
					strategy.InitialDelay, strategy.MaxDelay, strategy.MaxAttempts)

				return err
			}
			return nil
		},
		retry.Attempts(getMaxAttempts(currentStrategy)),
		retry.DelayType(func(n uint, err error, config *retry.Config) time.Duration {
			return calculateDelay(n, currentStrategy)
		}),
		retry.OnRetry(func(n uint, err error) {
			logrus.Infof("第 %d 次重试发布", n+1)
		}),
		retry.Context(ctx),
	)

	if err != nil {
		return errors.Wrapf(lastErr, "发布失败")
	}

	return nil
}

// PublishVideoWithRetry 带重试的发布视频（使用智能重试策略）
func (p *PublishAction) PublishVideoWithRetry(ctx context.Context, content PublishVideoContent, config RetryConfig) error {
	var lastErr error

	err := retry.Do(
		func() error {
			err := p.PublishVideo(ctx, content)
			if err != nil {
				lastErr = err
				logrus.Warnf("视频发布失败: %v", err)

				// 检查是否为可重试错误
				if !publishErrors.IsRetryable(err) {
					logrus.Errorf("不可重试错误，停止重试: %v", err)
					return retry.Unrecoverable(err)
				}

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

// PublishVideoWithSmartRetry 带智能重试策略的发布视频
func (p *PublishAction) PublishVideoWithSmartRetry(ctx context.Context, content PublishVideoContent) error {
	var lastErr error
	var currentStrategy publishErrors.RetryStrategy

	err := retry.Do(
		func() error {
			err := p.PublishVideo(ctx, content)
			if err != nil {
				lastErr = err
				logrus.Warnf("视频发布失败: %v", err)

				// 获取错误的重试策略
				strategy, retryable := publishErrors.GetRetryStrategy(err)
				if !retryable {
					logrus.Errorf("不可重试错误，停止重试: %v", err)
					return retry.Unrecoverable(err)
				}

				currentStrategy = strategy
				logrus.Infof("使用重试策略: 初始延迟=%v, 最大延迟=%v, 最大次数=%d",
					strategy.InitialDelay, strategy.MaxDelay, strategy.MaxAttempts)

				return err
			}
			return nil
		},
		retry.Attempts(getMaxAttempts(currentStrategy)),
		retry.DelayType(func(n uint, err error, config *retry.Config) time.Duration {
			return calculateDelay(n, currentStrategy)
		}),
		retry.OnRetry(func(n uint, err error) {
			logrus.Infof("第 %d 次重试视频发布", n+1)
		}),
		retry.Context(ctx),
	)

	if err != nil {
		return errors.Wrapf(lastErr, "视频发布失败")
	}

	return nil
}

// getMaxAttempts 获取最大重试次数，如果策略未设置则使用默认值
func getMaxAttempts(strategy publishErrors.RetryStrategy) uint {
	if strategy.MaxAttempts > 0 {
		return strategy.MaxAttempts
	}
	return DefaultRetryConfig.MaxAttempts
}

// calculateDelay 根据重试策略计算延迟时间
func calculateDelay(attempt uint, strategy publishErrors.RetryStrategy) time.Duration {
	if strategy.InitialDelay == 0 {
		return DefaultRetryConfig.Delay
	}

	// 使用指数退避算法
	delay := float64(strategy.InitialDelay)
	for i := uint(0); i < attempt; i++ {
		delay *= strategy.Multiplier
	}

	result := time.Duration(delay)

	// 限制最大延迟
	if strategy.MaxDelay > 0 && result > strategy.MaxDelay {
		result = strategy.MaxDelay
	}

	return result
}
