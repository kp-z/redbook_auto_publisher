# 设置页面测试指南

## 功能验证清单

### 1. 访问设置页面
- 启动前端：`npm run dev`
- 访问：http://localhost:3721/settings
- 检查侧边栏是否显示"设置"图标

### 2. API Key 配置测试

#### Anthropic API Key
1. 输入有效的 API Key（格式：`sk-ant-...`）
2. 点击"保存配置"
3. 验证提示"配置已保存"
4. 刷新页面，检查是否显示为 `••••••••`

#### Replicate API Token
1. 输入有效的 Token（格式：`r8_...`）
2. 保存并验证

### 3. 测试连接功能
1. 配置 API Key 后点击"测试连接"
2. 成功：显示绿色 ✓ "API Key 验证成功"
3. 失败：显示红色 ⚠ "API Key 验证失败"

### 4. MCP 调用验证
1. 配置 Anthropic API Key
2. 访问 http://localhost:3721/image-gen
3. 发送消息测试 AI 生成功能
4. 检查是否不再出现 401 错误

### 5. 数据持久化
- 配置保存在：`frontend/data/config.json`
- 该文件已加入 `.gitignore`，不会提交到 Git

## 预期行为

### 配置读取优先级
1. 优先读取 `data/config.json` 中的配置
2. 如果未配置，回退到环境变量 `ANTHROPIC_API_KEY` / `REPLICATE_API_TOKEN`
3. 如果都未配置，抛出友好错误提示

### 安全性
- API Key 在前端显示时脱敏为 `••••••••`
- 只有用户主动修改时才提交新值
- 配置文件不会提交到版本控制

## 故障排查

### 401 错误仍然出现
1. 检查 `data/config.json` 是否存在且包含有效 API Key
2. 重启前端服务
3. 清除浏览器缓存

### 配置保存失败
1. 检查 `data/` 目录权限
2. 查看控制台错误日志
3. 验证 API 路由 `/api/config` 是否正常

## 完成标准

- [x] 设置页面可访问
- [x] API Key 配置功能正常
- [x] 配置持久化到 `data/config.json`
- [x] Claude Client 从配置读取 API Key
- [x] Replicate Client 从配置读取 Token
- [x] 配置文件已加入 `.gitignore`
- [x] 构建通过无错误
