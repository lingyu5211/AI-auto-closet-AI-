import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Diary } from '@/types'

const STORAGE_KEY = 'wardrobe_diaries'

export const useDiaryStore = defineStore('diary', () => {
  const diaries = ref<Diary[]>([])

  const loadDiaries = () => {
    try {
      const stored = uni.getStorageSync(STORAGE_KEY)
      if (stored) {
        diaries.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load diaries:', e)
    }
  }

  const saveDiaries = () => {
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(diaries.value))
    } catch (e) {
      console.error('Failed to save diaries:', e)
    }
  }

  const addDiary = (diary: Omit<Diary, 'id' | 'createdAt'>) => {
    const newDiary: Diary = {
      ...diary,
      id: `diary_${Date.now()}`,
      createdAt: Date.now()
    }
    diaries.value.unshift(newDiary)
    saveDiaries()
    return newDiary
  }

  const updateDiary = (id: string, data: Partial<Diary>) => {
    const index = diaries.value.findIndex(d => d.id === id)
    if (index !== -1) {
      diaries.value[index] = { ...diaries.value[index], ...data }
      saveDiaries()
    }
  }

  const deleteDiary = (id: string) => {
    const index = diaries.value.findIndex(d => d.id === id)
    if (index !== -1) {
      diaries.value.splice(index, 1)
      saveDiaries()
    }
  }

  const getDiaryById = (id: string) => {
    return diaries.value.find(d => d.id === id)
  }

  const getDiariesByDate = (year: number, month: number) => {
    return diaries.value.filter(d => {
      const date = new Date(d.date)
      return date.getFullYear() === year && date.getMonth() === month
    })
  }

  const getDiariesByTag = (tag: string) => {
    return diaries.value.filter(d => d.tags.includes(tag))
  }

  const searchDiaries = (keyword: string) => {
    const lowerKeyword = keyword.toLowerCase()
    return diaries.value.filter(d =>
      d.content.toLowerCase().includes(lowerKeyword) ||
      d.tags.some(t => t.toLowerCase().includes(lowerKeyword)) ||
      d.scene.toLowerCase().includes(lowerKeyword)
    )
  }

  const monthlyStats = computed(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    const monthDiaries = diaries.value.filter(d => {
      const date = new Date(d.date)
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth
    })

    const sceneCount: Record<string, number> = {}
    const moodCount: Record<string, number> = {}
    const tagCount: Record<string, number> = {}

    monthDiaries.forEach(d => {
      sceneCount[d.scene] = (sceneCount[d.scene] || 0) + 1
      if (d.mood) {
        moodCount[d.mood] = (moodCount[d.mood] || 0) + 1
      }
      d.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })

    return {
      total: monthDiaries.length,
      sceneCount,
      moodCount,
      tagCount,
      mostUsedScene: Object.entries(sceneCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
    }
  })

  const allTags = computed(() => {
    const tags = new Set<string>()
    diaries.value.forEach(d => d.tags.forEach(t => tags.add(t)))
    return Array.from(tags)
  })

  return {
    diaries,
    loadDiaries,
    saveDiaries,
    addDiary,
    updateDiary,
    deleteDiary,
    getDiaryById,
    getDiariesByDate,
    getDiariesByTag,
    searchDiaries,
    monthlyStats,
    allTags
  }
})