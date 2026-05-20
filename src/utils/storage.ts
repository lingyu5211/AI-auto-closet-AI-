const PREFIX = 'wardrobe_'

export const storage = {
  set(key: string, value: unknown) {
    try {
      uni.setStorageSync(PREFIX + key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  },

  get<T = unknown>(key: string): T | null {
    try {
      const data = uni.getStorageSync(PREFIX + key)
      if (data) {
        return JSON.parse(data) as T
      }
      return null
    } catch (e) {
      console.error('Storage get error:', e)
      return null
    }
  },

  remove(key: string) {
    try {
      uni.removeStorageSync(PREFIX + key)
      return true
    } catch (e) {
      console.error('Storage remove error:', e)
      return false
    }
  },

  clear() {
    try {
      uni.clearStorageSync()
      return true
    } catch (e) {
      console.error('Storage clear error:', e)
      return false
    }
  },

  keys(): string[] {
    try {
      return uni.getStorageInfoSync().keys.filter(k => k.startsWith(PREFIX))
    } catch (e) {
      console.error('Storage keys error:', e)
      return []
    }
  }
}