# AI 穿搭生成 — 设计文档

**日期**: 2026-05-27
**状态**: 已验证

## 目标

用阿里云 AI API 替代现有的 Canvas 绝对定位拼接方案，实现：
- Qwen-VL 分析衣物照片生成详细描述
- 通义万相根据描述生成模特穿搭效果图
- 用户只需填写阿里云 API Key 即可使用

## 架构概览

```
衣物照片 → Qwen-VL 逐件分析 → 详细描述(text)
                                    ↓
              拼接 prompt → 通义万相 text2image → 效果图(URL)
                                    ↓
                             前端展示 + 保存
```

## 文件清单

| 文件 | 类型 | 职责 |
|------|------|------|
| `src/api/dashscope.ts` | 新增 | API 封装层，千问 + 万相调用 |
| `src/composables/useOutfitGenerator.ts` | 新增 | 搭配生成状态管理、缓存、流程编排 |
| `src/pages/settings/index.vue` | 改造 | 增加 API Key 配置入口 |
| `src/pages/match/index.vue` | 改造 | 智能搭配页改为生成图展示 |
| `src/pages/match/manual.vue` | 改造 | 手动搭配页改为生成图展示 |
| `vite.config.ts` | 改造 | 添加 DashScope 代理规则 |
| `proxy.js` | 新增 | 生产环境极简代理脚本 |

## API 层设计

### DashScope 封装 (`src/api/dashscope.ts`)

**Qwen-VL 图片分析**

- 端点: `POST /api/qwen/services/aigc/multimodal-generation/generation`
- 模型: `qwen-vl-plus` 或 `qwen-vl-max`
- 入参: 照片 base64/URL + prompt "详细描述这件衣服的颜色、版型、材质、花纹、风格"
- 出参: `ClothingDescription { color, pattern, material, fit, neckline, length, style, details }`

**通义万相 图像生成**

- 端点: `POST /api/wanxiang/services/aigc/text2image/image-synthesis`
- 模型: `wanx-v1`
- 入参: 拼接好的穿搭描述 prompt
- 出参: 异步任务 ID → 轮询获取图片 URL

**导出函数**

```ts
analyzeClothing(photo: string): Promise<ClothingDescription>
analyzeClothingBatch(photos: string[]): Promise<ClothingDescription[]>
generateOutfitImage(prompt: string, options?: { gender, style }): Promise<string>
isKeyConfigured(): boolean
testConnection(): Promise<boolean>
```

### 缓存

- 同一照片 URL → 分析结果的缓存存在 localStorage
- 避免重复分析浪费 API 额度

### API Key 管理

- 存 localStorage key: `dashscope_api_key`
- 设置页输入框脱敏显示（`sk-***xxxx`）
- 提供"测试连接"按钮验证 Key

## 代理方案

### 开发环境

```ts
// vite.config.ts server.proxy
{
  '/api/qwen': {
    target: 'https://dashscope.aliyuncs.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/qwen/, '/api/v1')
  },
  '/api/wanxiang': {
    target: 'https://dashscope.aliyuncs.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/wanxiang/, '/api/v1')
  }
}
```

### 生产环境

`proxy.js` — 极简 Express 代理，约 30 行。启动: `node proxy.js`。
前端检测是否配置了生产 API 地址，未配置则走相对路径、由 proxy.js 转发。

## 页面改造

### 设置页

增设 "AI 搭配设置" 区域：
- API Key 输入框（脱敏显示）
- 配置状态指示（已配置/未配置）
- [测试连接] 按钮

### 智能搭配页 (index.vue)

- 删除 `TryOnCanvas` 预览 + `OutfitCard` 中的 Canvas 模式
- 点击生成后显示进度提示
- 结果以图片卡片形式展示
- 保留换一批、保存、应用功能

### 手动搭配页 (manual.vue)

- 删除 `TryOnCanvas` 组件
- 用户勾选衣物后点"生成效果图"
- 展示生成的模特效果图
- 保留重置、导出、保存穿搭功能

## 错误处理

- API Key 未配置 → 提示前往设置页配置
- API Key 无效 → 提示检查 Key 或重新配置
- Qwen-VL 分析失败 → 降级使用本地标签(颜色+类型)拼接 prompt
- 万相生成超时 → 重试一次，仍失败则提示
- 网络错误 → 统一 toast 提示

## 待删除的旧代码

生成效果图功能上线并验证后，可清理：
- `src/components/TryOnCanvas.vue`（不再需要 Canvas 叠加）
- `src/components/ModelSwitch.vue`（性别选择融入 prompt 参数）
- `src/store/match.ts` 中的 `modelGender`/`modelImage` 状态
