<template>
  <view class="match-page">
    <view class="nav-bar">
      <view class="nav-left" @click="handleBack">
        <view class="back-btn">
          <text>←</text>
        </view>
      </view>
      <view class="nav-center">
        <text class="nav-title">智能穿搭</text>
      </view>
      <view class="nav-right">
        <view class="refresh-btn" @click="generateOutfits">
          <text>🔄</text>
        </view>
      </view>
    </view>
    
    <scroll-view class="match-content" scroll-y>
      <view class="quick-modes">
        <view 
          class="mode-item" 
          :class="{ active: activeMode === 'smart' }"
          @click="activeMode = 'smart'"
        >
          <text class="mode-icon">✨</text>
          <text class="mode-name">智能搭配</text>
        </view>
        <view 
          class="mode-item" 
          :class="{ active: activeMode === 'manual' }"
          @click="goToManual"
        >
          <text class="mode-icon">🎨</text>
          <text class="mode-name">手动搭配</text>
        </view>
        <view 
          class="mode-item" 
          :class="{ active: activeMode === 'history' }"
          @click="activeMode = 'history'"
        >
          <text class="mode-icon">📜</text>
          <text class="mode-name">穿搭历史</text>
        </view>
      </view>
      
      <view class="outfit-section" v-if="activeMode === 'smart'">
        <view class="section-header">
          <text class="section-title">为你推荐</text>
          <text class="section-hint">根据天气和你的偏好</text>
        </view>
        
        <view class="outfit-list" v-if="smartOutfits.length > 0">
          <view 
            v-for="outfit in smartOutfits" 
            :key="outfit.id"
            class="outfit-card-wrapper"
          >
            <OutfitCard :outfit="outfit" :show-actions="true" @click="handleOutfitClick" @favorite="handleFavorite" />
            <view class="outfit-actions-bottom">
              <view class="btn btn-outline btn-sm" @click="handleSave(outfit)">保存</view>
              <view class="btn btn-primary btn-sm" @click="handleApply(outfit)">应用</view>
            </view>
          </view>
        </view>
        
        <view class="empty-state" v-else>
          <text class="empty-icon">👔</text>
          <text class="empty-text">还没有推荐穿搭</text>
          <text class="empty-hint">添加至少2件衣物即可获得智能推荐</text>
          <view class="btn btn-primary mt-md" @click="goToAddClothing">添加衣物</view>
        </view>
      </view>
      
      <view class="outfit-section" v-else-if="activeMode === 'history'">
        <view class="section-header">
          <text class="section-title">穿搭历史</text>
        </view>
        
        <view class="outfit-list" v-if="savedOutfits.length > 0">
          <view 
            v-for="outfit in savedOutfits" 
            :key="outfit.id"
            class="outfit-card-wrapper"
          >
            <OutfitCard :outfit="outfit" :show-actions="true" @click="handleOutfitClick" @favorite="handleFavorite" />
            <view class="outfit-actions-bottom">
              <view class="btn btn-outline btn-sm" @click="handleApply(outfit)">应用</view>
            </view>
          </view>
        </view>
        
        <view class="empty-state" v-else>
          <text class="empty-icon">📜</text>
          <text class="empty-text">还没有穿搭记录</text>
          <text class="empty-hint">保存或应用穿搭后会显示在这里</text>
        </view>
      </view>
      
      <view class="bottom-space"></view>
    </scroll-view>
    
    <TabBar current="/pages/match/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMatchStore } from '@/store/match'
import { useWardrobeStore } from '@/store/wardrobe'
import type { Outfit } from '@/types'
import OutfitCard from '@/components/OutfitCard.vue'
import TabBar from '@/components/TabBar.vue'

const match = useMatchStore()
const wardrobe = useWardrobeStore()

const activeMode = ref('smart')
const smartOutfits = ref<Outfit[]>([])

const savedOutfits = computed(() => {
  return match.outfits
})

const generateOutfits = () => {
  if (wardrobe.clothes.length >= 2) {
    smartOutfits.value = match.generateSmartOutfits(5)
    uni.showToast({ title: '已为你生成新的穿搭', icon: 'success' })
  } else {
    uni.showToast({ title: '请先添加至少2件衣物', icon: 'none' })
  }
}

const handleOutfitClick = (outfit: Outfit) => {
  match.addToHistory(outfit.id)
}

const handleFavorite = (outfit: Outfit) => {
  if (outfit.id.startsWith('temp')) {
    match.addOutfit({
      name: outfit.name,
      description: outfit.description,
      clothes: outfit.clothes,
      scene: outfit.scene,
      season: outfit.season,
      isFavorite: true
    })
    uni.showToast({ title: '已保存到我的穿搭', icon: 'success' })
  } else {
    match.toggleFavorite(outfit.id)
    uni.showToast({ 
      title: outfit.isFavorite ? '已取消收藏' : '已收藏', 
      icon: 'none' 
    })
  }
}

const handleSave = (outfit: Outfit) => {
  match.addOutfit({
    name: outfit.name,
    description: outfit.description,
    clothes: outfit.clothes,
    scene: outfit.scene,
    season: outfit.season,
    isFavorite: false
  })
  uni.showToast({ title: '已保存到我的穿搭', icon: 'success' })
}

const handleApply = (outfit: Outfit) => {
  match.addToHistory(outfit.id)
  uni.showToast({ title: `已应用穿搭: ${outfit.name}`, icon: 'success' })
}

const goToManual = () => {
  uni.navigateTo({ url: '/pages/match/manual' })
}

const goToAddClothing = () => {
  uni.navigateTo({ url: '/pages/wardrobe/add' })
}

const handleBack = () => {
  uni.navigateBack({ delta: 1 })
}

onMounted(() => {
  wardrobe.loadClothes()
  match.loadOutfits()
  if (wardrobe.clothes.length >= 2) {
    smartOutfits.value = match.generateSmartOutfits(5)
  }
})

onShow(() => {
  wardrobe.loadClothes()
  match.loadOutfits()
})
</script>

<style lang="scss" scoped>
.match-page {
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

.refresh-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.match-content {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  min-height: 100vh;
}

.quick-modes {
  display: flex;
  background-color: $bg-white;
  margin: $spacing-md;
  border-radius: $border-radius-lg;
  padding: $spacing-sm;
}

.mode-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-md $spacing-sm;
  border-radius: $border-radius;
  
  &.active {
    background-color: $primary-color;
    
    .mode-name {
      color: $text-white;
    }
  }
}

.mode-icon {
  font-size: 36rpx;
}

.mode-name {
  font-size: $font-size-xs;
  color: $text-secondary;
  margin-top: $spacing-xs;
}

.outfit-section {
  padding: 0 $spacing-md;
}

.section-header {
  margin-bottom: $spacing-sm;
}

.section-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

.section-hint {
  font-size: $font-size-sm;
  color: $text-light;
  margin-top: $spacing-xs;
  display: block;
}

.outfit-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.outfit-card-wrapper {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  overflow: hidden;
}

.outfit-actions-bottom {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md $spacing-md;
}

.btn-sm {
  flex: 1;
  height: 72rpx;
  font-size: $font-size-sm;
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
