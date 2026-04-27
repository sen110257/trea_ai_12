<template>
  <div class="calendar">
    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth">
        <span class="nav-icon">‹</span>
      </button>
      <span class="calendar-title">{{ currentMonth.format('YYYY年MM月') }}</span>
      <button class="nav-btn" @click="nextMonth">
        <span class="nav-icon">›</span>
      </button>
    </div>
    
    <div class="calendar-weekdays">
      <div v-for="day in weekdays" :key="day" class="weekday">
        {{ day }}
      </div>
    </div>
    
    <div class="calendar-days">
      <div 
        v-for="(day, index) in calendarDays" 
        :key="index"
        class="day"
        :class="{
          'empty': !day.date,
          'today': day.isToday,
          'selected': day.isSelected,
          'has-bills': day.hasBills
        }"
        @click="day.date && selectDay(day.date)"
      >
        <span class="day-number">{{ day.date ? day.date.date() : '' }}</span>
        <span class="day-dot" v-if="day.hasBills && day.date"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import { useBillsStore } from '@/stores/bills'

const props = defineProps({
  selectedDate: {
    type: String,
    default: () => dayjs().format('YYYY-MM-DD')
  }
})

const emit = defineEmits(['select'])

const billsStore = useBillsStore()

const currentMonth = ref(dayjs(props.selectedDate))
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const calendarDays = computed(() => {
  const firstDay = currentMonth.value.startOf('month')
  const lastDay = currentMonth.value.endOf('month')
  const firstDayWeekday = firstDay.day()
  const daysInMonth = lastDay.date()
  
  const days = []
  
  for (let i = 0; i < firstDayWeekday; i++) {
    days.push({ date: null })
  }
  
  const today = dayjs()
  const selected = dayjs(props.selectedDate)
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = firstDay.date(i)
    const dateStr = date.format('YYYY-MM-DD')
    const dateBills = billsStore.getBillsByDate(dateStr)
    
    days.push({
      date,
      isToday: date.isSame(today, 'day'),
      isSelected: date.isSame(selected, 'day'),
      hasBills: dateBills.length > 0
    })
  }
  
  const remainingDays = 42 - days.length
  for (let i = 0; i < remainingDays; i++) {
    days.push({ date: null })
  }
  
  return days
})

watch(() => props.selectedDate, (newDate) => {
  const newMonth = dayjs(newDate).startOf('month')
  if (!newMonth.isSame(currentMonth.value.startOf('month'), 'month')) {
    currentMonth.value = newMonth
  }
})

function prevMonth() {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
}

function nextMonth() {
  currentMonth.value = currentMonth.value.add(1, 'month')
}

function selectDay(date) {
  const dateStr = date.format('YYYY-MM-DD')
  emit('select', dateStr)
}

onMounted(() => {
  currentMonth.value = dayjs(props.selectedDate)
})
</script>

<style scoped>
.calendar {
  user-select: none;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border: none;
  background-color: var(--bg-tertiary);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.nav-btn:active {
  transform: scale(0.9);
  background-color: var(--border-color);
}

.nav-icon {
  font-size: 20px;
  color: var(--text-primary);
  font-weight: 300;
}

.calendar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
  padding: 8px 0;
  font-weight: 500;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.day:active:not(.empty) {
  transform: scale(0.9);
}

.day.empty {
  cursor: default;
  pointer-events: none;
}

.day-number {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 400;
}

.day.today .day-number {
  font-weight: 600;
  color: var(--primary-color);
}

.day.selected {
  background-color: var(--primary-color);
}

.day.selected .day-number {
  color: #fff;
  font-weight: 600;
}

.day-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--warning-color);
  margin-top: 2px;
}

.day.selected .day-dot {
  background-color: #fff;
}

.day.today:not(.selected) {
  background-color: var(--primary-color) + '10';
}
</style>
