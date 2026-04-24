package validator

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/h2non/filetype"
	"github.com/pkg/errors"
)

const (
	// 文件大小限制
	MaxImageSize = 20 * 1024 * 1024  // 20MB
	MaxVideoSize = 500 * 1024 * 1024 // 500MB
)

var (
	// 支持的图片格式
	SupportedImageTypes = []string{"jpg", "jpeg", "png", "gif", "webp"}
	// 支持的视频格式
	SupportedVideoTypes = []string{"mp4", "mov", "avi", "mkv"}
)

// FileValidator 文件验证器
type FileValidator struct{}

// ValidateImage 验证图片文件
func (v *FileValidator) ValidateImage(path string) error {
	// 检查文件是否存在
	info, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return errors.Wrapf(err, "图片文件不存在: %s", path)
		}
		return errors.Wrap(err, "无法访问图片文件")
	}

	// 检查文件大小
	if info.Size() == 0 {
		return fmt.Errorf("图片文件为空: %s", path)
	}
	if info.Size() > MaxImageSize {
		return fmt.Errorf("图片文件过大 (%.2fMB > 20MB): %s",
			float64(info.Size())/1024/1024, path)
	}

	// 读取文件头检测类型
	data, err := os.ReadFile(path)
	if err != nil {
		return errors.Wrap(err, "读取图片文件失败")
	}

	kind, err := filetype.Match(data)
	if err != nil {
		return errors.Wrap(err, "检测图片类型失败")
	}

	if !filetype.IsImage(data) {
		return fmt.Errorf("文件不是有效的图片格式: %s", path)
	}

	// 检查是否为支持的格式
	if !contains(SupportedImageTypes, kind.Extension) {
		return fmt.Errorf("不支持的图片格式 %s，支持的格式: %v",
			kind.Extension, SupportedImageTypes)
	}

	return nil
}

// ValidateVideo 验证视频文件
func (v *FileValidator) ValidateVideo(path string) error {
	// 检查文件是否存在
	info, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return errors.Wrapf(err, "视频文件不存在: %s", path)
		}
		return errors.Wrap(err, "无法访问视频文件")
	}

	// 检查文件大小
	if info.Size() == 0 {
		return fmt.Errorf("视频文件为空: %s", path)
	}
	if info.Size() > MaxVideoSize {
		return fmt.Errorf("视频文件过大 (%.2fMB > 500MB): %s",
			float64(info.Size())/1024/1024, path)
	}

	// 检查扩展名
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(path), "."))
	if !contains(SupportedVideoTypes, ext) {
		return fmt.Errorf("不支持的视频格式 %s，支持的格式: %v",
			ext, SupportedVideoTypes)
	}

	return nil
}

// ValidateImages 批量验证图片
func (v *FileValidator) ValidateImages(paths []string) error {
	if len(paths) == 0 {
		return fmt.Errorf("图片列表为空")
	}

	if len(paths) > 9 {
		return fmt.Errorf("图片数量超过限制 (%d > 9)", len(paths))
	}

	for i, path := range paths {
		if err := v.ValidateImage(path); err != nil {
			return errors.Wrapf(err, "第 %d 张图片验证失败", i+1)
		}
	}

	return nil
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
