<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useWardrobeStore } from '@/store/wardrobe'
import { useSocialStore } from '@/store/social'

onLaunch(() => {
  console.log('App Launch')
  
  const wardrobeStore = useWardrobeStore()
  wardrobeStore.loadClothes()
  wardrobeStore.loadCategories()
  
  const socialStore = useSocialStore()
  socialStore.loadData()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@import './styles/index.scss';
</style>