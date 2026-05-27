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
          <text>刷新</text>
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
          <text class="mode-name">智能搭配</text>
        </view>
        <view 
          class="mode-item" 
          :class="{ active: activeMode === 'manual' }"
          @click="goToManual"
        >
          <text class="mode-name">手动搭配</text>
        </view>
        <view 
          class="mode-item" 
          :class="{ active: activeMode === 'history' }"
          @click="activeMode = 'history'"
        >
          <text class="mode-name">穿搭历史</text>
        </view>
      </view>

      <view class="outfit-section" v-if="activeMode === 'smart'">
        <view class="section-header">
          <text class="section-title">AI 智能搭配</text>
          <text class="section-hint">AI 分析衣物并生成穿搭效果图</text>
        </view>

        <view class="generate-area" v-if="smartOutfits.length === 0 && !isGenerating">
          <view class="generate-hint">
            <text class="generate-icon">✨</text>
            <text class="generate-text">AI 将分析你的衣橱，生成模特穿搭效果图</text>
          </view>
          <view class="btn btn-primary btn-generate" @click="generateOutfits">
            <text>开始生成搭配</text>
          </view>
        </view>

        <view class="generating-area" v-if="isGenerating">
          <view class="generating-spinner">
            <text class="spinner-icon">⏳</text>
          </view>
          <text class="generating-text">{{ stepLabel[currentStep] || '处理中...' }}</text>
          <text class="generating-hint">预计需要 10-30 秒</text>
        </view>

        <view class="outfit-list" v-if="smartOutfits.length > 0">
          <view
            v-for="outfit in smartOutfits"
            :key="outfit.id"
            class="outfit-card-wrapper"
          >
            <OutfitCard
              :outfit="outfit"
              :show-actions="true"
              :show-preview="true"
              :preview-image="outfit.generatedImage"
              @click="handleOutfitClick"
              @favorite="handleFavorite"
            />
            <view class="outfit-actions-bottom">
              <view class="btn btn-outline btn-sm" @click="handleSave(outfit)">保存</view>
              <view class="btn btn-primary btn-sm" @click="handleApply(outfit)">应用</view>
            </view>
          </view>

          <view class="btn btn-outline btn-refresh" @click="generateOutfits">
            <text>换一批</text>
          </view>
        </view>

        <view class="empty-state" v-if="!isKeyConfigured() && !isGenerating">
          <text class="empty-icon">🔑</text>
          <text class="empty-text">需要配置 API Key</text>
          <text class="empty-hint">前往设置页配置阿里云 API Key</text>
          <view class="btn btn-primary mt-md" @click="() => uni.navigateTo({ url: '/pages/settings/index' })">前往设置</view>
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
          <text class="empty-icon">—</text>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMatchStore } from '@/store/match'
import { useWardrobeStore } from '@/store/wardrobe'
import type { Outfit, Clothing } from '@/types'
import { isKeyConfigured } from '@/api/dashscope'
import { useOutfitGenerator } from '@/composables/useOutfitGenerator'
import OutfitCard from '@/components/OutfitCard.vue'
import TabBar from '@/components/TabBar.vue'

const match = useMatchStore()
const wardrobe = useWardrobeStore()
const { isGenerating, currentStep, resultImage, error, generateFromClothes, reset: resetGenerator } = useOutfitGenerator()

const activeMode = ref('smart')
const smartOutfits = ref<Array<Outfit & { generatedImage?: string }>>([])

const savedOutfits = computed(() => match.outfits)

const stepLabel: Record<string, string> = {
  analyzing: '正在分析衣物...',
  generating: '正在生成效果图...'
}

const getDisplayClothes = (outfit: Outfit): Clothing[] => {
  return outfit.clothes
    .map(id => wardrobe.getClothingById(id))
    .filter((c): c is Clothing => c !== undefined)
}

const generateOutfits = async () => {
  if (!isKeyConfigured()) {
    uni.showModal({
      title: '未配置 API Key',
      content: '请先在设置页配置阿里云 API Key 以使用 AI 搭配生成',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/settings/index' })
        }
      }
    })
    return
  }

  const active = wardrobe.getActiveClothes()
  if (active.length < 2) {
    uni.showToast({ title: '请先添加至少2件衣物并设为激活', icon: 'none' })
    return
  }

  const combos = match.generateSmartOutfits(3)
  if (combos.length === 0) {
    uni.showToast({ title: '暂无可搭配的衣物组合', icon: 'none' })
    return
  }

  smartOutfits.value = []
  resetGenerator()

  for (const outfit of combos) {
    const clothes = getDisplayClothes(outfit)
    if (clothes.length < 2) continue

    const imageUrl = await generateFromClothes(clothes, {
      gender: 'female',
      style: outfit.scene
    })

    smartOutfits.value.push({
      ...outfit,
      generatedImage: imageUrl || undefined
    })
  }

  if (smartOutfits.value.length > 0) {
    uni.showToast({ title: `已生成${smartOutfits.value.length}套搭配`, icon: 'success' })
  } else {
    uni.showToast({ title: '生成失败，请重试', icon: 'none' })
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
})

onShow(() => {
  wardrobe.loadClothes()
  match.loadOutfits()
})

onUnmounted(() => {
  resetGenerator()
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
  padding: 8rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #D4AF37;
  font-weight: 500;
}

.match-content {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  min-height: 100vh;
}

.quick-modes {
  display: flex;
  background-color: #FFFFFF;
  margin: $spacing-md;
  border-radius: $border-radius-lg;
  padding: 8rpx;
  gap: 4rpx;
}

.mode-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 12rpx;
  border-radius: $border-radius;

  &.active {
    background-color: #171717;

    .mode-name {
      color: #FFFFFF;
    }
  }
}

.mode-name {
  font-size: 24rpx;
  color: #888;
  font-weight: 500;
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
  font-size: 64rpx;
  color: #CCC;
  font-weight: 300;
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

.generate-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl $spacing-md;
}

.generate-icon {
  font-size: 64rpx;
  display: block;
  text-align: center;
}

.generate-text {
  font-size: $font-size-sm;
  color: $text-secondary;
  text-align: center;
  margin-top: $spacing-sm;
  display: block;
}

.generate-hint {
  margin-bottom: $spacing-lg;
  text-align: center;
}

.btn-generate {
  padding: 24rpx 64rpx;
  font-size: $font-size-base;
  border-radius: $border-radius;
}

.generating-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl;
}

.spinner-icon {
  font-size: 64rpx;
}

.generating-spinner {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.generating-text {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: 500;
  margin-top: $spacing-md;
}

.generating-hint {
  font-size: $font-size-sm;
  color: $text-light;
  margin-top: $spacing-xs;
}

.btn-refresh {
  margin-top: $spacing-md;
  align-self: center;
  padding: 16rpx 48rpx;
}

.mt-md {
  margin-top: $spacing-md;
}
</style>
