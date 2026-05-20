<template>
  <view class="model-wrapper">
    <div ref="canvasContainer" class="canvas-container"></div>
    
    <view class="controls">
      <view class="control-btn" @click="rotateModel(-30)">◀️</view>
      <view class="control-btn" @click="resetRotation">🔄</view>
      <view class="control-btn" @click="rotateModel(30)">▶️</view>
    </view>
    
    <view class="clothes-preview" v-if="hasClothes">
      <text class="preview-title">已穿衣物</text>
      <view class="preview-items">
        <view 
          v-for="(item, key) in clothes" 
          :key="key" 
          class="preview-item" 
          v-show="item"
          @click="removeClothing(key)"
        >
          <view class="preview-color" :style="{ backgroundColor: item.color }"></view>
          <text class="preview-name">{{ getClothesName(key as string) }}</text>
          <text class="preview-remove">×</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { Clothing } from '@/types'

const props = defineProps<{
  gender: 'male' | 'female'
  height: number
  shoulderWidth: number
  waistSize: number
  hipSize: number
  legRatio: number
  clothes?: {
    top?: Clothing
    bottom?: Clothing
    coat?: Clothing
    shoes?: Clothing
    accessory?: Clothing
  }
}>()

const emit = defineEmits(['remove-clothes'])

const canvasContainer = ref<HTMLDivElement | null>(null)
let scene: any = null
let camera: any = null
let renderer: any = null
let bodyGroup: any = null
let clothesGroup: any = null
let animationId: number = 0
let threeLoaded = false

const hasClothes = computed(() => {
  return props.clothes && Object.values(props.clothes).some(Boolean)
})

const loadThreeJS = () => {
  return new Promise<void>((resolve) => {
    if ((window as any).THREE) {
      threeLoaded = true
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    script.onload = () => {
      threeLoaded = true
      resolve()
    }
    document.head.appendChild(script)
  })
}

const initThreeJS = async () => {
  await loadThreeJS()
  
  if (!canvasContainer.value) return
  
  const THREE = (window as any).THREE
  
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a1a)
  
  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight
  
  camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000)
  camera.position.set(0, 2.5, 6)
  camera.lookAt(0, 2.0, 0)
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  canvasContainer.value.appendChild(renderer.domElement)
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.9)
  mainLight.position.set(8, 14, 8)
  mainLight.castShadow = true
  scene.add(mainLight)
  
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.35)
  fillLight.position.set(-6, 10, -6)
  scene.add(fillLight)
  
  bodyGroup = new THREE.Group()
  clothesGroup = new THREE.Group()
  createBody()
  scene.add(bodyGroup)
  scene.add(clothesGroup)
  
  animate()
}

const createBody = () => {
  if (!scene || !bodyGroup) return
  
  const THREE = (window as any).THREE
  
  while (bodyGroup.children.length > 0) {
    const child = bodyGroup.children[0]
    child.geometry.dispose()
    child.material.dispose()
    bodyGroup.remove(child)
  }
  
  while (clothesGroup.children.length > 0) {
    const child = clothesGroup.children[0]
    child.geometry.dispose()
    child.material.dispose()
    clothesGroup.remove(child)
  }
  
  const scale = props.height / 175
  const bodyScale = props.hipSize / 88
  
  const skinColor = new THREE.Color(0xffd4b8)
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.55,
    metalness: 0.05
  })
  
  const headGeometry = new THREE.SphereGeometry(0.135 * scale, 32, 32)
  const head = new THREE.Mesh(headGeometry, skinMaterial)
  head.position.y = 4.0 * scale
  head.castShadow = true
  bodyGroup.add(head)
  
  const hairColor = props.gender === 'female' ? 0x3d3d3d : 0x4a4a4a
  const hairMaterial = new THREE.MeshStandardMaterial({
    color: hairColor,
    roughness: 0.85
  })
  
  if (props.gender === 'female') {
    const hairGeometry = new THREE.SphereGeometry(0.15 * scale, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.4)
    const hair = new THREE.Mesh(hairGeometry, hairMaterial)
    hair.position.y = 3.95 * scale
    hair.scale.set(1.08, 1.3, 1.05)
    bodyGroup.add(hair)
  } else {
    const hairGeometry = new THREE.SphereGeometry(0.145 * scale, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.6)
    const hair = new THREE.Mesh(hairGeometry, hairMaterial)
    hair.position.y = 3.92 * scale
    hair.scale.set(1.02, 0.52, 0.98)
    bodyGroup.add(hair)
  }
  
  const neckGeometry = new THREE.CylinderGeometry(0.045 * scale, 0.055 * scale, 0.14 * scale, 16)
  const neck = new THREE.Mesh(neckGeometry, skinMaterial)
  neck.position.y = 3.75 * scale
  bodyGroup.add(neck)
  
  const bodyGeometry = new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 1.0 * scale, 32)
  const body = new THREE.Mesh(bodyGeometry, skinMaterial)
  body.position.y = 3.1 * scale
  body.castShadow = true
  bodyGroup.add(body)
  
  const waistGeometry = new THREE.CylinderGeometry(0.08 * scale * (props.waistSize / 65), 0.12 * scale, 0.25 * scale, 32)
  const waist = new THREE.Mesh(waistGeometry, skinMaterial)
  waist.position.y = 2.55 * scale
  bodyGroup.add(waist)
  
  const hipsGeometry = new THREE.CylinderGeometry(0.18 * scale * (props.hipSize / 88), 0.16 * scale * (props.hipSize / 88), 0.3 * scale, 32)
  const hips = new THREE.Mesh(hipsGeometry, skinMaterial)
  hips.position.y = 2.15 * scale
  bodyGroup.add(hips)
  
  const armGeometry = new THREE.CylinderGeometry(0.035 * scale, 0.028 * scale, 0.75 * scale, 16)
  
  const leftArm = new THREE.Mesh(armGeometry, skinMaterial)
  leftArm.position.set(-0.24 * scale, 3.4 * scale, 0)
  leftArm.rotation.y = Math.PI / 2
  leftArm.castShadow = true
  bodyGroup.add(leftArm)
  
  const rightArm = new THREE.Mesh(armGeometry, skinMaterial)
  rightArm.position.set(0.24 * scale, 3.4 * scale, 0)
  rightArm.rotation.y = -Math.PI / 2
  rightArm.castShadow = true
  bodyGroup.add(rightArm)
  
  const handGeometry = new THREE.SphereGeometry(0.032 * scale, 16, 16)
  
  const leftHand = new THREE.Mesh(handGeometry, skinMaterial)
  leftHand.position.set(-0.52 * scale, 3.05 * scale, 0)
  bodyGroup.add(leftHand)
  
  const rightHand = new THREE.Mesh(handGeometry, skinMaterial)
  rightHand.position.set(0.52 * scale, 3.05 * scale, 0)
  bodyGroup.add(rightHand)
  
  const legGeometry = new THREE.CylinderGeometry(0.14 * scale * bodyScale, 0.07 * scale * bodyScale, 1.1 * scale * (props.legRatio / 50), 32)
  
  const leftLeg = new THREE.Mesh(legGeometry, skinMaterial)
  leftLeg.position.set(-0.055 * scale, 1.15 * scale * (props.legRatio / 50), 0)
  leftLeg.castShadow = true
  bodyGroup.add(leftLeg)
  
  const rightLeg = new THREE.Mesh(legGeometry, skinMaterial)
  rightLeg.position.set(0.055 * scale, 1.15 * scale * (props.legRatio / 50), 0)
  rightLeg.castShadow = true
  bodyGroup.add(rightLeg)
  
  const footGeometry = new THREE.BoxGeometry(0.08 * scale, 0.04 * scale, 0.15 * scale)
  const footMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.8
  })
  
  const leftFoot = new THREE.Mesh(footGeometry, footMaterial)
  leftFoot.position.set(-0.055 * scale, 0.52 * scale * (props.legRatio / 50), 0.05 * scale)
  bodyGroup.add(leftFoot)
  
  const rightFoot = new THREE.Mesh(footGeometry, footMaterial)
  rightFoot.position.set(0.055 * scale, 0.52 * scale * (props.legRatio / 50), 0.05 * scale)
  bodyGroup.add(rightFoot)
  
  bodyGroup.scale.set(bodyScale, bodyScale, bodyScale)
  
  updateClothes(scale, bodyScale)
}

const updateClothes = (scale: number, bodyScale: number) => {
  if (!scene || !clothesGroup) return
  
  const THREE = (window as any).THREE
  
  while (clothesGroup.children.length > 0) {
    const child = clothesGroup.children[0]
    child.geometry.dispose()
    child.material.dispose()
    clothesGroup.remove(child)
  }
  
  if (props.clothes?.top) {
    const topColor = new THREE.Color(props.clothes.top.color)
    const topMaterial = new THREE.MeshStandardMaterial({
      color: topColor,
      roughness: 0.48,
      metalness: 0.08
    })
    
    const topGeometry = new THREE.CylinderGeometry(0.14 * scale, 0.1 * scale, 0.75 * scale, 32)
    const top = new THREE.Mesh(topGeometry, topMaterial)
    top.position.set(0, 3.15 * scale, 0)
    top.castShadow = true
    clothesGroup.add(top)
    
    const sleeveGeometry = new THREE.CylinderGeometry(0.042 * scale, 0.038 * scale, 0.72 * scale, 16)
    
    const leftSleeve = new THREE.Mesh(sleeveGeometry, topMaterial)
    leftSleeve.position.set(-0.25 * scale, 3.35 * scale, 0)
    leftSleeve.rotation.y = Math.PI / 2
    clothesGroup.add(leftSleeve)
    
    const rightSleeve = new THREE.Mesh(sleeveGeometry, topMaterial)
    rightSleeve.position.set(0.25 * scale, 3.35 * scale, 0)
    rightSleeve.rotation.y = -Math.PI / 2
    clothesGroup.add(rightSleeve)
  }
  
  if (props.clothes?.bottom) {
    const bottomColor = new THREE.Color(props.clothes.bottom.color)
    const bottomMaterial = new THREE.MeshStandardMaterial({
      color: bottomColor,
      roughness: 0.58,
      metalness: 0.05
    })
    
    const legHeight = 1.15 * scale * (props.legRatio / 50)
    const bottomGeometry = new THREE.CylinderGeometry(
      0.15 * scale * bodyScale,
      0.08 * scale * bodyScale,
      legHeight,
      32
    )
    const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial)
    bottom.position.set(0, 1.2 * scale * (props.legRatio / 50), 0)
    bottom.castShadow = true
    clothesGroup.add(bottom)
  }
  
  if (props.clothes?.coat) {
    const coatColor = new THREE.Color(props.clothes.coat.color)
    const coatMaterial = new THREE.MeshStandardMaterial({
      color: coatColor,
      roughness: 0.45,
      metalness: 0.1
    })
    
    const coatGeometry = new THREE.CylinderGeometry(0.18 * scale, 0.12 * scale, 0.95 * scale, 32)
    const coat = new THREE.Mesh(coatGeometry, coatMaterial)
    coat.position.set(0, 3.1 * scale, 0)
    coat.castShadow = true
    clothesGroup.add(coat)
  }
  
  if (props.clothes?.shoes) {
    const shoeColor = new THREE.Color(props.clothes.shoes.color)
    const shoeMaterial = new THREE.MeshStandardMaterial({
      color: shoeColor,
      roughness: 0.7,
      metalness: 0.2
    })
    
    const shoeGeometry = new THREE.BoxGeometry(0.085 * scale, 0.045 * scale, 0.16 * scale)
    
    const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial)
    leftShoe.position.set(-0.055 * scale, 0.49 * scale * (props.legRatio / 50), 0.055 * scale)
    clothesGroup.add(leftShoe)
    
    const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial)
    rightShoe.position.set(0.055 * scale, 0.49 * scale * (props.legRatio / 50), 0.055 * scale)
    clothesGroup.add(rightShoe)
  }
  
  clothesGroup.scale.set(bodyScale, bodyScale, bodyScale)
}

const animate = () => {
  animationId = requestAnimationFrame(animate)
  
  if (bodyGroup) {
    bodyGroup.rotation.y += 0.003
  }
  
  clothesGroup.rotation.y = bodyGroup ? bodyGroup.rotation.y : 0
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

const rotateModel = (angle: number) => {
  if (bodyGroup) {
    bodyGroup.rotation.y += angle * Math.PI / 180
  }
}

const resetRotation = () => {
  if (bodyGroup) {
    bodyGroup.rotation.y = 0
  }
}

const getClothesName = (key: string) => {
  const names: Record<string, string> = {
    top: '上衣',
    bottom: '下装',
    coat: '外套',
    shoes: '鞋子',
    accessory: '配饰'
  }
  return names[key] || key
}

const removeClothing = (key: string) => {
  emit('remove-clothes', key)
}

watch(() => [props.gender, props.height, props.shoulderWidth, props.waistSize, props.hipSize, props.legRatio], () => {
  createBody()
})

watch(() => props.clothes, () => {
  const scale = props.height / 175
  const bodyScale = props.hipSize / 88
  updateClothes(scale, bodyScale)
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initThreeJS()
  })
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  if (renderer && canvasContainer.value && renderer.domElement) {
    canvasContainer.value.removeChild(renderer.domElement)
    renderer.dispose()
  }
})
</script>

<style lang="scss" scoped>
.model-wrapper {
  width: 100%;
  height: 620rpx;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.canvas-container {
  width: 100%;
  height: 480rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background-color: #1a1a1a;
}

.controls {
  display: flex;
  gap: 24rpx;
  margin-top: 16rpx;
}

.control-btn {
  width: 70rpx;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  backdrop-filter: blur(10px);
  font-size: 28rpx;
}

.clothes-preview {
  width: 100%;
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  backdrop-filter: blur(10px);
}

.preview-title {
  font-size: 28rpx;
  color: #fff;
  margin-bottom: 16rpx;
  display: block;
  font-weight: 600;
}

.preview-items {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 18rpx;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10rpx;
}

.preview-color {
  width: 28rpx;
  height: 28rpx;
  border-radius: 6rpx;
}

.preview-name {
  font-size: 24rpx;
  color: #fff;
  font-weight: 500;
}

.preview-remove {
  font-size: 28rpx;
  color: #aaa;
  margin-left: 8rpx;
  cursor: pointer;
  font-weight: bold;
}
</style>
