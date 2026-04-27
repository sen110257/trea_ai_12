<template>
  <div class="account-book page-container">
    <header class="page-header">
      <div class="header-content">
        <h1 class="header-title">记账</h1>
        <div class="header-actions">
          <button class="icon-btn" @click="toggleTheme" :title="isDark ? '切换浅色模式' : '切换暗黑模式'">
            {{ isDark ? '☀️' : '🌙' }}
          </button>
          <button class="icon-btn" @click="showSearch = true" title="搜索账单">
            🔍
          </button>
        </div>
      </div>
    </header>

    <div class="summary-card card">
      <div class="summary-tabs">
        <div 
          class="summary-tab" 
          :class="{ active: summaryType === 'today' }"
          @click="summaryType = 'today'"
        >
          今日
        </div>
        <div 
          class="summary-tab" 
          :class="{ active: summaryType === 'week' }"
          @click="summaryType = 'week'"
        >
          本周
        </div>
        <div 
          class="summary-tab" 
          :class="{ active: summaryType === 'month' }"
          @click="summaryType = 'month'"
        >
          本月
        </div>
      </div>
      <div class="summary-data">
        <div class="summary-item">
          <span class="summary-label">收入</span>
          <span class="summary-value income">{{ formatAmount(currentSummary.income) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">支出</span>
          <span class="summary-value expense">{{ formatAmount(currentSummary.expense) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">结余</span>
          <span class="summary-value" :class="{ 'income': currentSummary.balance >= 0, 'expense': currentSummary.balance < 0 }">
            {{ formatAmount(currentSummary.balance) }}
          </span>
        </div>
      </div>
    </div>

    <div class="card">
      <Calendar 
        :selected-date="selectedDate" 
        @select="onDateSelect"
      />
    </div>

    <div class="bills-list-section">
      <div class="section-header">
        <span class="section-title">{{ formatDate(selectedDate) }} 账单</span>
        <button class="add-btn" @click="openAddModal">
          <span class="add-icon">+</span>
          <span>记一笔</span>
        </button>
      </div>
      <div class="card bills-card">
        <template v-if="currentDateBills.length > 0">
          <div 
            class="bill-item" 
            v-for="bill in currentDateBills" 
            :key="bill.id"
            @click="openEditModal(bill)"
          >
            <div class="bill-left">
              <div class="bill-icon" :style="{ backgroundColor: getCategoryColor(bill.type, bill.category) }">
                {{ getCategoryIcon(bill.type, bill.category) }}
              </div>
              <div class="bill-info">
                <div class="bill-category">{{ getCategoryName(bill.type, bill.category) }}</div>
                <div class="bill-remark" v-if="bill.remark">{{ bill.remark }}</div>
              </div>
            </div>
            <div class="bill-right">
              <span class="bill-amount" :class="bill.type">
                {{ bill.type === 'income' ? '+' : '-' }}{{ formatAmount(bill.amount) }}
              </span>
            </div>
          </div>
        </template>
        <div class="empty-state" v-else>
          <div class="empty-icon">📝</div>
          <div class="empty-text">暂无账单记录</div>
          <button class="empty-add-btn" @click="openAddModal">点击记一笔</button>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div class="overlay" v-if="showAddModal || showEditModal" @click="closeModal"></div>
    </Transition>
    
    <Transition name="slide-up">
      <div class="modal-container" v-if="showAddModal || showEditModal">
        <div class="modal-header">
          <h3 class="modal-title">{{ showEditModal ? '编辑账单' : '记一笔' }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="type-tabs">
            <div 
              class="type-tab" 
              :class="{ active: formData.type === 'expense' }"
              @click="formData.type = 'expense'; formData.category = 'food'"
            >
              支出
            </div>
            <div 
              class="type-tab" 
              :class="{ active: formData.type === 'income' }"
              @click="formData.type = 'income'; formData.category = 'salary'"
            >
              收入
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">金额</label>
            <input 
              type="number" 
              class="input-field amount-input"
              v-model.number="formData.amount"
              placeholder="请输入金额"
              step="0.01"
              min="0"
            />
          </div>

          <div class="input-group">
            <label class="input-label">分类</label>
            <div class="category-grid">
              <div 
                class="category-item" 
                v-for="cat in currentCategories" 
                :key="cat.id"
                :class="{ active: formData.category === cat.id }"
                @click="formData.category = cat.id"
              >
                <div class="category-icon" :style="{ backgroundColor: cat.color + '20', color: cat.color }">
                  {{ cat.icon }}
                </div>
                <span class="category-name">{{ cat.name }}</span>
              </div>
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">日期</label>
            <input 
              type="date" 
              class="input-field"
              v-model="formData.date"
            />
          </div>

          <div class="input-group">
            <label class="input-label">备注</label>
            <textarea 
              class="input-field"
              v-model="formData.remark"
              placeholder="添加备注（可选）"
              rows="2"
            ></textarea>
          </div>

          <button class="btn btn-primary save-btn" @click="saveBill" :disabled="!canSave">
            {{ showEditModal ? '保存修改' : '保存' }}
          </button>

          <button class="btn btn-ghost delete-btn" v-if="showEditModal" @click="confirmDelete">
            删除账单
          </button>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div class="overlay" v-if="showSearch" @click="showSearch = false"></div>
    </Transition>
    
    <Transition name="slide-up">
      <div class="modal-container search-modal" v-if="showSearch">
        <div class="modal-header">
          <h3 class="modal-title">搜索账单</h3>
          <button class="modal-close" @click="showSearch = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <input 
              type="text" 
              class="input-field"
              v-model="searchKeyword"
              placeholder="搜索金额、分类、备注..."
              @input="doSearch"
            />
          </div>

          <div class="filter-group">
            <div class="filter-row">
              <span class="filter-label">类型:</span>
              <div class="filter-options">
                <div 
                  class="filter-option" 
                  :class="{ active: searchFilters.type === 'all' }"
                  @click="searchFilters.type = 'all'; doSearch()"
                >全部</div>
                <div 
                  class="filter-option" 
                  :class="{ active: searchFilters.type === 'expense' }"
                  @click="searchFilters.type = 'expense'; doSearch()"
                >支出</div>
                <div 
                  class="filter-option" 
                  :class="{ active: searchFilters.type === 'income' }"
                  @click="searchFilters.type = 'income'; doSearch()"
                >收入</div>
              </div>
            </div>

            <div class="filter-row">
              <span class="filter-label">月份:</span>
              <select class="filter-select" v-model="searchFilters.month" @change="doSearch">
                <option value="">全部月份</option>
                <option :value="month.value" v-for="month in monthOptions" :key="month.value">
                  {{ month.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="search-results">
            <template v-if="searchResults.length > 0">
              <div 
                class="bill-item search-result-item" 
                v-for="bill in searchResults" 
                :key="bill.id"
              >
                <div class="bill-left">
                  <div class="bill-icon" :style="{ backgroundColor: getCategoryColor(bill.type, bill.category) }">
                    {{ getCategoryIcon(bill.type, bill.category) }}
                  </div>
                  <div class="bill-info">
                    <div class="bill-category">{{ getCategoryName(bill.type, bill.category) }}</div>
                    <div class="bill-date">{{ formatDate(bill.date) }}</div>
                  </div>
                </div>
                <div class="bill-right">
                  <span class="bill-amount" :class="bill.type">
                    {{ bill.type === 'income' ? '+' : '-' }}{{ formatAmount(bill.amount) }}
                  </span>
                </div>
              </div>
            </template>
            <div class="empty-state" v-else>
              <div class="empty-icon">🔍</div>
              <div class="empty-text">{{ searchKeyword ? '未找到匹配的账单' : '输入关键词搜索' }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { useThemeStore } from '@/stores/theme'
import { useBillsStore } from '@/stores/bills'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategory } from '@/constants/categories'
import Calendar from '@/components/Calendar.vue'

const themeStore = useThemeStore()
const billsStore = useBillsStore()

const isDark = computed(() => themeStore.isDark)
const summaryType = ref('today')
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const showAddModal = ref(false)
const showEditModal = ref(false)
const showSearch = ref(false)
const searchKeyword = ref('')
const searchFilters = ref({
  type: 'all',
  category: 'all',
  month: ''
})
const searchResults = ref([])
const editingBill = ref(null)

const formData = ref({
  type: 'expense',
  amount: null,
  category: 'food',
  date: dayjs().format('YYYY-MM-DD'),
  remark: ''
})

const monthOptions = computed(() => {
  const options = []
  for (let i = 0; i < 12; i++) {
    const month = dayjs().month(i)
    options.push({
      value: month.format('YYYY-MM'),
      label: month.format('YYYY年MM月')
    })
  }
  return options
})

const currentCategories = computed(() => {
  return formData.value.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
})

const currentDateBills = computed(() => {
  return billsStore.getBillsByDate(selectedDate.value)
})

const currentSummary = computed(() => {
  switch (summaryType.value) {
    case 'today':
      return {
        income: billsStore.todayIncome,
        expense: billsStore.todayExpense,
        balance: billsStore.todayBalance
      }
    case 'week':
      return {
        income: billsStore.thisWeekIncome,
        expense: billsStore.thisWeekExpense,
        balance: billsStore.thisWeekBalance
      }
    case 'month':
      return {
        income: billsStore.thisMonthIncome,
        expense: billsStore.thisMonthExpense,
        balance: billsStore.thisMonthBalance
      }
    default:
      return { income: 0, expense: 0, balance: 0 }
  }
})

const canSave = computed(() => {
  return formData.value.amount && formData.value.amount > 0 && formData.value.category
})

function formatAmount(amount) {
  const num = Number(amount) || 0
  const formatted = num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return '¥' + formatted
}

function formatDate(date) {
  const d = dayjs(date)
  const today = dayjs()
  const yesterday = dayjs().subtract(1, 'day')
  
  if (d.isSame(today, 'day')) {
    return '今天'
  } else if (d.isSame(yesterday, 'day')) {
    return '昨天'
  }
  return d.format('MM月DD日')
}

function getCategoryIcon(type, id) {
  return getCategory(type, id).icon
}

function getCategoryName(type, id) {
  return getCategory(type, id).name
}

function getCategoryColor(type, id) {
  return getCategory(type, id).color
}

function toggleTheme() {
  themeStore.toggleTheme()
}

function onDateSelect(date) {
  selectedDate.value = date
}

function openAddModal() {
  showAddModal.value = true
  editingBill.value = null
  formData.value = {
    type: 'expense',
    amount: null,
    category: 'food',
    date: selectedDate.value,
    remark: ''
  }
}

function openEditModal(bill) {
  showEditModal.value = true
  editingBill.value = bill
  formData.value = {
    type: bill.type,
    amount: bill.amount,
    category: bill.category,
    date: bill.date,
    remark: bill.remark || ''
  }
}

function closeModal() {
  showAddModal.value = false
  showEditModal.value = false
  editingBill.value = null
}

function saveBill() {
  if (!canSave.value) return

  if (showEditModal.value && editingBill.value) {
    billsStore.updateBill(editingBill.value.id, formData.value)
  } else {
    billsStore.addBill(formData.value)
  }
  closeModal()
}

function confirmDelete() {
  if (editingBill.value) {
    if (window.confirm('确定要删除这条账单吗？')) {
      billsStore.deleteBill(editingBill.value.id)
      closeModal()
    }
  }
}

function doSearch() {
  searchResults.value = billsStore.searchBills(searchKeyword.value, searchFilters.value)
}

onMounted(() => {
  selectedDate.value = dayjs().format('YYYY-MM-DD')
})
</script>

<style scoped>
.account-book {
  padding-top: 16px;
}

.summary-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.summary-tabs::-webkit-scrollbar {
  display: none;
}

.summary-tab {
  flex-shrink: 0;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
  background-color: var(--bg-tertiary);
  transition: all 0.2s ease;
}

.summary-tab.active {
  color: #fff;
  background-color: var(--primary-color);
}

.summary-tab:active {
  transform: scale(0.95);
}

.summary-data {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.summary-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  white-space: nowrap;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.summary-value.income {
  color: var(--success-color);
}

.summary-value.expense {
  color: var(--danger-color);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 12px;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: #fff;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  flex-shrink: 0;
}

.add-btn:active {
  transform: scale(0.95);
}

.add-icon {
  font-size: 18px;
  font-weight: 300;
}

.bills-card {
  padding: 0 20px;
}

.bill-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  min-height: 72px;
}

.bill-item:last-child {
  border-bottom: none;
}

.bill-item:active {
  opacity: 0.7;
  background-color: var(--bg-tertiary);
  margin: 0 -20px;
  padding-left: 20px;
  padding-right: 20px;
}

.bill-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.bill-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.bill-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  overflow: hidden;
  flex: 1;
}

.bill-category {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-remark {
  font-size: 13px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.bill-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-left: 12px;
}

.bill-amount {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.bill-amount.expense {
  color: var(--danger-color);
}

.bill-amount.income {
  color: var(--success-color);
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

.type-tabs {
  display: flex;
  margin-bottom: 20px;
  background-color: var(--bg-tertiary);
  border-radius: 12px;
  padding: 4px;
}

.type-tab {
  flex: 1;
  text-align: center;
  padding: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.type-tab.active {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.amount-input {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.category-item {
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

.category-item.active {
  border-color: var(--primary-color);
  background-color: var(--bg-tertiary);
}

.category-item:active {
  transform: scale(0.95);
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.category-name {
  font-size: 12px;
  color: var(--text-secondary);
}

.category-item.active .category-name {
  color: var(--text-primary);
  font-weight: 500;
}

.save-btn {
  width: 100%;
  margin-top: 20px;
  font-size: 16px;
}

.delete-btn {
  width: 100%;
  margin-top: 12px;
  color: var(--danger-color);
}

.filter-group {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  color: var(--text-secondary);
  min-width: 40px;
}

.filter-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-option {
  padding: 6px 14px;
  background-color: var(--bg-tertiary);
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.filter-option.active {
  background-color: var(--primary-color);
  color: #fff;
}

.filter-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.search-result-item {
  border-bottom: 1px solid var(--border-color);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-modal {
  max-height: 80vh;
}
</style>
