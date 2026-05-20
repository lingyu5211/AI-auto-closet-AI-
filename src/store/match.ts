import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Outfit, Weather } from '@/types'
import { useWardrobeStore } from './wardrobe'
import { useAuthStore } from './auth'
import boyModel from '@/img/boy_model.png'
import girlModel from '@/img/girl_model.png'

const STORAGE_KEY = 'wardrobe_outfits'

export const useMatchStore = defineStore('match', () => {
  const outfits = ref<Outfit[]>([])
  const currentWeather = ref<Weather | null>(null)
  const outfitHistory = ref<string[]>([])

  // Model gender state
  const modelGender = ref<'male' | 'female'>('female')

  const setModelGender = (gender: 'male' | 'female') => {
    modelGender.value = gender
  }

  // Computed model image path based on selected gender
  const modelImage = computed(() => {
    return modelGender.value === 'male' ? boyModel : girlModel
  })

  const loadOutfits = () => {
    try {
      const stored = uni.getStorageSync(STORAGE_KEY)
      if (stored) {
        outfits.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load outfits:', e)
    }
  }

  const saveOutfits = () => {
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(outfits.value))
    } catch (e) {
      console.error('Failed to save outfits:', e)
    }
  }

  const addOutfit = (outfit: Omit<Outfit, 'id' | 'createdAt'>) => {
    const newOutfit: Outfit = {
      ...outfit,
      id: `outfit_${Date.now()}`,
      createdAt: Date.now()
    }
    outfits.value.unshift(newOutfit)
    saveOutfits()
    return newOutfit
  }

  const updateOutfit = (id: string, data: Partial<Outfit>) => {
    const index = outfits.value.findIndex(o => o.id === id)
    if (index !== -1) {
      outfits.value[index] = { ...outfits.value[index], ...data }
      saveOutfits()
    }
  }

  const deleteOutfit = (id: string) => {
    const index = outfits.value.findIndex(o => o.id === id)
    if (index !== -1) {
      outfits.value.splice(index, 1)
      saveOutfits()
    }
  }

  const toggleFavorite = (id: string) => {
    const outfit = outfits.value.find(o => o.id === id)
    if (outfit) {
      outfit.isFavorite = !outfit.isFavorite
      saveOutfits()
    }
  }

  const addToHistory = (outfitId: string) => {
    const index = outfitHistory.value.indexOf(outfitId)
    if (index !== -1) {
      outfitHistory.value.splice(index, 1)
    }
    outfitHistory.value.unshift(outfitId)
    if (outfitHistory.value.length > 20) {
      outfitHistory.value = outfitHistory.value.slice(0, 20)
    }
  }

  const getTempLevel = (temp: { min: number; max: number }) => {
    const avgTemp = (temp.min + temp.max) / 2
    if (avgTemp >= 30) return 'hot'
    if (avgTemp >= 25) return 'warm'
    if (avgTemp >= 18) return 'mild'
    if (avgTemp >= 10) return 'cool'
    if (avgTemp >= 0) return 'cold'
    return 'freezing'
  }

  const getStyleByTemp = (temp: { min: number; max: number }) => {
    const level = getTempLevel(temp)
    const styles: Record<string, string[]> = {
      hot: ['清凉', '休闲', '度假'],
      warm: ['休闲', '通勤', '简约'],
      mild: ['轻商务', '休闲', '复古'],
      cool: ['通勤', '学院', '文艺'],
      cold: ['保暖', '商务', '复古'],
      freezing: ['保暖', '时尚', '户外']
    }
    return styles[level] || ['休闲']
  }

  const getTempAdvice = (temp: { min: number; max: number }) => {
    const level = getTempLevel(temp)
    const advices: Record<string, { tip: string; icon: string; layers: number }> = {
      hot: { tip: '炎热天气，建议穿透气清凉的衣物', icon: '🌞', layers: 1 },
      warm: { tip: '温暖舒适，适合轻薄透气的穿搭', icon: '🌤️', layers: 2 },
      mild: { tip: '气候宜人，可叠穿搭配层次感', icon: '🍂', layers: 2 },
      cool: { tip: '微凉天气，建议添加外套', icon: '🌥️', layers: 3 },
      cold: { tip: '寒冷天气，注意保暖', icon: '❄️', layers: 4 },
      freezing: { tip: '严寒天气，务必做好防寒', icon: '🧊', layers: 5 }
    }
    return advices[level] || { tip: '天气适宜', icon: '🌤️', layers: 2 }
  }

  const generateSmartOutfits = (count: number = 3): Outfit[] => {
    const wardrobe = useWardrobeStore()
    const auth = useAuthStore()
    const activeClothes = wardrobe.getActiveClothes()
    
    if (activeClothes.length < 2) return []

    const preferences = auth.user?.stylePreference || ['休闲']
    const temp = currentWeather.value?.temperature || { min: 18, max: 25 }
    const tempLevel = getTempLevel(temp)
    const tempStyles = getStyleByTemp(temp)
    
    let suitableClothes = activeClothes.filter(c => {
      const isSeasonSuitable = c.season.includes('四季') || 
        (temp.min >= 25 && c.season.includes('夏')) ||
        (temp.min >= 12 && temp.max <= 28 && (c.season.includes('春') || c.season.includes('秋'))) ||
        (temp.max <= 15 && c.season.includes('冬'))
      return isSeasonSuitable
    })

    const tops = suitableClothes.filter(c => c.type === 'top')
    const bottoms = suitableClothes.filter(c => c.type === 'pants' || c.type === 'skirt')
    const coats = suitableClothes.filter(c => c.type === 'coat')
    const jackets = suitableClothes.filter(c => c.type === 'jacket')
    const sweaters = suitableClothes.filter(c => c.type === 'sweater')
    const shoes = suitableClothes.filter(c => c.type === 'shoes')
    const accessories = suitableClothes.filter(c => c.type === 'accessory')

    const outerwear = [...coats, ...jackets]
    const upperLayer = [...tops, ...sweaters]

    const results: Outfit[] = []
    const usedCombinations = new Set<string>()

    for (let i = 0; i < count; i++) {
      const outfitClothes: string[] = []
      const advice = getTempAdvice(temp)
      
      if (upperLayer.length > 0) {
        const top = upperLayer[Math.floor(Math.random() * upperLayer.length)]
        outfitClothes.push(top.id)
      }
      
      if (bottoms.length > 0) {
        const bottom = bottoms[Math.floor(Math.random() * bottoms.length)]
        outfitClothes.push(bottom.id)
      }
      
      if (outerwear.length > 0 && advice.layers >= 3) {
        const outer = outerwear[Math.floor(Math.random() * outerwear.length)]
        outfitClothes.push(outer.id)
      }
      
      if (shoes.length > 0) {
        const shoe = shoes[Math.floor(Math.random() * shoes.length)]
        outfitClothes.push(shoe.id)
      }
      
      if (accessories.length > 0 && Math.random() > 0.4) {
        const accessory = accessories[Math.floor(Math.random() * accessories.length)]
        outfitClothes.push(accessory.id)
      }

      const key = outfitClothes.sort().join('-')
      if (!usedCombinations.has(key) && outfitClothes.length >= 2) {
        usedCombinations.add(key)
        const allStyles = [...new Set([...preferences, ...tempStyles])]
        const scene = allStyles[Math.floor(Math.random() * allStyles.length)]
        results.push({
          id: `temp_${Date.now()}_${i}`,
          name: `${scene}穿搭 ${i + 1}`,
          description: generateDescription(outfitClothes, wardrobe),
          clothes: outfitClothes,
          scene,
          season: getSeason(temp),
          isFavorite: false,
          createdAt: Date.now()
        })
      }
    }

    return results
  }

  const generateDescription = (clothesIds: string[], wardrobe: ReturnType<typeof useWardrobeStore>) => {
    const descriptions: string[] = []
    clothesIds.forEach(id => {
      const clothing = wardrobe.getClothingById(id)
      if (clothing) {
        descriptions.push(`${clothing.color}${clothing.subType || clothing.name}`)
      }
    })
    return descriptions.join(' + ')
  }

  const getSeason = (temp: { min: number; max: number }) => {
    if (temp.max >= 28) return '夏'
    if (temp.min <= 5) return '冬'
    if (temp.min >= 15 && temp.max <= 25) return '春'
    return '秋'
  }

  const getRecommendedOutfits = () => {
    return outfits.value.filter(o => o.isFavorite)
  }

  const getOutfitById = (id: string) => {
    return outfits.value.find(o => o.id === id)
  }

  const setWeather = (weather: Weather) => {
    currentWeather.value = weather
  }

  const tempAdvice = computed(() => {
    if (!currentWeather.value) return null
    return getTempAdvice(currentWeather.value.temperature)
  })

  const recommendedStyles = computed(() => {
    if (!currentWeather.value) return ['休闲']
    return getStyleByTemp(currentWeather.value.temperature)
  })

  return {
    outfits,
    currentWeather,
    outfitHistory,
    tempAdvice,
    recommendedStyles,
    loadOutfits,
    saveOutfits,
    addOutfit,
    updateOutfit,
    deleteOutfit,
    toggleFavorite,
    addToHistory,
    generateSmartOutfits,
    getRecommendedOutfits,
    getOutfitById,
    setWeather,
    getTempAdvice,
    getStyleByTemp,
    modelGender,
    modelImage,
    setModelGender,
  }
})
