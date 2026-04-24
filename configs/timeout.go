package configs

import "time"

// 超时配置统一管理
type TimeoutConfig struct {
	// 页面导航超时
	PageNavigation time.Duration
	// 页面加载超时
	PageLoad time.Duration
	// 元素查找超时
	ElementFind time.Duration
	// 图片上传超时
	ImageUpload time.Duration
	// 视频上传超时
	VideoUpload time.Duration
	// 发布按钮等待超时
	PublishButton time.Duration
	// DOM 稳定等待时间
	DOMStable time.Duration
}

// 默认超时配置
var DefaultTimeout = TimeoutConfig{
	PageNavigation: 60 * time.Second,
	PageLoad:       30 * time.Second,
	ElementFind:    10 * time.Second,
	ImageUpload:    2 * time.Minute,
	VideoUpload:    10 * time.Minute,
	PublishButton:  10 * time.Minute,
	DOMStable:      5 * time.Second,
}

// 获取超时配置（可从环境变量覆盖）
func GetTimeoutConfig() TimeoutConfig {
	// TODO: 支持从环境变量读取自定义超时配置
	return DefaultTimeout
}
