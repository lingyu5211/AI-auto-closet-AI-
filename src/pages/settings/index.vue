<template>
  <view class="settings-page">
    <view class="nav-bar">
      <view class="nav-left" @click="handleBack">
        <view class="back-btn">
          <text>←</text>
        </view>
      </view>
      <view class="nav-center">
        <text class="nav-title">我的</text>
      </view>
      <view class="nav-right"></view>
    </view>
    
    <scroll-view class="settings-content" scroll-y>
      <view class="profile-section" v-if="auth.user">
        <view class="profile-card" @click="handleProfileClick">
          <view class="profile-avatar-wrapper">
            <image 
              v-if="auth.user.avatarUrl" 
              :src="auth.user.avatarUrl" 
              class="profile-avatar" 
              mode="aspectFill"
            />
            <view v-else class="profile-avatar-default">
              <text>{{ auth.user.nickname.charAt(0) || '👤' }}</text>
            </view>
            <view class="avatar-edit-btn" @click.stop="handleAvatarUpload">
              <text class="edit-icon">📷</text>
            </view>
          </view>
          <view class="profile-info">
            <text class="profile-name">{{ auth.user.nickname }}</text>
            <text class="profile-bio">{{ auth.user.bio || '暂无个性签名' }}</text>
          </view>
          <view class="profile-arrow">
            <text>›</text>
          </view>
        </view>
        
        <view class="profile-stats">
          <view class="stat-item">
            <text class="stat-value">{{ wardrobe.clothes.length }}</text>
            <text class="stat-label">衣物</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ diary.diaryList.length }}</text>
            <text class="stat-label">日记</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ social.followingList.length }}</text>
            <text class="stat-label">关注</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ social.recommendUsers.length }}</text>
            <text class="stat-label">粉丝</text>
          </view>
        </view>
      </view>
      
      <view class="settings-section">
        <view class="section-title">账号管理</view>
        <view class="settings-list">
          <view class="settings-item" @click="handlePersonalInfo">
            <text class="item-icon">👤</text>
            <text class="item-text">个人信息</text>
            <text class="item-arrow">›</text>
          </view>
          <view class="settings-item" @click="handleAccountSecurity">
            <text class="item-icon">🔐</text>
            <text class="item-text">账号安全</text>
            <text class="item-arrow">›</text>
          </view>
          <view class="settings-item" @click="handleDataSync">
            <text class="item-icon">☁️</text>
            <text class="item-text">数据同步</text>
            <switch :checked="syncEnabled" @change="syncEnabled = !syncEnabled" />
          </view>
        </view>
      </view>
      
      <view class="settings-section">
        <view class="section-title">个性化设置</view>
        <view class="settings-list">
          <view class="settings-item" @click="handleStylePreference">
            <text class="item-icon">🎨</text>
            <text class="item-text">穿搭偏好</text>
            <text class="item-sub">{{ auth.user?.stylePreference.join('、') || '未设置' }}</text>
            <text class="item-arrow">›</text>
          </view>
          <view class="settings-item">
            <text class="item-icon">🌙</text>
            <text class="item-text">深色模式</text>
            <switch :checked="darkMode" @change="darkMode = !darkMode" />
          </view>
          <view class="settings-item">
            <text class="item-icon">🔔</text>
            <text class="item-text">通知提醒</text>
            <switch :checked="notifications" @change="notifications = !notifications" />
          </view>
        </view>
      </view>
      
      <view class="settings-section">
        <view class="section-title">基础设置</view>
        <view class="settings-list">
          <view class="settings-item" @click="handleCache">
            <text class="item-icon">💾</text>
            <text class="item-text">缓存管理</text>
            <text class="item-sub">清理缓存</text>
            <text class="item-arrow">›</text>
          </view>
          <view class="settings-item" @click="handleVersion">
            <text class="item-icon">📱</text>
            <text class="item-text">版本更新</text>
            <text class="item-sub">v1.0.0</text>
            <text class="item-arrow">›</text>
          </view>
          <view class="settings-item" @click="handleHelp">
            <text class="item-icon">❓</text>
            <text class="item-text">帮助中心</text>
            <text class="item-arrow">›</text>
          </view>
        </view>
      </view>
      
      <view class="settings-section">
        <view class="section-title">AI 搭配设置</view>
        <view class="settings-list">
          <view class="settings-item">
            <text class="item-icon">🤖</text>
            <text class="item-text">阿里云 API Key</text>
          </view>
          <view class="api-key-row">
            <input
              class="api-key-input"
              :value="apiKey"
              :type="keyVisible ? 'text' : 'password'"
              placeholder="输入 DashScope API Key (sk-...)"
              @input="(e: any) => apiKey = e.detail.value"
            />
            <view class="api-key-icons">
              <view class="key-icon-btn" @click="handleToggleVisibility" v-if="keyConfigured">
                <text>{{ keyVisible ? '🙈' : '👁️' }}</text>
              </view>
            </view>
          </view>
          <view class="api-key-actions">
            <view class="btn btn-sm btn-primary" @click="handleSaveKey">保存</view>
            <view class="btn btn-sm btn-outline" @click="handleClearKey" v-if="keyConfigured">清除</view>
          </view>
          <view class="settings-item">
            <text class="item-text">状态</text>
            <text class="item-sub" :style="{ color: keyConfigured ? '#4CAF50' : '#999' }">
              {{ keyConfigured ? '● 已配置' : '○ 未配置' }}
            </text>
          </view>
          <view class="settings-item" @click="handleTestConnection">
            <text class="item-text">测试连接</text>
            <text class="item-sub" v-if="testing">检测中...</text>
            <text class="item-arrow" v-else>›</text>
          </view>
        </view>
      </view>

      <view class="settings-section">
        <view class="section-title">关于</view>
        <view class="settings-list">
          <view class="settings-item" @click="handlePrivacy">
            <text class="item-icon">📜</text>
            <text class="item-text">隐私协议</text>
            <text class="item-arrow">›</text>
          </view>
          <view class="settings-item" @click="handleTerms">
            <text class="item-icon">📋</text>
            <text class="item-text">用户协议</text>
            <text class="item-arrow">›</text>
          </view>
        </view>
      </view>
      
      <view class="logout-section" v-if="auth.isLoggedIn">
        <view class="btn btn-outline btn-full" @click="handleLogout">退出登录</view>
      </view>
      
      <view class="bottom-space"></view>
    </scroll-view>
    
    <TabBar current="/pages/settings/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useWardrobeStore } from '@/store/wardrobe'
import { useDiaryStore } from '@/store/diary'
import { useSocialStore } from '@/store/social'
import TabBar from '@/components/TabBar.vue'
import { isKeyConfigured, setApiKey, testConnection } from '@/api/dashscope'

const auth = useAuthStore()
const wardrobe = useWardrobeStore()
const diary = useDiaryStore()
const social = useSocialStore()

const syncEnabled = ref(true)
const darkMode = ref(false)
const notifications = ref(true)

const apiKey = ref('')
const keyConfigured = ref(false)
const keyVisible = ref(false)
const testing = ref(false)

onMounted(() => {
  keyConfigured.value = isKeyConfigured()
  if (keyConfigured.value) {
    try {
      const stored = uni.getStorageSync('dashscope_api_key')
      if (stored) {
        apiKey.value = maskKey(stored as string)
      }
    } catch {}
  }
})

function maskKey(key: string): string {
  if (key.length <= 8) return '***'
  return key.slice(0, 4) + '***' + key.slice(-4)
}

function handleSaveKey() {
  if (!apiKey.value || apiKey.value.includes('***')) return
  setApiKey(apiKey.value)
  keyConfigured.value = true
  apiKey.value = maskKey(apiKey.value)
  uni.showToast({ title: 'API Key 已保存', icon: 'success' })
}

function handleClearKey() {
  setApiKey('')
  keyConfigured.value = false
  apiKey.value = ''
  uni.showToast({ title: 'API Key 已清除', icon: 'none' })
}

function handleToggleVisibility() {
  if (!keyConfigured.value) return
  if (keyVisible.value) {
    apiKey.value = maskKey(uni.getStorageSync('dashscope_api_key') as string)
  } else {
    apiKey.value = uni.getStorageSync('dashscope_api_key') as string || ''
  }
  keyVisible.value = !keyVisible.value
}

async function handleTestConnection() {
  if (!isKeyConfigured()) {
    uni.showToast({ title: '请先保存 API Key', icon: 'none' })
    return
  }
  testing.value = true
  const ok = await testConnection()
  testing.value = false
  uni.showToast({ title: ok ? '连接成功' : '连接失败，请检查 Key', icon: ok ? 'success' : 'none' })
}

const handleProfileClick = () => {
  uni.showToast({ title: '查看个人主页', icon: 'none' })
}

const handleAvatarUpload = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      auth.updateUser({ avatarUrl: tempFilePath })
      uni.showToast({ title: '头像上传成功', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: '上传失败', icon: 'none' })
    }
  })
}

const handlePersonalInfo = () => {
  uni.showToast({ title: '个人信息功能开发中', icon: 'none' })
}

const handleAccountSecurity = () => {
  uni.showToast({ title: '账号安全功能开发中', icon: 'none' })
}

const handleDataSync = () => {
  uni.showToast({ 
    title: syncEnabled.value ? '已开启数据同步' : '已关闭数据同步', 
    icon: 'none' 
  })
}

const handleStylePreference = () => {
  uni.showToast({ title: '穿搭偏好设置开发中', icon: 'none' })
}

const handleCache = () => {
  uni.showModal({
    title: '清理缓存',
    content: '确定要清理缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '缓存已清理', icon: 'success' })
      }
    }
  })
}

const handleVersion = () => {
  uni.showToast({ title: '当前已是最新版本', icon: 'success' })
}

const handleHelp = () => {
  uni.showToast({ title: '帮助中心开发中', icon: 'none' })
}

const handlePrivacy = () => {
  uni.showModal({
    title: '隐私协议',
    content: '我们重视您的隐私保护，您的所有数据仅用于个人衣橱管理，不会泄露给第三方。',
    showCancel: false
  })
}

const handleTerms = () => {
  uni.showModal({
    title: '用户协议',
    content: '欢迎使用电子衣橱APP，请遵守相关使用条款。',
    showCancel: false
  })
}

const handleBack = () => {
  uni.navigateBack({ delta: 1 })
}

const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
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
.settings-page {
  min-height: 100vh;
  background-color: $bg-gray;
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

.settings-content {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  padding: $spacing-md;
  padding-top: calc(88rpx + var(--status-bar-height, 44px) + #{$spacing-md});
  min-height: 100vh;
}

.profile-section {
  margin-bottom: $spacing-md;
}

.profile-card {
  background: linear-gradient(135deg, $primary-color, $primary-light);
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.profile-avatar-wrapper {
  position: relative;
}

.profile-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.profile-avatar-default {
  width: 120rpx;
  height: 120rpx;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: $text-white;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.avatar-edit-btn {
  position: absolute;
  bottom: -4rpx;
  right: -4rpx;
  width: 48rpx;
  height: 48rpx;
  background-color: $text-white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid rgba(255, 255, 255, 0.8);
}

.edit-icon {
  font-size: 24rpx;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-white;
  display: block;
}

.profile-bio {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.9);
  margin-top: $spacing-xs;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-arrow {
  font-size: $font-size-lg;
  color: rgba(255, 255, 255, 0.8);
}

.profile-stats {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  margin-top: $spacing-md;
  display: flex;
  justify-content: space-around;
  box-shadow: $shadow-sm;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $primary-color;
}

.stat-label {
  font-size: $font-size-xs;
  color: $text-hint;
  margin-top: 8rpx;
}

.settings-section {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  margin-bottom: $spacing-md;
  overflow: hidden;
}

.section-title {
  font-size: $font-size-sm;
  color: $text-light;
  padding: $spacing-md;
  padding-bottom: $spacing-sm;
}

.settings-list {
  border-top: 1rpx solid $border-color;
}

.settings-item {
  display: flex;
  align-items: center;
  padding: $spacing-md;
  gap: $spacing-md;
  border-bottom: 1rpx solid $border-color;
  
  &:last-child {
    border-bottom: none;
  }
}

.item-icon {
  font-size: 28rpx;
}

.item-text {
  flex: 1;
  font-size: $font-size-base;
  color: $text-primary;
}

.item-sub {
  font-size: $font-size-sm;
  color: $text-light;
  margin-right: $spacing-sm;
}

.item-arrow {
  font-size: $font-size-lg;
  color: $text-light;
}

.logout-section {
  padding: $spacing-xl;
}

.btn-full {
  width: 100%;
}

.bottom-space {
  height: calc(120rpx + #{$spacing-lg});
}

.api-key-row {
  display: flex;
  align-items: center;
  padding: 0 $spacing-md $spacing-sm;
  gap: $spacing-sm;
}

.api-key-input {
  flex: 1;
  height: 80rpx;
  background-color: $bg-gray;
  border-radius: $border-radius;
  padding: 0 $spacing-md;
  font-size: $font-size-sm;
  color: $text-primary;
}

.api-key-icons {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.key-icon-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.api-key-actions {
  display: flex;
  gap: $spacing-sm;
  padding: 0 $spacing-md $spacing-md;
}

.btn-sm {
  padding: 12rpx 32rpx;
  font-size: 24rpx;
  border-radius: $border-radius;
}
</style>
