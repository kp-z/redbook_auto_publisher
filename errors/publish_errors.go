package errors

import (
	"fmt"
)

// 发布相关错误类型
type PublishError struct {
	Stage   string // 失败阶段：upload, fill_form, submit
	Message string
	Err     error
}

func (e *PublishError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Stage, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s] %s", e.Stage, e.Message)
}

func (e *PublishError) Unwrap() error {
	return e.Err
}

// 创建发布错误的便捷函数
func NewUploadError(msg string, err error) *PublishError {
	return &PublishError{Stage: "upload", Message: msg, Err: err}
}

func NewFormError(msg string, err error) *PublishError {
	return &PublishError{Stage: "fill_form", Message: msg, Err: err}
}

func NewSubmitError(msg string, err error) *PublishError {
	return &PublishError{Stage: "submit", Message: msg, Err: err}
}

// 可重试错误
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

// 判断是否为可重试错误
func IsRetryable(err error) bool {
	_, ok := err.(*RetryableError)
	return ok
}
