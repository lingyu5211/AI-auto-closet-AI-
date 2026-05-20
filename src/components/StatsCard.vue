<template>
  <view class="stats-card">
    <view class="stats-header">
      <text class="stats-title">衣橱统计</text>
      <view class="refresh-btn" @click="handleRefresh">
        <text>🔄</text>
      </view>
    </view>
    
    <view v-if="loading" class="loading-state">
      <text class="loading-icon">⏳</text>
      <text class="loading-text">加载中...</text>
    </view>
    
    <template v-else>
      <view v-if="stats.total === 0" class="empty-stats">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无衣物数据</text>
        <view class="empty-btn" @click="goToAdd">
          <text>添加衣物</text>
        </view>
      </view>
      
      <template v-else>
        <view class="stats-grid">
          <view class="stat-item">
            <view class="stat-icon">👕</view>
            <text class="stat-value">{{ stats.total }}</text>
            <text class="stat-label">衣物总数</text>
          </view>
          <view class="stat-item">
            <view class="stat-icon active-icon">✅</view>
            <text class="stat-value">{{ stats.active }}</text>
            <text class="stat-label">在穿衣物</text>
          </view>
          <view class="stat-item">
            <view class="stat-icon favorite-icon">❤️</view>
            <text class="stat-value">{{ stats.favorite }}</text>
            <text class="stat-label">收藏衣物</text>
          </view>
        </view>
      </template>
      
      <view class="stats-section">
        <view class="section-header">
          <text class="section-title">分类分布</text>
        </view>
        <view class="category-grid">
          <view 
            v-for="(count, type) in stats.byType" 
            :key="type" 
            class="category-item"
            @click="handleCategoryClick(type as string)"
          >
            <view class="category-icon">{{ getTypeIcon(type as string) }}</view>
            <text class="category-name">{{ getTypeName(type as string) }}</text>
            <text class="category-count">{{ count }}</text>
          </view>
        </view>
      </view>
      
      <view class="stats-section">
        <view class="section-header">
          <text class="section-title">季节分布</text>
        </view>
        <view class="season-row">
          <view v-for="(count, season) in stats.bySeason" :key="season" class="season-item">
            <text class="season-icon">{{ getSeasonIcon(season as string) }}</text>
            <text class="season-name">{{ season }}</text>
            <text class="season-count">{{ count }}</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CLOTHING_TYPES } from '@/types'
import { useWardrobeStore } from '@/store/wardrobe'

const wardrobe = useWardrobeStore()
const loading = ref(false)

const stats = computed(() => wardrobe.stats)

const getTypeName = (type: string) => {
  const found = CLOTHING_TYPES.find(t => t.value === type)
  return found?.label || type
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

const getSeasonIcon = (season: string) => {
  const icons: Record<string, string> = {
    '春': '🌸',
    '夏': '☀️',
    '秋': '🍂',
    '冬': '❄️'
  }
  return icons[season] || '📅'
}

const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    wardrobe.loadClothes()
    loading.value = false
  }, 500)
}

const handleCategoryClick = (type: string) => {
  wardrobe.setFilterType(type)
  uni.switchTab({
    url: '/pages/wardrobe/index'
  })
}

const goToAdd = () => {
  uni.navigateTo({
    url: '/pages/wardrobe/add'
  })
}
</script>

<style lang="scss" scoped>
.stats-card {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.stats-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

.refresh-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-gray;
  border-radius: 50%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl;
}

.loading-icon {
  font-size: 64rpx;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: $font-size-base;
  color: $text-secondary;
  margin-top: $spacing-sm;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
  padding: $spacing-md 0;
  border-bottom: 1rpx solid $border-color;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 140rpx;
}

.stat-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-gray;
  border-radius: 50%;
  font-size: 32rpx;
}

.active-icon {
  background-color: #dcfce7;
}

.favorite-icon {
  background-color: #fce7f3;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 700;
  color: $primary-color;
  margin-top: $spacing-sm;
}

.stat-label {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-top: $spacing-xs;
}

.stats-section {
  margin-top: $spacing-md;
}

.section-header {
  margin-bottom: $spacing-sm;
}

.section-title {
  font-size: $font-size-base;
  font-weight: 500;
  color: $text-primary;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc(33.33% - 8rpx);
  padding: $spacing-sm;
  background-color: $bg-gray;
  border-radius: $border-radius-md;
}

.category-icon {
  font-size: 40rpx;
}

.category-name {
  font-size: $font-size-sm;
  color: $text-primary;
  margin-top: $spacing-xs;
}

.category-count {
  font-size: $font-size-xs;
  color: $text-secondary;
}

.season-row {
  display: flex;
  justify-content: space-around;
}

.season-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100rpx;
}

.season-icon {
  font-size: 32rpx;
}

.season-name {
  font-size: $font-size-xs;
  color: $text-primary;
  margin-top: $spacing-xs;
}

.season-count {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $primary-color;
}
</style>