export interface User {
  id: string
  phone: string
  nickname: string
  avatar: string
  avatarUrl: string
  gender: 'male' | 'female' | ''
  height: number
  weight: number
  bio: string
  stylePreference: string[]
  createdAt: number
}

export interface Clothing {
  id: string
  name: string
  type: string
  subType: string
  color: string
  brand: string
  size: string
  material: string
  purchaseChannel: string
  purchaseTime: number
  price: number
  season: string[]
  scene: string[]
  isFavorite: boolean
  isActive: boolean
  isCommon: boolean
  tags: string[]
  remark: string
  photo: string
  createdAt: number
  updatedAt: number
}

export interface Outfit {
  id: string
  name: string
  description: string
  clothes: string[]
  scene: string
  season: string
  isFavorite: boolean
  createdAt: number
}

export interface Diary {
  id: string
  outfitId: string
  photos: string[]
  content: string
  date: number
  weather: string
  scene: string
  mood: string
  tags: string[]
  isPublic: boolean
  createdAt: number
  authorId: string
  likeCount: number
  commentCount: number
}

export interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: number
}

export interface Like {
  id: string
  userId: string
  diaryId: string
  createdAt: number
}

export interface Notification {
  id: string
  type: 'follow' | 'like' | 'comment'
  fromUserId: string
  fromUserName: string
  fromUserAvatar: string
  diaryId?: string
  diaryContent?: string
  createdAt: number
  isRead: boolean
}

export interface SocialUser {
  id: string
  nickname: string
  avatar: string
  bio: string
  followerCount: number
  followingCount: number
  diaryCount: number
}

export interface Category {
  id: string
  name: string
  icon: string
  custom: boolean
}

export interface Weather {
  temperature: {
    min: number
    max: number
  }
  condition: string
  wind: string
  humidity: number
}

export interface WeatherForecast {
  date: string
  condition: string
  high: number
  low: number
}

export type AuthType = 'phone' | 'wechat' | 'qq' | 'guest'

export interface AuthState {
  isLoggedIn: boolean
  authType: AuthType
  user: User | null
}

export interface FilterOption {
  key: string
  label: string
  value: string
}

export const CLOTHING_TYPES = [
  { value: 'top', label: '上衣', children: ['T恤', '衬衫', '毛衣', '卫衣', '针织衫', '吊带', '背心'] },
  { value: 'pants', label: '裤子', children: ['牛仔裤', '休闲裤', '西装裤', '运动裤', '阔腿裤', '短裤'] },
  { value: 'skirt', label: '裙子', children: ['半身裙', '连衣裙', '短裙', '长裙'] },
  { value: 'coat', label: '外套', children: ['风衣', '大衣', '羽绒服', '夹克', '西装', '卫衣外套'] },
  { value: 'shoes', label: '鞋子', children: ['运动鞋', '高跟鞋', '平底鞋', '靴子', '凉鞋'] },
  { value: 'accessory', label: '配饰', children: ['帽子', '围巾', '包包', '首饰', '腰带'] }
]

export const COLORS = [
  '黑色', '白色', '灰色', '红色', '粉色', '橙色', '黄色', '绿色', '蓝色', '紫色', '棕色', '米色', '花色'
]

export const SEASONS = ['春', '夏', '秋', '冬', '四季']

export const SCENES = ['职场', '休闲', '约会', '运动', '聚会', '旅行', '正式']

export const MATERIALS = ['棉', '麻', '丝', '羊毛', '涤纶', '锦纶', '氨纶', '混纺', '皮革', '牛仔']

export const STYLE_PREFERENCES = ['休闲', '职场', '甜酷', '复古', '日系', '韩系', '欧美', '极简']