<template>
  <view class="clothing-card" @click="handleClick">
    <view class="card-image" :style="{ backgroundColor: getColorBg(clothing.color) }">
      <image 
        v-if="clothing.photo" 
        :src="clothing.photo" 
        class="clothing-photo"
        mode="aspectFill"
      />
      <view v-else class="image-content">
        <text class="placeholder-text">暂无图片</text>
      </view>
      <view v-if="clothing.isFavorite" class="favorite-badge">
        <text>❤️</text>
      </view>
      <view v-if="!clothing.isActive" class="inactive-badge">
        <text>闲置</text>
      </view>
    </view>
    <view class="card-info">
      <text class="card-name truncate">{{ clothing.name || clothing.subType || '未命名' }}</text>
      <view class="card-tags">
        <text class="tag tag-primary">{{ clothing.color }}</text>
        <text class="tag" v-if="clothing.isCommon">常用</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Clothing } from '@/types'

const props = defineProps<{
  clothing: Clothing
}>()

const emit = defineEmits<{
  click: [clothing: Clothing]
}>()

const handleClick = () => {
  emit('click', props.clothing)
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    top: '👕',
    pants: '👖',
    skirt: '👗',
    coat: '🧥',
    shoes: '👟',
    accessory: '🎒'
  }
  return icons[type] || '👔'
}

const getColorBg = (color: string) => {
  const colors: Record<string, string> = {
    '白色': '#FFFFFF',
    '黑色': '#1a1a1a',
    '蓝色': '#4169E1',
    '深蓝色': '#4682B4',
    '卡其色': '#C3B091',
    '灰色': '#808080',
    '红色': '#DC143C',
    '粉色': '#FF69B4',
    '黄色': '#FFD700',
    '绿色': '#228B22',
    '紫色': '#8B008B',
    '橙色': '#FF8C00'
  }
  return colors[color] || '#f5f5f5'
}
</script>

<style lang="scss" scoped>
.clothing-card {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.card-image {
  position: relative;
  width: 100%;
  height: 240rpx;
}

.clothing-photo {
  width: 100%;
  height: 100%;
}

.image-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.clothing-icon {
  font-size: 64rpx;
}

.clothing-text {
  font-size: $font-size-xs;
  color: rgba(0, 0, 0, 0.6);
  margin-top: $spacing-xs;
}

.favorite-badge {
  position: absolute;
  top: $spacing-sm;
  right: $spacing-sm;
  width: 48rpx;
  height: 48rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inactive-badge {
  position: absolute;
  top: $spacing-sm;
  left: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  background-color: rgba(239, 68, 68, 0.9);
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  color: $text-white;
}

.card-info {
  padding: $spacing-sm;
}

.card-name {
  font-size: $font-size-base;
  font-weight: 500;
  color: $text-primary;
}

.card-tags {
  margin-top: $spacing-xs;
  display: flex;
  gap: $spacing-xs;
}
</style>
