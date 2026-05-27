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
          <view v-else class="stage-model-wrap">
            <image
              :src="match.modelImage"
              mode="aspectFit"
              class="stage-model-bg"
            />
            <view v-if="selectedClothes.length > 0" class="stage-clothes-tags">
              <view
                v-for="item in selectedClothes"
                :key="item.id"
                class="stage-tag"
              >
                <image :src="item.photo" mode="aspectFill" class="stage-tag-img" />
                <text class="stage-tag-text">{{ item.name || item.subType }}</text>
              </view>
            </view>
            <view v-else class="stage-hint">
              <text class="stage-hint-text">选择衣物后点击生成</text>
            </view>
            <view v-if="isGenerating" class="stage-loading-overlay">
              <text class="stage-spinner">⏳</text>
              <text class="stage-text">{{ stepLabel[currentStep] || '处理中...' }}</text>
            </view>
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
        <view class="act-btn generate" :class="{ disabled: isGenerating }" @click="handleGenerate">
          <text>{{ isGenerating ? '生成中...' : '生成效果图' }}</text>
        </view>
        <view class="act-btn save" @click="handleSave">
          <text>保存穿搭</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
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
</script>

<style lang="scss" scoped>
.dressing-page {
  min-height: 100vh;
  background: #F5F5F5;
}

.dressing-body {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 88rpx - var(--status-bar-height, 44px));
}

.model-bar {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
}

/* Canvas */
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
  position: relative;
}

.result-image {
  width: 100%;
  height: 100%;
}

.stage-model-wrap {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-model-bg {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.stage-clothes-tags {
  position: absolute;
  bottom: 16rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8rpx;
  background: rgba(0,0,0,0.45);
  border-radius: 20rpx;
  padding: 8rpx 16rpx;
}

.stage-tag {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.stage-tag-img {
  width: 36rpx;
  height: 36rpx;
  border-radius: 6rpx;
  border: 1rpx solid rgba(255,255,255,0.5);
}

.stage-tag-text {
  font-size: 20rpx;
  color: #FFFFFF;
}

.stage-hint {
  position: absolute;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
}

.stage-hint-text {
  font-size: 24rpx;
  color: #999;
  background: rgba(255,255,255,0.8);
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
}

.stage-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.stage-spinner {
  font-size: 64rpx;
}

.stage-text {
  font-size: 24rpx;
  color: #FFFFFF;
}

/* Picker */
.picker-section {
  flex: 1;
  background: #FFFFFF;
  margin: 20rpx 24rpx;
  border-radius: 20rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.picker-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #171717;
  margin-bottom: 14rpx;
}

.category-tabs {
  white-space: nowrap;
  margin-bottom: 16rpx;
  flex-shrink: 0;
}

.cat-tab {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 24rpx;
  margin-right: 12rpx;
  background: #F5F5F5;
  border-radius: 24rpx;
  font-size: 24rpx;
  color: #666;
  transition: all 0.15s;

  &.active {
    background: #171717;
    color: #FFFFFF;
  }
}

.clothing-strip {
  white-space: nowrap;
  flex: 1;
}

.clothing-thumb {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 130rpx;
  margin-right: 16rpx;
}

.thumb-img-wrap {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  overflow: hidden;
  border: 3rpx solid transparent;
  background: #F5F5F5;
  transition: border-color 0.15s;

  image {
    width: 100%;
    height: 100%;
  }
}

.clothing-thumb.selected .thumb-img-wrap {
  border-color: #D4AF37;
}

.thumb-check {
  position: absolute;
  top: 0;
  right: 0;
  width: 36rpx;
  height: 36rpx;
  background: #D4AF37;
  color: #FFFFFF;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 10rpx 0 10rpx;
}

.thumb-name {
  font-size: 20rpx;
  color: #888;
  margin-top: 6rpx;
  max-width: 120rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-cat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 24rpx;
}

/* Action Bar */
.action-bar {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  border-top: 1rpx solid #F0F0F0;
}

.act-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14rpx;
  font-size: 26rpx;
  font-weight: 500;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.8;
  }
}

.act-btn.reset {
  background: #F5F5F5;
  color: #666;
}

.act-btn.export {
  background: #F0F0F0;
  color: #171717;
}

.act-btn.save {
  background: linear-gradient(135deg, #D4AF37, #C5A028);
  color: #FFFFFF;
  font-weight: 600;
}

.act-btn.generate {
  background: linear-gradient(135deg, #4A90D9, #357ABD);
  color: #FFFFFF;
  font-weight: 600;

  &.disabled {
    opacity: 0.5;
  }
}
</style>
