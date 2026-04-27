const STORAGE_PREFIX = 'account_book_'

export const storage = {
  set(key, value) {
    try {
      const storageKey = STORAGE_PREFIX + key
      const storageValue = JSON.stringify({
        value,
        timestamp: Date.now()
      })
      localStorage.setItem(storageKey, storageValue)
      return true
    } catch (error) {
      console.error('Storage set error:', error)
      return false
    }
  },

  get(key, defaultValue = null) {
    try {
      const storageKey = STORAGE_PREFIX + key
      const storageValue = localStorage.getItem(storageKey)
      if (!storageValue) return defaultValue
      const parsed = JSON.parse(storageValue)
      return parsed.value
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  },

  remove(key) {
    try {
      const storageKey = STORAGE_PREFIX + key
      localStorage.removeItem(storageKey)
      return true
    } catch (error) {
      console.error('Storage remove error:', error)
      return false
    }
  },

  clear() {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
      return true
    } catch (error) {
      console.error('Storage clear error:', error)
      return false
    }
  }
}

export default storage
