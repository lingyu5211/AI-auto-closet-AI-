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
    let detail = text
    try {
      const parsed = JSON.parse(text)
      detail = parsed.message || parsed.error || parsed.code || text
    } catch {}
    throw new Error(`Qwen API ${res.status}: ${detail}`)
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

  const typeLabels = ['上衣', '下装', '外套', '裤子', '裙子', '鞋子', '配饰']

  const parts = descriptions.map((d, i) => {
    const label = typeLabels[i] || `衣物${i + 1}`
    const detail = [d.color, d.pattern, d.material, d.fit, d.neckline, d.length, d.details]
      .filter(Boolean)
      .join('、')
    return `${label}：${detail}`
  })

  const styleHint = options.style ? `整体风格为${options.style}，` : ''

  return `一位${gender}性时装模特，标准直立站姿，正面全身照，纯白色摄影棚背景。
模特身穿以下指定服装，必须严格还原每件衣物的特征：
${parts.join('\n')}
${styleHint}高清时尚摄影，柔和均匀的摄影棚灯光，服装细节清晰可见，1:1比例`
}

export function buildPromptFromMetadata(
  clothes: Array<{ name: string; color: string; subType: string }>,
  options: GenerateOptions = {}
): string {
  const gender = options.gender === 'male' ? '男' : '女'

  const parts = clothes.map((c, i) => {
    const label = ['上衣', '下装', '外套', '鞋子', '配饰'][i] || `衣物${i + 1}`
    return `${label}：${c.color}色${c.subType || c.name}`
  })

  const styleHint = options.style ? `整体风格为${options.style}，` : ''

  return `一位${gender}性时装模特，标准直立站姿，正面全身照，纯白色摄影棚背景。
模特身穿以下指定服装：
${parts.join('\n')}
${styleHint}高清时尚摄影，柔和均匀的摄影棚灯光，服装细节清晰可见，1:1比例`
}

export async function generateOutfitImage(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const result = await qwenFetch('/services/aigc/multimodal-generation/generation', {
    model: 'wan2.6-t2i',
    input: {
      messages: [
        {
          role: 'user',
          content: [{ text: prompt }]
        }
      ]
    },
    parameters: {
      negative_prompt: '模糊、变形、扭曲、多只手、多余手指、丑陋面孔、低质量、jpeg artifacts、错误的服装、与实际描述不符的衣物、随意图案、杂乱背景、多人、半身照、侧脸',
      prompt_extend: false,
      watermark: false,
      n: 1,
      size: options.size || '1024*1024'
    }
  }) as {
    output?: {
      choices?: Array<{
        message?: { content?: Array<{ image?: string }> }
      }>
    }
  }

  const imageUrl = result.output?.choices?.[0]?.message?.content?.[0]?.image
  if (!imageUrl) {
    throw new Error('No image returned from Wanxiang')
  }
  return imageUrl
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

