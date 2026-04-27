import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { storage } from '@/utils/storage'
import { getMemoCategory } from '@/constants/categories'

const MEMOS_KEY = 'memos'

export const useMemosStore = defineStore('memos', () => {
  const memos = ref(storage.get(MEMOS_KEY, []))

  watch(memos, (newMemos) => {
    storage.set(MEMOS_KEY, newMemos)
  }, { deep: true })

  const sortedMemos = computed(() => {
    return [...memos.value].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return dayjs(b.updatedAt || b.createdAt).valueOf() - 
             dayjs(a.updatedAt || a.createdAt).valueOf()
    })
  })

  function addMemo(memoData) {
    const newMemo = {
      id: Date.now().toString(),
      title: memoData.title || '',
      content: memoData.content || '',
      category: memoData.category || 'personal',
      isPinned: memoData.isPinned || false,
      createdAt: dayjs().toISOString(),
      updatedAt: null
    }
    memos.value.push(newMemo)
    return newMemo
  }

  function updateMemo(id, updates) {
    const index = memos.value.findIndex(memo => memo.id === id)
    if (index !== -1) {
      memos.value[index] = {
        ...memos.value[index],
        ...updates,
        updatedAt: dayjs().toISOString()
      }
    }
  }

  function deleteMemo(id) {
    const index = memos.value.findIndex(memo => memo.id === id)
    if (index !== -1) {
      memos.value.splice(index, 1)
    }
  }

  function togglePin(id) {
    const memo = memos.value.find(m => m.id === id)
    if (memo) {
      memo.isPinned = !memo.isPinned
      memo.updatedAt = dayjs().toISOString()
    }
  }

  function getMemoById(id) {
    return memos.value.find(memo => memo.id === id)
  }

  function getMemosByCategory(categoryId) {
    if (categoryId === 'all') {
      return sortedMemos.value
    }
    return sortedMemos.value.filter(memo => memo.category === categoryId)
  }

  function searchMemos(keyword, category = 'all') {
    let results = [...memos.value]
    
    if (category && category !== 'all') {
      results = results.filter(memo => memo.category === category)
    }

    if (keyword && keyword.trim()) {
      const kw = keyword.toLowerCase().trim()
      results = results.filter(memo => {
        const catInfo = getMemoCategory(memo.category)
        return (
          (memo.title && memo.title.toLowerCase().includes(kw)) ||
          (memo.content && memo.content.toLowerCase().includes(kw)) ||
          catInfo.name.toLowerCase().includes(kw)
        )
      })
    }

    return results.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return dayjs(b.updatedAt || b.createdAt).valueOf() - 
             dayjs(a.updatedAt || a.createdAt).valueOf()
    })
  }

  return {
    memos,
    sortedMemos,
    addMemo,
    updateMemo,
    deleteMemo,
    togglePin,
    getMemoById,
    getMemosByCategory,
    searchMemos
  }
})
