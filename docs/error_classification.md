# 错误分类和智能重试策略

## 概述

本文档描述了 xiaohongshu-mcp 项目中的错误分类系统和智能重试策略。通过细化错误类型，系统能够针对不同错误采取最优的重试策略，提高发布成功率并减少不必要的重试。

## 错误分类

### 可重试错误类型

| 错误类型 | 说明 | 重试策略 |
|---------|------|---------|
| `ErrorCategoryNetworkTimeout` | 网络超时 | 快速重试，短延迟（500ms起始，最多5次） |
| `ErrorCategoryNetworkTemporary` | 临时网络故障 | 中等延迟（1s起始，最多4次） |
| `ErrorCategoryRateLimit` | 平台限流 | 长延迟，少重试（5s起始，最多3次） |
| `ErrorCategoryServerError` | 服务器错误 (5xx) | 中等延迟（2s起始，最多3次） |
| `ErrorCategoryResourceBusy` | 资源繁忙 | 短延迟，多重试（1s起始，最多4次） |

### 不可重试错误类型

| 错误类型 | 说明 | 处理方式 |
|---------|------|---------|
| `ErrorCategoryValidation` | 参数验证错误 | 立即失败，不重试 |
| `ErrorCategoryAuth` | 认证/权限错误 | 立即失败，不重试 |
| `ErrorCategoryNotFound` | 资源不存在 | 立即失败，不重试 |
| `ErrorCategoryBadRequest` | 请求格式错误 | 立即失败，不重试 |
| `ErrorCategoryBusinessRule` | 业务规则错误（如内容违规） | 立即失败，不重试 |

## 重试策略详解

### 网络超时 (ErrorCategoryNetworkTimeout)

```go
RetryStrategy{
    InitialDelay: 500 * time.Millisecond,
    MaxDelay:     5 * time.Second,
    MaxAttempts:  5,
    Multiplier:   1.5,
}
```

**适用场景**：网络请求超时、连接超时
**策略说明**：网络超时通常是瞬时问题，快速重试可以提高成功率

### 临时网络故障 (ErrorCategoryNetworkTemporary)

```go
RetryStrategy{
    InitialDelay: 1 * time.Second,
    MaxDelay:     10 * time.Second,
    MaxAttempts:  4,
    Multiplier:   2.0,
}
```

**适用场景**：DNS解析失败、连接被拒绝、网络不可达
**策略说明**：临时故障需要更长的恢复时间，使用指数退避

### 平台限流 (ErrorCategoryRateLimit)

```go
RetryStrategy{
    InitialDelay: 5 * time.Second,
    MaxDelay:     60 * time.Second,
    MaxAttempts:  3,
    Multiplier:   3.0,
}
```

**适用场景**：API限流、请求频率过高
**策略说明**：限流需要较长等待时间，避免持续触发限流

### 服务器错误 (ErrorCategoryServerError)

```go
RetryStrategy{
    InitialDelay: 2 * time.Second,
    MaxDelay:     15 * time.Second,
    MaxAttempts:  3,
    Multiplier:   2.0,
}
```

**适用场景**：HTTP 5xx 错误、服务器内部错误
**策略说明**：服务器错误可能需要时间恢复，适度重试

### 资源繁忙 (ErrorCategoryResourceBusy)

```go
RetryStrategy{
    InitialDelay: 1 * time.Second,
    MaxDelay:     8 * time.Second,
    MaxAttempts:  4,
    Multiplier:   1.8,
}
```

**适用场景**：资源锁定、并发冲突
**策略说明**：资源繁忙通常很快释放，使用较温和的退避策略

## 使用示例

### 创建带分类的错误

```go
import "github.com/xpzouying/xiaohongshu-mcp/errors"

// 网络超时错误
err := errors.NewUploadError(
    errors.ErrorCategoryNetworkTimeout,
    "上传图片超时",
    originalErr,
)

// 参数验证错误
err := errors.NewFormError(
    errors.ErrorCategoryValidation,
    "标题不能为空",
    nil,
)

// 平台限流错误
err := errors.NewSubmitError(
    errors.ErrorCategoryRateLimit,
    "请求过于频繁，请稍后再试",
    nil,
)
```

### 使用智能重试

```go
// 方式1：使用智能重试（自动根据错误类型选择策略）
err := publishAction.PublishWithSmartRetry(ctx, content)

// 方式2：使用固定配置重试（兼容旧版本）
config := xiaohongshu.RetryConfig{
    MaxAttempts: 3,
    Delay:       2 * time.Second,
    MaxDelay:    10 * time.Second,
}
err := publishAction.PublishWithRetry(ctx, content, config)
```

### 检查错误是否可重试

```go
if errors.IsRetryable(err) {
    // 可以重试
    strategy, ok := errors.GetRetryStrategy(err)
    if ok {
        log.Printf("重试策略: 初始延迟=%v, 最大次数=%d",
            strategy.InitialDelay, strategy.MaxAttempts)
    }
} else {
    // 不可重试，直接失败
    log.Printf("不可重试错误: %v", err)
}
```

## 实现细节

### 延迟计算算法

使用指数退避算法计算重试延迟：

```go
delay = InitialDelay * (Multiplier ^ attempt)
if delay > MaxDelay {
    delay = MaxDelay
}
```

例如，对于网络超时错误（Multiplier=1.5）：
- 第1次重试：500ms
- 第2次重试：750ms
- 第3次重试：1125ms
- 第4次重试：1687ms
- 第5次重试：2531ms

### 不可重试错误处理

当检测到不可重试错误时，使用 `retry.Unrecoverable(err)` 立即停止重试循环，避免浪费资源。

## 最佳实践

1. **准确分类错误**：在捕获错误时，尽可能准确地判断错误类型，选择合适的 ErrorCategory
2. **使用智能重试**：优先使用 `PublishWithSmartRetry` 方法，让系统自动选择最优策略
3. **记录重试日志**：重试过程会自动记录日志，便于问题排查
4. **监控重试指标**：关注平均重试次数，识别系统瓶颈
5. **避免过度重试**：对于明确不可重试的错误，及时返回失败

## 测试覆盖

所有错误分类和重试策略都有完整的单元测试覆盖，测试文件：`errors/publish_errors_test.go`

运行测试：
```bash
go test ./errors/... -v
```
