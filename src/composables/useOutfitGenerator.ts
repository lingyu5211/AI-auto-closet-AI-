import { ref } from 'vue'
import type { Clothing } from '@/types'
import {
  analyzeClothingBatch,
  buildOutfitPrompt,
  buildPromptFromMetadata,
  generateOutfitImage,
  isKeyConfigured,
  type GenerateOptions
} from '@/api/dashscope'

export function useOutfitGenerator() {
  const isGenerating = ref(false)
  const currentStep = ref<'idle' | 'analyzing' | 'generating' | 'done'>('idle')
  const resultImage = ref('')
  const error = ref('')

  async function generateFromClothes(
    clothes: Clothing[],
    options: GenerateOptions = {}
  ): Promise<string> {
    if (!isKeyConfigured()) {
      error.value = '请先在设置页配置阿里云 API Key'
      uni.showToast({ title: error.value, icon: 'none' })
      return ''
    }

    if (clothes.length === 0) {
      error.value = '请选择至少一件衣物'
      uni.showToast({ title: error.value, icon: 'none' })
      return ''
    }

    isGenerating.value = true
    error.value = ''
    currentStep.value = 'analyzing'

    try {
      const photos = clothes.map(c => c.photo).filter(Boolean)
      let descriptions

      try {
        descriptions = await analyzeClothingBatch(photos)
      } catch (e) {
        console.warn('Qwen-VL analysis failed, using metadata fallback:', e)
        const prompt = buildPromptFromMetadata(
          clothes.map(c => ({
            name: c.name,
            color: c.color,
            subType: c.subType
          })),
          options
        )
        currentStep.value = 'generating'
        try {
          const imgUrl = await generateOutfitImage(prompt, options)
          resultImage.value = imgUrl
          currentStep.value = 'done'
          return imgUrl
        } catch (genErr) {
          error.value = '图像生成失败，请重试'
          uni.showToast({ title: error.value, icon: 'none' })
          return ''
        }
      }

      currentStep.value = 'generating'
      const prompt = buildOutfitPrompt(descriptions, options)

      try {
        const imgUrl = await generateOutfitImage(prompt, options)
        resultImage.value = imgUrl
        currentStep.value = 'done'
        return imgUrl
      } catch (genErr) {
        error.value = '图像生成失败，请重试'
        uni.showToast({ title: error.value, icon: 'none' })
        return ''
      }
    } finally {
      isGenerating.value = false
    }
  }

  function reset(): void {
    isGenerating.value = false
    currentStep.value = 'idle'
    resultImage.value = ''
    error.value = ''
  }

  return {
    isGenerating,
    currentStep,
    resultImage,
    error,
    generateFromClothes,
    reset
  }
}
