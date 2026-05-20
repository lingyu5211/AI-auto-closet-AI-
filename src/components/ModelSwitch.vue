<template>
  <view class="model-switch" @click="toggle">
    <view class="switch-option" :class="{ active: modelValue === 'female' }">
      <text>👩🏻 女</text>
    </view>
    <view class="switch-option" :class="{ active: modelValue === 'male' }">
      <text>👦🏻 男</text>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: 'male' | 'female'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: 'male' | 'female']
}>()

const toggle = () => {
  const next: 'male' | 'female' = props.modelValue === 'male' ? 'female' : 'male'
  emit('update:modelValue', next)
}
</script>

<style lang="scss" scoped>
.model-switch {
  display: inline-flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: $border-radius;
  padding: 4rpx;
  gap: 4rpx;
}

.switch-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx 32rpx;
  border-radius: 10rpx;
  font-size: $font-size-sm;
  color: $text-secondary;
  background: transparent;
  transition: all 0.3s ease;
  cursor: pointer;

  &.active {
    background: $primary-color;
    color: #ffffff;
    box-shadow: $shadow-sm;
  }
}
</style>
