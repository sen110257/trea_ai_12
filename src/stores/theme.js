import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { storage } from '@/utils/storage'

const THEME_KEY = 'theme'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(storage.get(THEME_KEY, false))

  watch(isDark, (newValue) => {
    storage.set(THEME_KEY, newValue)
    updateDocumentTheme(newValue)
  }, { immediate: true })

  function updateDocumentTheme(dark) {
    const html = document.documentElement
    if (dark) {
      html.classList.add('dark-theme')
    } else {
      html.classList.remove('dark-theme')
    }
  }

  function toggleTheme() {
    isDark.value = !isDark.value
  }

  function setDark() {
    isDark.value = true
  }

  function setLight() {
    isDark.value = false
  }

  return {
    isDark,
    toggleTheme,
    setDark,
    setLight
  }
})
