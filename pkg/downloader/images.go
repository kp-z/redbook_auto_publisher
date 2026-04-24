package downloader

import (
	"crypto/sha256"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/h2non/filetype"
	"github.com/pkg/errors"
)

// ImageDownloader 图片下载器
type ImageDownloader struct {
	savePath   string
	httpClient *http.Client
}

// NewImageDownloader 创建图片下载器
func NewImageDownloader(savePath string) (*ImageDownloader, error) {
	// 确保保存目录存在
	if err := os.MkdirAll(savePath, 0755); err != nil {
		return nil, errors.Wrapf(err, "failed to create save path: %s", savePath)
	}

	return &ImageDownloader{
		savePath: savePath,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}, nil
}

// DownloadImage 下载图片
// 返回本地文件路径
func (d *ImageDownloader) DownloadImage(imageURL string) (string, error) {
	// 验证URL格式
	if !d.isValidImageURL(imageURL) {
		return "", errors.New("invalid image URL format")
	}

	// 创建请求并设置请求头
	req, err := http.NewRequest("GET", imageURL, nil)
	if err != nil {
		return "", errors.Wrap(err, "failed to create request")
	}

	// 设置 User-Agent，模拟浏览器请求
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	// 设置 Referer，使用图片 URL 的域名
	parsedURL, _ := url.Parse(imageURL)
	if parsedURL != nil {
		req.Header.Set("Referer", fmt.Sprintf("%s://%s/", parsedURL.Scheme, parsedURL.Host))
	}

	// 下载图片数据
	resp, err := d.httpClient.Do(req)
	if err != nil {
		return "", errors.Wrapf(err, "failed to download image from %s", imageURL)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("download failed with status %d for URL: %s", resp.StatusCode, imageURL)
	}

	// 读取图片数据，限制最大读取大小防止内存溢出
	limitedReader := io.LimitReader(resp.Body, 20*1024*1024) // 20MB 限制
	imageData, err := io.ReadAll(limitedReader)
	if err != nil {
		return "", errors.Wrap(err, "failed to read image data")
	}

	// 检查是否读取完整
	if len(imageData) == 0 {
		return "", errors.New("downloaded image is empty")
	}

	// 检测图片格式
	kind, err := filetype.Match(imageData)
	if err != nil {
		return "", errors.Wrap(err, "failed to detect file type")
	}

	if !filetype.IsImage(imageData) {
		return "", errors.New("downloaded file is not a valid image")
	}

	// 生成唯一文件名
	fileName := d.generateFileName(imageURL, kind.Extension)
	filePath := filepath.Join(d.savePath, fileName)

	// 如果文件已存在，验证文件完整性
	if existingInfo, err := os.Stat(filePath); err == nil {
		// 检查文件大小是否匹配
		if existingInfo.Size() == int64(len(imageData)) {
			return filePath, nil
		}
		// 文件大小不匹配，删除旧文件重新下载
		os.Remove(filePath)
	}

	// 保存到文件，使用原子写入
	tmpPath := filePath + ".tmp"
	if err := os.WriteFile(tmpPath, imageData, 0644); err != nil {
		return "", errors.Wrap(err, "failed to save image")
	}

	// 原子重命名
	if err := os.Rename(tmpPath, filePath); err != nil {
		os.Remove(tmpPath) // 清理临时文件
		return "", errors.Wrap(err, "failed to rename temp file")
	}

	return filePath, nil
}

// DownloadImages 批量下载图片
func (d *ImageDownloader) DownloadImages(imageURLs []string) ([]string, error) {
	var localPaths []string
	var errs []error

	for _, imageURL := range imageURLs {
		localPath, err := d.DownloadImage(imageURL)
		if err != nil {
			errs = append(errs, fmt.Errorf("failed to download %s: %w", imageURL, err))
			continue
		}
		localPaths = append(localPaths, localPath)
	}

	if len(errs) > 0 {
		return localPaths, fmt.Errorf("download errors occurred: %v", errs)
	}

	return localPaths, nil
}

// isValidImageURL 检查是否为有效的图片URL
func (d *ImageDownloader) isValidImageURL(rawURL string) bool {
	// 检查是否以http/https开头
	if !strings.HasPrefix(strings.ToLower(rawURL), "http://") &&
		!strings.HasPrefix(strings.ToLower(rawURL), "https://") {
		return false
	}

	// 检查URL格式
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return false
	}

	return parsedURL.Scheme != "" && parsedURL.Host != ""
}

// generateFileName 生成唯一的文件名
func (d *ImageDownloader) generateFileName(imageURL, extension string) string {
	// 使用URL的SHA256哈希作为文件名，确保唯一性
	hash := sha256.Sum256([]byte(imageURL))
	hashStr := fmt.Sprintf("%x", hash)

	// 取前16位哈希值作为文件名
	shortHash := hashStr[:16]

	// 添加时间戳确保更好的唯一性
	timestamp := time.Now().Unix()

	return fmt.Sprintf("img_%s_%d.%s", shortHash, timestamp, extension)
}

// IsImageURL 判断字符串是否为图片URL
func IsImageURL(path string) bool {
	return strings.HasPrefix(strings.ToLower(path), "http://") ||
		strings.HasPrefix(strings.ToLower(path), "https://")
}
