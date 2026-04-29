package errors

import (
	"fmt"
	"time"
)

// ErrorCategory 错误分类
type ErrorCategory int

const (
	// 可重试错误类型
	ErrorCategoryNetworkTimeout   ErrorCategory = iota + 1 // 网络超时
	ErrorCategoryNetworkTemporary                          // 临时网络故障
	ErrorCategoryRateLimit                                 // 平台限流
	ErrorCategoryServerError                               // 服务器错误 (5xx)
	ErrorCategoryResourceBusy                              // 资源繁忙

	// 不可重试错误类型
	ErrorCategoryValidation   // 参数验证错误
	ErrorCategoryAuth         // 认证/权限错误
	ErrorCategoryNotFound     // 资源不存在
	ErrorCategoryBadRequest   // 请求格式错误
	ErrorCategoryBusinessRule // 业务规则错误（如内容违规）
)

// String 返回错误分类的字符串表示
func (c ErrorCategory) String() string {
	switch c {
	case ErrorCategoryNetworkTimeout:
		return "网络超时"
	case ErrorCategoryNetworkTemporary:
		return "临时网络故障"
	case ErrorCategoryRateLimit:
		return "平台限流"
	case ErrorCategoryServerError:
		return "服务器错误"
	case ErrorCategoryResourceBusy:
		return "资源繁忙"
	case ErrorCategoryValidation:
		return "参数验证错误"
	case ErrorCategoryAuth:
		return "认证权限错误"
	case ErrorCategoryNotFound:
		return "资源不存在"
	case ErrorCategoryBadRequest:
		return "请求格式错误"
	case ErrorCategoryBusinessRule:
		return "业务规则错误"
	default:
		return "未知错误"
	}
}

// IsRetryable 判断错误分类是否可重试
func (c ErrorCategory) IsRetryable() bool {
	switch c {
	case ErrorCategoryNetworkTimeout,
		ErrorCategoryNetworkTemporary,
		ErrorCategoryRateLimit,
		ErrorCategoryServerError,
		ErrorCategoryResourceBusy:
		return true
	default:
		return false
	}
}

// RetryStrategy 重试策略
type RetryStrategy struct {
	InitialDelay time.Duration // 初始延迟
	MaxDelay     time.Duration // 最大延迟
	MaxAttempts  uint          // 最大重试次数
	Multiplier   float64       // 延迟倍增因子
}

// GetRetryStrategy 根据错误分类获取重试策略
func (c ErrorCategory) GetRetryStrategy() RetryStrategy {
	switch c {
	case ErrorCategoryNetworkTimeout:
		// 网络超时：快速重试，短延迟
		return RetryStrategy{
			InitialDelay: 500 * time.Millisecond,
			MaxDelay:     5 * time.Second,
			MaxAttempts:  5,
			Multiplier:   1.5,
		}
	case ErrorCategoryNetworkTemporary:
		// 临时故障：中等延迟
		return RetryStrategy{
			InitialDelay: 1 * time.Second,
			MaxDelay:     10 * time.Second,
			MaxAttempts:  4,
			Multiplier:   2.0,
		}
	case ErrorCategoryRateLimit:
		// 限流：长延迟，少重试
		return RetryStrategy{
			InitialDelay: 5 * time.Second,
			MaxDelay:     60 * time.Second,
			MaxAttempts:  3,
			Multiplier:   3.0,
		}
	case ErrorCategoryServerError:
		// 服务器错误：中等延迟
		return RetryStrategy{
			InitialDelay: 2 * time.Second,
			MaxDelay:     15 * time.Second,
			MaxAttempts:  3,
			Multiplier:   2.0,
		}
	case ErrorCategoryResourceBusy:
		// 资源繁忙：短延迟，多重试
		return RetryStrategy{
			InitialDelay: 1 * time.Second,
			MaxDelay:     8 * time.Second,
			MaxAttempts:  4,
			Multiplier:   1.8,
		}
	default:
		// 不可重试错误，返回零值策略
		return RetryStrategy{
			InitialDelay: 0,
			MaxDelay:     0,
			MaxAttempts:  0,
			Multiplier:   0,
		}
	}
}

// PublishError 发布相关错误
type PublishError struct {
	Stage    string        // 失败阶段：upload, fill_form, submit
	Category ErrorCategory // 错误分类
	Message  string        // 错误消息
	Err      error         // 原始错误
}

func (e *PublishError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s][%s] %s: %v", e.Stage, e.Category, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s][%s] %s", e.Stage, e.Category, e.Message)
}

func (e *PublishError) Unwrap() error {
	return e.Err
}

// IsRetryable 判断发布错误是否可重试
func (e *PublishError) IsRetryable() bool {
	return e.Category.IsRetryable()
}

// GetRetryStrategy 获取重试策略
func (e *PublishError) GetRetryStrategy() RetryStrategy {
	return e.Category.GetRetryStrategy()
}

// 创建发布错误的便捷函数

// NewUploadError 创建上传错误
func NewUploadError(category ErrorCategory, msg string, err error) *PublishError {
	return &PublishError{Stage: "upload", Category: category, Message: msg, Err: err}
}

// NewFormError 创建表单填写错误
func NewFormError(category ErrorCategory, msg string, err error) *PublishError {
	return &PublishError{Stage: "fill_form", Category: category, Message: msg, Err: err}
}

// NewSubmitError 创建提交错误
func NewSubmitError(category ErrorCategory, msg string, err error) *PublishError {
	return &PublishError{Stage: "submit", Category: category, Message: msg, Err: err}
}

// 可重试错误（保留向后兼容）
type RetryableError struct {
	Err error
}

func (e *RetryableError) Error() string {
	return fmt.Sprintf("retryable: %v", e.Err)
}

func (e *RetryableError) Unwrap() error {
	return e.Err
}

func NewRetryableError(err error) *RetryableError {
	return &RetryableError{Err: err}
}

// IsRetryable 判断是否为可重试错误（兼容旧版本）
func IsRetryable(err error) bool {
	// 检查新版本 PublishError
	if pe, ok := err.(*PublishError); ok {
		return pe.IsRetryable()
	}
	// 检查旧版本 RetryableError
	if _, ok := err.(*RetryableError); ok {
		return true
	}
	return false
}

// GetRetryStrategy 获取错误的重试策略
func GetRetryStrategy(err error) (RetryStrategy, bool) {
	if pe, ok := err.(*PublishError); ok {
		if pe.IsRetryable() {
			return pe.GetRetryStrategy(), true
		}
	}
	return RetryStrategy{}, false
}
