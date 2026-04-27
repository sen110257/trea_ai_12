<template>
  <div id="app" :class="{ 'dark-theme': isDark }">
    <router-view />
    <BottomNav />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from './stores/theme'
import BottomNav from './components/BottomNav.vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
</script>

<style>
#app {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
