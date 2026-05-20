<template>
  <view class="filter-overlay" v-if="visible" @click="handleClose">
    <view class="filter-sheet" @click.stop>
      <view class="sheet-header">
        <text class="sheet-title">筛选条件</text>
        <view class="sheet-close" @click="handleClose">
          <text>×</text>
        </view>
      </view>
      <scroll-view class="sheet-content" scroll-y>
        <view class="filter-section">
          <text class="section-title">颜色</text>
          <view class="filter-options">
            <view 
              v-for="color in COLORS" 
              :key="color" 
              class="filter-option"
              :class="{ active: filters.color === color }"
              @click="updateFilter('color', color)"
            >
              <text>{{ color }}</text>
            </view>
          </view>
        </view>
        <view class="filter-section">
          <text class="section-title">季节</text>
          <view class="filter-options">
            <view 
              v-for="season in SEASONS" 
              :key="season" 
              class="filter-option"
              :class="{ active: filters.season === season }"
              @click="updateFilter('season', season)"
            >
              <text>{{ season }}</text>
            </view>
          </view>
        </view>
        <view class="filter-section">
          <text class="section-title">场景</text>
          <view class="filter-options">
            <view 
              v-for="scene in SCENES" 
              :key="scene" 
              class="filter-option"
              :class="{ active: filters.scene === scene }"
              @click="updateFilter('scene', scene)"
            >
              <text>{{ scene }}</text>
            </view>
          </view>
        </view>
        <view class="filter-section">
          <text class="section-title">常用</text>
          <view class="filter-options">
            <view 
              class="filter-option"
              :class="{ active: filters.isCommon === true }"
              @click="updateFilter('isCommon', true)"
            >
              <text>常用</text>
            </view>
            <view 
              class="filter-option"
              :class="{ active: filters.isCommon === false }"
              @click="updateFilter('isCommon', false)"
            >
              <text>不常用</text>
            </view>
          </view>
        </view>
      </scroll-view>
      <view class="sheet-footer">
        <view class="btn btn-secondary" @click="handleReset">重置</view>
        <view class="btn btn-primary" @click="handleConfirm">确定</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { COLORS, SEASONS, SCENES } from '@/types'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [filters: Record<string, unknown>]
}>()

const filters = reactive<Record<string, unknown>>({
  color: '',
  season: '',
  scene: '',
  isCommon: undefined
})

const updateFilter = (key: string, value: unknown) => {
  filters[key] = filters[key] === value ? '' : value
}

const handleClose = () => {
  emit('close')
}

const handleReset = () => {
  filters.color = ''
  filters.season = ''
  filters.scene = ''
  filters.isCommon = undefined
}

const handleConfirm = () => {
  const filtered = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  emit('confirm', filtered)
}
</script>

<style lang="scss" scoped>
.filter-overlay {
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

.filter-sheet {
  width: 100%;
  max-height: 80vh;
  background-color: $bg-white;
  border-radius: $border-radius-lg $border-radius-lg 0 0;
  display: flex;
  flex-direction: column;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1rpx solid $border-color;
}

.sheet-title {
  font-size: $font-size-lg;
  font-weight: 600;
}

.sheet-close {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: $text-light;
}

.sheet-content {
  flex: 1;
  padding: $spacing-md;
}

.filter-section {
  margin-bottom: $spacing-lg;
}

.section-title {
  font-size: $font-size-base;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.filter-option {
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

.sheet-footer {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  border-top: 1rpx solid $border-color;
  padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
}

.sheet-footer .btn {
  flex: 1;
}
</style>