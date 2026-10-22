package errors

import (
	"errors"
	"testing"
	"time"
)

func TestErrorCategory_IsRetryable(t *testing.T) {
	tests := []struct {
		name     string
		category ErrorCategory
		want     bool
	}{
		{"网络超时可重试", ErrorCategoryNetworkTimeout, true},
		{"临时网络故障可重试", ErrorCategoryNetworkTemporary, true},
		{"平台限流可重试", ErrorCategoryRateLimit, true},
		{"服务器错误可重试", ErrorCategoryServerError, true},
		{"资源繁忙可重试", ErrorCategoryResourceBusy, true},
		{"参数验证错误不可重试", ErrorCategoryValidation, false},
		{"认证错误不可重试", ErrorCategoryAuth, false},
		{"资源不存在不可重试", ErrorCategoryNotFound, false},
		{"请求格式错误不可重试", ErrorCategoryBadRequest, false},
		{"业务规则错误不可重试", ErrorCategoryBusinessRule, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.category.IsRetryable(); got != tt.want {
				t.Errorf("ErrorCategory.IsRetryable() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestErrorCategory_GetRetryStrategy(t *testing.T) {
	tests := []struct {
		name     string
		category ErrorCategory
		validate func(t *testing.T, strategy RetryStrategy)
	}{
		{
			name:     "网络超时策略",
			category: ErrorCategoryNetworkTimeout,
			validate: func(t *testing.T, strategy RetryStrategy) {
				if strategy.InitialDelay != 500*time.Millisecond {
					t.Errorf("InitialDelay = %v, want 500ms", strategy.InitialDelay)
				}
				if strategy.MaxAttempts != 5 {
					t.Errorf("MaxAttempts = %v, want 5", strategy.MaxAttempts)
				}
			},
		},
		{
			name:     "限流策略",
			category: ErrorCategoryRateLimit,
			validate: func(t *testing.T, strategy RetryStrategy) {
				if strategy.InitialDelay != 5*time.Second {
					t.Errorf("InitialDelay = %v, want 5s", strategy.InitialDelay)
				}
				if strategy.MaxDelay != 60*time.Second {
					t.Errorf("MaxDelay = %v, want 60s", strategy.MaxDelay)
				}
				if strategy.MaxAttempts != 3 {
					t.Errorf("MaxAttempts = %v, want 3", strategy.MaxAttempts)
				}
			},
		},
		{
			name:     "不可重试错误返回零值策略",
			category: ErrorCategoryValidation,
			validate: func(t *testing.T, strategy RetryStrategy) {
				if strategy.MaxAttempts != 0 {
					t.Errorf("MaxAttempts = %v, want 0", strategy.MaxAttempts)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			strategy := tt.category.GetRetryStrategy()
			tt.validate(t, strategy)
		})
	}
}

func TestPublishError_IsRetryable(t *testing.T) {
	tests := []struct {
		name string
		err  *PublishError
		want bool
	}{
		{
			name: "网络超时错误可重试",
			err:  NewUploadError(ErrorCategoryNetworkTimeout, "上传超时", nil),
			want: true,
		},
		{
			name: "参数验证错误不可重试",
			err:  NewFormError(ErrorCategoryValidation, "参数错误", nil),
			want: false,
		},
		{
			name: "限流错误可重试",
			err:  NewSubmitError(ErrorCategoryRateLimit, "请求过于频繁", nil),
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.err.IsRetryable(); got != tt.want {
				t.Errorf("PublishError.IsRetryable() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestPublishError_GetRetryStrategy(t *testing.T) {
	err := NewUploadError(ErrorCategoryNetworkTimeout, "上传超时", nil)
	strategy := err.GetRetryStrategy()

	if strategy.InitialDelay != 500*time.Millisecond {
		t.Errorf("InitialDelay = %v, want 500ms", strategy.InitialDelay)
	}
	if strategy.MaxAttempts != 5 {
		t.Errorf("MaxAttempts = %v, want 5", strategy.MaxAttempts)
	}
}

func TestIsRetryable(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want bool
	}{
		{
			name: "PublishError可重试",
			err:  NewUploadError(ErrorCategoryNetworkTimeout, "超时", nil),
			want: true,
		},
		{
			name: "PublishError不可重试",
			err:  NewFormError(ErrorCategoryValidation, "验证失败", nil),
			want: false,
		},
		{
			name: "RetryableError可重试",
			err:  NewRetryableError(errors.New("test")),
			want: true,
		},
		{
			name: "普通错误不可重试",
			err:  errors.New("normal error"),
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsRetryable(tt.err); got != tt.want {
				t.Errorf("IsRetryable() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetRetryStrategy(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantOk     bool
		wantDelay  time.Duration
		wantMaxAtt uint
	}{
		{
			name:       "可重试PublishError返回策略",
			err:        NewUploadError(ErrorCategoryNetworkTimeout, "超时", nil),
			wantOk:     true,
			wantDelay:  500 * time.Millisecond,
			wantMaxAtt: 5,
		},
		{
			name:       "不可重试PublishError返回false",
			err:        NewFormError(ErrorCategoryValidation, "验证失败", nil),
			wantOk:     false,
			wantDelay:  0,
			wantMaxAtt: 0,
		},
		{
			name:       "普通错误返回false",
			err:        errors.New("normal error"),
			wantOk:     false,
			wantDelay:  0,
			wantMaxAtt: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			strategy, ok := GetRetryStrategy(tt.err)
			if ok != tt.wantOk {
				t.Errorf("GetRetryStrategy() ok = %v, want %v", ok, tt.wantOk)
			}
			if strategy.InitialDelay != tt.wantDelay {
				t.Errorf("InitialDelay = %v, want %v", strategy.InitialDelay, tt.wantDelay)
			}
			if strategy.MaxAttempts != tt.wantMaxAtt {
				t.Errorf("MaxAttempts = %v, want %v", strategy.MaxAttempts, tt.wantMaxAtt)
			}
		})
	}
}

func TestPublishError_Error(t *testing.T) {
	tests := []struct {
		name string
		err  *PublishError
		want string
	}{
		{
			name: "带原始错误",
			err:  NewUploadError(ErrorCategoryNetworkTimeout, "上传失败", errors.New("connection timeout")),
			want: "[upload][网络超时] 上传失败: connection timeout",
		},
		{
			name: "不带原始错误",
			err:  NewFormError(ErrorCategoryValidation, "参数错误", nil),
			want: "[fill_form][参数验证错误] 参数错误",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.err.Error(); got != tt.want {
				t.Errorf("PublishError.Error() = %v, want %v", got, tt.want)
			}
		})
	}
}
