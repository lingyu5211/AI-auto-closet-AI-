<template>
  <view class="home-page">
    <view class="nav-bar">
      <view class="nav-left">
        <text class="nav-title">电子衣橱</text>
      </view>
      <view class="nav-right">
        <view class="search-btn" @click="handleSearch">
          <text>🔍</text>
        </view>
        <view class="avatar-btn" @click="goToProfile">
          <text class="avatar">👤</text>
        </view>
      </view>
    </view>
    
    <scroll-view 
      class="home-content" 
      scroll-y 
      :scroll-top="scrollTop"
      @scroll="handleScroll"
      :scroll-with-animation="true"
    >
      <view class="weather-card" v-if="weather">
        <view class="weather-icon">{{ getWeatherIcon(weather.condition) }}</view>
        <view class="weather-info">
          <text class="weather-temp">{{ weather.temperature.min }}°-{{ weather.temperature.max }}°</text>
          <text class="weather-condition">{{ weather.condition }}</text>
        </view>
        <view class="weather-hint">
          <text>适合{{ currentSeason }}穿搭</text>
        </view>
      </view>
      
      <view class="temp-advice-card" v-if="tempAdvice">
        <view class="advice-icon">{{ tempAdvice.icon }}</view>
        <view class="advice-content">
          <text class="advice-tip">{{ tempAdvice.tip }}</text>
          <view class="style-tags">
            <view 
              v-for="style in recommendedStyles" 
              :key="style" 
              class="style-tag"
            >
              {{ style }}
            </view>
          </view>
        </view>
        <view class="layer-info">
          <text class="layer-num">{{ tempAdvice.layers }}层</text>
          <text class="layer-label">衣物</text>
        </view>
      </view>
      
      <view class="section">
        <view class="section-header">
          <text class="section-title">今日推荐</text>
          <view class="section-subtitle">根据 {{ weather?.temperature.min }}°-{{ weather?.temperature.max }}° 推荐</view>
          <text class="section-more" @click="goToMatch">查看更多</text>
        </view>
        
        <scroll-view class="outfit-scroll" scroll-x v-if="recommendedOutfits.length > 0">
          <view class="outfit-list">
            <view 
              v-for="outfit in recommendedOutfits" 
              :key="outfit.id" 
              class="outfit-item"
              @click="handleOutfitClick(outfit)"
            >
              <OutfitCard :outfit="outfit" :show-actions="true" />
            </view>
          </view>
        </scroll-view>
        
        <view class="empty-state" v-else>
          <text class="empty-icon">👔</text>
          <text class="empty-text">还没有推荐穿搭</text>
          <text class="empty-hint">添加衣物后即可获得智能推荐</text>
        </view>
      </view>
      
      <view class="section">
        <view class="section-header">
          <text class="section-title">快捷操作</text>
        </view>
        <view class="quick-actions">
          <view class="action-item" @click="goToAddClothing">
            <view class="action-icon add">
              <text>+</text>
            </view>
            <text class="action-text">添加衣物</text>
          </view>
          <view class="action-item" @click="goToWardrobe">
            <view class="action-icon">👕</view>
            <text class="action-text">我的衣橱</text>
          </view>
          <view class="action-item" @click="goToMatch">
            <view class="action-icon">🎨</view>
            <text class="action-text">智能穿搭</text>
          </view>
          <view class="action-item" @click="goToDiary">
            <view class="action-icon">📔</view>
            <text class="action-text">穿搭日记</text>
          </view>
          <view class="action-item" @click="handleClearWardrobe">
            <view class="action-icon">🗑️</view>
            <text class="action-text">整理衣橱</text>
          </view>
        </view>
      </view>
      
      <view class="section">
        <view class="section-header">
          <text class="section-title">最新衣物</text>
          <text class="section-more" @click="goToWardrobe">查看全部</text>
        </view>
        
        <view class="clothing-grid" v-if="recentClothes.length > 0">
          <view 
            v-for="clothing in recentClothes" 
            :key="clothing.id"
            class="clothing-item"
            @click="handleClothingClick(clothing)"
          >
            <ClothingCard :clothing="clothing" />
          </view>
        </view>
        
        <view class="empty-state" v-else>
          <text class="empty-icon">📦</text>
          <text class="empty-text">还没有衣物</text>
          <view class="btn btn-primary mt-md" @click="goToAddClothing">
            <text>添加第一件衣物</text>
          </view>
        </view>
      </view>
      
      <view class="bottom-space"></view>
    </scroll-view>
    
    <TabBar current="/pages/home/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import { useAuthStore } from '@/store/auth'
import { useWardrobeStore } from '@/store/wardrobe'
import { useMatchStore } from '@/store/match'
import type { Outfit, Clothing, Weather } from '@/types'
import { getWeatherIcon as getIcon, getSeasonByMonth } from '@/utils'
import ClothingCard from '@/components/ClothingCard.vue'
import OutfitCard from '@/components/OutfitCard.vue'
import TabBar from '@/components/TabBar.vue'

const auth = useAuthStore()
const wardrobe = useWardrobeStore()
const match = useMatchStore()

const weather = ref<Weather | null>(null)
const recommendedOutfits = ref<Outfit[]>([])
const scrollTop = ref<number>(0)

const currentSeason = computed(() => {
  const month = new Date().getMonth() + 1
  return getSeasonByMonth(month)
})

const recentClothes = computed(() => {
  return wardrobe.clothes.slice(0, 6)
})

const tempAdvice = computed(() => match.tempAdvice)
const recommendedStyles = computed(() => match.recommendedStyles)

const getWeatherIcon = (condition: string) => {
  return getIcon(condition)
}

const loadWeather = () => {
  weather.value = {
    temperature: { min: 18, max: 26 },
    condition: '晴',
    wind: '微风',
    humidity: 45
  }
  match.setWeather(weather.value)
}

const loadRecommendations = () => {
  if (wardrobe.clothes.length >= 2) {
    recommendedOutfits.value = match.generateSmartOutfits(3)
  } else {
    recommendedOutfits.value = []
  }
}

const handleSearch = () => {
  uni.showToast({ title: '搜索功能开发中', icon: 'none' })
}

const goToProfile = () => {
  uni.navigateTo({ url: '/pages/settings/index' })
}

const goToAddClothing = () => {
  uni.navigateTo({ url: '/pages/wardrobe/add' })
}

const goToWardrobe = () => {
  uni.navigateTo({ url: '/pages/wardrobe/index' })
}

const goToMatch = () => {
  uni.navigateTo({ url: '/pages/match/index' })
}

const goToDiary = () => {
  uni.navigateTo({ url: '/pages/diary/index' })
}

const handleOutfitClick = (outfit: Outfit) => {
  match.addToHistory(outfit.id)
  uni.showToast({ title: `已应用穿搭: ${outfit.name}`, icon: 'success' })
}

const handleClothingClick = (clothing: Clothing) => {
  uni.navigateTo({ url: `/pages/wardrobe/detail?id=${clothing.id}` })
}

const handleClearWardrobe = () => {
  uni.showModal({
    title: '整理衣橱',
    content: '你可以将不常用的衣物标记为闲置，或删除不需要的衣物',
    confirmText: '去整理',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        uni.redirectTo({ url: '/pages/wardrobe/index' })
      }
    }
  })
}

const handleScroll = (e: any) => {
  scrollTop.value = e.detail.scrollTop
}

const saveScrollPosition = () => {
  try {
    uni.setStorageSync('home_scroll_position', scrollTop.value)
  } catch (e) {
    console.error('保存滚动位置失败', e)
  }
}

const restoreScrollPosition = () => {
  try {
    const savedPosition = uni.getStorageSync('home_scroll_position')
    if (savedPosition !== '' && savedPosition !== undefined && savedPosition !== null) {
      scrollTop.value = savedPosition
      nextTick(() => {
        scrollTop.value = savedPosition + 1
        nextTick(() => {
          scrollTop.value = savedPosition
        })
      })
    }
  } catch (e) {
    console.error('恢复滚动位置失败', e)
  }
}

onMounted(() => {
  auth.loadAuth()
  wardrobe.loadClothes()
  match.loadOutfits()
  loadWeather()
  loadRecommendations()
  restoreScrollPosition()
})

onShow(() => {
  wardrobe.loadClothes()
  loadRecommendations()
  restoreScrollPosition()
})

onHide(() => {
  saveScrollPosition()
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: linear-gradient(90deg, $primary-color, $primary-light);
  padding-top: var(--status-bar-height, 44px);
  height: calc(88rpx + var(--status-bar-height, 44px));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: $spacing-md;
  padding-right: $spacing-sm;
}

.nav-left {
  flex: 1;
}

.nav-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-white;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.search-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.avatar-btn {
  width: 64rpx;
  height: 64rpx;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.home-content {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  min-height: 100vh;
}

.weather-card {
  margin: $spacing-md;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.weather-icon {
  font-size: 64rpx;
}

.weather-info {
  flex: 1;
}

.weather-temp {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $text-white;
  display: block;
}

.weather-condition {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.8);
}

.weather-hint {
  background-color: rgba(255, 255, 255, 0.2);
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius;
  font-size: $font-size-xs;
  color: $text-white;
}

.temp-advice-card {
  margin: 0 $spacing-md;
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.advice-icon {
  font-size: 56rpx;
}

.advice-content {
  flex: 1;
}

.advice-tip {
  font-size: $font-size-sm;
  color: $text-primary;
  display: block;
  margin-bottom: $spacing-xs;
}

.style-tags {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

.style-tag {
  background-color: $primary-light;
  color: $primary-color;
  padding: 4rpx 16rpx;
  border-radius: $border-radius;
  font-size: $font-size-xs;
}

.layer-info {
  text-align: center;
  border-left: 1rpx solid $border-color;
  padding-left: $spacing-md;
}

.layer-num {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $primary-color;
  display: block;
}

.layer-label {
  font-size: $font-size-xs;
  color: $text-light;
}

.section {
  margin-top: $spacing-md;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 $spacing-md;
  margin-bottom: $spacing-sm;
}

.section-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
  display: block;
}

.section-subtitle {
  font-size: $font-size-xs;
  color: $text-light;
  margin-top: 4rpx;
}

.section-more {
  font-size: $font-size-sm;
  color: $primary-color;
  margin-top: 8rpx;
}

.outfit-scroll {
  white-space: nowrap;
}

.outfit-list {
  display: inline-flex;
  padding: $spacing-sm $spacing-md;
  gap: $spacing-sm;
}

.outfit-item {
  width: 280rpx;
  flex-shrink: 0;
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

.quick-actions {
  display: flex;
  justify-content: space-around;
  padding: $spacing-md;
  background-color: $bg-white;
  margin: 0 $spacing-md;
  border-radius: $border-radius-lg;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
}

.action-icon {
  width: 96rpx;
  height: 96rpx;
  background-color: $bg-gray;
  border-radius: $border-radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  
  &.add {
    background-color: $primary-color;
    color: $text-white;
    font-size: 48rpx;
    font-weight: 300;
  }
}

.action-text {
  font-size: $font-size-xs;
  color: $text-secondary;
}

.clothing-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 $spacing-md;
  gap: $spacing-sm;
}

.clothing-item {
  width: calc(50% - #{$spacing-sm} / 2);
}

.bottom-space {
  height: calc(120rpx + #{$spacing-lg});
}
</style>
