# AI 穿搭生成 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Canvas-based outfit compositing with Qwen-VL + Tongyi Wanxiang API pipeline for AI-generated outfit images.

**Architecture:** New `src/api/dashscope.ts` wraps both APIs behind the Vite proxy. A `useOutfitGenerator` composable orchestrates the analyze→generate pipeline with localStorage caching. Settings page gains an API Key input. Match pages drop TryOnCanvas in favor of showing generated images directly.

**Tech Stack:** TypeScript, Vue 3 + Pinia, uni-app H5, DashScope (Qwen-VL + Wanxiang), Vite proxy

---

### Task 1: Add Vite proxy rules

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Add DashScope proxy entries to vite.config.ts**

Read the file first:
```
vite.config.ts
```

Replace:
```ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
})
```

With:
```ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  server: {
    proxy: {
      '/api/qwen': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/qwen/, '/api/v1')
      },
      '/api/wanxiang': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/wanxiang/, '/api/v1')
      }
    }
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add vite.config.ts
git commit -m "feat: add DashScope API proxy rules to Vite config"
```

---

### Task 2: Create DashScope API module

**Files:**
- Create: `src/api/dashscope.ts`

- [ ] **Step 1: Create the API module**

Write `src/api/dashscope.ts`:

```ts
/* ==================== Types ==================== */

export interface ClothingDescription {
  color: string
  pattern: string
  material: string
  fit: string
  neckline: string
  length: string
  style: string
  details: string
}

export interface GenerateOptions {
  gender?: 'male' | 'female'
  style?: string
  size?: string
}

const API_KEY_STORAGE = 'dashscope_api_key'
const CACHE_STORAGE = 'dashscope_cache'

/* ==================== API Key ==================== */

function getApiKey(): string {
  try {
    return uni.getStorageSync(API_KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function setApiKey(key: string): void {
  uni.setStorageSync(API_KEY_STORAGE, key)
}

export function isKeyConfigured(): boolean {
  return getApiKey().length > 0
}

/* ==================== Cache ==================== */

function getCache(): Record<string, ClothingDescription> {
  try {
    const raw = uni.getStorageSync(CACHE_STORAGE)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setCacheItem(key: string, value: ClothingDescription): void {
  const cache = getCache()
  cache[key] = value
  uni.setStorageSync(CACHE_STORAGE, JSON.stringify(cache))
}

function getCacheItem(key: string): ClothingDescription | null {
  return getCache()[key] || null
}

/* ==================== HTTP Helpers ==================== */

function getAuthHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json'
  }
}

async function qwenFetch(endpoint: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`/api/qwen${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Qwen API error ${res.status}: ${text}`)
  }
  return res.json()
}

async function wanxiangFetch(endpoint: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`/api/wanxiang${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Wanxiang API error ${res.status}: ${text}`)
  }
  return res.json()
}

/* ==================== Qwen-VL: Analyze Clothing ==================== */

export async function analyzeClothing(photo: string): Promise<ClothingDescription> {
  const cached = getCacheItem(photo)
  if (cached) return cached

  const prompt = `请仔细描述这件衣服的以下属性，以JSON格式返回，不要添加任何额外文字：
{
  "color": "颜色（如米白色、深蓝色）",
  "pattern": "花纹（如纯色、条纹、格子、碎花）",
  "material": "材质（如纯棉、牛仔、针织、雪纺）",
  "fit": "版型（如修身、宽松、直筒、A字）",
  "neckline": "领型（如圆领、V领、翻领、连帽；下装填无）",
  "length": "衣长/裤长（如短款、常规、长款、七分）",
  "style": "风格（如休闲、通勤、运动、甜美、街头）",
  "details": "细节特征（如图案印花、破洞、蕾丝、刺绣等）"
}`

  const result = await qwenFetch('/services/aigc/multimodal-generation/generation', {
    model: 'qwen-vl-plus',
    input: {
      messages: [
        {
          role: 'user',
          content: [
            { image: photo },
            { text: prompt }
          ]
        }
      ]
    }
  }) as {
    output?: {
      choices?: Array<{
        message?: { content?: Array<{ text?: string }> }
      }>
    }
  }

  const text = result.output?.choices?.[0]?.message?.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse clothing description from Qwen-VL response')
  }

  const description: ClothingDescription = JSON.parse(jsonMatch[0])
  setCacheItem(photo, description)
  return description
}

export async function analyzeClothingBatch(
  photos: string[]
): Promise<ClothingDescription[]> {
  return Promise.all(photos.map(p => analyzeClothing(p)))
}

/* ==================== Tongyi Wanxiang: Generate Outfit Image ==================== */

export function buildOutfitPrompt(
  descriptions: ClothingDescription[],
  options: GenerateOptions = {}
): string {
  const gender = options.gender === 'male' ? '男' : '女'
  const parts = descriptions.map((d, i) => {
    const label = i === 0 ? '上衣' :
      i === 1 ? '下装' :
      i === 2 ? '外套' :
      i === 3 ? '鞋子' : '配饰'
    return `${label}: ${d.color}${d.pattern}${d.material}${d.fit}${d.details}`
  })

  const styleHint = options.style ? `整体风格${options.style}` : ''
  return `一位${gender}性模特穿着${parts.join('，')}，${styleHint}，全身站立照，白色背景，服装展示，高清，真实感`
}

export async function generateOutfitImage(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const result = await wanxiangFetch('/services/aigc/text2image/image-synthesis', {
    model: 'wanx-v1',
    input: { prompt },
    parameters: {
      size: options.size || '1024*1024',
      n: 1
    }
  }) as {
    output?: { task_id?: string }
  }

  const taskId = result.output?.task_id
  if (!taskId) {
    throw new Error('No task_id returned from Wanxiang')
  }

  // Poll for result
  const imageUrl = await pollTask(taskId)
  return imageUrl
}

async function pollTask(taskId: string, maxAttempts = 30, intervalMs = 2000): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/wanxiang/tasks/${taskId}`, {
      headers: getAuthHeaders()
    })
    if (!res.ok) {
      throw new Error(`Task polling failed: ${res.status}`)
    }

    const data = await res.json() as {
      output?: {
        task_status?: string
        results?: Array<{ url?: string }>
      }
    }

    const status = data.output?.task_status
    if (status === 'SUCCEEDED') {
      const url = data.output?.results?.[0]?.url
      if (!url) throw new Error('No image URL in completed task')
      return url
    }
    if (status === 'FAILED') {
      throw new Error('Image generation task failed')
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error('Image generation timed out')
}

/* ==================== Connection Test ==================== */

export async function testConnection(): Promise<boolean> {
  try {
    await qwenFetch('/services/aigc/multimodal-generation/generation', {
      model: 'qwen-vl-plus',
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: '回复OK' }]
          }
        ]
      }
    })
    return true
  } catch {
    return false
  }
}

/* ==================== Fallback: Build prompt from clothing metadata ==================== */

export function buildPromptFromMetadata(
  clothes: Array<{ name: string; color: string; type: string; subType: string }>,
  options: GenerateOptions = {}
): string {
  const gender = options.gender === 'male' ? '男' : '女'
  const parts = clothes.map(c => `${c.color}${c.subType || c.name}`)
  const styleHint = options.style ? `整体风格${options.style}` : ''
  return `一位${gender}性模特穿着${parts.join('，')}，${styleHint}，全身站立照，白色背景，服装展示，高清，真实感`
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx vue-tsc --noEmit src/api/dashscope.ts 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/api/dashscope.ts
git commit -m "feat: add DashScope API module for Qwen-VL and Wanxiang"
```

---

### Task 3: Create useOutfitGenerator composable

**Files:**
- Create: `src/composables/useOutfitGenerator.ts`

- [ ] **Step 1: Create the composable**

Write `src/composables/useOutfitGenerator.ts`:

```ts
import { ref } from 'vue'
import type { Clothing, Outfit } from '@/types'
import {
  analyzeClothing,
  analyzeClothingBatch,
  buildOutfitPrompt,
  buildPromptFromMetadata,
  generateOutfitImage,
  isKeyConfigured,
  type GenerateOptions
} from '@/api/dashscope'

export function useOutfitGenerator() {
  const isGenerating = ref(false)
  const currentStep = ref<'idle' | 'analyzing' | 'generating' | 'done'>('idle')
  const resultImage = ref('')
  const error = ref('')

  async function generateFromClothes(
    clothes: Clothing[],
    options: GenerateOptions = {}
  ): Promise<string> {
    if (!isKeyConfigured()) {
      error.value = '请先在设置页配置阿里云 API Key'
      uni.showToast({ title: error.value, icon: 'none' })
      return ''
    }

    if (clothes.length === 0) {
      error.value = '请选择至少一件衣物'
      uni.showToast({ title: error.value, icon: 'none' })
      return ''
    }

    isGenerating.value = true
    error.value = ''
    currentStep.value = 'analyzing'

    try {
      // Phase 1: Analyze clothing photos with Qwen-VL
      const photos = clothes.map(c => c.photo).filter(Boolean)
      let descriptions

      try {
        descriptions = await analyzeClothingBatch(photos)
      } catch (e) {
        // Fallback: use metadata
        console.warn('Qwen-VL analysis failed, using metadata fallback:', e)
        const prompt = buildPromptFromMetadata(
          clothes.map(c => ({
            name: c.name,
            color: c.color,
            type: c.type,
            subType: c.subType
          })),
          options
        )
        currentStep.value = 'generating'
        try {
          const imgUrl = await generateOutfitImage(prompt, options)
          resultImage.value = imgUrl
          currentStep.value = 'done'
          return imgUrl
        } catch (genErr) {
          error.value = '图像生成失败，请重试'
          uni.showToast({ title: error.value, icon: 'none' })
          return ''
        }
      }

      // Phase 2: Build prompt and generate image
      currentStep.value = 'generating'
      const prompt = buildOutfitPrompt(descriptions, options)

      try {
        const imgUrl = await generateOutfitImage(prompt, options)
        resultImage.value = imgUrl
        currentStep.value = 'done'
        return imgUrl
      } catch (genErr) {
        error.value = '图像生成失败，请重试'
        uni.showToast({ title: error.value, icon: 'none' })
        return ''
      }
    } finally {
      isGenerating.value = false
    }
  }

  function reset(): void {
    isGenerating.value = false
    currentStep.value = 'idle'
    resultImage.value = ''
    error.value = ''
  }

  return {
    isGenerating,
    currentStep,
    resultImage,
    error,
    generateFromClothes,
    reset
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/composables/useOutfitGenerator.ts
git commit -m "feat: add useOutfitGenerator composable with fallback logic"
```

---

### Task 4: Create production proxy script

**Files:**
- Create: `proxy.js`

- [ ] **Step 1: Create the proxy script**

Write `proxy.js`:

```js
// Minimal proxy for DashScope API in production
// Usage: node proxy.js
// Then set your frontend base URL to http://localhost:3000

const http = require('http')
const https = require('https')

const PORT = process.env.PORT || 3000
const TARGET = 'dashscope.aliyuncs.com'

const server = http.createServer((req, res) => {
  // Forward API key from request header
  const auth = req.headers['authorization']

  const options = {
    hostname: TARGET,
    path: req.url.replace('/api/qwen', '/api/v1').replace('/api/wanxiang', '/api/v1'),
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth || ''
    }
  }

  const proxy = https.request(options, (pres) => {
    res.writeHead(pres.statusCode, pres.headers)
    pres.pipe(res)
  })

  proxy.on('error', (err) => {
    res.writeHead(502)
    res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }))
  })

  req.pipe(proxy)
})

server.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`)
})
```

- [ ] **Step 2: Commit**

```bash
git add proxy.js
git commit -m "feat: add production proxy script for DashScope API"
```

---

### Task 5: Add API Key configuration to Settings page

**Files:**
- Modify: `src/pages/settings/index.vue`

- [ ] **Step 1: Read current settings page**

The file is at `src/pages/settings/index.vue`. We need to add an "AI 搭配设置" section before the "关于" section.

- [ ] **Step 2: Add import and reactive state**

In the `<script setup>` block, add after the existing imports:

```ts
import { ref, onMounted } from 'vue'
import { isKeyConfigured, setApiKey, testConnection } from '@/api/dashscope'
```

Note: Change the existing `import { ref } from 'vue'` to `import { ref, onMounted } from 'vue'`.

- [ ] **Step 3: Add state and handlers**

Add this block after the existing `const notifications = ref(true)` line:

```ts
const apiKey = ref('')
const keyConfigured = ref(false)
const keyVisible = ref(false)
const testing = ref(false)

onMounted(() => {
  keyConfigured.value = isKeyConfigured()
  if (keyConfigured.value) {
    try {
      const stored = uni.getStorageSync('dashscope_api_key')
      if (stored) {
        apiKey.value = maskKey(stored as string)
      }
    } catch {}
  }
})

function maskKey(key: string): string {
  if (key.length <= 8) return '***'
  return key.slice(0, 4) + '***' + key.slice(-4)
}

function handleSaveKey() {
  if (!apiKey.value || apiKey.value.includes('***')) return
  setApiKey(apiKey.value)
  keyConfigured.value = true
  apiKey.value = maskKey(apiKey.value)
  uni.showToast({ title: 'API Key 已保存', icon: 'success' })
}

function handleClearKey() {
  setApiKey('')
  keyConfigured.value = false
  apiKey.value = ''
  uni.showToast({ title: 'API Key 已清除', icon: 'none' })
}

function handleToggleVisibility() {
  if (!keyConfigured.value) return
  if (keyVisible.value) {
    apiKey.value = maskKey(uni.getStorageSync('dashscope_api_key') as string)
  } else {
    apiKey.value = uni.getStorageSync('dashscope_api_key') as string || ''
  }
  keyVisible.value = !keyVisible.value
}

async function handleTestConnection() {
  if (!isKeyConfigured()) {
    uni.showToast({ title: '请先保存 API Key', icon: 'none' })
    return
  }
  testing.value = true
  const ok = await testConnection()
  testing.value = false
  uni.showToast({ title: ok ? '连接成功' : '连接失败，请检查 Key', icon: ok ? 'success' : 'none' })
}
```

- [ ] **Step 4: Add the AI settings section in template**

Insert this new section right before the "关于" section (`<view class="settings-section">` with `<view class="section-title">关于</view>`):

```html
      <view class="settings-section">
        <view class="section-title">AI 搭配设置</view>
        <view class="settings-list">
          <view class="settings-item">
            <text class="item-icon">🤖</text>
            <text class="item-text">阿里云 API Key</text>
          </view>
          <view class="api-key-row">
            <input
              class="api-key-input"
              :value="apiKey"
              :type="keyVisible ? 'text' : 'password'"
              placeholder="输入 DashScope API Key"
              @input="(e: any) => apiKey = e.detail.value"
            />
            <view class="api-key-icons">
              <view class="key-icon-btn" @click="handleToggleVisibility" v-if="keyConfigured">
                <text>{{ keyVisible ? '🙈' : '👁️' }}</text>
              </view>
            </view>
          </view>
          <view class="api-key-actions">
            <view class="btn btn-sm btn-primary" @click="handleSaveKey">保存</view>
            <view class="btn btn-sm btn-outline" @click="handleClearKey" v-if="keyConfigured">清除</view>
          </view>
          <view class="settings-item">
            <text class="item-text">状态</text>
            <text class="item-sub" :style="{ color: keyConfigured ? '#4CAF50' : '#999' }">
              {{ keyConfigured ? '● 已配置' : '○ 未配置' }}
            </text>
          </view>
          <view class="settings-item" @click="handleTestConnection">
            <text class="item-text">测试连接</text>
            <text class="item-sub" v-if="testing">检测中...</text>
            <text class="item-arrow" v-else>›</text>
          </view>
        </view>
      </view>
```

- [ ] **Step 5: Add scoped styles**

Add before the closing `</style>` tag:

```scss
.api-key-row {
  display: flex;
  align-items: center;
  padding: 0 $spacing-md $spacing-sm;
  gap: $spacing-sm;
}

.api-key-input {
  flex: 1;
  height: 80rpx;
  background-color: $bg-gray;
  border-radius: $border-radius;
  padding: 0 $spacing-md;
  font-size: $font-size-sm;
  color: $text-primary;
}

.api-key-icons {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.key-icon-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.api-key-actions {
  display: flex;
  gap: $spacing-sm;
  padding: 0 $spacing-md $spacing-md;
}

.btn-sm {
  padding: 12rpx 32rpx;
  font-size: 24rpx;
  border-radius: $border-radius;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/settings/index.vue
git commit -m "feat: add API Key configuration to settings page"
```

---

### Task 6: Update OutfitCard to support image preview

**Files:**
- Modify: `src/components/OutfitCard.vue`

- [ ] **Step 1: Replace TryOnCanvas preview with image preview**

The current OutfitCard uses TryOnCanvas for `showPreview` mode. We need to replace it with a simple `<image>` tag that shows the generated outfit image.

In the template, change:

```html
    <view class="outfit-preview" v-if="showPreview && modelSrc">
      <TryOnCanvas
        :model-src="modelSrc"
        :clothes="displayClothes"
        :canvas-width="previewW"
        :canvas-height="previewH"
      />
    </view>
```

To:

```html
    <view class="outfit-preview" v-if="showPreview && previewImage">
      <image :src="previewImage" mode="aspectFit" class="preview-image" />
    </view>
```

- [ ] **Step 2: Remove TryOnCanvas import and add previewImage prop**

In the script section:

Remove the import:
```ts
import TryOnCanvas from '@/components/TryOnCanvas.vue'
```

Add `previewImage` prop to props definition:
```ts
const props = defineProps<{
  outfit: Outfit
  showActions?: boolean
  showPreview?: boolean
  modelSrc?: string
  previewImage?: string
}>()
```

Remove:
```ts
const previewW = 140
const previewH = 200
```

- [ ] **Step 3: Add preview image styles**

Replace `.outfit-preview` style:

```scss
.outfit-preview {
  padding: $spacing-sm;
  display: flex;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 360rpx;
  border-radius: $border-radius;
}
```

The old style (with the same name) should be replaced.

- [ ] **Step 4: Commit**

```bash
git add src/components/OutfitCard.vue
git commit -m "feat: replace TryOnCanvas preview with image preview in OutfitCard"
```

---

### Task 7: Refactor smart match page for AI generation

**Files:**
- Modify: `src/pages/match/index.vue`

- [ ] **Step 1: Read current file to understand the full structure**

The file is at `src/pages/match/index.vue`. We need to:
- Remove ModelSwitch component
- Add generate button flow
- Replace OutfitCard rendering to pass generated images
- Show loading/progress state during generation

- [ ] **Step 2: Replace script section**

Replace the entire `<script setup>` block:

```ts
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMatchStore } from '@/store/match'
import { useWardrobeStore } from '@/store/wardrobe'
import type { Outfit, Clothing } from '@/types'
import { isKeyConfigured } from '@/api/dashscope'
import { useOutfitGenerator } from '@/composables/useOutfitGenerator'
import OutfitCard from '@/components/OutfitCard.vue'
import TabBar from '@/components/TabBar.vue'

const match = useMatchStore()
const wardrobe = useWardrobeStore()
const { isGenerating, currentStep, resultImage, error, generateFromClothes, reset: resetGenerator } = useOutfitGenerator()

const activeMode = ref('smart')
const smartOutfits = ref<Array<Outfit & { generatedImage?: string }>>([])

const savedOutfits = computed(() => match.outfits)

const stepLabel: Record<string, string> = {
  analyzing: '正在分析衣物...',
  generating: '正在生成效果图...'
}

const getDisplayClothes = (outfit: Outfit): Clothing[] => {
  return outfit.clothes
    .map(id => wardrobe.getClothingById(id))
    .filter((c): c is Clothing => c !== undefined)
}

const generateOutfits = async () => {
  if (!isKeyConfigured()) {
    uni.showModal({
      title: '未配置 API Key',
      content: '请先在设置页配置阿里云 API Key 以使用 AI 搭配生成',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/settings/index' })
        }
      }
    })
    return
  }

  const active = wardrobe.getActiveClothes()
  if (active.length < 2) {
    uni.showToast({ title: '请先添加至少2件衣物并设为激活', icon: 'none' })
    return
  }

  // Generate 3 outfit combinations from wardrobe
  const combos = match.generateSmartOutfits(3)
  if (combos.length === 0) {
    uni.showToast({ title: '暂无可搭配的衣物组合', icon: 'none' })
    return
  }

  smartOutfits.value = []
  resetGenerator()

  for (const outfit of combos) {
    const clothes = getDisplayClothes(outfit)
    if (clothes.length < 2) continue

    const imageUrl = await generateFromClothes(clothes, {
      gender: 'female',
      style: outfit.scene
    })

    smartOutfits.value.push({
      ...outfit,
      generatedImage: imageUrl || undefined
    })
  }

  if (smartOutfits.value.length > 0) {
    uni.showToast({ title: `已生成${smartOutfits.value.length}套搭配`, icon: 'success' })
  } else {
    uni.showToast({ title: '生成失败，请重试', icon: 'none' })
  }
}

const handleOutfitClick = (outfit: Outfit) => {
  match.addToHistory(outfit.id)
}

const handleFavorite = (outfit: Outfit) => {
  if (outfit.id.startsWith('temp')) {
    match.addOutfit({
      name: outfit.name,
      description: outfit.description,
      clothes: outfit.clothes,
      scene: outfit.scene,
      season: outfit.season,
      isFavorite: true
    })
    uni.showToast({ title: '已保存到我的穿搭', icon: 'success' })
  } else {
    match.toggleFavorite(outfit.id)
    uni.showToast({
      title: outfit.isFavorite ? '已取消收藏' : '已收藏',
      icon: 'none'
    })
  }
}

const handleSave = (outfit: Outfit) => {
  match.addOutfit({
    name: outfit.name,
    description: outfit.description,
    clothes: outfit.clothes,
    scene: outfit.scene,
    season: outfit.season,
    isFavorite: false
  })
  uni.showToast({ title: '已保存到我的穿搭', icon: 'success' })
}

const handleApply = (outfit: Outfit) => {
  match.addToHistory(outfit.id)
  uni.showToast({ title: `已应用穿搭: ${outfit.name}`, icon: 'success' })
}

const goToManual = () => {
  uni.navigateTo({ url: '/pages/match/manual' })
}

const goToAddClothing = () => {
  uni.navigateTo({ url: '/pages/wardrobe/add' })
}

const handleBack = () => {
  uni.navigateBack({ delta: 1 })
}

onMounted(() => {
  wardrobe.loadClothes()
  match.loadOutfits()
  if (isKeyConfigured() && wardrobe.clothes.length >= 2) {
    // Optionally auto-generate on mount
  }
})

onShow(() => {
  wardrobe.loadClothes()
  match.loadOutfits()
})

onUnmounted(() => {
  resetGenerator()
})
```

- [ ] **Step 3: Replace the smart outfit list template**

Replace the smart mode section (`v-if="activeMode === 'smart'"`) template:

```html
      <view class="outfit-section" v-if="activeMode === 'smart'">
        <view class="section-header">
          <text class="section-title">AI 智能搭配</text>
          <text class="section-hint">AI 分析衣物并生成穿搭效果图</text>
        </view>

        <view class="generate-area" v-if="smartOutfits.length === 0 && !isGenerating">
          <view class="generate-hint">
            <text class="generate-icon">✨</text>
            <text class="generate-text">AI 将分析你的衣橱，生成模特穿搭效果图</text>
          </view>
          <view class="btn btn-primary btn-generate" @click="generateOutfits">
            <text>开始生成搭配</text>
          </view>
        </view>

        <view class="generating-area" v-if="isGenerating">
          <view class="generating-spinner">
            <text class="spinner-icon">⏳</text>
          </view>
          <text class="generating-text">{{ stepLabel[currentStep] || '处理中...' }}</text>
          <text class="generating-hint">预计需要 10-30 秒</text>
        </view>

        <view class="outfit-list" v-if="smartOutfits.length > 0">
          <view
            v-for="outfit in smartOutfits"
            :key="outfit.id"
            class="outfit-card-wrapper"
          >
            <OutfitCard
              :outfit="outfit"
              :show-actions="true"
              :show-preview="true"
              :preview-image="outfit.generatedImage"
              @click="handleOutfitClick"
              @favorite="handleFavorite"
            />
            <view class="outfit-actions-bottom">
              <view class="btn btn-outline btn-sm" @click="handleSave(outfit)">保存</view>
              <view class="btn btn-primary btn-sm" @click="handleApply(outfit)">应用</view>
            </view>
          </view>

          <view class="btn btn-outline btn-refresh" @click="generateOutfits">
            <text>换一批</text>
          </view>
        </view>

        <view class="empty-state" v-if="!isKeyConfigured() && !isGenerating">
          <text class="empty-icon">🔑</text>
          <text class="empty-text">需要配置 API Key</text>
          <text class="empty-hint">前往设置页配置阿里云 API Key</text>
          <view class="btn btn-primary mt-md" @click="() => uni.navigateTo({ url: '/pages/settings/index' })">前往设置</view>
        </view>
      </view>
```

- [ ] **Step 4: Remove ModelSwitch bar from template**

Remove this block:
```html
      <view class="model-switch-bar">
        <ModelSwitch v-model="match.modelGender" />
      </view>
```

- [ ] **Step 5: Replace history section's OutfitCard props**

In the history section, remove `:show-preview="true"` and `:model-src="match.modelImage"` from OutfitCard:

```html
            <OutfitCard :outfit="outfit" :show-actions="true" @click="handleOutfitClick" @favorite="handleFavorite" />
```

- [ ] **Step 6: Add new styles**

Add before the closing `</style>` tag:

```scss
.generate-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl $spacing-md;
}

.generate-icon {
  font-size: 64rpx;
  display: block;
  text-align: center;
}

.generate-text {
  font-size: $font-size-sm;
  color: $text-secondary;
  text-align: center;
  margin-top: $spacing-sm;
  display: block;
}

.generate-hint {
  margin-bottom: $spacing-lg;
  text-align: center;
}

.btn-generate {
  padding: 24rpx 64rpx;
  font-size: $font-size-base;
  border-radius: $border-radius;
}

.generating-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl;
}

.spinner-icon {
  font-size: 64rpx;
}

.generating-spinner {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.generating-text {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: 500;
  margin-top: $spacing-md;
}

.generating-hint {
  font-size: $font-size-sm;
  color: $text-light;
  margin-top: $spacing-xs;
}

.btn-refresh {
  margin-top: $spacing-md;
  align-self: center;
  padding: 16rpx 48rpx;
}

.mt-md {
  margin-top: $spacing-md;
}
```

- [ ] **Step 7: Remove the `.model-switch-bar` style block**

Delete:
```scss
.model-switch-bar {
  display: flex;
  justify-content: center;
  padding: 0 $spacing-md $spacing-sm;
}
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/match/index.vue
git commit -m "feat: refactor smart match page to use AI generation pipeline"
```

---

### Task 8: Refactor manual match page for AI generation

**Files:**
- Modify: `src/pages/match/manual.vue`

- [ ] **Step 1: Read current file**

The file is at `src/pages/match/manual.vue`. We need to replace TryOnCanvas with generated image display.

- [ ] **Step 2: Replace entire script section**

```ts
import { ref, computed } from 'vue'
import { useWardrobeStore } from '@/store/wardrobe'
import { useMatchStore } from '@/store/match'
import type { Clothing } from '@/types'
import { isKeyConfigured } from '@/api/dashscope'
import { useOutfitGenerator } from '@/composables/useOutfitGenerator'
import NavBar from '@/components/NavBar.vue'
import ModelSwitch from '@/components/ModelSwitch.vue'

const wardrobe = useWardrobeStore()
const match = useMatchStore()
const { isGenerating, currentStep, resultImage, error, generateFromClothes, reset: resetGenerator } = useOutfitGenerator()

const activeCategory = ref('top')
const selectedIds = ref<Set<string>>(new Set())

const stepLabel: Record<string, string> = {
  analyzing: '正在分析选中的衣物...',
  generating: '正在生成效果图...'
}

const categories = [
  { value: 'top', label: '上衣' },
  { value: 'pants', label: '裤子' },
  { value: 'skirt', label: '裙子' },
  { value: 'coat', label: '外套' },
  { value: 'shoes', label: '鞋子' },
  { value: 'accessory', label: '配饰' },
]

const filteredClothes = computed(() =>
  wardrobe.clothes.filter(c => c.type === activeCategory.value)
)

const selectedClothes = computed(() =>
  wardrobe.clothes.filter(c => selectedIds.value.has(c.id))
)

const isSelected = (id: string) => selectedIds.value.has(id)

const getCatLabel = (val: string) => {
  return categories.find(c => c.value === val)?.label || val
}

const toggleClothing = (item: Clothing) => {
  if (selectedIds.value.has(item.id)) {
    selectedIds.value.delete(item.id)
  } else {
    selectedIds.value.add(item.id)
  }
}

const handleGenerate = async () => {
  if (!isKeyConfigured()) {
    uni.showModal({
      title: '未配置 API Key',
      content: '请先在设置页配置阿里云 API Key',
      success: (res) => {
        if (res.confirm) uni.navigateTo({ url: '/pages/settings/index' })
      }
    })
    return
  }

  const clothes = selectedClothes.value
  if (clothes.length < 2) {
    uni.showToast({ title: '请至少选择2件衣物', icon: 'none' })
    return
  }

  await generateFromClothes(clothes, {
    gender: match.modelGender,
    style: '休闲'
  })
}

const handleReset = () => {
  selectedIds.value.clear()
  resetGenerator()
}

const handleExport = () => {
  if (!resultImage.value) {
    uni.showToast({ title: '请先生成效果图', icon: 'none' })
    return
  }
  uni.previewImage({ urls: [resultImage.value] })
}

const handleSave = () => {
  if (!resultImage.value) {
    uni.showToast({ title: '请先生成效果图', icon: 'none' })
    return
  }
  match.addOutfit({
    name: 'AI 搭配',
    description: `${selectedIds.value.size} 件衣物 AI 生成`,
    clothes: [...selectedIds.value],
    scene: '自定义',
    season: '四季',
    isFavorite: false,
  })
  uni.showToast({ title: '已保存', icon: 'success' })
}
```

- [ ] **Step 3: Replace template**

Replace the entire `<template>` block:

```html
<template>
  <view class="dressing-page">
    <NavBar title="AI 虚拟试衣间" :show-back="true" />

    <view class="dressing-body">
      <!-- Model gender toggle -->
      <view class="model-bar">
        <ModelSwitch v-model="match.modelGender" />
      </view>

      <!-- Image display area -->
      <view class="canvas-section">
        <view class="image-stage">
          <image
            v-if="resultImage"
            :src="resultImage"
            mode="aspectFit"
            class="result-image"
          />
          <view v-else-if="isGenerating" class="stage-loading">
            <text class="stage-spinner">⏳</text>
            <text class="stage-text">{{ stepLabel[currentStep] || '处理中...' }}</text>
          </view>
          <view v-else class="stage-empty">
            <text class="stage-icon">👗</text>
            <text class="stage-text">选择衣物后点击生成</text>
          </view>
        </view>
      </view>

      <!-- Clothing picker -->
      <view class="picker-section">
        <view class="picker-label">选择衣物</view>

        <scroll-view class="category-tabs" scroll-x :show-scrollbar="false">
          <view
            v-for="cat in categories"
            :key="cat.value"
            class="cat-tab"
            :class="{ active: activeCategory === cat.value }"
            @click="activeCategory = cat.value"
          >
            <text>{{ cat.label }}</text>
          </view>
        </scroll-view>

        <scroll-view
          class="clothing-strip"
          scroll-x
          :show-scrollbar="false"
          v-if="filteredClothes.length > 0"
        >
          <view
            v-for="item in filteredClothes"
            :key="item.id"
            class="clothing-thumb"
            :class="{ selected: isSelected(item.id) }"
            @click="toggleClothing(item)"
          >
            <view class="thumb-img-wrap">
              <image :src="item.photo" mode="aspectFill" />
              <view v-if="isSelected(item.id)" class="thumb-check">
                <text>✓</text>
              </view>
            </view>
            <text class="thumb-name">{{ item.name || '未命名' }}</text>
          </view>
        </scroll-view>
        <view v-else class="empty-cat">
          <text>暂无{{ getCatLabel(activeCategory) }}类衣物，请先添加</text>
        </view>
      </view>

      <!-- Action bar -->
      <view class="action-bar">
        <view class="act-btn reset" @click="handleReset">
          <text>重置</text>
        </view>
        <view class="act-btn export" @click="handleExport">
          <text>导出图片</text>
        </view>
        <view class="act-btn generate" @click="handleGenerate" :class="{ disabled: isGenerating }">
          <text>{{ isGenerating ? '生成中...' : '生成效果图' }}</text>
        </view>
        <view class="act-btn save" @click="handleSave">
          <text>保存穿搭</text>
        </view>
      </view>
    </view>
  </view>
</template>
```

- [ ] **Step 4: Update styles**

Add to the existing style block (replace the `.canvas-section` block and add new styles):

Replace:
```scss
.canvas-section {
  margin: 0 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.06);
}
```

With:
```scss
.canvas-section {
  margin: 0 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.06);
  background: #FFFFFF;
}

.image-stage {
  width: 100%;
  aspect-ratio: 375 / 600;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FAFAFA;
}

.result-image {
  width: 100%;
  height: 100%;
}

.stage-loading,
.stage-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.stage-spinner,
.stage-icon {
  font-size: 64rpx;
}

.stage-text {
  font-size: 24rpx;
  color: #999;
}
```

Add a new action button style:

```scss
.act-btn.generate {
  background: linear-gradient(135deg, #4A90D9, #357ABD);
  color: #FFFFFF;
  font-weight: 600;

  &.disabled {
    opacity: 0.5;
  }
}
```

Update `.action-bar` to use 4 buttons (adjust gap):
```scss
.action-bar {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  border-top: 1rpx solid #F0F0F0;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/match/manual.vue
git commit -m "feat: refactor manual match page to use AI generation"
```

---

### Task 9: Clean up unused code and final integration

**Files:**
- Modify: `src/store/match.ts`
- Remove references: `src/components/ModelSwitch.vue` (keep file but no longer imported by match pages)
- No deletion: `src/components/TryOnCanvas.vue` (kept as fallback, can be removed later)

- [ ] **Step 1: Remove modelGender/modelImage from match store**

In `src/store/match.ts`, remove the model-related state. The manual.vue page still uses `match.modelGender` — we keep only `modelGender` but remove `modelImage` (the computed image path).

Actually, looking at the manual.vue refactor, we still import ModelSwitch and use `match.modelGender`. So we should keep that state for now. But remove `modelImage` since it's no longer used.

Let's just check: after our refactors, is `modelImage` used anywhere?

- `src/pages/match/index.vue` — we removed ModelSwitch and no longer use modelImage ✓
- `src/pages/match/manual.vue` — we still use ModelSwitch and match.modelGender, but not modelImage ✓
- `src/components/OutfitCard.vue` — we removed modelSrc prop usage ✓

So we can remove `modelImage` from the store but keep `modelGender`.

In `src/store/match.ts`:

Remove the two model image imports:
```ts
import boyModel from '@/img/boy_model.png'
import girlModel from '@/img/girl_model.png'
```

Remove the `modelImage` computed:
```ts
const modelImage = computed(() => {
  return modelGender.value === 'male' ? boyModel : girlModel
})
```

And remove `modelImage` from the return statement.

- [ ] **Step 2: Verify no remaining references to removed exports**

```bash
grep -r "modelImage\|TryOnCanvas" src/ --include="*.vue" --include="*.ts" 2>/dev/null
```

Expected: only `TryOnCanvas.vue` file itself, and maybe `outfit-image` class in OutfitCard (not relevant).

- [ ] **Step 3: Commit**

```bash
git add src/store/match.ts
git commit -m "refactor: remove unused modelImage from match store"
```

- [ ] **Step 4: Build verification**

```bash
npm run build:h5 2>&1 | tail -20
```

Verify the build succeeds with no errors.

- [ ] **Step 5: Final commit if any build fixes needed**

```bash
git add -A
git commit -m "chore: fix build issues from AI generation refactor"
```
