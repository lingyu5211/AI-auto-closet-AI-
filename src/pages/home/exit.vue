<template>
  <view class="exit-page">
    <view class="nav-bar">
      <view class="nav-left" @click="handleBack">
        <view class="back-btn">
          <text>←</text>
        </view>
      </view>
      <view class="nav-center">
        <text class="nav-title">退出</text>
      </view>
      <view class="nav-right"></view>
    </view>
    
    <scroll-view class="exit-content" scroll-y>
      <view class="exit-card">
        <view class="exit-icon">👋</view>
        <text class="exit-title">确定要退出吗？</text>
        <text class="exit-subtitle">退出后您可以随时重新登录</text>
      </view>
      
      <view class="button-group">
        <view class="btn btn-outline btn-lg" @click="handleCancel">
          <text>取消</text>
        </view>
        <view class="btn btn-primary btn-lg" @click="handleExit">
          <text>退出登录</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()

const handleBack = () => {
  uni.navigateBack()
}

const handleCancel = () => {
  uni.navigateBack()
}

const handleExit = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出当前账号吗？',
    success: (res) => {
      if (res.confirm) {
        auth.logout()
        uni.reLaunch({ url: '/pages/auth/login' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.exit-page {
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
}

.exit-content {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  min-height: 100vh;
  padding: $spacing-xl $spacing-md;
}

.exit-card {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  text-align: center;
  box-shadow: $shadow-sm;
}

.exit-icon {
  font-size: 120rpx;
  margin-bottom: $spacing-md;
}

.exit-title {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $text-primary;
  display: block;
  margin-bottom: $spacing-sm;
}

.exit-subtitle {
  font-size: $font-size-sm;
  color: $text-secondary;
  display: block;
}

.button-group {
  margin-top: $spacing-xl;
  display: flex;
  gap: $spacing-md;
}

.btn-lg {
  flex: 1;
  height: 96rpx;
  font-size: $font-size-base;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $border-radius-lg;
}
</style>
