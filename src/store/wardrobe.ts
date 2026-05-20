import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Clothing, Category } from '@/types'
import { CLOTHING_TYPES } from '@/types'

const STORAGE_KEY = 'wardrobe_clothes'
const CATEGORY_KEY = 'wardrobe_categories'

const mockClothes: Clothing[] = []

export const useWardrobeStore = defineStore('wardrobe', () => {
  const clothes = ref<Clothing[]>([])
  const categories = ref<Category[]>([
    { id: 'top', name: '上衣', icon: '👕', custom: false },
    { id: 'pants', name: '裤子', icon: '👖', custom: false },
    { id: 'skirt', name: '裙子', icon: '👗', custom: false },
    { id: 'coat', name: '外套', icon: '🧥', custom: false },
    { id: 'shoes', name: '鞋子', icon: '👟', custom: false },
    { id: 'accessory', name: '配饰', icon: '🎒', custom: false }
  ])
  const filterType = ref<string>('')

  const setFilterType = (type: string) => {
    filterType.value = type
  }

  const loadClothes = () => {
    try {
      const stored = uni.getStorageSync(STORAGE_KEY)
      console.log('Stored data length:', stored?.length)
      if (stored && stored.length > 2) {
        const parsed = JSON.parse(stored)
        console.log('Parsed clothes count:', parsed?.length)
        if (parsed && parsed.length > 0) {
          const hasValidData = parsed[0].season && Array.isArray(parsed[0].season)
          if (hasValidData) {
            clothes.value = parsed
          } else {
            clothes.value = []
            saveClothes()
          }
        } else {
          clothes.value = []
          saveClothes()
        }
      } else {
        clothes.value = []
        saveClothes()
      }
      console.log('Current clothes count:', clothes.value.length)
    } catch (e: any) {
      console.error('Failed to load clothes:', e.message || e)
      clothes.value = []
      saveClothes()
    }
  }

  const initMockData = () => {
    // 不再自动填充预设数据，等待用户添加
  }

  const saveClothes = () => {
    try {
      const data = JSON.stringify(clothes.value)
      console.log('Saving clothes data, size:', data.length)
      uni.setStorageSync(STORAGE_KEY, data)
      console.log('Save successful')
    } catch (e: any) {
      console.error('Failed to save clothes:', e.message || e)
      uni.showToast({ title: '保存失败，数据过大', icon: 'none' })
    }
  }

  const loadCategories = () => {
    try {
      const stored = uni.getStorageSync(CATEGORY_KEY)
      if (stored) {
        const customCats = JSON.parse(stored)
        const defaultCats = categories.value.filter(c => !c.custom)
        categories.value = [...defaultCats, ...customCats]
      }
    } catch (e) {
      console.error('Failed to load categories:', e)
    }
  }

  const saveCategories = () => {
    try {
      const customCats = categories.value.filter(c => c.custom)
      uni.setStorageSync(CATEGORY_KEY, JSON.stringify(customCats))
    } catch (e) {
      console.error('Failed to save categories:', e)
    }
  }

  const addClothing = (clothing: Omit<Clothing, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClothing: Clothing = {
      ...clothing,
      id: `clothing_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    clothes.value.unshift(newClothing)
    saveClothes()
    return newClothing
  }

  const updateClothing = (id: string, data: Partial<Clothing>) => {
    const index = clothes.value.findIndex(c => c.id === id)
    if (index !== -1) {
      clothes.value[index] = { ...clothes.value[index], ...data, updatedAt: Date.now() }
      saveClothes()
    }
  }

  const deleteClothing = (id: string) => {
    const index = clothes.value.findIndex(c => c.id === id)
    if (index !== -1) {
      const deleted = clothes.value.splice(index, 1)[0]
      saveClothes()
      return deleted
    }
    return null
  }

  const toggleFavorite = (id: string) => {
    const clothing = clothes.value.find(c => c.id === id)
    if (clothing) {
      clothing.isFavorite = !clothing.isFavorite
      clothing.updatedAt = Date.now()
      saveClothes()
    }
  }

  const toggleActive = (id: string) => {
    const clothing = clothes.value.find(c => c.id === id)
    if (clothing) {
      clothing.isActive = !clothing.isActive
      clothing.updatedAt = Date.now()
      saveClothes()
    }
  }

  const addCategory = (name: string) => {
    const newCategory: Category = {
      id: `category_${Date.now()}`,
      name,
      icon: '📁',
      custom: true
    }
    categories.value.push(newCategory)
    saveCategories()
    return newCategory
  }

  const deleteCategory = (id: string) => {
    const index = categories.value.findIndex(c => c.id === id)
    if (index !== -1 && categories.value[index].custom) {
      categories.value.splice(index, 1)
      saveCategories()
    }
  }

  const getClothingById = (id: string) => {
    return clothes.value.find(c => c.id === id)
  }

  const getClothesByType = (type: string) => {
    return clothes.value.filter(c => c.type === type)
  }

  const getFavoriteClothes = () => {
    return clothes.value.filter(c => c.isFavorite)
  }

  const getActiveClothes = () => {
    return clothes.value.filter(c => c.isActive)
  }

  const getClothesByCategory = (categoryId: string) => {
    const category = categories.value.find(c => c.id === categoryId)
    if (!category || !category.custom) {
      return getClothesByType(categoryId)
    }
    return clothes.value.filter(c => c.tags.includes(category.name))
  }

  const filterClothes = (filters: {
    color?: string
    season?: string
    scene?: string
    material?: string
    isCommon?: boolean
    brand?: string
  }) => {
    return clothes.value.filter(c => {
      if (filters.color && c.color !== filters.color) return false
      if (filters.season && !c.season.includes(filters.season)) return false
      if (filters.scene && !c.scene.includes(filters.scene)) return false
      if (filters.material && c.material !== filters.material) return false
      if (filters.isCommon !== undefined && c.isCommon !== filters.isCommon) return false
      if (filters.brand && !c.brand.includes(filters.brand)) return false
      return true
    })
  }

  const searchClothes = (keyword: string) => {
    const lowerKeyword = keyword.toLowerCase()
    return clothes.value.filter(c => 
      c.name.toLowerCase().includes(lowerKeyword) ||
      c.brand.toLowerCase().includes(lowerKeyword) ||
      c.tags.some(t => t.toLowerCase().includes(lowerKeyword))
    )
  }

  const stats = computed(() => {
    console.log('Clothes length:', clothes.value.length)
    const total = clothes.value.length
    const active = clothes.value.filter(c => c.isActive).length
    const favorite = clothes.value.filter(c => c.isFavorite).length
    const byType: Record<string, number> = {}
    CLOTHING_TYPES.forEach(t => {
      byType[t.value] = clothes.value.filter(c => c.type === t.value).length
    })
    const bySeason: Record<string, number> = {}
    ['春', '夏', '秋', '冬'].forEach(s => {
      bySeason[s] = clothes.value.filter(c => Array.isArray(c.season) && c.season.includes(s)).length
    })
    console.log('Stats:', { total, active, favorite, byType, bySeason })
    return { total, active, favorite, byType, bySeason }
  })

  return {
    clothes,
    categories,
    filterType,
    loadClothes,
    saveClothes,
    loadCategories,
    saveCategories,
    initMockData,
    addClothing,
    updateClothing,
    deleteClothing,
    toggleFavorite,
    toggleActive,
    addCategory,
    deleteCategory,
    getClothingById,
    getClothesByType,
    getFavoriteClothes,
    getActiveClothes,
    getClothesByCategory,
    filterClothes,
    searchClothes,
    setFilterType,
    stats
  }
})