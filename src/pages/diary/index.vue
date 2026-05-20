<template>
  <view class="diary-page">
    <view class="nav-bar">
      <view class="nav-left" @click="handleBack">
        <view class="back-btn">
          <text>←</text>
        </view>
      </view>
      <view class="nav-center">
        <text class="nav-title">穿搭日记</text>
      </view>
      <view class="nav-right">
        <view class="add-btn" @click="goToAdd">
          <text>+</text>
        </view>
      </view>
    </view>
    
    <scroll-view class="diary-content" scroll-y>
      <view class="stats-section">
        <view class="stats-card">
          <view class="stat-item">
            <text class="stat-value">{{ monthlyStats.total }}</text>
            <text class="stat-label">本月记录</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ diaries.length }}</text>
            <text class="stat-label">总记录</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ monthlyStats.mostUsedScene || '-' }}</text>
            <text class="stat-label">常用场景</text>
          </view>
        </view>
      </view>
      
      <view class="filter-tabs">
        <view 
          class="filter-tab"
          :class="{ active: activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          <text>全部</text>
        </view>
        <view 
          class="filter-tab"
          :class="{ active: activeFilter === 'month' }"
          @click="activeFilter = 'month'"
        >
          <text>本月</text>
        </view>
        <view 
          v-for="tag in popularTags" 
          :key="tag"
          class="filter-tab"
          :class="{ active: activeFilter === tag }"
          @click="activeFilter = tag"
        >
          <text>{{ tag }}</text>
        </view>
      </view>
      
      <view class="diary-list" v-if="filteredDiaries.length > 0">
        <view 
          v-for="diary in filteredDiaries" 
          :key="diary.id"
          class="diary-item"
          @click="handleDiaryClick(diary)"
        >
          <DiaryCard :diary="diary" />
        </view>
      </view>
      
      <view class="empty-state" v-else>
        <text class="empty-icon">📔</text>
        <text class="empty-text">还没有穿搭日记</text>
        <text class="empty-hint">记录你的每日穿搭，留下美好回忆</text>
        <view class="btn btn-primary mt-md" @click="goToAdd">开始记录</view>
      </view>
      
      <view class="bottom-space"></view>
    </scroll-view>
    
    <TabBar current="/pages/diary/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useDiaryStore } from '@/store/diary'
import type { Diary } from '@/types'
import DiaryCard from '@/components/DiaryCard.vue'
import TabBar from '@/components/TabBar.vue'

const diary = useDiaryStore()

const activeFilter = ref('all')

const diaries = computed(() => diary.diaries)

const monthlyStats = computed(() => diary.monthlyStats)

const popularTags = computed(() => {
  return diary.allTags.slice(0, 5)
})

const filteredDiaries = computed(() => {
  if (activeFilter.value === 'all') {
    return diaries.value
  } else if (activeFilter.value === 'month') {
    const now = new Date()
    return diaries.value.filter(d => {
      const date = new Date(d.date)
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    })
  } else {
    return diary.getDiariesByTag(activeFilter.value)
  }
})

const handleDiaryClick = (diary: Diary) => {
  uni.showToast({ title: `查看日记: ${formatDate(diary.date)}`, icon: 'none' })
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const goToAdd = () => {
  uni.navigateTo({ url: '/pages/diary/add' })
}

const handleBack = () => {
  uni.navigateBack({ delta: 1 })
}

onMounted(() => {
  diary.loadDiaries()
})

onShow(() => {
  diary.loadDiaries()
})
</script>

<style lang="scss" scoped>
.diary-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background-color: $bg-white;
  padding-top: var(--status-bar-height, 44px);
  height: calc(88rpx + var(--status-bar-height, 44px));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: $spacing-md;
  padding-right: $spacing-md;
  box-shadow: $shadow-sm;
}

.nav-left {
  width: 80rpx;
  display: flex;
  align-items: center;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  color: $text-primary;
  font-weight: 600;
}

.nav-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

.nav-right {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.add-btn {
  width: 64rpx;
  height: 64rpx;
  background-color: $primary-color;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-white;
  font-size: 32rpx;
}

.diary-content {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  min-height: 100vh;
}

.stats-section {
  padding: $spacing-md;
}

.stats-card {
  background: linear-gradient(135deg, $primary-color, $primary-light);
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: $text-white;
}

.stat-label {
  font-size: $font-size-xs;
  color: rgba(255, 255, 255, 0.8);
  margin-top: $spacing-xs;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background-color: rgba(255, 255, 255, 0.3);
}

.filter-tabs {
  display: flex;
  padding: 0 $spacing-md;
  gap: $spacing-sm;
  overflow-x: auto;
  white-space: nowrap;
}

.filter-tab {
  padding: $spacing-sm $spacing-md;
  background-color: $bg-white;
  border-radius: $border-radius;
  font-size: $font-size-sm;
  color: $text-secondary;
  flex-shrink: 0;
  
  &.active {
    background-color: $primary-color;
    color: $text-white;
  }
}

.diary-list {
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.diary-item {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  overflow: hidden;
}

.empty-state {
  padding: $spacing-xl;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-text {
  font-size: $font-size-base;
  color: $text-secondary;
  margin-top: $spacing-md;
}

.empty-hint {
  font-size: $font-size-sm;
  color: $text-light;
  margin-top: $spacing-xs;
}

.bottom-space {
  height: calc(120rpx + #{$spacing-lg});
}
</style>
