<template>
  <view class="add-page">
    <NavBar title="添加衣物" :show-back="true" />
    
    <scroll-view class="add-content" scroll-y>
      <view class="photo-section">
        <view class="photo-upload" @click="handlePhotoUpload">
          <image v-if="photo" :src="photo" mode="aspectFill" />
          <view v-else class="photo-placeholder">
            <text class="placeholder-icon">📸</text>
            <text class="placeholder-text">点击拍照或从相册选择</text>
          </view>
        </view>
        <view class="upload-options">
          <view class="upload-option" @click="chooseImage('camera')">
            <text>📷</text>
            <text>拍照</text>
          </view>
          <view class="upload-option" @click="chooseImage('album')">
            <text>📁</text>
            <text>相册</text>
          </view>
        </view>
      </view>
      
      <view class="form-section">
        <view class="form-item">
          <text class="form-label">衣物名称</text>
          <input class="input" v-model="form.name" placeholder="输入衣物名称" />
        </view>
        
        <view class="form-item">
          <text class="form-label">类型</text>
          <view class="picker-btn" @click="showTypePicker = true">
            <text>{{ form.type || '请选择类型' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </view>
        
        <view class="form-item" v-if="selectedType">
          <text class="form-label">子类型</text>
          <view class="picker-btn" @click="showSubTypePicker = true">
            <text>{{ form.subType || '请选择子类型' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </view>
        
        <view class="form-item">
          <text class="form-label">颜色</text>
          <view class="color-options">
            <view 
              v-for="color in COLORS" 
              :key="color"
              class="color-item"
              :class="{ active: form.color === color }"
              @click="form.color = color"
            >
              <text>{{ color }}</text>
            </view>
          </view>
        </view>
        
        <view class="form-item">
          <text class="form-label">品牌</text>
          <input class="input" v-model="form.brand" placeholder="输入品牌名称" />
        </view>
        
        <view class="form-item">
          <text class="form-label">季节</text>
          <view class="multi-select">
            <view 
              v-for="season in SEASONS" 
              :key="season"
              class="select-item"
              :class="{ active: form.season.includes(season) }"
              @click="toggleSeason(season)"
            >
              <text>{{ season }}</text>
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
              :class="{ active: form.scene.includes(scene) }"
              @click="toggleScene(scene)"
            >
              <text>{{ scene }}</text>
            </view>
          </view>
        </view>
        
        <view class="form-item">
          <text class="form-label">常用</text>
          <switch :checked="form.isCommon" @change="form.isCommon = !form.isCommon" />
        </view>
        
        <view class="form-item">
          <text class="form-label">备注</text>
          <textarea class="textarea" v-model="form.remark" placeholder="添加备注信息..." />
        </view>
      </view>
      
      <view class="bottom-space"></view>
    </scroll-view>
    
    <view class="submit-bar">
      <view class="btn btn-primary" @click="handleSubmit">保存衣物</view>
    </view>
    
    <view class="picker-overlay" v-if="showTypePicker" @click="showTypePicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择类型</text>
          <view class="picker-close" @click="showTypePicker = false">×</view>
        </view>
        <scroll-view scroll-y class="picker-options">
          <view 
            v-for="type in CLOTHING_TYPES" 
            :key="type.value"
            class="picker-item"
            :class="{ active: form.type === type.value }"
            @click="selectType(type)"
          >
            <text>{{ type.label }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
    
    <view class="picker-overlay" v-if="showSubTypePicker" @click="showSubTypePicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择子类型</text>
          <view class="picker-close" @click="showSubTypePicker = false">×</view>
        </view>
        <scroll-view scroll-y class="picker-options">
          <view 
            v-for="sub in currentSubTypes" 
            :key="sub"
            class="picker-item"
            :class="{ active: form.subType === sub }"
            @click="form.subType = sub; showSubTypePicker = false"
          >
            <text>{{ sub }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useWardrobeStore } from '@/store/wardrobe'
import { CLOTHING_TYPES, COLORS, SEASONS, SCENES } from '@/types'
import NavBar from '@/components/NavBar.vue'

const wardrobe = useWardrobeStore()

const photo = ref('')
const showTypePicker = ref(false)
const showSubTypePicker = ref(false)

const form = reactive({
  name: '',
  type: '',
  subType: '',
  color: '',
  brand: '',
  season: [] as string[],
  scene: [] as string[],
  isCommon: false,
  remark: ''
})

const selectedType = computed(() => {
  return CLOTHING_TYPES.find(t => t.value === form.type)
})

const currentSubTypes = computed(() => {
  return selectedType.value?.children || []
})

const toggleSeason = (season: string) => {
  const index = form.season.indexOf(season)
  if (index === -1) {
    form.season.push(season)
  } else {
    form.season.splice(index, 1)
  }
}

const toggleScene = (scene: string) => {
  const index = form.scene.indexOf(scene)
  if (index === -1) {
    form.scene.push(scene)
  } else {
    form.scene.splice(index, 1)
  }
}

const selectType = (type: typeof CLOTHING_TYPES[0]) => {
  form.type = type.value
  form.subType = ''
  showTypePicker.value = false
}

const compressImage = (file: File, maxSide = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
        img.onload = () => {
          let width = img.width
          let height = img.height

          // Scale down long side to maxSide, maintaining aspect ratio
          const longSide = Math.max(width, height)
          if (longSide > maxSide) {
            const scale = maxSide / longSide
            width = Math.round(width * scale)
            height = Math.round(height * scale)
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(e.target?.result as string)
            return
          }
          ctx.drawImage(img, 0, 0, width, height)

          // Iteratively compress to keep dataURL under ~200KB
          let quality = 0.7
          let result = canvas.toDataURL('image/jpeg', quality)
          while (result.length > 200 * 1024 && quality > 0.2) {
            quality -= 0.15
            result = canvas.toDataURL('image/jpeg', Math.round(quality * 100) / 100)
          }
          resolve(result)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const chooseImage = (sourceType: 'camera' | 'album') => {
    const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'
    
    if (isH5) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = sourceType === 'camera' ? 'environment' : undefined
      input.style.display = 'none'
      document.body.appendChild(input)
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement
        if (target.files && target.files[0]) {
          const file = target.files[0]
          uni.showLoading({ title: '压缩中...' })
          try {
            const compressedDataUrl = await compressImage(file)
            photo.value = compressedDataUrl
            console.log('Compressed image size:', compressedDataUrl.length)
          } catch (error) {
            console.error('Compression failed:', error)
            const reader = new FileReader()
            reader.onload = (e) => {
              photo.value = e.target?.result as string
            }
            reader.readAsDataURL(file)
          }
          uni.hideLoading()
        }
        document.body.removeChild(input)
      }
      input.click()
    } else {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: [sourceType],
      success: (res) => {
        photo.value = res.tempFilePaths[0]
      },
      fail: () => {
        uni.showToast({ title: '选择图片失败', icon: 'none' })
      }
    })
  }
}

const handlePhotoUpload = () => {
  uni.showActionSheet({
    itemList: ['拍照', '从相册选择'],
    success: (res) => {
      if (res.tapIndex === 0) {
        chooseImage('camera')
      } else {
        chooseImage('album')
      }
    }
  })
}

const handleSubmit = () => {
  if (!photo.value) {
    uni.showToast({ title: '请上传衣物照片', icon: 'none' })
    return
  }

  if (!form.type) {
    uni.showToast({ title: '请选择衣物类型', icon: 'none' })
    return
  }

  if (!form.color) {
    uni.showToast({ title: '请选择颜色', icon: 'none' })
    return
  }

  uni.showLoading({ title: '保存中...' })

  const result = wardrobe.addClothing({
    name: form.name,
    type: form.type,
    subType: form.subType,
    color: form.color,
    brand: form.brand,
    size: '',
    material: '',
    purchaseChannel: '',
    purchaseTime: 0,
    price: 0,
    season: form.season.length > 0 ? form.season : ['四季'],
    scene: form.scene,
    isFavorite: false,
    isActive: true,
    isCommon: form.isCommon,
    tags: [],
    remark: form.remark,
    photo: photo.value
  })

  uni.hideLoading()

  if (!result) {
    // Save failed — error toast already shown by wardrobe store
    return
  }

  uni.showToast({ title: '添加成功', icon: 'success' })
  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
}
</script>

<style lang="scss" scoped>
.add-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.add-content {
  padding-top: calc(88rpx + var(--status-bar-height, 44px));
  padding: $spacing-md;
  padding-top: calc(88rpx + var(--status-bar-height, 44px) + #{$spacing-md});
  min-height: 100vh;
}

.photo-section {
  margin-bottom: $spacing-lg;
}

.photo-upload {
  width: 100%;
  height: 400rpx;
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  overflow: hidden;
  border: 2rpx dashed $border-color;
}

.photo-upload image {
  width: 100%;
  height: 100%;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 80rpx;
}

.placeholder-text {
  font-size: $font-size-sm;
  color: $text-light;
  margin-top: $spacing-sm;
}

.upload-options {
  display: flex;
  justify-content: center;
  gap: $spacing-xl;
  margin-top: $spacing-md;
}

.upload-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.form-section {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
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

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.color-item {
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

.textarea {
  width: 100%;
  height: 160rpx;
  padding: $spacing-sm $spacing-md;
  background-color: $bg-gray;
  border-radius: $border-radius;
  font-size: $font-size-base;
  color: $text-primary;
  box-sizing: border-box;
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