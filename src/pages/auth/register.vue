<template>
  <view class="register-page">
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <view class="nav-title">注册</view>
      <view class="nav-placeholder"></view>
    </view>
    
    <scroll-view class="register-content" scroll-y>
      <view class="register-form">
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
          <text class="form-label">验证码</text>
          <view class="input-group">
            <input 
              class="input input-short" 
              v-model="code" 
              placeholder="请输入验证码" 
              type="number"
              maxlength="6"
            />
            <view 
              class="btn btn-secondary btn-sm" 
              :class="{ disabled: countDown > 0 }"
              @click="getCode"
            >
              <text>{{ countDown > 0 ? `${countDown}s` : '获取验证码' }}</text>
            </view>
          </view>
        </view>
        
        <view class="form-item">
          <text class="form-label">密码</text>
          <input 
            class="input" 
            v-model="password" 
            placeholder="请设置密码（6-12位字母+数字）" 
            type="password"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">确认密码</text>
          <input 
            class="input" 
            v-model="confirmPassword" 
            placeholder="请再次输入密码" 
            type="password"
          />
        </view>
        
        <view class="form-row mt-sm">
          <view class="checkbox" :class="{ checked: agree }" @click="agree = !agree">
            <text v-if="agree">✓</text>
          </view>
          <text class="form-text">我已阅读并同意</text>
          <text class="form-link">用户协议</text>
          <text class="form-text">和</text>
          <text class="form-link">隐私政策</text>
        </view>
        
        <view class="btn btn-primary mt-lg" @click="handleRegister">注册</view>
      </view>
      
      <view class="privacy-tips">
        <text>您的信息仅用于账号注册，不会泄露给第三方</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { isValidPhone, isValidPassword } from '@/utils'

const auth = useAuthStore()

const phone = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const agree = ref(false)
const countDown = ref(0)

const getCode = () => {
  if (countDown.value > 0) return
  
  if (!phone.value) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  
  if (!isValidPhone(phone.value)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  
  countDown.value = 60
  const timer = setInterval(() => {
    countDown.value--
    if (countDown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  
  uni.showToast({ title: '验证码已发送', icon: 'success' })
}

const handleRegister = () => {
  if (!phone.value) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  
  if (!isValidPhone(phone.value)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  
  if (!code.value) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  
  if (!password.value) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  
  if (!isValidPassword(password.value)) {
    uni.showToast({ title: '密码需6-12位字母+数字', icon: 'none' })
    return
  }
  
  if (password.value !== confirmPassword.value) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }
  
  if (!agree.value) {
    uni.showToast({ title: '请同意用户协议和隐私政策', icon: 'none' })
    return
  }
  
  auth.login('phone', {
    phone: phone.value,
    nickname: '用户' + phone.value.slice(-4)
  })
  
  uni.navigateTo({ url: '/pages/auth/guide' })
}

const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.register-page {
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

.register-content {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  padding: $spacing-lg;
  padding-top: calc(88rpx + var(--status-bar-height, 44px) + #{$spacing-lg});
  min-height: 100vh;
}

.register-form {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
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

.input-group {
  display: flex;
  gap: $spacing-sm;
}

.input-short {
  flex: 1;
}

.btn-sm {
  width: 180rpx;
  height: 80rpx;
  font-size: $font-size-sm;
}

.form-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
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
}

.form-link {
  font-size: $font-size-sm;
  color: $primary-color;
}

.privacy-tips {
  margin-top: $spacing-lg;
  text-align: center;
  font-size: $font-size-xs;
  color: $text-light;
}

.disabled {
  opacity: 0.5;
}
</style>