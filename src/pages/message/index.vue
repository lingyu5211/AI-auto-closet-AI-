<template>
  <view class="message-page">
    <NavBar title="消息" :showBack="true"></NavBar>
    <view class="tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <text>{{ tab.label }}</text>
        <view v-if="tab.key === 'notifications' && social.unreadCount > 0" class="badge">
          <text>{{ social.unreadCount > 99 ? '99+' : social.unreadCount }}</text>
        </view>
      </view>
    </view>

    <scroll-view v-show="activeTab === 'notifications'" class="content" scroll-y>
      <view v-if="social.notifications.length === 0" class="empty-state">
        <text class="empty-icon">🔔</text>
        <text class="empty-text">暂无消息</text>
      </view>
      
      <view 
        v-for="notification in social.notifications" 
        :key="notification.id"
        class="notification-item"
        :class="{ unread: !notification.isRead }"
        @click="handleNotificationClick(notification)"
      >
        <image 
          :src="notification.fromUserAvatar" 
          class="avatar" 
          mode="aspectFill"
          @click.stop="handleUserClick(notification.fromUserId)"
        />
        <view class="notification-content">
          <view class="notification-text">
            <text 
              class="name"
              @click.stop="handleUserClick(notification.fromUserId)"
            >{{ notification.fromUserName }}</text>
            <text class="action">
              {{ notification.type === 'follow' ? '关注了你' : 
                 notification.type === 'like' ? '点赞了你的穿搭日记' : '评论了你的穿搭日记' }}
            </text>
          </view>
          <text 
            v-if="notification.diaryContent" 
            class="diary-preview"
            @click.stop="handleDiaryClick(notification.diaryId)"
          >{{ notification.diaryContent }}</text>
          <text class="time">{{ formatTime(notification.createdAt) }}</text>
        </view>
        <view v-if="!notification.isRead" class="unread-dot"></view>
      </view>
    </scroll-view>

    <scroll-view v-show="activeTab === 'recommend'" class="content" scroll-y>
      <view class="section-header">
        <text class="section-title">推荐关注</text>
        <text class="section-subtitle">发现更多穿搭达人</text>
      </view>
      
      <view v-if="social.recommendUsers.length === 0" class="empty-state">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">暂无推荐用户</text>
      </view>
      
      <view 
        v-for="user in social.recommendUsers" 
        :key="user.id"
        class="user-item"
        @click="handleUserClick(user.id)"
      >
        <image :src="user.avatar" class="user-avatar" mode="aspectFill" />
        <view class="user-info">
          <text class="user-name">{{ user.nickname }}</text>
          <text class="user-bio">{{ user.bio }}</text>
          <view class="user-stats">
            <text class="stat">{{ user.diaryCount }} 日记</text>
            <text class="stat">|</text>
            <text class="stat">{{ formatNumber(user.followerCount) }} 粉丝</text>
          </view>
        </view>
        <view 
          class="follow-btn"
          :class="{ followed: social.isFollowing(user.id) }"
          @click.stop="handleFollow(user)"
        >
          <text>{{ social.isFollowing(user.id) ? '已关注' : '关注' }}</text>
        </view>
      </view>
    </scroll-view>

    <scroll-view v-show="activeTab === 'following'" class="content" scroll-y>
      <view class="section-header">
        <text class="section-title">我关注的人</text>
        <text class="section-subtitle">{{ social.getFollowingCount() }} 位用户</text>
      </view>
      
      <view v-if="social.getFollowingCount() === 0" class="empty-state">
        <text class="empty-icon">👥</text>
        <text class="empty-text">还没有关注任何人</text>
        <view class="empty-action" @click="activeTab = 'recommend'">
          <text>去关注</text>
        </view>
      </view>
      
      <view 
        v-for="user in followingUsers" 
        :key="user.id" 
        class="user-item"
        @click="handleUserClick(user.id)"
      >
        <image :src="user.avatar" class="user-avatar" mode="aspectFill" />
        <view class="user-info">
          <text class="user-name">{{ user.nickname }}</text>
          <text class="user-bio">{{ user.bio }}</text>
        </view>
        <view 
          class="follow-btn followed"
          @click.stop="handleFollow(user)"
        >
          <text>已关注</text>
        </view>
      </view>

      <view v-if="social.getFollowingDiaries.length > 0" class="diaries-section">
        <text class="diaries-title">TA们的最新动态</text>
        <view 
          v-for="diary in social.getFollowingDiaries" 
          :key="diary.id" 
          class="diary-card"
          @click="handleDiaryClick(diary.id)"
        >
          <view class="diary-images">
            <image v-for="(photo, idx) in diary.photos.slice(0, 3)" :key="idx" :src="photo" mode="aspectFill" />
          </view>
          <view class="diary-info">
            <text class="diary-content">{{ diary.content }}</text>
            <view class="diary-footer">
              <view class="like-btn" @click.stop="handleLike(diary)">
                <text>{{ social.isLiked(diary.id) ? '❤️' : '🤍' }}</text>
                <text>{{ diary.likeCount }}</text>
              </view>
              <text class="diary-time">{{ formatDate(diary.date) }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { useSocialStore } from '@/store/social'
import type { Notification, SocialUser, Diary } from '@/types'

const social = useSocialStore()

const activeTab = ref('notifications')

const tabs = [
  { key: 'notifications', label: '通知' },
  { key: 'recommend', label: '推荐' },
  { key: 'following', label: '我关注的' }
]

const followingUsers = computed(() => {
  const followingIds = social.follows
    .filter(f => f.followerId === 'guest')
    .map(f => f.followingId)
  
  return social.recommendUsers.filter(u => followingIds.includes(u.id))
})

onMounted(() => {
  social.loadData()
})

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

const formatNumber = (num: number) => {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

const handleNotificationClick = (notification: Notification) => {
  social.markAsRead(notification.id)
}

const handleFollow = (user: SocialUser) => {
  social.follow(user.id)
}

const handleLike = (diary: Diary) => {
  social.likeDiary(diary.id)
}

const handleUserClick = (userId: string) => {
  uni.navigateTo({
    url: `/pages/user/index?userId=${userId}`
  })
}



const handleDiaryClick = (diaryId?: string) => {
  if (diaryId) {
    uni.showToast({
      title: `查看日记详情: ${diaryId}`,
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.message-page {
  min-height: 100vh;
  background-color: $bg-gray;
}



.tabs {
  display: flex;
  background-color: $bg-white;
  padding: 0 20rpx;
  border-bottom: 1rpx solid $border-color;
  
  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80rpx;
    position: relative;
    font-size: $font-size-base;
    color: $text-secondary;
    transition: color 0.3s ease;
    
    &.active {
      color: $primary-color;
      font-weight: 500;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 4rpx;
        background-color: $primary-color;
        border-radius: 2rpx;
      }
    }
  }
  
  .badge {
    background-color: $error-color;
    color: $bg-white;
    font-size: 20rpx;
    padding: 2rpx 12rpx;
    border-radius: 20rpx;
    margin-left: 8rpx;
  }
}

.content {
  height: calc(100vh - 220rpx);
  padding: 20rpx;
  padding-top: calc(120rpx + var(--status-bar-height, 44px));
}

.section-header {
  margin-bottom: 20rpx;
  
  .section-title {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $text-primary;
  }
  
  .section-subtitle {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-top: 8rpx;
    display: block;
  }
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  margin-bottom: 16rpx;
  position: relative;
  transition: all 0.3s ease;
  
  &.unread {
    background-color: rgba(99, 102, 241, 0.05);
  }
  
  &:active {
    transform: scale(0.98);
    opacity: 0.8;
  }
  
  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .notification-content {
    flex: 1;
    margin-left: 20rpx;
    
    .notification-text {
      display: flex;
      flex-wrap: wrap;
      
      .name {
        font-weight: 500;
        color: $text-primary;
        margin-right: 8rpx;
      }
      
      .action {
        color: $text-secondary;
        font-size: $font-size-base;
      }
    }
    
    .diary-preview {
      color: $text-hint;
      font-size: $font-size-sm;
      margin-top: 8rpx;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .time {
      color: $text-hint;
      font-size: $font-size-xs;
      margin-top: 8rpx;
      display: block;
    }
  }
  
  .unread-dot {
    width: 12rpx;
    height: 12rpx;
    background-color: $primary-color;
    border-radius: 50%;
    position: absolute;
    right: 24rpx;
    top: 50%;
    transform: translateY(-50%);
  }
}

.user-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  margin-bottom: 16rpx;
  
  .user-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .user-info {
    flex: 1;
    margin-left: 20rpx;
    
    .user-name {
      font-size: $font-size-base;
      font-weight: 500;
      color: $text-primary;
    }
    
    .user-bio {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-top: 6rpx;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .user-stats {
      display: flex;
      align-items: center;
      margin-top: 8rpx;
      
      .stat {
        font-size: $font-size-xs;
        color: $text-hint;
        margin-right: 12rpx;
      }
    }
  }
  
  .follow-btn {
    padding: 12rpx 32rpx;
    border-radius: 40rpx;
    background-color: $primary-color;
    color: $bg-white;
    font-size: $font-size-sm;
    transition: all 0.3s ease;
    
    &.followed {
      background-color: $bg-gray;
      color: $text-secondary;
    }
  }
}

.diaries-section {
  margin-top: 30rpx;
  
  .diaries-title {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 20rpx;
    display: block;
  }
  
  .diary-card {
    background-color: $bg-white;
    border-radius: $border-radius-lg;
    margin-bottom: 20rpx;
    overflow: hidden;
    
    .diary-images {
      display: flex;
      
      image {
        width: 33.33%;
        height: 200rpx;
      }
    }
    
    .diary-info {
      padding: 20rpx;
      
      .diary-content {
        font-size: $font-size-base;
        color: $text-primary;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .diary-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 16rpx;
        
        .like-btn {
          display: flex;
          align-items: center;
          font-size: $font-size-sm;
          color: $text-secondary;
          
          text:first-child {
            margin-right: 8rpx;
            font-size: 28rpx;
          }
        }
        
        .diary-time {
          font-size: $font-size-xs;
          color: $text-hint;
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }
  
  .empty-text {
    font-size: $font-size-base;
    color: $text-hint;
  }
  
  .empty-action {
    margin-top: 30rpx;
    padding: 16rpx 48rpx;
    background-color: $primary-color;
    color: $bg-white;
    border-radius: 40rpx;
    font-size: $font-size-sm;
  }
}
</style>
