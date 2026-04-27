<template>
  <div class="statistics page-container">
    <header class="page-header">
      <div class="header-content">
        <h1 class="header-title">数据统计</h1>
        <div class="header-actions">
          <button class="icon-btn" @click="toggleTheme" :title="isDark ? '切换浅色模式' : '切换暗黑模式'">
            {{ isDark ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>
    </header>

    <div class="budget-card card" :class="{ 'over-budget': isOverBudget }">
      <div class="budget-header">
        <div class="budget-title">
          <span class="budget-icon">🎯</span>
          <span>{{ currentMonth.format('YYYY年MM月') }}预算</span>
        </div>
        <button class="budget-edit" @click="showBudgetModal = true">
          设置
        </button>
      </div>
      <div class="budget-summary">
        <div class="budget-item">
          <span class="budget-label">已支出</span>
          <span class="budget-value expense">{{ formatAmount(monthExpense) }}</span>
        </div>
        <div class="budget-divider"></div>
        <div class="budget-item">
          <span class="budget-label">剩余预算</span>
          <span class="budget-value" :class="{ 'over-budget': isOverBudget }">
            {{ formatAmount(budgetRemaining) }}
          </span>
        </div>
      </div>
      <div class="budget-progress">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :class="{ 'over-budget': isOverBudget }"
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>
        <div class="progress-text">
          <span>{{ progressPercent }}%</span>
          <span>预算 ¥{{ monthlyBudget }}</span>
        </div>
      </div>
      <div class="budget-warning" v-if="isOverBudget">
        <span class="warning-icon">⚠️</span>
        <span>已超支 {{ formatAmount(Math.abs(budgetRemaining)) }}，注意控制消费哦~</span>
      </div>
    </div>

    <div class="card">
      <div class="chart-header">
        <div class="chart-tabs">
          <div 
            class="chart-tab" 
            :class="{ active: chartType === 'expense' }"
            @click="chartType = 'expense'"
          >
            支出占比
          </div>
          <div 
            class="chart-tab" 
            :class="{ active: chartType === 'income' }"
            @click="chartType = 'income'"
          >
            收入占比
          </div>
        </div>
      </div>
      <div class="chart-container" ref="pieChartRef"></div>
      <div class="chart-legend" v-if="currentStats.length > 0">
        <div 
          class="legend-item" 
          v-for="item in currentStats.slice(0, 6)" 
          :key="item.id"
        >
          <div class="legend-dot" :style="{ backgroundColor: item.color }"></div>
          <span class="legend-name">{{ item.name }}</span>
          <span class="legend-value">{{ formatAmount(item.amount) }}</span>
        </div>
      </div>
      <div class="empty-state" v-else>
        <div class="empty-icon">📊</div>
        <div class="empty-text">暂无{{ chartType === 'expense' ? '支出' : '收入' }}数据</div>
      </div>
    </div>

    <div class="card">
      <div class="chart-header">
        <h3 class="chart-title">月度收支趋势</h3>
        <select class="year-select" v-model="selectedYear" @change="updateChart">
          <option :value="year" v-for="year in availableYears" :key="year">
            {{ year }}年
          </option>
        </select>
      </div>
      <div class="chart-container line-chart" ref="lineChartRef"></div>
    </div>

    <div class="card">
      <div class="chart-header">
        <h3 class="chart-title">本月账单明细</h3>
      </div>
      <template v-if="monthBills.length > 0">
        <div 
          class="bill-item" 
          v-for="bill in monthBills.slice(0, 10)" 
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
        <div class="more-link" v-if="monthBills.length > 10">
          还有 {{ monthBills.length - 10 }} 条记录
        </div>
      </template>
      <div class="empty-state" v-else>
        <div class="empty-icon">📝</div>
        <div class="empty-text">本月暂无账单</div>
      </div>
    </div>

    <Transition name="fade">
      <div class="overlay" v-if="showBudgetModal" @click="showBudgetModal = false"></div>
    </Transition>
    
    <Transition name="slide-up">
      <div class="modal-container" v-if="showBudgetModal">
        <div class="modal-header">
          <h3 class="modal-title">设置每月预算</h3>
          <button class="modal-close" @click="showBudgetModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <label class="input-label">预算金额</label>
            <input 
              type="number" 
              class="input-field amount-input"
              v-model.number="budgetInput"
              placeholder="请输入预算金额"
              step="100"
              min="0"
            />
          </div>
          <div class="quick-budgets">
            <div 
              class="quick-budget" 
              v-for="amount in quickBudgetAmounts" 
              :key="amount"
              @click="budgetInput = amount"
            >
              ¥{{ amount.toLocaleString() }}
            </div>
          </div>
          <button class="btn btn-primary save-btn" @click="saveBudget">
            确认设置
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { useThemeStore } from '@/stores/theme'
import { useBillsStore } from '@/stores/bills'
import { getCategory } from '@/constants/categories'

const themeStore = useThemeStore()
const billsStore = useBillsStore()

const isDark = computed(() => themeStore.isDark)
const currentMonth = ref(dayjs())
const chartType = ref('expense')
const selectedYear = ref(dayjs().year())
const showBudgetModal = ref(false)
const budgetInput = ref(billsStore.monthlyBudget)

const pieChartRef = ref(null)
const lineChartRef = ref(null)
let pieChart = null
let lineChart = null

const monthlyBudget = computed(() => billsStore.monthlyBudget)
const monthExpense = computed(() => billsStore.thisMonthExpense)
const monthIncome = computed(() => billsStore.thisMonthIncome)
const budgetRemaining = computed(() => billsStore.monthlyBudgetRemaining)
const isOverBudget = computed(() => billsStore.isOverBudget)
const monthBills = computed(() => billsStore.thisMonthBills)

const progressPercent = computed(() => {
  return Math.round(billsStore.budgetPercentage)
})

const currentStats = computed(() => {
  return billsStore.getCategoryStats(chartType.value)
})

const availableYears = computed(() => {
  const years = []
  const currentYear = dayjs().year()
  for (let i = currentYear; i >= currentYear - 3; i--) {
    years.push(i)
  }
  return years
})

const quickBudgetAmounts = [3000, 5000, 8000, 10000, 15000, 20000]

function formatAmount(amount) {
  const num = Number(amount) || 0
  const formatted = num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return '¥' + formatted
}

function formatDate(date) {
  return dayjs(date).format('MM月DD日')
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

function saveBudget() {
  if (budgetInput.value && budgetInput.value >= 0) {
    billsStore.setMonthlyBudget(budgetInput.value)
    showBudgetModal.value = false
  }
}

function initPieChart() {
  if (!pieChartRef.value) return
  
  if (pieChart) {
    pieChart.dispose()
  }
  
  pieChart = echarts.init(pieChartRef.value, isDark.value ? 'dark' : null)
  
  const options = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: isDark.value ? '#1e293b' : '#ffffff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: currentStats.value.length > 0 
          ? currentStats.value.map(item => ({
              value: item.amount,
              name: item.name,
              itemStyle: { color: item.color }
            }))
          : [{ value: 1, name: '暂无数据', itemStyle: { color: '#94a3b8' } }]
      }
    ]
  }
  
  pieChart.setOption(options)
}

function initLineChart() {
  if (!lineChartRef.value) return
  
  if (lineChart) {
    lineChart.dispose()
  }
  
  lineChart = echarts.init(lineChartRef.value, isDark.value ? 'dark' : null)
  
  const monthlyData = billsStore.getMonthlyTrend(selectedYear.value)
  
  const options = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>'
        params.forEach(item => {
          result += `${item.marker} ${item.seriesName}: ¥${item.value.toFixed(2)}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['收入', '支出'],
      bottom: 0,
      textStyle: {
        color: isDark.value ? '#94a3b8' : '#64748b'
      }
    },
    grid: {
      left: 40,
      right: 20,
      top: 20,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: monthlyData.map(item => item.month),
      axisLine: {
        lineStyle: {
          color: isDark.value ? '#334155' : '#e2e8f0'
        }
      },
      axisLabel: {
        color: isDark.value ? '#94a3b8' : '#64748b',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: isDark.value ? '#334155' : '#e2e8f0'
        }
      },
      axisLine: {
        show: false
      },
      axisLabel: {
        color: isDark.value ? '#94a3b8' : '#64748b',
        formatter: (value) => {
          if (value >= 1000) {
            return (value / 1000) + 'k'
          }
          return value
        }
      }
    },
    series: [
      {
        name: '收入',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#10b981'
        },
        itemStyle: {
          color: '#10b981'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
          ])
        },
        data: monthlyData.map(item => item.income)
      },
      {
        name: '支出',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#ef4444'
        },
        itemStyle: {
          color: '#ef4444'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
          ])
        },
        data: monthlyData.map(item => item.expense)
      }
    ]
  }
  
  lineChart.setOption(options)
}

function updateChart() {
  nextTick(() => {
    initPieChart()
    initLineChart()
  })
}

watch([chartType, isDark], () => {
  updateChart()
})

watch(selectedYear, () => {
  initLineChart()
})

const handleResize = () => {
  if (pieChart) pieChart.resize()
  if (lineChart) lineChart.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  nextTick(() => {
    initPieChart()
    initLineChart()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (pieChart) pieChart.dispose()
  if (lineChart) lineChart.dispose()
})
</script>

<style scoped>
.statistics {
  padding-top: 16px;
}

.budget-card {
  background: linear-gradient(135deg, var(--primary-color) 0%, #8b5cf6 100%);
  color: #fff;
}

.budget-card.over-budget {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.budget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.budget-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.budget-icon {
  font-size: 18px;
}

.budget-edit {
  padding: 6px 14px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  color: #fff;
}

.budget-summary {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 16px;
}

.budget-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.budget-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.budget-value {
  font-size: 20px;
  font-weight: 600;
}

.budget-value.expense {
  opacity: 0.9;
}

.budget-value.over-budget {
  color: #fecaca;
}

.budget-divider {
  width: 1px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.2);
}

.budget-progress {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
}

.progress-bar {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #fff;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-fill.over-budget {
  background-color: #fecaca;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  opacity: 0.8;
}

.budget-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px;
  background-color: rgba(254, 243, 199, 0.2);
  border-radius: 8px;
  font-size: 13px;
}

.warning-icon {
  font-size: 16px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.chart-tabs {
  display: flex;
  gap: 8px;
  background-color: var(--bg-tertiary);
  border-radius: 12px;
  padding: 4px;
}

.chart-tab {
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 10px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.chart-tab.active {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.year-select {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.chart-container {
  height: 240px;
  margin-bottom: 12px;
}

.chart-container.line-chart {
  height: 280px;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-name {
  margin-right: 4px;
}

.legend-value {
  font-weight: 600;
  color: var(--text-primary);
}

.bill-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  min-height: 60px;
}

.bill-item:last-child {
  border-bottom: none;
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
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
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
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-date {
  font-size: 12px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-amount {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  flex-shrink: 0;
  margin-left: 12px;
}

.bill-amount.expense {
  color: var(--danger-color);
}

.bill-amount.income {
  color: var(--success-color);
}

.more-link {
  text-align: center;
  padding-top: 12px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.amount-input {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.quick-budgets {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.quick-budget {
  padding: 10px 16px;
  background-color: var(--bg-tertiary);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.quick-budget:active {
  transform: scale(0.95);
  background-color: var(--primary-color);
  color: #fff;
}

.save-btn {
  width: 100%;
  margin-top: 20px;
}
</style>
