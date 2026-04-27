<template>
  <nav class="bottom-nav">
    <div 
      class="nav-item" 
      :class="{ active: currentRoute === '/account' }"
      @click="navigate('/account')"
    >
      <span class="nav-icon">📝</span>
      <span class="nav-label">记账</span>
    </div>
    <div 
      class="nav-item" 
      :class="{ active: currentRoute === '/statistics' }"
      @click="navigate('/statistics')"
    >
      <span class="nav-icon">📊</span>
      <span class="nav-label">统计</span>
    </div>
    <div 
      class="nav-item" 
      :class="{ active: currentRoute === '/memo' }"
      @click="navigate('/memo')"
    >
      <span class="nav-icon">📋</span>
      <span class="nav-label">备忘录</span>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => route.path)

function navigate(path) {
  if (route.path !== path) {
    router.push(path)
  }
}
</script>
