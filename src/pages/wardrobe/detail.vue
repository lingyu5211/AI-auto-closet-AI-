<template>
  <view class="detail-page">
    <NavBar title="衣物详情" :show-back="true">
      <template #right>
        <view class="more-btn" @click="showMoreMenu = true">
          <text>⋮</text>
        </view>
      </template>
    </NavBar>
    
    <scroll-view class="detail-content" scroll-y v-if="clothing">
      <view class="detail-image">
        <image v-if="clothing.photo" :src="clothing.photo" mode="aspectFill" />
        <view v-else class="image-placeholder">
          <text>{{ getTypeIcon(clothing.type) }}</text>
        </view>
        <view class="image-badges">
          <view v-if="clothing.isFavorite" class="badge badge-favorite">
            <text>❤️</text>
          </view>
          <view v-if="!clothing.isActive" class="badge badge-inactive">
            <text>闲置</text>
          </view>
          <view v-if="clothing.isCommon" class="badge badge-common">
            <text>常用</text>
          </view>
        </view>
      </view>
      
      <view class="detail-info">
        <text class="detail-name">{{ clothing.name || clothing.subType || '未命名' }}</text>
        <view class="detail-tags">
          <text class="tag tag-primary">{{ clothing.color }}</text>
          <text class="tag">{{ getTypeName(clothing.type) }}</text>
          <text class="tag" v-if="clothing.subType">{{ clothing.subType }}</text>
        </view>
      </view>
      
      <view class="detail-section">
        <view class="section-title">基本信息</view>
        <view class="info-list">
          <view class="info-item">
            <text class="info-label">品牌</text>
            <text class="info-value">{{ clothing.brand || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">尺码</text>
            <text class="info-value">{{ clothing.size || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">材质</text>
            <text class="info-value">{{ clothing.material || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">季节</text>
            <text class="info-value">{{ clothing.season.join(' / ') || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">场景</text>
            <text class="info-value">{{ clothing.scene.join(' / ') || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">购买渠道</text>
            <text class="info-value">{{ clothing.purchaseChannel || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">购买时间</text>
            <text class="info-value">{{ clothing.purchaseTime ? formatDate(clothing.purchaseTime) : '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">价格</text>
            <text class="info-value">{{ clothing.price > 0 ? `¥${clothing.price.toFixed(2)}` : '-' }}</text>
          </view>
        </view>
      </view>
      
      <view class="detail-section" v-if="clothing.tags.length > 0">
        <view class="section-title">标签</view>
        <view class="tags-list">
          <text class="tag" v-for="tag in clothing.tags" :key="tag">{{ tag }}</text>
        </view>
      </view>
      
      <view class="detail-section" v-if="clothing.remark">
        <view class="section-title">备注</view>
        <text class="remark-text">{{ clothing.remark }}</text>
      </view>
      
      <view class="detail-actions">
        <view class="action-btn" :class="{ active: clothing.isFavorite }" @click="toggleFavorite">
          <text>{{ clothing.isFavorite ? '❤️' : '🤍' }}</text>
          <text>收藏</text>
        </view>
        <view class="action-btn" :class="{ active: !clothing.isActive }" @click="toggleActive">
          <text>{{ clothing.isActive ? '📦' : '💤' }}</text>
          <text>{{ clothing.isActive ? '标记闲置' : '取消闲置' }}</text>
        </view>
        <view class="action-btn" @click="handleShare">
          <text>📤</text>
          <text>分享</text>
        </view>
      </view>
      
      <view class="bottom-space"></view>
    </scroll-view>
    
    <view class="footer-actions">
      <view class="btn btn-secondary" @click="handleEdit">编辑</view>
      <view class="btn btn-danger" @click="handleDelete">删除</view>
    </view>
    
    <view class="menu-overlay" v-if="showMoreMenu" @click="showMoreMenu = false">
      <view class="menu-content" @click.stop>
        <view class="menu-item" @click="handleEdit; showMoreMenu = false">
          <text>✏️</text>
          <text>编辑衣物</text>
        </view>
        <view class="menu-item" @click="handleDelete; showMoreMenu = false">
          <text>🗑️</text>
          <text>删除衣物</text>
        </view>
        <view class="menu-item" @click="showMoreMenu = false">
          <text>❌</text>
          <text>取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useWardrobeStore } from '@/store/wardrobe'
import { CLOTHING_TYPES } from '@/types'
import { formatDate } from '@/utils'
import NavBar from '@/components/NavBar.vue'

const wardrobe = useWardrobeStore()

const clothingId = ref('')
const showMoreMenu = ref(false)

const clothing = computed(() => {
  return wardrobe.getClothingById(clothingId.value)
})

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

const toggleFavorite = () => {
  if (clothing.value) {
    wardrobe.toggleFavorite(clothing.value.id)
    uni.showToast({ 
      title: clothing.value.isFavorite ? '已取消收藏' : '已收藏', 
      icon: 'none' 
    })
  }
}

const toggleActive = () => {
  if (clothing.value) {
    wardrobe.toggleActive(clothing.value.id)
    uni.showToast({ 
      title: clothing.value.isActive ? '已取消闲置' : '已标记闲置', 
      icon: 'none' 
    })
  }
}

const handleEdit = () => {
  uni.showToast({ title: '编辑功能开发中', icon: 'none' })
}

const handleDelete = () => {
  uni.showModal({
    title: '删除衣物',
    content: '确定要删除这件衣物吗？',
    confirmText: '删除',
    confirmColor: '#ef4444',
    success: (res) => {
      if (res.confirm && clothing.value) {
        wardrobe.deleteClothing(clothing.value.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    }
  })
}

const handleShare = () => {
  uni.showToast({ title: '分享功能开发中', icon: 'none' })
}

onLoad((options) => {
  clothingId.value = options?.id || ''
})

onMounted(() => {
  wardrobe.loadClothes()
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.detail-content {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  min-height: 100vh;
}

.detail-image {
  position: relative;
  width: 100%;
  height: 500rpx;
  background-color: $bg-white;
}

.detail-image image {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 120rpx;
}

.image-badges {
  position: absolute;
  bottom: $spacing-md;
  left: $spacing-md;
  display: flex;
  gap: $spacing-xs;
}

.badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  
  &.badge-favorite {
    background-color: rgba(239, 68, 68, 0.9);
    color: $text-white;
  }
  
  &.badge-inactive {
    background-color: rgba(239, 68, 68, 0.9);
    color: $text-white;
  }
  
  &.badge-common {
    background-color: rgba($primary-color, 0.9);
    color: $text-white;
  }
}

.detail-info {
  background-color: $bg-white;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
}

.detail-name {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $text-primary;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
}

.detail-section {
  background-color: $bg-white;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: $spacing-sm;
  border-bottom: 1rpx solid $border-color;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.info-label {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.info-value {
  font-size: $font-size-sm;
  color: $text-primary;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.remark-text {
  font-size: $font-size-base;
  color: $text-primary;
  line-height: 1.6;
}

.detail-actions {
  display: flex;
  justify-content: space-around;
  padding: $spacing-lg;
  background-color: $bg-white;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;
  
  &.active {
    color: $primary-color;
  }
}

.footer-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
  background-color: $bg-white;
  border-top: 1rpx solid $border-color;
}

.footer-actions .btn {
  flex: 1;
}

.bottom-space {
  height: calc(160rpx + env(safe-area-inset-bottom));
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.menu-content {
  width: 100%;
  background-color: $bg-white;
  border-radius: $border-radius-lg $border-radius-lg 0 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: $spacing-lg;
  gap: $spacing-md;
  font-size: $font-size-base;
  color: $text-primary;
  border-bottom: 1rpx solid $border-color;
  
  &:last-child {
    border-bottom: none;
    color: $text-light;
  }
}

.more-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}
</style>