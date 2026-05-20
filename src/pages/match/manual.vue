<template>
  <view class="dressing-page">
    <NavBar title="虚拟试衣间" :show-back="true" />

    <scroll-view class="dressing-content" scroll-y>
      <!-- Model gender switch -->
      <view class="model-switch-bar">
        <ModelSwitch v-model="match.modelGender" />
      </view>

      <!-- Canvas try-on area -->
      <view class="canvas-section">
        <TryOnCanvas
          ref="tryonRef"
          :model-src="match.modelImage"
          :clothes="selectedClothes"
          :interactive="true"
          :canvas-width="canvasW"
          :canvas-height="canvasH"
          @update="handleLayersUpdate"
          @export="handleExported"
        />
        <view class="canvas-hint" v-if="selectedClothes.length > 0">
          <text>👆 拖拽衣物调整位置</text>
        </view>
      </view>

      <!-- Clothing category picker -->
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
          <text>暂无{{ getCatLabel(activeCategory) }}，请先添加衣物</text>
        </view>
      </view>

      <!-- Action bar -->
      <view class="action-bar">
        <view class="btn btn-outline" @click="handleReset">🔄 重置</view>
        <view class="btn btn-secondary" @click="handleExport">📷 导出</view>
        <view class="btn btn-primary" @click="handleSave">💾 保存穿搭</view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWardrobeStore } from '@/store/wardrobe'
import { useMatchStore } from '@/store/match'
import type { Clothing } from '@/types'
import type { ClothingLayer } from '@/components/TryOnCanvas.vue'
import NavBar from '@/components/NavBar.vue'
import ModelSwitch from '@/components/ModelSwitch.vue'
import TryOnCanvas from '@/components/TryOnCanvas.vue'

const wardrobe = useWardrobeStore()
const match = useMatchStore()

const tryonRef = ref<InstanceType<typeof TryOnCanvas> | null>(null)
const activeCategory = ref('top')
const selectedIds = ref<Set<string>>(new Set())

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
    tryonRef.value?.removeClothing(item.id)
  } else {
    selectedIds.value.add(item.id)
    tryonRef.value?.addClothing(item)
  }
}

const handleLayersUpdate = (_layers: ClothingLayer[]) => {
  // Position updates from drag interactions; no persistence needed during editing
}

const handleReset = () => {
  selectedIds.value.clear()
  tryonRef.value?.reset()
}

const handleExport = () => {
  if (selectedIds.value.size === 0) {
    uni.showToast({ title: '请先选择衣物', icon: 'none' })
    return
  }
  tryonRef.value?.exportImage()
}

const handleExported = (dataURL: string) => {
  if (!dataURL) {
    uni.showToast({ title: '导出失败', icon: 'none' })
    return
  }
  uni.previewImage({ urls: [dataURL] })
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
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

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
.canvas-hint {
  text-align: center;
  padding: $spacing-xs;
  font-size: $font-size-xs;
  color: $text-light;
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
  font-size: $font-size-sm;
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
.btn-secondary {
  background: $bg-gray;
  color: $text-primary;
}
.bottom-space {
  height: 40rpx;
}
</style>
