<template>
  <view class="nav-bar">
    <view v-if="showBack" class="nav-back" @click="handleBack">
      <text class="back-icon">‹</text>
    </view>
    <view v-else class="nav-placeholder"></view>
    <view class="nav-title">{{ title }}</view>
    <view class="nav-right">
      <slot name="right"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  showBack?: boolean
}>()

const handleBack = () => {
  uni.navigateBack({ delta: 1 })
}
</script>

<style lang="scss" scoped>
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

.nav-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-placeholder {
  width: 64rpx;
}

.back-icon {
  font-size: 48rpx;
  color: $text-primary;
  font-weight: 300;
}

.nav-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

.nav-right {
  width: 64rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>