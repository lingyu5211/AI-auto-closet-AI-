<template>
  <view class="tab-bar">
    <view 
      v-for="item in tabs" 
      :key="item.path"
      class="tab-item"
      :class="{ active: currentPath === item.path }"
      @click="handleTabClick(item.path)"
    >
      <text class="tab-icon">{{ item.icon }}</text>
      <text class="tab-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: string
}>()

const tabs = [
  { path: '/pages/home/index', text: '首页', icon: '🏠' },
  { path: '/pages/wardrobe/index', text: '衣橱', icon: '👕' },
  { path: '/pages/match/index', text: '穿搭', icon: '🎨' },
  { path: '/pages/message/index', text: '消息', icon: '💬' },
  { path: '/pages/diary/index', text: '日记', icon: '📔' },
  { path: '/pages/settings/index', text: '我的', icon: '👤' }
]

const currentPath = computed(() => props.current)

const handleTabClick = (path: string) => {
  if (currentPath.value !== path) {
    const fullPath = path.startsWith('/') ? path : '/' + path
    uni.navigateTo({ 
      url: fullPath,
      success: () => {
        console.log('Tab switch success:', fullPath)
      }
    })
  }
}
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: $bg-white;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  transition: all 0.3s ease;
  
  &.active {
    .tab-icon {
      transform: scale(1.1);
    }
    
    .tab-text {
      color: $primary-color;
      font-weight: 500;
    }
  }
}

.tab-icon {
  font-size: 36rpx;
  transition: transform 0.3s ease;
}

.tab-text {
  font-size: $font-size-xs;
  color: $text-secondary;
  margin-top: 4rpx;
  transition: color 0.3s ease;
}
</style>
