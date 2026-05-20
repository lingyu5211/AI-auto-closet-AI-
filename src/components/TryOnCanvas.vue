<template>
  <view
    class="tryon-canvas-wrapper"
    :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
  >
    <canvas
      :canvas-id="canvasId"
      :id="canvasId"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      class="tryon-canvas"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, getCurrentInstance, nextTick } from 'vue'
import type { Clothing } from '@/types'

/* ==================== Types ==================== */

interface ModelDrawArea {
  x: number
  y: number
  w: number
  h: number
}

export interface ClothingLayer {
  id: string
  clothing: Clothing
  x: number
  y: number
  w: number
  h: number
  zIndex: number
}

interface DragState {
  layer: ClothingLayer
  offsetX: number
  offsetY: number
}

/* ==================== Region Mapping ==================== */

const REGION_MAP: Record<string, { xPct: number; yPct: number; wPct: number; hPct: number; zIndex: number }> = {
  top:       { xPct: 0.22, yPct: 0.18, wPct: 0.56, hPct: 0.22, zIndex: 200 },
  pants:     { xPct: 0.22, yPct: 0.42, wPct: 0.56, hPct: 0.30, zIndex: 300 },
  skirt:     { xPct: 0.22, yPct: 0.42, wPct: 0.56, hPct: 0.28, zIndex: 300 },
  coat:      { xPct: 0.20, yPct: 0.15, wPct: 0.60, hPct: 0.28, zIndex: 400 },
  shoes:     { xPct: 0.26, yPct: 0.74, wPct: 0.48, hPct: 0.12, zIndex: 500 },
  accessory: { xPct: 0.30, yPct: 0.25, wPct: 0.40, hPct: 0.15, zIndex: 600 },
}

/* ==================== Props & Emits ==================== */

const props = withDefaults(defineProps<{
  modelSrc: string
  clothes: Clothing[]
  interactive?: boolean
  canvasWidth?: number
  canvasHeight?: number
}>(), {
  interactive: false,
  canvasWidth: 375,
  canvasHeight: 500,
})

const emit = defineEmits<{
  update: [layers: ClothingLayer[]]
  export: [dataURL: string]
}>()

/* ==================== State ==================== */

const canvasId = `tryon_${Math.random().toString(36).slice(2, 8)}`

const instance = getCurrentInstance()
let ctx: ReturnType<typeof uni.createCanvasContext> | null = null

const modelDrawArea = ref<ModelDrawArea | null>(null)
const layers = ref<ClothingLayer[]>([])
const draggingState = ref<DragState | null>(null)
const renderScheduled = ref(false)
const initialized = ref(false)

/* ==================== Utility Functions ==================== */

/** Wrap uni.getImageInfo in a Promise */
function getImageInfo(src: string): Promise<{ width: number; height: number; path: string }> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Empty image source'))
      return
    }
    uni.getImageInfo({
      src,
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    })
  })
}

/** Compute the model draw area to fit within the canvas, centered */
function computeModelDrawArea(modelW: number, modelH: number): ModelDrawArea {
  const cw = props.canvasWidth
  const ch = props.canvasHeight
  const scale = Math.min(cw / modelW, ch / modelH)
  const drawW = modelW * scale
  const drawH = modelH * scale
  return {
    x: (cw - drawW) / 2,
    y: (ch - drawH) / 2,
    w: drawW,
    h: drawH,
  }
}

/** Compute initial position for a clothing item based on its type and model draw area */
function computeRegionForType(type: string): { x: number; y: number; w: number; h: number; zIndex: number } | null {
  const mapping = REGION_MAP[type]
  if (!mapping || !modelDrawArea.value) return null

  const area = modelDrawArea.value
  return {
    x: area.x + mapping.xPct * area.w,
    y: area.y + mapping.yPct * area.h,
    w: mapping.wPct * area.w,
    h: mapping.hPct * area.h,
    zIndex: mapping.zIndex,
  }
}

/** Get canvas-relative touch coordinates */
function getCanvasCoords(e: any): { x: number; y: number } {
  // uni-app mini-program format
  if (e.detail && e.detail.x !== undefined && e.detail.y !== undefined) {
    return { x: e.detail.x, y: e.detail.y }
  }

  // H5 DOM format
  let clientX = 0
  let clientY = 0
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX
    clientY = e.changedTouches[0].clientY
  }

  // Account for canvas element position
  try {
    const el = document.querySelector(`canvas[canvas-id="${canvasId}"]`)
    if (el) {
      const rect = el.getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    }
  } catch (_) {
    // DOM API not available (mini-program environment)
  }

  return { x: clientX, y: clientY }
}

/** Build layers array from the clothes prop using region mapping */
function buildLayersFromClothes(): void {
  if (!modelDrawArea.value) return

  const newLayers: ClothingLayer[] = []
  for (const clothing of props.clothes) {
    if (!clothing.photo) continue
    const region = computeRegionForType(clothing.type)
    if (!region) continue
    newLayers.push({
      id: clothing.id,
      clothing,
      x: region.x,
      y: region.y,
      w: region.w,
      h: region.h,
      zIndex: region.zIndex,
    })
  }
  layers.value = newLayers
}

/* ==================== Rendering Pipeline ==================== */

/** Execute the complete rendering pipeline. Returns a Promise that resolves when drawing is complete. */
function doRender(): Promise<void> {
  return new Promise((resolve) => {
    if (!ctx || !modelDrawArea.value) {
      resolve()
      return
    }

    const area = modelDrawArea.value

    // Layer 0: Clear canvas
    ctx.clearRect(0, 0, props.canvasWidth, props.canvasHeight)

    // Layer 1: Draw model image (scaled to fit, centered)
    ctx.drawImage(props.modelSrc, area.x, area.y, area.w, area.h)

    // Layers 2-7: Draw clothing items sorted by z-index
    const sorted = [...layers.value].sort((a, b) => a.zIndex - b.zIndex)
    for (const layer of sorted) {
      if (!layer.clothing.photo) continue
      ctx.drawImage(layer.clothing.photo, layer.x, layer.y, layer.w, layer.h)
    }

    // Execute draw commands (reserve=false clears previous frame)
    ctx.draw(false, () => {
      resolve()
    })
  })
}

/** Schedule a render on next tick, deduplicating rapid calls */
function scheduleRender(): void {
  if (renderScheduled.value) return
  renderScheduled.value = true
  nextTick(() => {
    renderScheduled.value = false
    doRender()
  })
}

/* ==================== Canvas Initialization ==================== */

async function initCanvas(): Promise<void> {
  if (!props.modelSrc) return

  ctx = uni.createCanvasContext(canvasId, instance?.proxy)

  try {
    const modelInfo = await getImageInfo(props.modelSrc)
    modelDrawArea.value = computeModelDrawArea(modelInfo.width, modelInfo.height)
  } catch (_) {
    // Model image failed to load — use a default draw area
    modelDrawArea.value = {
      x: 0,
      y: 0,
      w: props.canvasWidth,
      h: props.canvasHeight,
    }
  }

  buildLayersFromClothes()
  initialized.value = true
  await doRender()
}

/* ==================== Exposed Methods ==================== */

/** Add a clothing item to the canvas at its default region */
function addClothing(item: Clothing): void {
  if (!item.photo) return

  // Remove existing layer with same id if present
  layers.value = layers.value.filter((l) => l.id !== item.id)

  const region = computeRegionForType(item.type)
  if (!region) return

  const layer: ClothingLayer = {
    id: item.id,
    clothing: item,
    x: region.x,
    y: region.y,
    w: region.w,
    h: region.h,
    zIndex: region.zIndex,
  }

  layers.value.push(layer)
  scheduleRender()
}

/** Remove a clothing item by id */
function removeClothing(id: string): void {
  layers.value = layers.value.filter((l) => l.id !== id)
  scheduleRender()
}

/** Clear all clothing layers */
function reset(): void {
  layers.value = []
  scheduleRender()
}

/** Export canvas to image and emit @export event */
async function exportImage(): Promise<void> {
  // Ensure canvas is fully rendered first
  await doRender()

  // Small delay to let the canvas paint complete
  await new Promise((r) => setTimeout(r, 50))

  // Try H5 canvas toDataURL first
  try {
    const canvasEl = document.querySelector(
      `canvas[canvas-id="${canvasId}"]`
    ) as HTMLCanvasElement | null
    if (canvasEl && typeof canvasEl.toDataURL === 'function') {
      const dataURL = canvasEl.toDataURL('image/png')
      emit('export', dataURL)
      return
    }
  } catch (_) {
    // Fall through to uni API
  }

  // Fallback to uni.canvasToTempFilePath
  uni.canvasToTempFilePath(
    {
      canvasId,
      fileType: 'png',
      quality: 1,
      success: (res) => {
        emit('export', res.tempFilePath)
      },
      fail: () => {
        emit('export', '')
      },
    },
    instance?.proxy
  )
}

defineExpose({
  addClothing,
  removeClothing,
  reset,
  exportImage,
})

/* ==================== Touch Handlers (Interactive Mode) ==================== */

function onTouchStart(e: any): void {
  if (!props.interactive) return

  const coords = getCanvasCoords(e)
  if (!coords) return

  // Hit-test from top layer down
  const sorted = [...layers.value].sort((a, b) => b.zIndex - a.zIndex)
  for (const layer of sorted) {
    if (
      coords.x >= layer.x &&
      coords.x <= layer.x + layer.w &&
      coords.y >= layer.y &&
      coords.y <= layer.y + layer.h
    ) {
      draggingState.value = {
        layer,
        offsetX: coords.x - layer.x,
        offsetY: coords.y - layer.y,
      }
      // Bring dragged layer to top
      layer.zIndex = Math.max(...layers.value.map((l) => l.zIndex), 0) + 1
      scheduleRender()
      return
    }
  }

  draggingState.value = null
}

function onTouchMove(e: any): void {
  if (!props.interactive || !draggingState.value) return

  const coords = getCanvasCoords(e)
  if (!coords) return

  const state = draggingState.value
  state.layer.x = coords.x - state.offsetX
  state.layer.y = coords.y - state.offsetY

  scheduleRender()
}

function onTouchEnd(_e: any): void {
  if (!props.interactive) return

  if (draggingState.value) {
    emit('update', [...layers.value])
  }

  draggingState.value = null
}

/* ==================== Watchers ==================== */

// Static mode: rebuild layers when clothes prop changes
watch(
  () => props.clothes,
  () => {
    if (!props.interactive && initialized.value) {
      buildLayersFromClothes()
      scheduleRender()
    }
  },
  { deep: true }
)

// Reinitialize canvas when model image changes
watch(
  () => props.modelSrc,
  () => {
    if (initialized.value) {
      initCanvas()
    }
  }
)

/* ==================== Lifecycle ==================== */

onMounted(() => {
  nextTick(() => {
    initCanvas()
  })
})
</script>

<style lang="scss" scoped>
.tryon-canvas-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: $border-radius-md;
  background-color: $bg-gray;
}

.tryon-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
