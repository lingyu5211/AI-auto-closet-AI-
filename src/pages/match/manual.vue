<template>
  <view class="manual-page">
    <NavBar title="虚拟试衣" :show-back="true" />
    
    <scroll-view class="manual-content" scroll-y>
      <view class="canvas-section">
        <view class="canvas-header">
          <text class="section-title">我的试衣间</text>
          <view class="upload-btn" @click="uploadPhoto">
            <text>📷 上传照片</text>
          </view>
        </view>
        
        <view class="canvas-container">
          <view class="canvas-wrapper" v-if="userPhoto">
            <canvas 
              canvas-id="tryOnCanvas" 
              id="tryOnCanvas"
              class="tryon-canvas"
              style="width: 100%; height: 100%;"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            ></canvas>
            
            <canvas 
              canvas-id="maskCanvas" 
              id="maskCanvas"
              class="mask-canvas"
              style="width: 100%; height: 100%;"
            ></canvas>
            
            <view class="clothing-layer">
              <view 
                v-for="(item, index) in selectedClothes" 
                :key="item.id"
                class="clothing-item-wrapper"
                :style="getClothingStyle(item)"
                @touchstart.stop="startDragClothing($event, item, index)"
                @touchmove.stop="dragClothing"
                @touchend.stop="endDragClothing"
              >
                <image :src="item.photo" class="clothing-image" mode="aspectFit" />
                <view class="clothing-resize" @touchstart.stop="startResize($event, item, index)">
                  <text>⤡</text>
                </view>
              </view>
            </view>
            
            <view class="canvas-tools">
              <view 
                class="tool-btn" 
                :class="{ active: currentTool === 'eraser' }"
                @click="currentTool = 'eraser'"
              >
                <text>🧹 擦除</text>
              </view>
              <view 
                class="tool-btn" 
                :class="{ active: currentTool === 'restore' }"
                @click="currentTool = 'restore'"
              >
                <text>✏️ 恢复</text>
              </view>
              <view 
                class="tool-btn" 
                :class="{ active: currentTool === 'move' }"
                @click="currentTool = 'move'"
              >
                <text>✋ 移动</text>
              </view>
              <view 
                class="tool-btn" 
                @click="quickRemoveBg"
              >
                <text>⚡ 快速抠图</text>
              </view>
            </view>
            
            <view class="brush-size">
              <text class="size-label">笔刷大小: {{ brushSize }}px</text>
              <slider 
                :value="brushSize" 
                :min="5" 
                :max="50" 
                :step="1"
                activeColor="#6366f1"
                backgroundColor="#eee"
                block-size="20"
                @change="(e: any) => brushSize = e.detail.value"
              />
            </view>
          </view>
          
          <view class="upload-placeholder" v-else>
            <view class="placeholder-icon">✨</view>
            <text class="placeholder-text">虚拟试衣间</text>
            <text class="placeholder-hint">使用 remove.bg 进行专业抠图</text>
            
            <view class="tips-card">
              <view class="tips-header">
                <text class="tips-icon">💡</text>
                <text class="tips-title">最佳试穿效果</text>
              </view>
              <view class="tips-content">
                <text>1. 打开 <text class="highlight">remove.bg</text> 上传照片</text>
                <text>2. AI 自动抠图，精细调整边缘</text>
                <text>3. 下载透明背景图片</text>
                <text>4. 上传到这里进行试穿</text>
              </view>
              <view class="action-btns">
                <view class="btn-tip" @click="openRemoveBg">
                  <text>🌐 打开 remove.bg</text>
                </view>
              </view>
            </view>
            
            <view class="upload-btn-large" @click="uploadPhoto">
              <text>📷 上传处理后的照片</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="clothing-section">
        <view class="section-header">
          <text class="section-title">选择衣物</text>
        </view>
        
        <view class="category-tabs">
          <view 
            v-for="cat in clothingCategories" 
            :key="cat.value"
            class="category-tab"
            :class="{ active: activeCategory === cat.value }"
            @click="activeCategory = cat.value"
          >
            <text>{{ cat.icon }} {{ cat.label }}</text>
          </view>
        </view>
        
        <scroll-view class="clothing-list" scroll-x>
          <view 
            v-for="item in filteredClothes" 
            :key="item.id"
            class="clothing-card"
            :class="{ selected: isSelected(item) }"
            @click="selectClothing(item)"
          >
            <image :src="item.photo" mode="aspectFill" />
            <text class="clothing-name">{{ item.name }}</text>
            <view class="clothing-check" v-if="isSelected(item)">✓</view>
          </view>
          <view v-if="filteredClothes.length === 0" class="empty-clothing">
            <text>暂无{{ getCategoryLabel(activeCategory) }}</text>
          </view>
        </scroll-view>
      </view>
      
      <view class="selected-section">
        <text class="section-title">已选衣物</text>
        <view class="selected-items">
          <view 
            v-for="(item, index) in selectedClothes" 
            :key="index"
            class="selected-item"
          >
            <image :src="item.photo" mode="aspectFill" />
            <view class="selected-info">
              <text class="selected-name">{{ item.name }}</text>
              <text class="selected-category">{{ getCategoryLabel(item.category) }}</text>
            </view>
            <view class="selected-remove" @click="removeClothing(index)">
              <text>×</text>
            </view>
          </view>
          <view v-if="selectedClothes.length === 0" class="empty-selected">
            <text>请选择衣物进行试穿</text>
          </view>
        </view>
      </view>
      
      <view class="submit-bar">
        <view class="btn btn-secondary" @click="handleReset">重置</view>
        <view class="btn btn-primary" @click="handleSave">保存试穿效果</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWardrobeStore } from '@/store/wardrobe'
import type { Clothing } from '@/types'
import NavBar from '@/components/NavBar.vue'

const wardrobe = useWardrobeStore()

const userPhoto = ref<string>('')
const originalPhoto = ref<string>('')
const activeCategory = ref('top')
const selectedClothes = ref<(Clothing & { x: number; y: number; scale: number })[]>([])
const currentTool = ref<'eraser' | 'restore' | 'move'>('eraser')
const brushSize = ref(20)

const clothingCategories = [
  { value: 'top', label: '上衣', icon: '👕' },
  { value: 'bottom', label: '下装', icon: '👖' },
  { value: 'coat', label: '外套', icon: '🧥' },
  { value: 'shoes', label: '鞋子', icon: '👟' },
  { value: 'accessory', label: '配饰', icon: '🎒' }
]

const filteredClothes = computed(() => {
  return wardrobe.clothes.filter(c => c.category === activeCategory.value)
})

const isSelected = (item: Clothing) => {
  return selectedClothes.value.some(c => c.id === item.id)
}

const getCategoryLabel = (category: string) => {
  const cat = clothingCategories.find(c => c.value === category)
  return cat ? cat.label : category
}

const getClothingStyle = (item: Clothing & { x: number; y: number; scale: number }) => {
  return {
    left: item.x + 'px',
    top: item.y + 'px',
    transform: `scale(${item.scale})`
  }
}

let canvasWidth = 0
let canvasHeight = 0
let canvasLeft = 0
let canvasTop = 0
let isDrawing = false
let lastX = 0
let lastY = 0
let maskData: number[][] = []

let draggingClothing: any = null
let dragOffsetX = 0
let dragOffsetY = 0

const openRemoveBg = () => {
  if (typeof window !== 'undefined') {
    window.open('https://www.remove.bg/zh/upload', '_blank')
    uni.showToast({ title: '正在打开网站...', icon: 'none' })
  } else {
    uni.showModal({
      title: '打开 remove.bg',
      content: '将复制链接到剪贴板，请在浏览器中打开',
      confirmText: '复制链接',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.setClipboardData({
            data: 'https://www.remove.bg/zh/upload',
            success: () => {
              uni.showToast({ title: '链接已复制', icon: 'success' })
            }
          })
        }
      }
    })
  }
}

const uploadPhoto = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album'],
    success: (res) => {
      userPhoto.value = res.tempFilePaths[0]
      originalPhoto.value = res.tempFilePaths[0]
      setTimeout(() => {
        initCanvas()
      }, 300)
    },
    fail: () => {
      uni.showToast({ title: '选择图片失败', icon: 'none' })
    }
  })
}

const initCanvas = () => {
  const query = uni.createSelectorQuery()
  query.select('#tryOnCanvas').boundingClientRect((rect: any) => {
    if (rect) {
      canvasWidth = rect.width
      canvasHeight = rect.height
      canvasLeft = rect.left
      canvasTop = rect.top
      
      maskData = Array(Math.floor(canvasHeight)).fill(null).map(() => 
        Array(Math.floor(canvasWidth)).fill(1)
      )
      
      uni.getImageInfo({
        src: userPhoto.value,
        success: (info) => {
          const ctx = uni.createCanvasContext('tryOnCanvas')
          const maskCtx = uni.createCanvasContext('maskCanvas')
          
          let imgWidth = info.width
          let imgHeight = info.height
          let offsetX = 0
          let offsetY = 0
          
          if (imgWidth > imgHeight) {
            imgHeight = (canvasWidth / imgWidth) * imgHeight
            imgWidth = canvasWidth
            offsetY = (canvasHeight - imgHeight) / 2
          } else {
            imgWidth = (canvasHeight / imgHeight) * imgWidth
            imgHeight = canvasHeight
            offsetX = (canvasWidth - imgWidth) / 2
          }
          
          ctx.clearRect(0, 0, canvasWidth, canvasHeight)
          ctx.drawImage(userPhoto.value, offsetX, offsetY, imgWidth, imgHeight)
          ctx.draw()
          
          maskCtx.clearRect(0, 0, canvasWidth, canvasHeight)
          maskCtx.setFillStyle('rgba(0, 0, 0, 0.7)')
          maskCtx.fillRect(0, 0, canvasWidth, canvasHeight)
          maskCtx.draw()
        },
        fail: () => {
          uni.showToast({ title: '图片加载失败', icon: 'none' })
        }
      })
    } else {
      setTimeout(initCanvas, 100)
    }
  }).exec()
}

const getCanvasPos = (pageX: number, pageY: number) => {
  return {
    x: Math.max(0, Math.min(canvasWidth, pageX - canvasLeft)),
    y: Math.max(0, Math.min(canvasHeight, pageY - canvasTop))
  }
}

const handleTouchStart = (e: any) => {
  if (currentTool.value !== 'eraser' && currentTool.value !== 'restore') return
  
  const touch = e.touches[0]
  const pos = getCanvasPos(touch.pageX, touch.pageY)
  isDrawing = true
  lastX = pos.x
  lastY = pos.y
  
  updateMask(pos.x, pos.y)
}

const handleTouchMove = (e: any) => {
  if (currentTool.value !== 'eraser' && currentTool.value !== 'restore') return
  if (!isDrawing) return
  
  const touch = e.touches[0]
  const pos = getCanvasPos(touch.pageX, touch.pageY)
  
  updateMask(pos.x, pos.y)
  
  lastX = pos.x
  lastY = pos.y
}

const handleTouchEnd = () => {
  isDrawing = false
}

const updateMask = (x: number, y: number) => {
  const maskCtx = uni.createCanvasContext('maskCanvas')
  
  if (currentTool.value === 'eraser') {
    maskCtx.clearRect(x - brushSize.value, y - brushSize.value, brushSize.value * 2, brushSize.value * 2)
  } else {
    maskCtx.setFillStyle('rgba(0, 0, 0, 0.7)')
    maskCtx.fillRect(x - brushSize.value, y - brushSize.value, brushSize.value * 2, brushSize.value * 2)
  }
  
  maskCtx.draw(true)
}

const quickRemoveBg = () => {
  uni.showLoading({ title: '正在快速抠图...' })
  
  setTimeout(() => {
    const maskCtx = uni.createCanvasContext('maskCanvas')
    
    maskCtx.clearRect(0, 0, canvasWidth, canvasHeight)
    
    const gradient = maskCtx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)')
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)')
    
    maskCtx.setFillStyle(gradient)
    maskCtx.fillRect(0, 0, canvasWidth, canvasHeight)
    
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2
    const bodyWidth = canvasWidth * 0.4
    const bodyHeight = canvasHeight * 0.8
    
    maskCtx.beginPath()
    maskCtx.roundRect(centerX - bodyWidth/2, centerY - bodyHeight/2, bodyWidth, bodyHeight, 20)
    maskCtx.clearRect(centerX - bodyWidth/2 - 5, centerY - bodyHeight/2 - 5, bodyWidth + 10, bodyHeight + 10)
    
    maskCtx.draw()
    
    uni.hideLoading()
    uni.showToast({ title: '快速抠图完成', icon: 'success' })
  }, 800)
}

const selectClothing = (item: Clothing) => {
  const existingIndex = selectedClothes.value.findIndex(c => c.id === item.id)
  if (existingIndex >= 0) {
    selectedClothes.value.splice(existingIndex, 1)
  } else {
    const defaultPositions: any = {
      top: { x: canvasWidth * 0.3, y: canvasHeight * 0.2 },
      bottom: { x: canvasWidth * 0.35, y: canvasHeight * 0.5 },
      coat: { x: canvasWidth * 0.25, y: canvasHeight * 0.15 },
      shoes: { x: canvasWidth * 0.4, y: canvasHeight * 0.7 },
      accessory: { x: canvasWidth * 0.5, y: canvasHeight * 0.25 }
    }
    
    const pos = defaultPositions[item.category] || { x: canvasWidth * 0.3, y: canvasHeight * 0.2 }
    selectedClothes.value.push({
      ...item,
      x: pos.x,
      y: pos.y,
      scale: 0.8
    })
  }
}

const startDragClothing = (e: any, item: any, index: number) => {
  if (currentTool.value !== 'move') return
  
  draggingClothing = { item, index }
  const touch = e.touches[0]
  dragOffsetX = touch.pageX - item.x
  dragOffsetY = touch.pageY - item.y
}

const dragClothing = (e: any) => {
  if (!draggingClothing || currentTool.value !== 'move') return
  
  const touch = e.touches[0]
  draggingClothing.item.x = touch.pageX - dragOffsetX
  draggingClothing.item.y = touch.pageY - dragOffsetY
}

const endDragClothing = () => {
  draggingClothing = null
}

const startResize = (e: any, item: any, index: number) => {
  e.stopPropagation()
  const newScale = item.scale >= 1.5 ? 0.5 : item.scale + 0.25
  item.scale = newScale
}

const removeClothing = (index: number) => {
  selectedClothes.value.splice(index, 1)
}

const handleReset = () => {
  userPhoto.value = ''
  originalPhoto.value = ''
  selectedClothes.value = []
  currentTool.value = 'eraser'
}

const handleSave = () => {
  uni.showToast({ title: '保存成功', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.manual-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.manual-content {
  height: calc(100vh - 180rpx);
}

.canvas-section {
  background-color: $bg-white;
  margin: $spacing-md;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

.upload-btn {
  padding: $spacing-sm $spacing-md;
  background-color: $primary-color;
  color: #fff;
  border-radius: $border-radius-md;
  font-size: $font-size-sm;
}

.canvas-container {
  width: 100%;
  height: 500rpx;
  background-color: #e0e0e0;
  border-radius: $border-radius-md;
  overflow: hidden;
  position: relative;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.tryon-canvas {
  width: 100%;
  height: 100%;
}

.mask-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.clothing-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.clothing-item-wrapper {
  position: absolute;
  pointer-events: auto;
  cursor: move;
  transition: transform 0.2s;
}

.clothing-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: $border-radius-sm;
}

.clothing-resize {
  position: absolute;
  bottom: -10rpx;
  right: -10rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: $primary-color;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-sm;
  cursor: se-resize;
}

.canvas-tools {
  position: absolute;
  bottom: 80rpx;
  left: $spacing-md;
  right: $spacing-md;
  display: flex;
  gap: $spacing-xs;
  background-color: rgba(0,0,0,0.7);
  padding: $spacing-xs;
  border-radius: $border-radius-lg;
  overflow-x: auto;
}

.tool-btn {
  padding: $spacing-xs $spacing-sm;
  color: #fff;
  font-size: $font-size-xs;
  border-radius: $border-radius-md;
  background-color: rgba(255,255,255,0.2);
  white-space: nowrap;
  
  &.active {
    background-color: $primary-color;
  }
}

.brush-size {
  position: absolute;
  bottom: 20rpx;
  left: $spacing-md;
  right: $spacing-md;
  background-color: rgba(0,0,0,0.7);
  padding: $spacing-sm;
  border-radius: $border-radius-md;
}

.size-label {
  color: #fff;
  font-size: $font-size-xs;
  display: block;
  margin-bottom: $spacing-xs;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
}

.placeholder-icon {
  font-size: 120rpx;
  opacity: 0.8;
}

.placeholder-text {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
  margin-top: $spacing-md;
}

.placeholder-hint {
  font-size: $font-size-sm;
  color: $primary-color;
  margin-top: $spacing-xs;
}

.tips-card {
  width: 100%;
  background: linear-gradient(135deg, $primary-color 0%, #818cf8 100%);
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-top: $spacing-lg;
  color: #fff;
}

.tips-header {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-md;
}

.tips-icon {
  font-size: $font-size-xl;
  margin-right: $spacing-sm;
}

.tips-title {
  font-size: $font-size-md;
  font-weight: 600;
}

.tips-content {
  background-color: rgba(255,255,255,0.2);
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  
  text {
    display: block;
    font-size: $font-size-sm;
    line-height: 1.8;
    margin-bottom: $spacing-xs;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .highlight {
    font-weight: 600;
    text-decoration: underline;
  }
}

.action-btns {
  display: flex;
  gap: $spacing-sm;
}

.btn-tip, .btn-upload {
  flex: 1;
  padding: $spacing-sm;
  text-align: center;
  border-radius: $border-radius-md;
  font-size: $font-size-xs;
}

.btn-tip {
  background-color: rgba(255,255,255,0.3);
}

.btn-upload {
  background-color: #fff;
  color: $primary-color;
  font-weight: 600;
}

.upload-btn-large {
  margin-top: $spacing-lg;
  padding: $spacing-md $spacing-xl;
  background-color: $primary-color;
  color: #fff;
  border-radius: $border-radius-lg;
  font-size: $font-size-md;
}

.clothing-section {
  background-color: $bg-white;
  margin: $spacing-md;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
}

.section-header {
  margin-bottom: $spacing-md;
}

.category-tabs {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  overflow-x: auto;
}

.category-tab {
  padding: $spacing-sm $spacing-md;
  background-color: $bg-gray;
  border-radius: $border-radius-lg;
  font-size: $font-size-sm;
  white-space: nowrap;
  
  &.active {
    background-color: $primary-color;
    color: #fff;
  }
}

.clothing-list {
  white-space: nowrap;
}

.clothing-card {
  display: inline-block;
  width: 140rpx;
  margin-right: $spacing-md;
  position: relative;
  
  image {
    width: 140rpx;
    height: 140rpx;
    border-radius: $border-radius-md;
    border: 2rpx solid transparent;
  }
  
  &.selected image {
    border-color: $primary-color;
  }
}

.clothing-name {
  font-size: $font-size-xs;
  color: $text-primary;
  margin-top: $spacing-xs;
  display: block;
  white-space: normal;
}

.clothing-check {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 32rpx;
  height: 32rpx;
  background-color: $primary-color;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-xs;
}

.empty-clothing {
  display: inline-block;
  padding: $spacing-lg;
  color: $text-secondary;
}

.selected-section {
  background-color: $bg-white;
  margin: $spacing-md;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
}

.selected-items {
  margin-top: $spacing-md;
}

.selected-item {
  display: flex;
  align-items: center;
  padding: $spacing-sm;
  background-color: $bg-gray;
  border-radius: $border-radius-md;
  margin-bottom: $spacing-sm;
}

.selected-item image {
  width: 80rpx;
  height: 80rpx;
  border-radius: $border-radius-sm;
}

.selected-info {
  flex: 1;
  margin-left: $spacing-sm;
}

.selected-name {
  font-size: $font-size-sm;
  color: $text-primary;
  display: block;
}

.selected-category {
  font-size: $font-size-xs;
  color: $text-secondary;
}

.selected-remove {
  width: 48rpx;
  height: 48rpx;
  background-color: #ff4d4f;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-lg;
}

.empty-selected {
  text-align: center;
  padding: $spacing-lg;
  color: $text-secondary;
}

.submit-bar {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
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
  background-color: $primary-color;
  color: #fff;
}

.btn-secondary {
  background-color: $bg-gray;
  color: $text-primary;
}
</style>