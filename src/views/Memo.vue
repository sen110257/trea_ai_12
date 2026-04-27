<template>
  <div class="memo page-container">
    <header class="page-header">
      <div class="header-content">
        <h1 class="header-title">备忘录</h1>
        <div class="header-actions">
          <button class="icon-btn" @click="toggleTheme" :title="isDark ? '切换浅色模式' : '切换暗黑模式'">
            {{ isDark ? '☀️' : '🌙' }}
          </button>
          <button class="icon-btn add-btn" @click="openAddModal" title="新建备忘录">
            ✏️
          </button>
        </div>
      </div>
    </header>

    <div class="search-section card">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索备忘录..."
          @input="doSearch"
        />
        <button class="search-clear" v-if="searchKeyword" @click="clearSearch">
          &times;
        </button>
      </div>
    </div>

    <div class="category-section">
      <div class="category-list">
        <div 
          class="category-chip" 
          :class="{ active: selectedCategory === 'all' }"
          @click="selectCategory('all')"
        >
          全部
        </div>
        <div 
          class="category-chip" 
          v-for="cat in memoCategories" 
          :key="cat.id"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectCategory(cat.id)"
        >
          <span class="chip-icon">{{ cat.icon }}</span>
          <span class="chip-name">{{ cat.name }}</span>
        </div>
      </div>
    </div>

    <div class="memo-list-section">
      <template v-if="filteredMemos.length > 0">
        <TransitionGroup name="memo-list">
          <div 
            class="memo-card card" 
            v-for="memo in filteredMemos" 
            :key="memo.id"
            :class="{ 'is-pinned': memo.isPinned }"
            @click="openEditModal(memo)"
          >
            <div class="memo-header">
              <div class="memo-category-tag" :style="{ backgroundColor: getCategoryColor(memo.category) + '20', color: getCategoryColor(memo.category) }">
                <span class="tag-icon">{{ getCategoryIcon(memo.category) }}</span>
                <span>{{ getCategoryName(memo.category) }}</span>
              </div>
              <div class="memo-actions" @click.stop>
                <button 
                  class="memo-action-btn pin-btn" 
                  :class="{ active: memo.isPinned }"
                  @click="toggleMemoPin(memo)"
                  :title="memo.isPinned ? '取消置顶' : '置顶'"
                >
                  📌
                </button>
                <button 
                  class="memo-action-btn delete-btn"
                  @click="confirmDelete(memo)"
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
            <div class="memo-content">
              <h3 class="memo-title" v-if="memo.title">{{ memo.title }}</h3>
              <p class="memo-text" :class="{ 'no-title': !memo.title }">{{ memo.content || '暂无内容' }}</p>
            </div>
            <div class="memo-footer">
              <span class="memo-time">{{ formatTime(memo.updatedAt || memo.createdAt) }}</span>
              <span class="memo-pin-badge" v-if="memo.isPinned">已置顶</span>
            </div>
          </div>
        </TransitionGroup>
      </template>
      <div class="empty-state" v-else>
        <div class="empty-icon">📋</div>
        <div class="empty-text">{{ searchKeyword ? '未找到匹配的备忘录' : '暂无备忘录' }}</div>
        <button class="empty-add-btn" @click="openAddModal" v-if="!searchKeyword">
          点击添加第一条
        </button>
      </div>
    </div>

    <Transition name="fade">
      <div class="overlay" v-if="showAddModal || showEditModal" @click="closeModal"></div>
    </Transition>
    
    <Transition name="slide-up">
      <div class="modal-container memo-modal" v-if="showAddModal || showEditModal">
        <div class="modal-header">
          <h3 class="modal-title">{{ showEditModal ? '编辑备忘录' : '新建备忘录' }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <input 
              type="text" 
              class="input-field"
              v-model="formData.title"
              placeholder="标题（可选）"
              maxlength="50"
            />
          </div>

          <div class="input-group">
            <textarea 
              class="input-field memo-textarea"
              v-model="formData.content"
              placeholder="输入内容..."
              rows="8"
            ></textarea>
          </div>

          <div class="input-group">
            <label class="input-label">分类</label>
            <div class="category-selector">
              <div 
                class="category-option" 
                v-for="cat in memoCategories" 
                :key="cat.id"
                :class="{ active: formData.category === cat.id }"
                @click="formData.category = cat.id"
              >
                <span class="option-icon" :style="{ backgroundColor: cat.color + '20', color: cat.color }">
                  {{ cat.icon }}
                </span>
                <span class="option-name">{{ cat.name }}</span>
              </div>
            </div>
          </div>

          <div class="input-group" v-if="showEditModal">
            <div class="pin-option" @click="formData.isPinned = !formData.isPinned">
              <div class="pin-checkbox" :class="{ active: formData.isPinned }">
                {{ formData.isPinned ? '✓' : '' }}
              </div>
              <span class="pin-label">置顶显示</span>
            </div>
          </div>

          <button class="btn btn-primary save-btn" @click="saveMemo" :disabled="!canSave">
            {{ showEditModal ? '保存修改' : '保存' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { useThemeStore } from '@/stores/theme'
import { useMemosStore } from '@/stores/memos'
import { MEMO_CATEGORIES, getMemoCategory } from '@/constants/categories'

const themeStore = useThemeStore()
const memosStore = useMemosStore()

const isDark = computed(() => themeStore.isDark)
const memoCategories = MEMO_CATEGORIES

const searchKeyword = ref('')
const selectedCategory = ref('all')
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingMemo = ref(null)

const formData = ref({
  title: '',
  content: '',
  category: 'personal',
  isPinned: false
})

const filteredMemos = computed(() => {
  if (searchKeyword.value.trim()) {
    return memosStore.searchMemos(searchKeyword.value, selectedCategory.value)
  }
  return memosStore.getMemosByCategory(selectedCategory.value)
})

const canSave = computed(() => {
  return formData.value.title?.trim() || formData.value.content?.trim()
})

function formatTime(time) {
  const d = dayjs(time)
  const now = dayjs()
  const today = dayjs().startOf('day')
  const yesterday = dayjs().subtract(1, 'day').startOf('day')
  
  if (d.isSame(now, 'minute')) {
    return '刚刚'
  } else if (d.isSame(now, 'hour')) {
    return `${now.diff(d, 'minute')}分钟前`
  } else if (d.isAfter(today)) {
    return d.format('HH:mm')
  } else if (d.isAfter(yesterday)) {
    return '昨天 ' + d.format('HH:mm')
  } else if (d.isSame(now, 'year')) {
    return d.format('MM月DD日 HH:mm')
  }
  return d.format('YYYY年MM月DD日')
}

function getCategoryIcon(id) {
  return getMemoCategory(id).icon
}

function getCategoryName(id) {
  return getMemoCategory(id).name
}

function getCategoryColor(id) {
  return getMemoCategory(id).color
}

function toggleTheme() {
  themeStore.toggleTheme()
}

function selectCategory(categoryId) {
  selectedCategory.value = categoryId
}

function clearSearch() {
  searchKeyword.value = ''
}

function doSearch() {
  // 搜索逻辑在 computed 中自动处理
}

function openAddModal() {
  showAddModal.value = true
  editingMemo.value = null
  formData.value = {
    title: '',
    content: '',
    category: 'personal',
    isPinned: false
  }
}

function openEditModal(memo) {
  showEditModal.value = true
  editingMemo.value = memo
  formData.value = {
    title: memo.title || '',
    content: memo.content || '',
    category: memo.category,
    isPinned: memo.isPinned
  }
}

function closeModal() {
  showAddModal.value = false
  showEditModal.value = false
  editingMemo.value = null
}

function saveMemo() {
  if (!canSave.value) return

  if (showEditModal.value && editingMemo.value) {
    memosStore.updateMemo(editingMemo.value.id, formData.value)
  } else {
    memosStore.addMemo(formData.value)
  }
  closeModal()
}

function toggleMemoPin(memo) {
  memosStore.togglePin(memo.id)
}

function confirmDelete(memo) {
  if (window.confirm('确定要删除这条备忘录吗？')) {
    memosStore.deleteMemo(memo.id)
  }
}

onMounted(() => {
  // 初始化时确保数据加载
})
</script>

<style scoped>
.memo {
  padding-top: 16px;
}

.search-section {
  margin-bottom: 16px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  font-size: 16px;
  opacity: 0.5;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 15px;
  color: var(--text-primary);
  background-color: var(--bg-tertiary);
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--primary-color);
  background-color: var(--bg-secondary);
}

.search-clear {
  position: absolute;
  right: 16px;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  font-size: 20px;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-section {
  margin-bottom: 16px;
}

.category-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 20px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.category-list::-webkit-scrollbar {
  display: none;
}

.category-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background-color: var(--bg-secondary);
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.category-chip:active {
  transform: scale(0.95);
}

.category-chip.active {
  background-color: var(--primary-color);
  color: #fff;
}

.chip-icon {
  font-size: 14px;
}

.memo-list-section {
  padding-bottom: 20px;
}

.memo-card {
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.memo-card:active {
  transform: scale(0.98);
}

.memo-card.is-pinned {
  border-left: 3px solid var(--warning-color);
}

.memo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.memo-category-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tag-icon {
  font-size: 12px;
}

.memo-actions {
  display: flex;
  gap: 4px;
}

.memo-action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.memo-action-btn:hover,
.memo-action-btn:active {
  opacity: 1;
  background-color: var(--bg-tertiary);
}

.memo-action-btn.pin-btn.active {
  opacity: 1;
}

.memo-content {
  margin-bottom: 12px;
}

.memo-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  line-height: 1.4;
}

.memo-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.memo-text.no-title {
  color: var(--text-primary);
  font-weight: 500;
}

.memo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.memo-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.memo-pin-badge {
  font-size: 11px;
  padding: 2px 8px;
  background-color: var(--warning-color) + '20';
  color: var(--warning-color);
  border-radius: 10px;
  font-weight: 500;
}

.empty-add-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background-color: var(--primary-color);
  color: #fff;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.memo-modal {
  max-height: 90vh;
}

.memo-textarea {
  min-height: 160px;
  resize: none;
  line-height: 1.6;
}

.category-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.category-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.category-option:active {
  transform: scale(0.95);
}

.category-option.active {
  border-color: var(--primary-color);
  background-color: var(--bg-tertiary);
}

.option-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.option-name {
  font-size: 12px;
  color: var(--text-secondary);
}

.category-option.active .option-name {
  color: var(--text-primary);
  font-weight: 500;
}

.pin-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: var(--bg-tertiary);
  border-radius: 12px;
  cursor: pointer;
}

.pin-checkbox {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: transparent;
  transition: all 0.2s ease;
}

.pin-checkbox.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: #fff;
}

.pin-label {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.save-btn {
  width: 100%;
  margin-top: 20px;
}

.memo-list-enter-active,
.memo-list-leave-active {
  transition: all 0.3s ease;
}

.memo-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.memo-list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
