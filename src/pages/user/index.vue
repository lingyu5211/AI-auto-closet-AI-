<template>
  <view class="user-page">
    <NavBar title="用户主页" :showBack="true" />
    
    <scroll-view class="content" scroll-y>
      <view class="profile-header">
        <image :src="user?.avatar" class="profile-avatar" mode="aspectFill" />
        <view class="profile-info">
          <text class="profile-name">{{ user?.nickname }}</text>
          <text class="profile-bio">{{ user?.bio }}</text>
        </view>
        <view 
          class="follow-btn"
          :class="{ followed: isFollowing }"
          @click="handleFollow"
        >
          <text>{{ isFollowing ? '已关注' : '关注' }}</text>
        </view>
      </view>
      
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-value">{{ user?.diaryCount }}</text>
          <text class="stat-label">日记</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ user?.followerCount }}</text>
          <text class="stat-label">粉丝</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ user?.followingCount }}</text>
          <text class="stat-label">关注</text>
        </view>
      </view>
      
      <view class="section">
        <text class="section-title">TA的穿搭日记</text>
        <view v-if="userDiaries.length === 0" class="empty-state">
          <text class="empty-icon">📝</text>
          <text class="empty-text">暂无日记</text>
        </view>
        <view v-else class="diary-grid">
          <view 
            v-for="diary in userDiaries" 
            :key="diary.id" 
            class="diary-item"
            @click="handleDiaryClick(diary.id)"
          >
            <image :src="diary.photos[0]" mode="aspectFill" />
            <view class="diary-info">
              <text class="diary-likes">{{ diary.likeCount }} ❤️</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <TabBar current="/pages/message/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import TabBar from '@/components/TabBar.vue'
import { useSocialStore } from '@/store/social'
import { useDiaryStore } from '@/store/diary'
import type { SocialUser, Diary } from '@/types'

const social = useSocialStore()
const diaryStore = useDiaryStore()

const userId = ref('')
const user = ref<SocialUser | null>(null)

const isFollowing = computed(() => {
  return social.isFollowing(userId.value)
})

const userDiaries = computed((): Diary[] => {
  return diaryStore.diaryList.filter(d => d.authorId === userId.value)
})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as { options?: { userId?: string } }
  userId.value = currentPage.options?.userId || ''
  
  if (userId.value) {
    user.value = social.recommendUsers.find(u => u.id === userId.value) || null
  }
})

const handleFollow = () => {
  if (userId.value) {
    social.follow(userId.value)
  }
}

const handleDiaryClick = (diaryId: string) => {
  uni.showToast({
    title: `查看日记: ${diaryId}`,
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
.user-page {
  min-height: 100vh;
  background-color: $bg-gray;
}

.content {
  height: calc(100vh - 220rpx);
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
}

.profile-header {
  background-color: $bg-white;
  padding: 40rpx 30rpx;
  display: flex;
  align-items: flex-start;
}

.profile-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 4rpx solid $primary-color;
}

.profile-info {
  flex: 1;
  margin-left: 24rpx;
}

.profile-name {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $text-primary;
}

.profile-bio {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-top: 8rpx;
  display: block;
}

.follow-btn {
  padding: 16rpx 36rpx;
  background-color: $primary-color;
  color: $bg-white;
  border-radius: 40rpx;
  font-size: $font-size-sm;
  
  &.followed {
    background-color: $bg-gray;
    color: $text-secondary;
  }
}

.stats-row {
  background-color: $bg-white;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 30rpx 0;
  margin-top: 16rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $text-primary;
}

.stat-label {
  font-size: $font-size-xs;
  color: $text-hint;
  margin-top: 8rpx;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background-color: $border-color;
}

.section {
  margin-top: 16rpx;
  background-color: $bg-white;
  padding: 24rpx;
}

.section-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 20rpx;
  display: block;
}

.diary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.diary-item {
  position: relative;
  aspect-ratio: 1;
  
  image {
    width: 100%;
    height: 100%;
    border-radius: $border-radius;
  }
  
  .diary-info {
    position: absolute;
    bottom: 8rpx;
    left: 8rpx;
    right: 8rpx;
    background: rgba(0, 0, 0, 0.5);
    border-radius: $border-radius-sm;
    padding: 8rpx;
    
    .diary-likes {
      font-size: $font-size-xs;
      color: $bg-white;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  
  .empty-icon {
    font-size: 60rpx;
    margin-bottom: 16rpx;
  }
  
  .empty-text {
    font-size: $font-size-base;
    color: $text-hint;
  }
}
</style>
