import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Follow, Like, Notification, SocialUser, Diary } from '@/types'
import { useAuthStore } from './auth'
import { useDiaryStore } from './diary'

const FOLLOWS_KEY = 'social_follows'
const LIKES_KEY = 'social_likes'
const NOTIFICATIONS_KEY = 'social_notifications'

const mockUsers: SocialUser[] = [
  {
    id: 'user_1',
    nickname: '时尚达人小美',
    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fashion%20girl%20avatar%20portrait%20cute%20style&image_size=square',
    bio: '分享每日穿搭灵感 ✨',
    followerCount: 1258,
    followingCount: 326,
    diaryCount: 156
  },
  {
    id: 'user_2',
    nickname: '职场穿搭师',
    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20woman%20avatar%20portrait%20elegant&image_size=square',
    bio: '职场穿搭技巧分享',
    followerCount: 2341,
    followingCount: 189,
    diaryCount: 89
  },
  {
    id: 'user_3',
    nickname: '日系少女',
    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=japanese%20style%20girl%20avatar%20cute%20kawaii&image_size=square',
    bio: '喜欢日系穿搭和甜点 🍰',
    followerCount: 892,
    followingCount: 445,
    diaryCount: 203
  },
  {
    id: 'user_4',
    nickname: '街头潮流',
    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=street%20fashion%20boy%20avatar%20cool%20style&image_size=square',
    bio: '街头风爱好者',
    followerCount: 1567,
    followingCount: 234,
    diaryCount: 98
  },
  {
    id: 'user_5',
    nickname: '极简主义者',
    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=minimalist%20fashion%20avatar%20simple%20elegant&image_size=square',
    bio: 'Less is More',
    followerCount: 3120,
    followingCount: 67,
    diaryCount: 45
  }
]

export const useSocialStore = defineStore('social', () => {
  const follows = ref<Follow[]>([])
  const likes = ref<Like[]>([])
  const notifications = ref<Notification[]>([])

  const loadData = () => {
    try {
      const storedFollows = uni.getStorageSync(FOLLOWS_KEY)
      if (storedFollows) {
        follows.value = JSON.parse(storedFollows)
      }

      const storedLikes = uni.getStorageSync(LIKES_KEY)
      if (storedLikes) {
        likes.value = JSON.parse(storedLikes)
      }

      const storedNotifications = uni.getStorageSync(NOTIFICATIONS_KEY)
      if (storedNotifications) {
        notifications.value = JSON.parse(storedNotifications)
      } else {
        initMockNotifications()
      }
    } catch (e) {
      console.error('Failed to load social data:', e)
    }
  }

  const initMockNotifications = () => {
    notifications.value = [
      {
        id: 'notif_1',
        type: 'follow',
        fromUserId: 'user_1',
        fromUserName: '时尚达人小美',
        fromUserAvatar: mockUsers[0].avatar,
        createdAt: Date.now() - 1000 * 60 * 5,
        isRead: false
      },
      {
        id: 'notif_2',
        type: 'like',
        fromUserId: 'user_2',
        fromUserName: '职场穿搭师',
        fromUserAvatar: mockUsers[1].avatar,
        diaryId: 'diary_1',
        diaryContent: '今天分享一套职场通勤穿搭，简约干练！',
        createdAt: Date.now() - 1000 * 60 * 30,
        isRead: false
      },
      {
        id: 'notif_3',
        type: 'follow',
        fromUserId: 'user_3',
        fromUserName: '日系少女',
        fromUserAvatar: mockUsers[2].avatar,
        createdAt: Date.now() - 1000 * 60 * 60 * 2,
        isRead: true
      },
      {
        id: 'notif_4',
        type: 'like',
        fromUserId: 'user_4',
        fromUserName: '街头潮流',
        fromUserAvatar: mockUsers[3].avatar,
        diaryId: 'diary_2',
        diaryContent: '周末休闲穿搭分享，舒适又时尚～',
        createdAt: Date.now() - 1000 * 60 * 60 * 5,
        isRead: true
      },
      {
        id: 'notif_5',
        type: 'follow',
        fromUserId: 'user_5',
        fromUserName: '极简主义者',
        fromUserAvatar: mockUsers[4].avatar,
        createdAt: Date.now() - 1000 * 60 * 60 * 24,
        isRead: true
      }
    ]
    saveNotifications()
  }

  const saveFollows = () => {
    try {
      uni.setStorageSync(FOLLOWS_KEY, JSON.stringify(follows.value))
    } catch (e) {
      console.error('Failed to save follows:', e)
    }
  }

  const saveLikes = () => {
    try {
      uni.setStorageSync(LIKES_KEY, JSON.stringify(likes.value))
    } catch (e) {
      console.error('Failed to save likes:', e)
    }
  }

  const saveNotifications = () => {
    try {
      uni.setStorageSync(NOTIFICATIONS_KEY, JSON.stringify(notifications.value))
    } catch (e) {
      console.error('Failed to save notifications:', e)
    }
  }

  const follow = (userId: string) => {
    const auth = useAuthStore()
    const currentUserId = auth.user?.id || 'guest'

    const existing = follows.value.find(
      f => f.followerId === currentUserId && f.followingId === userId
    )

    if (existing) {
      follows.value = follows.value.filter(
        f => !(f.followerId === currentUserId && f.followingId === userId)
      )
      saveFollows()
      return false
    }

    follows.value.push({
      id: `follow_${Date.now()}`,
      followerId: currentUserId,
      followingId: userId,
      createdAt: Date.now()
    })
    saveFollows()
    return true
  }

  const isFollowing = (userId: string) => {
    const auth = useAuthStore()
    const currentUserId = auth.user?.id || 'guest'

    return follows.value.some(
      f => f.followerId === currentUserId && f.followingId === userId
    )
  }

  const getFollowingCount = () => {
    const auth = useAuthStore()
    const currentUserId = auth.user?.id || 'guest'
    return follows.value.filter(f => f.followerId === currentUserId).length
  }

  const getFollowerCount = () => {
    const auth = useAuthStore()
    const currentUserId = auth.user?.id || 'guest'
    return follows.value.filter(f => f.followingId === currentUserId).length
  }

  const likeDiary = (diaryId: string) => {
    const auth = useAuthStore()
    const currentUserId = auth.user?.id || 'guest'
    const diaryStore = useDiaryStore()

    const existing = likes.value.find(
      l => l.userId === currentUserId && l.diaryId === diaryId
    )

    if (existing) {
      likes.value = likes.value.filter(
        l => !(l.userId === currentUserId && l.diaryId === diaryId)
      )
      saveLikes()

      const diary = diaryStore.diaryList.find(d => d.id === diaryId)
      if (diary && diary.likeCount > 0) {
        diary.likeCount--
        diaryStore.saveDiaryList()
      }
      return false
    }

    likes.value.push({
      id: `like_${Date.now()}`,
      userId: currentUserId,
      diaryId,
      createdAt: Date.now()
    })
    saveLikes()

    const diary = diaryStore.diaryList.find(d => d.id === diaryId)
    if (diary) {
      diary.likeCount++
      diaryStore.saveDiaryList()
    }
    return true
  }

  const isLiked = (diaryId: string) => {
    const auth = useAuthStore()
    const currentUserId = auth.user?.id || 'guest'

    return likes.value.some(l => l.userId === currentUserId && l.diaryId === diaryId)
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'isRead'>) => {
    notifications.value.unshift({
      ...notification,
      id: `notif_${Date.now()}`,
      isRead: false
    })

    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50)
    }

    saveNotifications()
  }

  const markAllAsRead = () => {
    notifications.value.forEach(n => n.isRead = true)
    saveNotifications()
  }

  const markAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.isRead = true
      saveNotifications()
    }
  }

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.isRead).length
  })

  const recommendUsers = computed(() => {
    const auth = useAuthStore()
    const currentUserId = auth.user?.id || 'guest'

    return mockUsers.filter(u => u.id !== currentUserId)
  })

  const getFollowingDiaries = computed((): Diary[] => {
    const auth = useAuthStore()
    const diaryStore = useDiaryStore()
    const currentUserId = auth.user?.id || 'guest'

    const followingIds = follows.value
      .filter(f => f.followerId === currentUserId)
      .map(f => f.followingId)

    return diaryStore.diaryList.filter(d => followingIds.includes(d.authorId))
  })

  return {
    follows,
    likes,
    notifications,
    unreadCount,
    recommendUsers,
    getFollowingDiaries,
    loadData,
    follow,
    isFollowing,
    getFollowingCount,
    getFollowerCount,
    likeDiary,
    isLiked,
    addNotification,
    markAllAsRead,
    markAsRead
  }
})
