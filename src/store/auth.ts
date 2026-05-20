import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthType } from '@/types'

const STORAGE_KEY = 'wardrobe_auth'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const authType = ref<AuthType>('guest')
  const user = ref<User | null>(null)
  const hasGuided = ref(false)

  const loadAuth = () => {
    try {
      const stored = uni.getStorageSync(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        isLoggedIn.value = data.isLoggedIn
        authType.value = data.authType
        user.value = data.user
        hasGuided.value = data.hasGuided || false
      }
    } catch (e) {
      console.error('Failed to load auth:', e)
    }
  }

  const saveAuth = () => {
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify({
        isLoggedIn: isLoggedIn.value,
        authType: authType.value,
        user: user.value,
        hasGuided: hasGuided.value
      }))
    } catch (e) {
      console.error('Failed to save auth:', e)
    }
  }

  const login = (type: AuthType, userData?: Partial<User>) => {
    isLoggedIn.value = true
    authType.value = type
    if (userData) {
      user.value = {
        id: userData.id || `user_${Date.now()}`,
        phone: userData.phone || '',
        nickname: userData.nickname || '用户',
        avatar: userData.avatar || '',
        avatarUrl: userData.avatarUrl || '',
        gender: userData.gender || '',
        height: userData.height || 0,
        weight: userData.weight || 0,
        bio: userData.bio || '',
        stylePreference: userData.stylePreference || ['休闲'],
        createdAt: userData.createdAt || Date.now()
      }
    }
    saveAuth()
  }

  const logout = () => {
    isLoggedIn.value = false
    authType.value = 'guest'
    user.value = null
    saveAuth()
  }

  const updateUser = (data: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...data, updatedAt: Date.now() }
      saveAuth()
    }
  }

  const setGuided = (value: boolean) => {
    hasGuided.value = value
    saveAuth()
  }

  const guestLogin = () => {
    isLoggedIn.value = true
    authType.value = 'guest'
    user.value = {
      id: `guest_${Date.now()}`,
      phone: '',
      nickname: '时尚达人',
      avatar: '',
      avatarUrl: '',
      gender: '',
      height: 0,
      weight: 0,
      bio: '分享我的时尚穿搭日常 ✨',
      stylePreference: ['休闲', '职场'],
      createdAt: Date.now()
    }
    saveAuth()
  }

  const isGuest = computed(() => authType.value === 'guest')

  return {
    isLoggedIn,
    authType,
    user,
    hasGuided,
    isGuest,
    loadAuth,
    login,
    logout,
    updateUser,
    setGuided,
    guestLogin
  }
})