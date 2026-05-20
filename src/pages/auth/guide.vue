<template>
  <view class="guide-page">
    <view class="guide-content">
      <view class="guide-step" v-if="currentStep === 0">
        <view class="step-icon">📸</view>
        <text class="step-title">添加你的第一件衣物</text>
        <text class="step-desc">拍照或从相册导入，开始管理你的衣橱</text>
        <view class="step-image">
          <view class="image-placeholder">
            <text>👕</text>
          </view>
        </view>
      </view>
      
      <view class="guide-step" v-else-if="currentStep === 1">
        <view class="step-icon">🎨</view>
        <text class="step-title">选择你的穿搭偏好</text>
        <text class="step-desc">告诉我们你喜欢的风格，为你推荐更精准的穿搭</text>
        <view class="preference-options">
          <view 
            v-for="style in STYLE_PREFERENCES" 
            :key="style"
            class="preference-item"
            :class="{ active: selectedStyles.includes(style) }"
            @click="toggleStyle(style)"
          >
            <text>{{ style }}</text>
          </view>
        </view>
      </view>
      
      <view class="guide-step" v-else-if="currentStep === 2">
        <view class="step-icon">🎉</view>
        <text class="step-title">完成引导</text>
        <text class="step-desc">太棒了！现在开始体验电子衣橱的全部功能吧</text>
        <view class="complete-image">
          <text>✨👗✨</text>
        </view>
      </view>
    </view>
    
    <view class="guide-indicator">
      <view 
        v-for="i in 3" 
        :key="i" 
        class="indicator-dot"
        :class="{ active: currentStep === i - 1 }"
      ></view>
    </view>
    
    <view class="guide-footer">
      <view v-if="currentStep < 2" class="btn btn-primary" @click="nextStep">
        <text>{{ currentStep === 1 && selectedStyles.length === 0 ? '跳过' : '下一步' }}</text>
      </view>
      <view v-else class="btn btn-primary" @click="finishGuide">
        <text>开始使用</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { STYLE_PREFERENCES } from '@/types'

const auth = useAuthStore()

const currentStep = ref(0)
const selectedStyles = ref<string[]>([])

const toggleStyle = (style: string) => {
  const index = selectedStyles.value.indexOf(style)
  if (index === -1) {
    if (selectedStyles.value.length < 3) {
      selectedStyles.value.push(style)
    }
  } else {
    selectedStyles.value.splice(index, 1)
  }
}

const nextStep = () => {
  if (currentStep.value === 1 && selectedStyles.value.length > 0) {
    auth.updateUser({ stylePreference: selectedStyles.value })
  }
  currentStep.value++
}

const finishGuide = () => {
  auth.setGuided(true)
  if (selectedStyles.value.length > 0) {
    auth.updateUser({ stylePreference: selectedStyles.value })
  }
  uni.switchTab({ url: '/pages/home/index' })
}
</script>

<style lang="scss" scoped>
.guide-page {
  min-height: 100vh;
  background: linear-gradient(180deg, $primary-color 0%, $primary-light 100%);
  display: flex;
  flex-direction: column;
}

.guide-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
}

.guide-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.step-icon {
  font-size: 120rpx;
}

.step-title {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $text-white;
  margin-top: $spacing-lg;
}

.step-desc {
  font-size: $font-size-base;
  color: rgba(255, 255, 255, 0.8);
  margin-top: $spacing-md;
  max-width: 500rpx;
}

.step-image {
  margin-top: $spacing-xl;
}

.image-placeholder {
  width: 300rpx;
  height: 300rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 100rpx;
}

.preference-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $spacing-sm;
  margin-top: $spacing-xl;
}

.preference-item {
  padding: $spacing-md $spacing-lg;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: $border-radius-lg;
  font-size: $font-size-base;
  color: $text-white;
  
  &.active {
    background-color: $text-white;
    color: $primary-color;
  }
}

.complete-image {
  margin-top: $spacing-xl;
  font-size: 120rpx;
}

.guide-indicator {
  display: flex;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-lg;
}

.indicator-dot {
  width: 16rpx;
  height: 16rpx;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  
  &.active {
    width: 40rpx;
    border-radius: 8rpx;
    background-color: $text-white;
  }
}

.guide-footer {
  padding: $spacing-lg;
  padding-bottom: calc(#{$spacing-lg} + env(safe-area-inset-bottom));
}

.guide-footer .btn {
  width: 100%;
}
</style>