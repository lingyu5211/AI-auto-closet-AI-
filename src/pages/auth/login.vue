<template>
  <view class="login-page">
    <view class="login-header">
      <text class="logo">👔</text>
      <text class="app-name">电子衣橱</text>
      <text class="app-desc">数字化衣物管理+智能穿搭辅助</text>
    </view>
    
    <view class="login-form">
      <view class="form-item">
        <text class="form-label">手机号</text>
        <input 
          class="input" 
          v-model="phone" 
          placeholder="请输入手机号" 
          type="number"
          maxlength="11"
        />
      </view>
      
      <view class="form-item">
        <text class="form-label">密码</text>
        <input 
          class="input" 
          v-model="password" 
          placeholder="请输入密码" 
          type="password"
        />
      </view>
      
      <view class="form-row">
        <view class="checkbox" :class="{ checked: rememberMe }" @click="rememberMe = !rememberMe">
          <text v-if="rememberMe">✓</text>
        </view>
        <text class="form-text">记住我</text>
        <text class="form-link" @click="goToForgetPwd">忘记密码</text>
      </view>
      
      <view class="btn btn-primary mt-lg" @click="handleLogin">登录</view>
    </view>
    
    <view class="login-other">
      <view class="divider">
        <view class="divider-line"></view>
        <text class="divider-text">其他登录方式</text>
        <view class="divider-line"></view>
      </view>
      
      <view class="other-options">
        <view class="other-item" @click="handleWechatLogin">
          <text class="other-icon">💚</text>
          <text class="other-text">微信登录</text>
        </view>
        <view class="other-item" @click="handleQQLogin">
          <text class="other-icon">💙</text>
          <text class="other-text">QQ登录</text>
        </view>
      </view>
      
      <view class="register-link">
        <text>还没有账号？</text>
        <text class="form-link" @click="goToRegister">立即注册</text>
      </view>
      
      <view class="guest-link" @click="handleGuestLogin">
        <text>游客模式进入</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { isValidPhone } from '@/utils'

const auth = useAuthStore()

const phone = ref('')
const password = ref('')
const rememberMe = ref(false)

const handleLogin = () => {
  if (!phone.value) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  
  if (!isValidPhone(phone.value)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  
  if (!password.value) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  
  auth.login('phone', {
    phone: phone.value,
    nickname: '用户' + phone.value.slice(-4)
  })
  
  if (!auth.hasGuided) {
    uni.navigateTo({ url: '/pages/auth/guide' })
  } else {
    uni.switchTab({ url: '/pages/home/index' })
  }
}

const handleWechatLogin = () => {
  uni.showToast({ title: '微信登录功能开发中', icon: 'none' })
  auth.login('wechat', { nickname: '微信用户' })
  if (!auth.hasGuided) {
    uni.navigateTo({ url: '/pages/auth/guide' })
  } else {
    uni.switchTab({ url: '/pages/home/index' })
  }
}

const handleQQLogin = () => {
  uni.showToast({ title: 'QQ登录功能开发中', icon: 'none' })
  auth.login('qq', { nickname: 'QQ用户' })
  if (!auth.hasGuided) {
    uni.navigateTo({ url: '/pages/auth/guide' })
  } else {
    uni.switchTab({ url: '/pages/home/index' })
  }
}

const handleGuestLogin = () => {
  auth.guestLogin()
  if (!auth.hasGuided) {
    uni.navigateTo({ url: '/pages/auth/guide' })
  } else {
    uni.switchTab({ url: '/pages/home/index' })
  }
}

const goToRegister = () => {
  uni.navigateTo({ url: '/pages/auth/register' })
}

const goToForgetPwd = () => {
  uni.showToast({ title: '密码找回功能开发中', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, $primary-color 0%, $primary-light 100%);
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}

.logo {
  font-size: 120rpx;
}

.app-name {
  font-size: $font-size-xxl;
  font-weight: 700;
  color: $text-white;
  margin-top: $spacing-md;
}

.app-desc {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.8);
  margin-top: $spacing-sm;
}

.login-form {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-top: $spacing-xl;
}

.form-item {
  margin-bottom: $spacing-md;
}

.form-label {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
  display: block;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $spacing-sm;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid $text-light;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-sm;
  color: $primary-color;
  
  &.checked {
    background-color: $primary-color;
    border-color: $primary-color;
    color: $text-white;
  }
}

.form-text {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-left: $spacing-xs;
}

.form-link {
  font-size: $font-size-sm;
  color: $primary-color;
}

.login-other {
  margin-top: $spacing-lg;
}

.divider {
  display: flex;
  align-items: center;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background-color: rgba(255, 255, 255, 0.3);
}

.divider-text {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.8);
  padding: 0 $spacing-md;
}

.other-options {
  display: flex;
  justify-content: center;
  gap: $spacing-xl;
  margin-top: $spacing-lg;
}

.other-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
}

.other-icon {
  width: 100rpx;
  height: 100rpx;
  background-color: $bg-white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
}

.other-text {
  font-size: $font-size-sm;
  color: $text-white;
}

.register-link {
  display: flex;
  justify-content: center;
  gap: $spacing-xs;
  margin-top: $spacing-lg;
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.8);
}

.guest-link {
  display: flex;
  justify-content: center;
  margin-top: $spacing-md;
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.6);
  
  text {
    text-decoration: underline;
  }
}
</style>