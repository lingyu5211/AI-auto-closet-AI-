/* ==================== Types ==================== */

export interface ClothingDescription {
  color: string
  pattern: string
  material: string
  fit: string
  neckline: string
  length: string
  style: string
  details: string
}

export interface GenerateOptions {
  gender?: 'male' | 'female'
  style?: string
  size?: string
}

const API_KEY_STORAGE = 'dashscope_api_key'
const CACHE_STORAGE = 'dashscope_cache'

/* ==================== API Key ==================== */

export function getApiKey(): string {
  try {
    return uni.getStorageSync(API_KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function setApiKey(key: string): void {
  uni.setStorageSync(API_KEY_STORAGE, key)
}

export function isKeyConfigured(): boolean {
  return getApiKey().length > 0
}

/* ==================== Cache ==================== */

function getCache(): Record<string, ClothingDescription> {
  try {
    const raw = uni.getStorageSync(CACHE_STORAGE)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setCacheItem(key: string, value: ClothingDescription): void {
  const cache = getCache()
  cache[key] = value
  uni.setStorageSync(CACHE_STORAGE, JSON.stringify(cache))
}

function getCacheItem(key: string): ClothingDescription | null {
  return getCache()[key] || null
}

/* ==================== HTTP Helpers ==================== */

function getAuthHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json'
  }
}

async function qwenFetch(endpoint: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`/api/qwen${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Qwen API error ${res.status}: ${text}`)
  }
  return res.json()
}

async function wanxiangFetch(endpoint: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`/api/wanxiang${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Wanxiang API error ${res.status}: ${text}`)
  }
  return res.json()
}

/* ==================== Qwen-VL: Analyze Clothing ==================== */

export async function analyzeClothing(photo: string): Promise<ClothingDescription> {
  const cached = getCacheItem(photo)
  if (cached) return cached

  const prompt = `请仔细描述这件衣服的以下属性，以JSON格式返回，不要添加任何额外文字：
{
  "color": "颜色（如米白色、深蓝色）",
  "pattern": "花纹（如纯色、条纹、格子、碎花）",
  "material": "材质（如纯棉、牛仔、针织、雪纺）",
  "fit": "版型（如修身、宽松、直筒、A字）",
  "neckline": "领型（如圆领、V领、翻领、连帽；下装填无）",
  "length": "衣长/裤长（如短款、常规、长款、七分）",
  "style": "风格（如休闲、通勤、运动、甜美、街头）",
  "details": "细节特征（如图案印花、破洞、蕾丝、刺绣等）"
}`

  const result = await qwenFetch('/services/aigc/multimodal-generation/generation', {
    model: 'qwen-vl-plus',
    input: {
      messages: [
        {
          role: 'user',
          content: [
            { image: photo },
            { text: prompt }
          ]
        }
      ]
    }
  }) as {
    output?: {
      choices?: Array<{
        message?: { content?: Array<{ text?: string }> }
      }>
    }
  }

  const text = result.output?.choices?.[0]?.message?.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse clothing description from Qwen-VL response')
  }

  const description: ClothingDescription = JSON.parse(jsonMatch[0])
  setCacheItem(photo, description)
  return description
}

export async function analyzeClothingBatch(
  photos: string[]
): Promise<ClothingDescription[]> {
  return Promise.all(photos.map(p => analyzeClothing(p)))
}

/* ==================== Tongyi Wanxiang: Generate Outfit Image ==================== */

export function buildOutfitPrompt(
  descriptions: ClothingDescription[],
  options: GenerateOptions = {}
): string {
  const gender = options.gender === 'male' ? '男' : '女'
  const parts = descriptions.map((d, i) => {
    const label = i === 0 ? '上衣' :
      i === 1 ? '下装' :
      i === 2 ? '外套' :
      i === 3 ? '鞋子' : '配饰'
    return `${label}: ${d.color}${d.pattern}${d.material}${d.fit}${d.details}`
  })

  const styleHint = options.style ? `整体风格${options.style}` : ''
  return `一位${gender}性模特穿着${parts.join('，')}，${styleHint}，全身站立照，白色背景，服装展示，高清，真实感`
}

export async function generateOutfitImage(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const result = await wanxiangFetch('/services/aigc/text2image/image-synthesis', {
    model: 'wanx-v1',
    input: { prompt },
    parameters: {
      size: options.size || '1024*1024',
      n: 1
    }
  }) as {
    output?: { task_id?: string }
  }

  const taskId = result.output?.task_id
  if (!taskId) {
    throw new Error('No task_id returned from Wanxiang')
  }

  const imageUrl = await pollTask(taskId)
  return imageUrl
}

async function pollTask(taskId: string, maxAttempts = 30, intervalMs = 2000): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/wanxiang/tasks/${taskId}`, {
      headers: getAuthHeaders()
    })
    if (!res.ok) {
      throw new Error(`Task polling failed: ${res.status}`)
    }

    const data = await res.json() as {
      output?: {
        task_status?: string
        results?: Array<{ url?: string }>
      }
    }

    const status = data.output?.task_status
    if (status === 'SUCCEEDED') {
      const url = data.output?.results?.[0]?.url
      if (!url) throw new Error('No image URL in completed task')
      return url
    }
    if (status === 'FAILED') {
      throw new Error('Image generation task failed')
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error('Image generation timed out')
}

/* ==================== Connection Test ==================== */

export async function testConnection(): Promise<boolean> {
  try {
    await qwenFetch('/services/aigc/multimodal-generation/generation', {
      model: 'qwen-vl-plus',
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: '回复OK' }]
          }
        ]
      }
    })
    return true
  } catch {
    return false
  }
}

/* ==================== Fallback: Build prompt from clothing metadata ==================== */

export function buildPromptFromMetadata(
  clothes: Array<{ name: string; color: string; subType: string }>,
  options: GenerateOptions = {}
): string {
  const gender = options.gender === 'male' ? '男' : '女'
  const parts = clothes.map(c => `${c.color}${c.subType || c.name}`)
  const styleHint = options.style ? `整体风格${options.style}` : ''
  return `一位${gender}性模特穿着${parts.join('，')}，${styleHint}，全身站立照，白色背景，服装展示，高清，真实感`
}
