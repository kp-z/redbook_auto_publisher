package validator

import (
	"os"
	"path/filepath"
	"testing"
)

func TestValidateImage(t *testing.T) {
	validator := &FileValidator{}

	tests := []struct {
		name    string
		setup   func() string
		wantErr bool
	}{
		{
			name: "不存在的文件",
			setup: func() string {
				return "/tmp/nonexistent.jpg"
			},
			wantErr: true,
		},
		{
			name: "空文件",
			setup: func() string {
				tmpFile := filepath.Join(os.TempDir(), "empty.jpg")
				os.WriteFile(tmpFile, []byte{}, 0644)
				return tmpFile
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := tt.setup()
			defer os.Remove(path)

			err := validator.ValidateImage(path)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateImage() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateImages(t *testing.T) {
	validator := &FileValidator{}

	tests := []struct {
		name    string
		paths   []string
		wantErr bool
	}{
		{
			name:    "空列表",
			paths:   []string{},
			wantErr: true,
		},
		{
			name:    "超过9张",
			paths:   make([]string, 10),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.ValidateImages(tt.paths)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateImages() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
