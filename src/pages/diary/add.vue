<template>
  <view class="add-diary-page">
    <NavBar title="添加日记" :show-back="true" />
    
    <scroll-view class="add-content" scroll-y>
      <view class="photo-section">
        <view class="section-title">今日穿搭照片</view>
        <view class="photo-grid">
          <view 
            v-for="(photo, index) in photos" 
            :key="index"
            class="photo-item"
          >
            <image :src="photo" mode="aspectFill" />
            <view class="photo-remove" @click="removePhoto(index)">
              <text>×</text>
            </view>
          </view>
          <view 
            class="photo-item add"
            @click="choosePhoto"
            v-if="photos.length < 9"
          >
            <text class="add-icon">+</text>
          </view>
        </view>
      </view>
      
      <view class="form-section">
        <view class="form-item">
          <text class="form-label">关联穿搭</text>
          <view class="picker-btn" @click="showOutfitPicker = true">
            <text>{{ selectedOutfit?.name || '选择穿搭（可选）' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </view>
        
        <view class="form-item">
          <text class="form-label">日期</text>
          <view class="picker-btn" @click="showDatePicker = true">
            <text>{{ formatDate(form.date) }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </view>
        
        <view class="form-item">
          <text class="form-label">天气</text>
          <view class="weather-options">
            <view 
              v-for="w in weatherOptions" 
              :key="w.value"
              class="weather-item"
              :class="{ active: form.weather === w.value }"
              @click="form.weather = w.value"
            >
              <text class="weather-icon">{{ w.icon }}</text>
              <text class="weather-name">{{ w.value }}</text>
            </view>
          </view>
        </view>
        
        <view class="form-item">
          <text class="form-label">场景</text>
          <view class="multi-select">
            <view 
              v-for="scene in SCENES" 
              :key="scene"
              class="select-item"
              :class="{ active: form.scene === scene }"
              @click="form.scene = scene"
            >
              <text>{{ scene }}</text>
            </view>
          </view>
        </view>
        
        <view class="form-item">
          <text class="form-label">心情</text>
          <view class="mood-options">
            <view 
              v-for="mood in moodOptions" 
              :key="mood"
              class="mood-item"
              :class="{ active: form.mood === mood }"
              @click="form.mood = mood"
            >
              <text>{{ mood }}</text>
            </view>
          </view>
        </view>
        
        <view class="form-item">
          <text class="form-label">日记内容</text>
          <textarea class="textarea" v-model="form.content" placeholder="记录今日穿搭感受..." />
        </view>
        
        <view class="form-item">
          <text class="form-label">标签</text>
          <view class="tag-input">
            <input 
              class="tag-input-field" 
              v-model="newTag" 
              placeholder="输入标签后按回车"
              @confirm="addTag"
            />
            <view class="tags-list" v-if="form.tags.length > 0">
              <view 
                v-for="(tag, index) in form.tags" 
                :key="index"
                class="tag-item"
              >
                <text>{{ tag }}</text>
                <text class="tag-remove" @click="removeTag(index)">×</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <view class="bottom-space"></view>
    </scroll-view>
    
    <view class="submit-bar">
      <view class="btn btn-primary" @click="handleSubmit">保存日记</view>
    </view>
    
    <view class="picker-overlay" v-if="showOutfitPicker" @click="showOutfitPicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择穿搭</text>
          <view class="picker-close" @click="showOutfitPicker = false">×</view>
        </view>
        <scroll-view scroll-y class="picker-options">
          <view class="picker-item" @click="selectedOutfit = null; showOutfitPicker = false">
            <text>不关联穿搭</text>
          </view>
          <view 
            v-for="outfit in outfits" 
            :key="outfit.id"
            class="picker-item"
            :class="{ active: selectedOutfit?.id === outfit.id }"
            @click="selectedOutfit = outfit; showOutfitPicker = false"
          >
            <text>{{ outfit.name }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useDiaryStore } from '@/store/diary'
import { useMatchStore } from '@/store/match'
import { SCENES } from '@/types'
import { formatDate } from '@/utils'
import NavBar from '@/components/NavBar.vue'

const diary = useDiaryStore()
const match = useMatchStore()

const photos = ref<string[]>([])
const newTag = ref('')
const showOutfitPicker = ref(false)
const showDatePicker = ref(false)
const selectedOutfit = ref<typeof match.outfits[0] | null>(null)

const outfits = match.outfits

const weatherOptions = [
  { value: '晴', icon: '☀️' },
  { value: '多云', icon: '⛅' },
  { value: '阴', icon: '☁️' },
  { value: '小雨', icon: '🌧️' },
  { value: '大雨', icon: '⛈️' },
  { value: '雪', icon: '❄️' }
]

const moodOptions = ['开心', '一般', '疲惫', '烦躁', '兴奋']

const form = reactive({
  date: Date.now(),
  weather: '晴',
  scene: '日常',
  mood: '',
  content: '',
  tags: [] as string[]
})

const choosePhoto = () => {
  uni.chooseImage({
    count: 9 - photos.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      photos.value.push(...res.tempFilePaths)
    }
  })
}

const removePhoto = (index: number) => {
  photos.value.splice(index, 1)
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
    form.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  form.tags.splice(index, 1)
}

const handleSubmit = () => {
  diary.addDiary({
    outfitId: selectedOutfit.value?.id || '',
    photos: photos.value,
    content: form.content,
    date: form.date,
    weather: form.weather,
    scene: form.scene,
    mood: form.mood,
    tags: form.tags,
    isPublic: false
  })
  
  uni.showToast({ title: '保存成功', icon: 'success' })
  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
}
</script>

<style lang="scss" scoped>
.add-diary-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.add-content {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  padding: $spacing-md;
  padding-top: calc(88rpx + var(--status-bar-height, 44px) + #{$spacing-md});
  min-height: 100vh;
}

.section-title {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
  display: block;
}

.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.photo-item {
  position: relative;
  width: calc(33.33% - #{$spacing-sm} / 3 * 2);
  aspect-ratio: 1;
  border-radius: $border-radius;
  overflow: hidden;
  
  &.add {
    background-color: $bg-gray;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.photo-item image {
  width: 100%;
  height: 100%;
}

.add-icon {
  font-size: 48rpx;
  color: $text-light;
}

.photo-remove {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 32rpx;
  height: 32rpx;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: $text-white;
}

.form-section {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-top: $spacing-md;
}

.form-item {
  margin-bottom: $spacing-md;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
  display: block;
}

.picker-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 88rpx;
  background-color: $bg-gray;
  border-radius: $border-radius;
  padding: 0 $spacing-md;
  font-size: $font-size-base;
  color: $text-primary;
}

.picker-arrow {
  font-size: $font-size-lg;
  color: $text-light;
}

.weather-options {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.weather-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background-color: $bg-gray;
  border-radius: $border-radius;
  min-width: 80rpx;
  
  &.active {
    background-color: $primary-color;
    
    .weather-name {
      color: $text-white;
    }
  }
}

.weather-icon {
  font-size: 28rpx;
}

.weather-name {
  font-size: $font-size-xs;
  color: $text-secondary;
  margin-top: 4rpx;
}

.multi-select {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.select-item {
  padding: $spacing-sm $spacing-md;
  background-color: $bg-gray;
  border-radius: $border-radius;
  font-size: $font-size-sm;
  color: $text-secondary;
  
  &.active {
    background-color: $primary-color;
    color: $text-white;
  }
}

.mood-options {
  display: flex;
  gap: $spacing-sm;
}

.mood-item {
  padding: $spacing-sm $spacing-md;
  background-color: $bg-gray;
  border-radius: $border-radius;
  font-size: $font-size-sm;
  color: $text-secondary;
  
  &.active {
    background-color: $primary-color;
    color: $text-white;
  }
}

.textarea {
  width: 100%;
  height: 200rpx;
  padding: $spacing-sm $spacing-md;
  background-color: $bg-gray;
  border-radius: $border-radius;
  font-size: $font-size-base;
  color: $text-primary;
  box-sizing: border-box;
}

.tag-input {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.tag-input-field {
  height: 80rpx;
  padding: 0 $spacing-md;
  background-color: $bg-gray;
  border-radius: $border-radius;
  font-size: $font-size-base;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: $spacing-xs $spacing-sm;
  background-color: rgba($primary-color, 0.1);
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  color: $primary-color;
}

.tag-remove {
  font-size: $font-size-sm;
}

.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $spacing-md;
  padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
  background-color: $bg-white;
  border-top: 1rpx solid $border-color;
}

.submit-bar .btn {
  width: 100%;
}

.bottom-space {
  height: calc(160rpx + env(safe-area-inset-bottom));
}

.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.picker-content {
  width: 100%;
  max-height: 60vh;
  background-color: $bg-white;
  border-radius: $border-radius-lg $border-radius-lg 0 0;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1rpx solid $border-color;
}

.picker-title {
  font-size: $font-size-lg;
  font-weight: 600;
}

.picker-close {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: $text-light;
}

.picker-options {
  max-height: 50vh;
}

.picker-item {
  padding: $spacing-md;
  font-size: $font-size-base;
  color: $text-primary;
  border-bottom: 1rpx solid $border-color;
  
  &.active {
    color: $primary-color;
    background-color: rgba($primary-color, 0.05);
  }
}
</style>