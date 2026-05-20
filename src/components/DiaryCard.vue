<template>
  <view class="diary-card" @click="handleClick">
    <view class="diary-images" v-if="diary.photos.length > 0">
      <swiper class="diary-swiper" indicator-dots indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff">
        <swiper-item v-for="(photo, index) in diary.photos" :key="index">
          <image :src="photo" mode="aspectFill" />
        </swiper-item>
      </swiper>
    </view>
    <view class="diary-images" v-else>
      <view class="diary-placeholder">
        <text class="placeholder-icon">📸</text>
      </view>
    </view>
    <view class="diary-content">
      <view class="diary-header">
        <text class="diary-date">{{ formatDate(diary.date) }}</text>
        <view class="diary-meta">
          <text class="weather-icon">{{ getWeatherIcon(diary.weather) }}</text>
          <text class="diary-scene">{{ diary.scene }}</text>
        </view>
      </view>
      <text class="diary-text" v-if="diary.content">{{ diary.content }}</text>
      <view class="diary-tags" v-if="diary.tags.length > 0">
        <text class="tag" v-for="tag in diary.tags" :key="tag">{{ tag }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Diary } from '@/types'
import { formatDate, getWeatherIcon } from '@/utils'

const props = defineProps<{
  diary: Diary
}>()

const emit = defineEmits<{
  click: [diary: Diary]
}>()

const handleClick = () => {
  emit('click', props.diary)
}
</script>

<style lang="scss" scoped>
.diary-card {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.diary-images {
  width: 100%;
  height: 320rpx;
}

.diary-swiper {
  width: 100%;
  height: 100%;
}

.diary-swiper image {
  width: 100%;
  height: 100%;
}

.diary-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-gray;
}

.placeholder-icon {
  font-size: 80rpx;
}

.diary-content {
  padding: $spacing-md;
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diary-date {
  font-size: $font-size-md;
  font-weight: 600;
  color: $text-primary;
}

.diary-meta {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.weather-icon {
  font-size: 28rpx;
}

.diary-scene {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.diary-text {
  font-size: $font-size-base;
  color: $text-primary;
  margin-top: $spacing-sm;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.diary-tags {
  margin-top: $spacing-sm;
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}
</style>
