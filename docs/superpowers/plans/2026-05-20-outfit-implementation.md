# 穿搭功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于男女模特图片实现 Canvas 合成穿搭预览 + 虚拟试衣间

**Architecture:** 新建 TryOnCanvas 作为共用 Canvas 渲染引擎（静态预览/交互拖拽双模式），重写 manual.vue 为虚拟试衣间，改造 index.vue + OutfitCard 嵌入模特穿搭预览，match store 增加 modelGender 状态管理。

**Tech Stack:** uni-app 3.0 + Vue 3 + Pinia + TypeScript + Canvas 2D API

---

### Task 1: TryOnCanvas 核心组件

**Files:**
- Create: `src/components/TryOnCanvas.vue`

- [ ] **Step 1: 创建 TryOnCanvas.vue — 骨架 + Props 定义**

```vue
<template>
  <view class="tryon-container" :style="containerStyle">
    <canvas
      :canvas-id="canvasId"
      :id="canvasId"
      class="tryon-canvas"
      :style="canvasStyle"
      :disable-scroll="true"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    ></canvas>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, getCurrentInstance } from 'vue'
import type { Clothing } from '@/types'

interface ClothingLayer {
  clothing: Clothing
  x: number
  y: number
  w: number
  h: number
  zIndex: number
}

const props = defineProps<{
  modelSrc: string
  clothes: Clothing[]
  interactive?: boolean
  canvasWidth?: number
  canvasHeight?: number
}>()

const emit = defineEmits<{
  update: [layers: ClothingLayer[]]
  export: [dataURL: string]
}>()

const canvasId = `tryon_${Math.random().toString(36).slice(2, 8)}`
const containerStyle = computed(() => ({
  width: (props.canvasWidth || 375) + 'px',
  height: (props.canvasHeight || 500) + 'px'
}))
const canvasStyle = computed(() => ({
  width: (props.canvasWidth || 375) + 'px',
  height: (props.canvasHeight || 500) + 'px'
}))

const layers = ref<ClothingLayer[]>([])
const modelLoaded = ref(false)
const ctx = ref<any>(null)
const instance = getCurrentInstance()
```

- [ ] **Step 2: 实现模特底图加载与渲染**

在 `onMounted` 中初始化 Canvas Context 并绘制模特底图：

```typescript
const W = computed(() => props.canvasWidth || 375)
const H = computed(() => props.canvasHeight || 500)

const initCanvas = () => {
  ctx.value = uni.createCanvasContext(canvasId, instance?.proxy)

  uni.getImageInfo({
    src: props.modelSrc,
    success: (info) => {
      modelLoaded.value = true
      // 缩放模特图以适应画布，居中放置
      const scale = Math.min(W.value / info.width, H.value / info.height) * 0.9
      const imgW = info.width * scale
      const imgH = info.height * scale
      const x = (W.value - imgW) / 2
      const y = (H.value - imgH) / 2

      // 缓存模特绘制参数
      modelDrawParams.value = { x, y, w: imgW, h: imgH, scale }
      drawAll()
    },
    fail: () => {
      console.error('Failed to load model image:', props.modelSrc)
    }
  })
}

const modelDrawParams = ref({ x: 0, y: 0, w: 0, h: 0, scale: 1 })

const drawModel = () => {
  if (!modelLoaded.value) return
  const m = modelDrawParams.value
  ctx.value.drawImage(props.modelSrc, m.x, m.y, m.w, m.h)
}
```

- [ ] **Step 3: 实现衣物图层渲染 + 类型位置映射**

每种衣物类型在模特身上的默认区域映射：

```typescript
const CLOTHING_REGIONS: Record<string, { xPct: number; yPct: number; wPct: number; hPct: number; zIndex: number }> = {
  top:      { xPct: 0.22, yPct: 0.18, wPct: 0.56, hPct: 0.22, zIndex: 200 },
  pants:    { xPct: 0.22, yPct: 0.42, wPct: 0.56, hPct: 0.30, zIndex: 300 },
  skirt:    { xPct: 0.22, yPct: 0.42, wPct: 0.56, hPct: 0.28, zIndex: 300 },
  coat:     { xPct: 0.20, yPct: 0.15, wPct: 0.60, hPct: 0.28, zIndex: 400 },
  shoes:    { xPct: 0.26, yPct: 0.74, wPct: 0.48, hPct: 0.12, zIndex: 500 },
  accessory:{ xPct: 0.30, yPct: 0.25, wPct: 0.40, hPct: 0.15, zIndex: 600 }
}

const getRegionForClothing = (clothing: Clothing) => {
  return CLOTHING_REGIONS[clothing.type] || CLOTHING_REGIONS['top']
}

const drawClothing = (layer: ClothingLayer) => {
  uni.getImageInfo({
    src: layer.clothing.photo,
    success: (info) => {
      // 按区域比例缩放衣物图
      const scaleX = layer.w / info.width
      const scaleY = layer.h / info.height
      const scale = Math.min(scaleX, scaleY)
      const drawW = info.width * scale
      const drawH = info.height * scale
      const drawX = layer.x + (layer.w - drawW) / 2
      const drawY = layer.y + (layer.h - drawH) / 2
      ctx.value.drawImage(layer.clothing.photo, drawX, drawY, drawW, drawH)
      ctx.value.draw(true)
    }
  })
}
```

- [ ] **Step 4: 实现 drawAll — 全量渲染管线**

```typescript
const drawAll = () => {
  if (!ctx.value || !modelLoaded.value) return
  ctx.value.clearRect(0, 0, W.value, H.value)
  drawModel()
  // 按 zIndex 排序后逐层绘制
  const sorted = [...layers.value].sort((a, b) => a.zIndex - b.zIndex)
  sorted.forEach(layer => drawClothing(layer))
}
```

- [ ] **Step 5: 实现交互模式 — 触摸拖拽**

```typescript
const draggingIndex = ref(-1)
const dragStartPos = ref({ x: 0, y: 0 })
const layerStartPos = ref({ x: 0, y: 0 })

const hitTest = (px: number, py: number): number => {
  // 从上层往下找，返回命中的 layer index
  for (let i = layers.value.length - 1; i >= 0; i--) {
    const l = layers.value[i]
    if (px >= l.x && px <= l.x + l.w && py >= l.y && py <= l.y + l.h) {
      return i
    }
  }
  return -1
}

const handleTouchStart = (e: any) => {
  if (!props.interactive) return
  const touch = e.touches[0]
  const idx = hitTest(touch.x, touch.y)
  if (idx >= 0) {
    draggingIndex.value = idx
    dragStartPos.value = { x: touch.x, y: touch.y }
    layerStartPos.value = { x: layers.value[idx].x, y: layers.value[idx].y }
  }
}

const handleTouchMove = (e: any) => {
  if (draggingIndex.value < 0) return
  const touch = e.touches[0]
  const dx = touch.x - dragStartPos.value.x
  const dy = touch.y - dragStartPos.value.y
  layers.value[draggingIndex.value].x = layerStartPos.value.x + dx
  layers.value[draggingIndex.value].y = layerStartPos.value.y + dy
  drawAll()
}

const handleTouchEnd = () => {
  if (draggingIndex.value >= 0) {
    emit('update', [...layers.value])
  }
  draggingIndex.value = -1
}
```

- [ ] **Step 6: 实现 exposed 方法 + watch 响应**

```typescript
const addClothing = (clothing: Clothing) => {
  const exists = layers.value.find(l => l.clothing.id === clothing.id)
  if (exists) return

  const region = getRegionForClothing(clothing)
  const m = modelDrawParams.value
  const layer: ClothingLayer = {
    clothing,
    x: m.x + region.xPct * m.w,
    y: m.y + region.yPct * m.h,
    w: region.wPct * m.w,
    h: region.hPct * m.h,
    zIndex: region.zIndex
  }
  layers.value.push(layer)
  drawAll()
}

const removeClothing = (id: string) => {
  layers.value = layers.value.filter(l => l.clothing.id !== id)
  drawAll()
}

const reset = () => {
  layers.value = []
  drawAll()
}

const exportImage = () => {
  if (!ctx.value) return
  ctx.value.draw(true, () => {
    uni.canvasToTempFilePath({
      canvasId,
      success: (res) => emit('export', res.tempFilePath),
      fail: () => uni.showToast({ title: '导出失败', icon: 'none' })
    }, instance?.proxy)
  })
}

// 衣物列表变化时重建 layers
watch(() => props.clothes, (newClothes) => {
  if (!props.interactive) {
    layers.value = []
    newClothes.forEach(c => addClothing(c))
  }
}, { immediate: true })

watch(() => props.modelSrc, () => {
  layers.value = []
  modelLoaded.value = false
  setTimeout(initCanvas, 100)
})

defineExpose({ addClothing, removeClothing, reset, exportImage })

onMounted(() => {
  setTimeout(initCanvas, 200)
})
```

- [ ] **Step 7: 添加样式**

```vue
<style lang="scss" scoped>
.tryon-container {
  position: relative;
  overflow: hidden;
  border-radius: $border-radius-md;
  background-color: #e8e8e8;
}
.tryon-canvas {
  display: block;
}
</style>
```

---

### Task 2: ModelSwitch 组件 + match Store 增强

**Files:**
- Create: `src/components/ModelSwitch.vue`
- Modify: `src/store/match.ts`

- [ ] **Step 1: 创建 ModelSwitch.vue**

```vue
<template>
  <view class="model-switch" @click="toggle">
    <view class="switch-option" :class="{ active: modelValue === 'female' }">
      <text>👩🏻 女</text>
    </view>
    <view class="switch-option" :class="{ active: modelValue === 'male' }">
      <text>👦🏻 男</text>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: 'male' | 'female' }>()
const emit = defineEmits<{ 'update:modelValue': [v: 'male' | 'female'] }>()

const toggle = () => {
  emit('update:modelValue', props.modelValue === 'male' ? 'female' : 'male')
}
</script>

<style lang="scss" scoped>
.model-switch {
  display: inline-flex;
  background: $bg-white;
  border-radius: 40rpx;
  padding: 4rpx;
  box-shadow: $shadow-sm;
}
.switch-option {
  padding: 8rpx 24rpx;
  border-radius: 36rpx;
  font-size: $font-size-sm;
  color: $text-secondary;
  transition: all 0.2s;
  &.active {
    background: $primary-color;
    color: #fff;
    font-weight: 600;
  }
}
</style>
```

- [ ] **Step 2: 增强 match Store — 添加 modelGender + 模型路径 computed**

在 `src/store/match.ts` 的 `defineStore` 内部添加：

```typescript
const modelGender = ref<'male' | 'female'>('female')

const setModelGender = (gender: 'male' | 'female') => {
  modelGender.value = gender
}

const modelImage = computed(() => {
  // 使用 import 或静态路径引用模特图片
  return modelGender.value === 'male' 
    ? '/src/img/boy_model.png' 
    : '/src/img/girl_model.png'
})
```

同时在 return 中导出：

```typescript
return {
  // ... existing
  modelGender,
  modelImage,
  setModelGender,
}
```

---

### Task 3: 重写 manual.vue — 虚拟试衣间

**Files:**
- Modify: `src/pages/match/manual.vue` (重写)

- [ ] **Step 1: 重写 template — 虚拟试衣间布局**

```vue
<template>
  <view class="dressing-page">
    <NavBar title="虚拟试衣间" :show-back="true" />

    <scroll-view class="dressing-content" scroll-y>
      <!-- 模特性别切换 -->
      <view class="model-switch-bar">
        <ModelSwitch v-model="currentGender" />
      </view>

      <!-- Canvas 试衣区 -->
      <view class="canvas-section">
        <TryOnCanvas
          ref="tryonRef"
          :model-src="match.modelImage"
          :clothes="selectedClothes"
          :interactive="true"
          :canvas-width="canvasW"
          :canvas-height="canvasH"
          @update="handleLayersUpdate"
        />
        <!-- 交互工具栏 -->
        <view class="canvas-tools" v-if="currentTool">
          <text class="tool-hint">{{ toolHint }}</text>
        </view>
      </view>

      <!-- 衣物分类选择 -->
      <view class="picker-section">
        <scroll-view class="category-tabs" scroll-x>
          <view
            v-for="cat in categories"
            :key="cat.value"
            class="cat-tab"
            :class="{ active: activeCategory === cat.value }"
            @click="activeCategory = cat.value"
          >
            <text>{{ cat.icon }} {{ cat.label }}</text>
          </view>
        </scroll-view>

        <scroll-view class="clothing-strip" scroll-x v-if="filteredClothes.length > 0">
          <view
            v-for="item in filteredClothes"
            :key="item.id"
            class="clothing-thumb"
            :class="{ selected: isSelected(item.id) }"
            @click="toggleClothing(item)"
          >
            <image :src="item.photo" mode="aspectFill" />
            <text class="clothing-name">{{ item.name }}</text>
            <view class="check-mark" v-if="isSelected(item.id)">✓</view>
          </view>
        </scroll-view>
        <view v-else class="empty-cat">
          <text>暂无{{ getCategoryLabel(activeCategory) }}</text>
        </view>
      </view>

      <!-- 已选 + 操作 -->
      <view class="action-bar">
        <view class="btn btn-outline" @click="handleReset">🔄 重置</view>
        <view class="btn btn-primary" @click="handleSave">💾 保存穿搭</view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>
```

- [ ] **Step 2: 重写 script setup**

```typescript
import { ref, computed } from 'vue'
import { useWardrobeStore } from '@/store/wardrobe'
import { useMatchStore } from '@/store/match'
import type { Clothing } from '@/types'
import NavBar from '@/components/NavBar.vue'
import ModelSwitch from '@/components/ModelSwitch.vue'
import TryOnCanvas from '@/components/TryOnCanvas.vue'

const wardrobe = useWardrobeStore()
const match = useMatchStore()

const tryonRef = ref<InstanceType<typeof TryOnCanvas> | null>(null)
const currentGender = ref<'male' | 'female'>(match.modelGender)
const activeCategory = ref('top')
const selectedIds = ref<Set<string>>(new Set())
const currentTool = ref<string | null>(null)

const canvasW = 375
const canvasH = 440

const categories = [
  { value: 'top', label: '上衣', icon: '👕' },
  { value: 'pants', label: '裤子', icon: '👖' },
  { value: 'skirt', label: '裙子', icon: '👗' },
  { value: 'coat', label: '外套', icon: '🧥' },
  { value: 'shoes', label: '鞋子', icon: '👟' },
  { value: 'accessory', label: '配饰', icon: '🎒' }
]

const toolHint = computed(() => '拖拽衣物调整位置')

const filteredClothes = computed(() =>
  wardrobe.clothes.filter(c => c.type === activeCategory.value)
)

const selectedClothes = computed(() =>
  wardrobe.clothes.filter(c => selectedIds.value.has(c.id))
)

const isSelected = (id: string) => selectedIds.value.has(id)

const toggleClothing = (item: Clothing) => {
  if (selectedIds.value.has(item.id)) {
    selectedIds.value.delete(item.id)
    tryonRef.value?.removeClothing(item.id)
  } else {
    selectedIds.value.add(item.id)
    tryonRef.value?.addClothing(item)
  }
}

const handleLayersUpdate = (layers: any[]) => {
  // layers 位置更新，暂不持久化
}

const handleReset = () => {
  selectedIds.value.clear()
  tryonRef.value?.reset()
}

const handleSave = () => {
  if (selectedIds.value.size < 2) {
    uni.showToast({ title: '请至少选择2件衣物', icon: 'none' })
    return
  }
  match.addOutfit({
    name: '我的搭配',
    description: `${selectedIds.value.size} 件衣物`,
    clothes: [...selectedIds.value],
    scene: '自定义',
    season: '四季',
    isFavorite: false
  })
  uni.showToast({ title: '已保存', icon: 'success' })
}

// 同步 modelGender
const stopWatch = watch(currentGender, (v) => match.setModelGender(v))
onUnmounted(() => stopWatch())
```

- [ ] **Step 3: 重写 style**

```vue
<style lang="scss" scoped>
.dressing-page {
  min-height: 100vh;
  background: $bg-color;
}
.dressing-content {
  height: calc(100vh - 180rpx);
}
.model-switch-bar {
  display: flex;
  justify-content: center;
  padding: $spacing-md;
}
.canvas-section {
  margin: 0 $spacing-md;
  position: relative;
}
.canvas-tools {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  background: rgba(0,0,0,0.6);
  border-radius: 12rpx;
  padding: 8rpx 16rpx;
}
.tool-hint {
  color: #fff;
  font-size: $font-size-xs;
}
.picker-section {
  background: $bg-white;
  margin: $spacing-md;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
}
.category-tabs {
  white-space: nowrap;
  margin-bottom: $spacing-sm;
}
.cat-tab {
  display: inline-block;
  padding: 8rpx 20rpx;
  margin-right: 8rpx;
  background: $bg-gray;
  border-radius: 32rpx;
  font-size: $font-size-sm;
  &.active {
    background: $primary-color;
    color: #fff;
  }
}
.clothing-strip {
  white-space: nowrap;
}
.clothing-thumb {
  display: inline-block;
  width: 120rpx;
  margin-right: 12rpx;
  text-align: center;
  position: relative;
  image {
    width: 120rpx;
    height: 120rpx;
    border-radius: $border-radius-md;
    border: 3rpx solid transparent;
  }
  &.selected image {
    border-color: $primary-color;
  }
}
.clothing-name {
  font-size: 20rpx;
  color: $text-secondary;
  display: block;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
}
.check-mark {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 32rpx;
  height: 32rpx;
  background: $primary-color;
  color: #fff;
  border-radius: 50%;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-cat {
  padding: $spacing-lg;
  text-align: center;
  color: $text-light;
}
.action-bar {
  display: flex;
  gap: $spacing-md;
  padding: 0 $spacing-md;
  padding-bottom: calc($spacing-md + env(safe-area-inset-bottom));
}
.btn {
  flex: 1;
  padding: $spacing-md;
  text-align: center;
  border-radius: $border-radius-md;
  font-size: $font-size-md;
  font-weight: 500;
}
.btn-primary {
  background: $primary-color;
  color: #fff;
}
.btn-outline {
  background: $bg-white;
  color: $text-primary;
  border: 1rpx solid $border-color;
}
.bottom-space {
  height: 40rpx;
}
</style>
```

---

### Task 4: 改造智能推荐页 + OutfitCard

**Files:**
- Modify: `src/pages/match/index.vue`
- Modify: `src/components/OutfitCard.vue`

- [ ] **Step 1: 改造 OutfitCard — 新增模特预览区**

修改 `src/components/OutfitCard.vue`，在衣物图片列表上方添加 TryOnCanvas 预览：

```vue
<template>
  <view class="outfit-card" @click="handleClick">
    <!-- 新增：模特穿搭预览 -->
    <view class="outfit-preview" v-if="showPreview">
      <TryOnCanvas
        :model-src="modelSrc"
        :clothes="displayClothes"
        :interactive="false"
        :canvas-width="previewW"
        :canvas-height="previewH"
      />
    </view>

    <!-- 原有衣物图片列表（无预览时显示） -->
    <view class="outfit-images" v-else>
      <!-- ... 保持原有代码不变 ... -->
    </view>

    <!-- 以下保持不变 -->
    <view class="outfit-info">...</view>
    <view class="outfit-actions" v-if="showActions">...</view>
  </view>
</template>
```

在 script 中添加新 props 和导入：

```typescript
import TryOnCanvas from '@/components/TryOnCanvas.vue'

const props = defineProps<{
  outfit: Outfit
  showActions?: boolean
  showPreview?: boolean
  modelSrc?: string
}>()

const previewW = 140
const previewH = 200
```

- [ ] **Step 2: 改造 index.vue — 传入模特图和 preview 模式**

在 `src/pages/match/index.vue` 的 template 中修改 OutfitCard 使用方式：

```vue
<OutfitCard
  :outfit="outfit"
  :show-actions="true"
  :show-preview="true"
  :model-src="match.modelImage"
  @click="handleOutfitClick"
  @favorite="handleFavorite"
/>
```

在 script 中添加 store 引用：

```typescript
import { useMatchStore } from '@/store/match'
const match = useMatchStore()
```

同时在页面顶部添加 ModelSwitch：

```vue
<view class="model-switch-bar">
  <ModelSwitch v-model="match.modelGender" />
</view>
```

---

### Task 5: 导出功能 + 端到端联调

**Files:**
- Modify: `src/pages/match/manual.vue` (补完导出)

- [ ] **Step 1: 补完虚拟试衣间导出功能**

在 manual.vue 的操作栏中增加导出按钮，调用 TryOnCanvas 的 `exportImage` 方法：

```typescript
const handleExport = async () => {
  if (selectedIds.value.size === 0) {
    uni.showToast({ title: '请先选择衣物', icon: 'none' })
    return
  }
  tryonRef.value?.exportImage()
}

// 监听 export 事件
const handleExported = (dataURL: string) => {
  // 保存到相册或预览
  uni.previewImage({ urls: [dataURL] })
}
```

在 template 操作栏添加导出按钮：

```vue
<view class="btn btn-secondary" @click="handleExport">📷 导出</view>
```

在 TryOnCanvas 上绑定 export 事件：

```vue
<TryOnCanvas
  ref="tryonRef"
  ...
  @export="handleExported"
/>
```

- [ ] **Step 2: 确保 match store 数据持久化**

确认 `loadOutfits` 和 `saveOutfits` 在主流程中正确调用（已有逻辑，检查 App.vue 和 index.vue 中的调用即可）。

- [ ] **Step 3: 模特图片路径验证**

确认 `src/img/boy_model.png` 和 `src/img/girl_model.png` 存在且可用。在 H5 模式下运行 `npm run dev:h5`，打开浏览器验证：
- 虚拟试衣间加载模特底图
- 选择衣物后正确叠加渲染
- 智能推荐页卡片显示模特预览
- 模特性别切换正常工作

---

### 完成标准

- [ ] TryOnCanvas 正确渲染模特 + 衣物图层
- [ ] 虚拟试衣间可选择衣物并在模特上拖拽调整
- [ ] 智能推荐卡片展示模特穿搭预览
- [ ] 男/女模特可切换，切换后重新渲染
- [ ] 穿搭可保存并持久化
- [ ] Canvas 可导出穿搭图片
