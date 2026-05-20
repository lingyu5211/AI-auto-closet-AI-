<template>
  <view class="wardrobe-page">
    <view class="nav-bar">
      <view class="nav-left" @click="handleBack">
        <view class="back-btn">
          <text>←</text>
        </view>
      </view>
      <view class="nav-center">
        <text class="nav-title">我的衣橱</text>
      </view>
      <view class="nav-right">
        <view class="filter-btn" @click="showFilter = true">
          <text>⚙️</text>
        </view>
      </view>
    </view>
    
    <view class="content">
      <StatsCard class="stats-card" />
      
      <view class="category-tabs">
        <scroll-view scroll-x class="tabs-scroll">
          <view class="tabs-list">
            <view 
              v-for="cat in categories" 
              :key="cat.id"
              class="tab-item"
              :class="{ active: activeCategory === cat.id }"
              @click="activeCategory = cat.id"
            >
              <text class="tab-icon">{{ cat.icon }}</text>
              <text class="tab-name">{{ cat.name }}</text>
              <text class="tab-count">{{ getCategoryCount(cat.id) }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
      
      <view class="clothing-list" v-if="filteredClothes.length > 0">
        <view 
          v-for="clothing in filteredClothes" 
          :key="clothing.id"
          class="clothing-item"
          @click="goToDetail(clothing.id)"
        >
          <ClothingCard :clothing="clothing" />
        </view>
      </view>
      
      <view class="empty-state" v-else>
        <text class="empty-icon">📦</text>
        <text class="empty-text">该分类下暂无衣物</text>
      </view>
    </view>
    
    <view class="fab-btn" @click="goToAdd">
      <text>+</text>
    </view>
    
    <FilterSheet 
      :visible="showFilter" 
      @close="showFilter = false"
      @confirm="handleFilterConfirm"
    />
    
    <TabBar current="/pages/wardrobe/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWardrobeStore } from '@/store/wardrobe'
import type { Clothing } from '@/types'
import ClothingCard from '@/components/ClothingCard.vue'
import StatsCard from '@/components/StatsCard.vue'
import FilterSheet from '@/components/FilterSheet.vue'
import TabBar from '@/components/TabBar.vue'

const wardrobe = useWardrobeStore()

const activeCategory = ref('all')
const showFilter = ref(false)
const currentFilters = ref<Record<string, unknown>>({})

const categories = computed(() => {
  return [
    { id: 'all', name: '全部', icon: '👔', custom: false },
    ...wardrobe.categories
  ]
})

const filteredClothes = computed(() => {
  let clothes = wardrobe.clothes
  
  if (activeCategory.value !== 'all') {
    clothes = wardrobe.getClothesByCategory(activeCategory.value)
  }
  
  if (Object.keys(currentFilters.value).length > 0) {
    clothes = wardrobe.filterClothes(currentFilters.value as Record<string, string>)
  }
  
  // 只显示有照片的衣物
  return clothes.filter(c => c.photo)
})

const getCategoryCount = (categoryId: string) => {
  if (categoryId === 'all') {
    return wardrobe.clothes.filter(c => c.photo).length
  }
  return wardrobe.getClothesByCategory(categoryId).filter(c => c.photo).length
}

const goToDetail = (id: string) => {
  uni.navigateTo({ url: `/pages/wardrobe/detail?id=${id}` })
}

const goToAdd = () => {
  uni.navigateTo({ url: '/pages/wardrobe/add' })
}

const handleBack = () => {
  uni.navigateBack({ delta: 1 })
}

const handleFilterConfirm = (filters: Record<string, unknown>) => {
  currentFilters.value = filters
  showFilter.value = false
}

onMounted(() => {
  wardrobe.loadClothes()
  wardrobe.loadCategories()
})

onShow(() => {
  wardrobe.loadClothes()
})
</script>

<style lang="scss" scoped>
.wardrobe-page {
  min-height: 100vh;
  background-color: $bg-color;
  padding-bottom: calc(120rpx + 120rpx);
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

.filter-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.content {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  padding: $spacing-md;
  padding-top: calc(88rpx + var(--status-bar-height, 44px) + #{$spacing-md});
}

.stats-card {
  margin-bottom: $spacing-md;
}

.category-tabs {
  margin-bottom: $spacing-md;
}

.tabs-scroll {
  white-space: nowrap;
}

.tabs-list {
  display: inline-flex;
  gap: $spacing-sm;
}

.tab-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  min-width: 100rpx;
  
  &.active {
    background-color: $primary-color;
    
    .tab-name, .tab-count {
      color: $text-white;
    }
  }
}

.tab-icon {
  font-size: 32rpx;
}

.tab-name {
  font-size: $font-size-xs;
  color: $text-secondary;
  margin-top: $spacing-xs;
}

.tab-count {
  font-size: $font-size-xs;
  color: $text-light;
  margin-top: 2rpx;
}

.clothing-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.clothing-item {
  width: calc(50% - #{$spacing-sm} / 2);
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

.fab-btn {
  position: fixed;
  right: $spacing-lg;
  bottom: calc(120rpx + #{$spacing-lg});
  width: 100rpx;
  height: 100rpx;
  background-color: $primary-color;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-white;
  font-size: 48rpx;
  font-weight: 300;
  box-shadow: $shadow-lg;
}
</style>
