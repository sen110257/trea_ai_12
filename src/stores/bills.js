import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { storage } from '@/utils/storage'
import { getCategory } from '@/constants/categories'

const BILLS_KEY = 'bills'
const BUDGET_KEY = 'monthly_budget'

export const useBillsStore = defineStore('bills', () => {
  const bills = ref(storage.get(BILLS_KEY, []))
  const monthlyBudget = ref(storage.get(BUDGET_KEY, 5000))

  watch(bills, (newBills) => {
    storage.set(BILLS_KEY, newBills)
  }, { deep: true })

  watch(monthlyBudget, (newBudget) => {
    storage.set(BUDGET_KEY, newBudget)
  })

  const sortedBills = computed(() => {
    return [...bills.value].sort((a, b) => {
      return dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    })
  })

  const today = computed(() => dayjs().format('YYYY-MM-DD'))
  const thisWeekStart = computed(() => dayjs().startOf('week').format('YYYY-MM-DD'))
  const thisMonthStart = computed(() => dayjs().startOf('month').format('YYYY-MM-DD'))
  const thisMonthEnd = computed(() => dayjs().endOf('month').format('YYYY-MM-DD'))

  function getBillsByDateRange(startDate, endDate) {
    return bills.value.filter(bill => {
      const billDate = dayjs(bill.date)
      return billDate.isAfter(dayjs(startDate).subtract(1, 'day')) &&
             billDate.isBefore(dayjs(endDate).add(1, 'day'))
    })
  }

  function getBillsByDate(date) {
    return bills.value.filter(bill => bill.date === date)
  }

  const todayBills = computed(() => getBillsByDate(today.value))

  const todayIncome = computed(() => {
    return todayBills.value
      .filter(bill => bill.type === 'income')
      .reduce((sum, bill) => sum + bill.amount, 0)
  })

  const todayExpense = computed(() => {
    return todayBills.value
      .filter(bill => bill.type === 'expense')
      .reduce((sum, bill) => sum + bill.amount, 0)
  })

  const todayBalance = computed(() => todayIncome.value - todayExpense.value)

  const thisWeekBills = computed(() => getBillsByDateRange(thisWeekStart.value, today.value))

  const thisWeekIncome = computed(() => {
    return thisWeekBills.value
      .filter(bill => bill.type === 'income')
      .reduce((sum, bill) => sum + bill.amount, 0)
  })

  const thisWeekExpense = computed(() => {
    return thisWeekBills.value
      .filter(bill => bill.type === 'expense')
      .reduce((sum, bill) => sum + bill.amount, 0)
  })

  const thisWeekBalance = computed(() => thisWeekIncome.value - thisWeekExpense.value)

  const thisMonthBills = computed(() => getBillsByDateRange(thisMonthStart.value, thisMonthEnd.value))

  const thisMonthIncome = computed(() => {
    return thisMonthBills.value
      .filter(bill => bill.type === 'income')
      .reduce((sum, bill) => sum + bill.amount, 0)
  })

  const thisMonthExpense = computed(() => {
    return thisMonthBills.value
      .filter(bill => bill.type === 'expense')
      .reduce((sum, bill) => sum + bill.amount, 0)
  })

  const thisMonthBalance = computed(() => thisMonthIncome.value - thisMonthExpense.value)

  const monthlyBudgetRemaining = computed(() => {
    return monthlyBudget.value - thisMonthExpense.value
  })

  const isOverBudget = computed(() => monthlyBudgetRemaining.value < 0)

  const budgetPercentage = computed(() => {
    if (monthlyBudget.value <= 0) return 0
    return Math.min((thisMonthExpense.value / monthlyBudget.value) * 100, 100)
  })

  function addBill(billData) {
    const newBill = {
      id: Date.now().toString(),
      ...billData,
      createdAt: dayjs().toISOString()
    }
    bills.value.push(newBill)
    return newBill
  }

  function updateBill(id, updates) {
    const index = bills.value.findIndex(bill => bill.id === id)
    if (index !== -1) {
      bills.value[index] = {
        ...bills.value[index],
        ...updates,
        updatedAt: dayjs().toISOString()
      }
    }
  }

  function deleteBill(id) {
    const index = bills.value.findIndex(bill => bill.id === id)
    if (index !== -1) {
      bills.value.splice(index, 1)
    }
  }

  function getCategoryStats(type, month = null) {
    let targetBills = month 
      ? getBillsByDateRange(
          dayjs(month).startOf('month').format('YYYY-MM-DD'),
          dayjs(month).endOf('month').format('YYYY-MM-DD')
        )
      : thisMonthBills.value

    targetBills = targetBills.filter(bill => bill.type === type)
    
    const stats = {}
    targetBills.forEach(bill => {
      if (!stats[bill.category]) {
        const catInfo = getCategory(type, bill.category)
        stats[bill.category] = {
          id: bill.category,
          name: catInfo.name,
          icon: catInfo.icon,
          color: catInfo.color,
          amount: 0,
          count: 0
        }
      }
      stats[bill.category].amount += bill.amount
      stats[bill.category].count += 1
    })

    return Object.values(stats).sort((a, b) => b.amount - a.amount)
  }

  function getMonthlyTrend(year = dayjs().year()) {
    const months = []
    for (let i = 0; i < 12; i++) {
      const month = dayjs().year(year).month(i)
      const monthStart = month.startOf('month').format('YYYY-MM-DD')
      const monthEnd = month.endOf('month').format('YYYY-MM-DD')
      const monthBills = getBillsByDateRange(monthStart, monthEnd)
      
      const income = monthBills
        .filter(b => b.type === 'income')
        .reduce((s, b) => s + b.amount, 0)
      
      const expense = monthBills
        .filter(b => b.type === 'expense')
        .reduce((s, b) => s + b.amount, 0)

      months.push({
        month: month.format('MM月'),
        monthNum: i + 1,
        income,
        expense,
        balance: income - expense
      })
    }
    return months
  }

  function searchBills(keyword, filters = {}) {
    let results = [...bills.value]

    if (keyword && keyword.trim()) {
      const kw = keyword.toLowerCase().trim()
      results = results.filter(bill => {
        const catInfo = getCategory(bill.type, bill.category)
        return (
          catInfo.name.toLowerCase().includes(kw) ||
          (bill.remark && bill.remark.toLowerCase().includes(kw)) ||
          bill.amount.toString().includes(kw)
        )
      })
    }

    if (filters.type && filters.type !== 'all') {
      results = results.filter(bill => bill.type === filters.type)
    }

    if (filters.category && filters.category !== 'all') {
      results = results.filter(bill => bill.category === filters.category)
    }

    if (filters.month) {
      const monthStart = dayjs(filters.month).startOf('month').format('YYYY-MM-DD')
      const monthEnd = dayjs(filters.month).endOf('month').format('YYYY-MM-DD')
      results = results.filter(bill => {
        const billDate = dayjs(bill.date)
        return billDate.isAfter(dayjs(monthStart).subtract(1, 'day')) &&
               billDate.isBefore(dayjs(monthEnd).add(1, 'day'))
      })
    }

    return results.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
  }

  function setMonthlyBudget(amount) {
    monthlyBudget.value = Number(amount)
  }

  return {
    bills,
    sortedBills,
    monthlyBudget,
    today,
    todayBills,
    todayIncome,
    todayExpense,
    todayBalance,
    thisWeekBills,
    thisWeekIncome,
    thisWeekExpense,
    thisWeekBalance,
    thisMonthBills,
    thisMonthIncome,
    thisMonthExpense,
    thisMonthBalance,
    monthlyBudgetRemaining,
    isOverBudget,
    budgetPercentage,
    addBill,
    updateBill,
    deleteBill,
    getBillsByDate,
    getBillsByDateRange,
    getCategoryStats,
    getMonthlyTrend,
    searchBills,
    setMonthlyBudget
  }
})
