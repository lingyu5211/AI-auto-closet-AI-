<template>
  <view class="outfit-card" @click="handleClick">
    <view class="outfit-preview" v-if="showPreview && modelSrc">
      <TryOnCanvas
        :model-src="modelSrc"
        :clothes="displayClothes"
        :interactive="false"
        :canvas-width="previewW"
        :canvas-height="previewH"
      />
    </view>
    <view class="outfit-images" v-else>
      <view v-for="(clothing, index) in displayClothes" :key="clothing.id" class="outfit-image" :style="{ zIndex: displayClothes.length - index }">
        <image v-if="clothing.photo" :src="clothing.photo" mode="aspectFill" />
        <view v-else class="placeholder-image">
          <text>{{ getTypeIcon(clothing.type) }}</text>
        </view>
      </view>
    </view>
    <view class="outfit-info">
      <text class="outfit-name">{{ outfit.name }}</text>
      <text class="outfit-desc truncate">{{ outfit.description }}</text>
      <view class="outfit-meta">
        <text class="tag tag-primary">{{ outfit.scene }}</text>
        <text class="tag">{{ outfit.season }}</text>
      </view>
    </view>
    <view class="outfit-actions" v-if="showActions">
      <view class="action-btn" @click.stop="handleFavorite">
        <text>{{ outfit.isFavorite ? '❤️' : '🤍' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Outfit, Clothing } from '@/types'
import { useWardrobeStore } from '@/store/wardrobe'
import TryOnCanvas from '@/components/TryOnCanvas.vue'

const props = defineProps<{
  outfit: Outfit
  showActions?: boolean
  showPreview?: boolean
  modelSrc?: string
}>()

const previewW = 140
const previewH = 200

const emit = defineEmits<{
  click: [outfit: Outfit]
  favorite: [outfit: Outfit]
}>()

const wardrobe = useWardrobeStore()

const displayClothes = computed<Clothing[]>(() => {
  return props.outfit.clothes
    .map(id => wardrobe.getClothingById(id))
    .filter((c): c is Clothing => c !== undefined)
    .slice(0, 4)
})

const handleClick = () => {
  emit('click', props.outfit)
}

const handleFavorite = () => {
  emit('favorite', props.outfit)
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
</script>

<style lang="scss" scoped>
.outfit-card {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  overflow: hidden;
  box-shadow: $shadow-sm;
  position: relative;
}

.outfit-preview {
  padding: $spacing-sm;
  display: flex;
  justify-content: center;
}

.outfit-images {
  display: flex;
  padding: $spacing-sm;
  padding-bottom: 0;
}

.outfit-image {
  width: 120rpx;
  height: 160rpx;
  border-radius: $border-radius;
  overflow: hidden;
  margin-right: -20rpx;
  margin-bottom: $spacing-sm;
  border: 2rpx solid $bg-white;
  box-shadow: $shadow-sm;
}

.outfit-image:first-child {
  margin-left: $spacing-xs;
}

.outfit-image image {
  width: 100%;
  height: 100%;
}

.placeholder-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-gray;
  font-size: 40rpx;
}

.outfit-info {
  padding: $spacing-sm $spacing-md;
}

.outfit-name {
  font-size: $font-size-md;
  font-weight: 600;
  color: $text-primary;
}

.outfit-desc {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-top: $spacing-xs;
}

.outfit-meta {
  margin-top: $spacing-sm;
  display: flex;
  gap: $spacing-xs;
}

.outfit-actions {
  position: absolute;
  top: $spacing-sm;
  right: $spacing-sm;
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}
</style>