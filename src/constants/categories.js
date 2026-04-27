export const EXPENSE_CATEGORIES = [
  { id: 'food', name: '餐饮', icon: '🍜', color: '#f59e0b' },
  { id: 'transport', name: '交通', icon: '🚗', color: '#3b82f6' },
  { id: 'shopping', name: '购物', icon: '🛍️', color: '#ec4899' },
  { id: 'rent', name: '房租', icon: '🏠', color: '#8b5cf6' },
  { id: 'entertainment', name: '娱乐', icon: '🎮', color: '#10b981' },
  { id: 'medical', name: '医疗', icon: '💊', color: '#ef4444' },
  { id: 'education', name: '教育', icon: '📚', color: '#06b6d4' },
  { id: 'fitness', name: '健身', icon: '🏃', color: '#f97316' },
  { id: 'clothing', name: '服饰', icon: '👕', color: '#a855f7' },
  { id: 'beauty', name: '美容', icon: '💄', color: '#ec4899' },
  { id: 'pet', name: '宠物', icon: '🐱', color: '#84cc16' },
  { id: 'gift', name: '送礼', icon: '🎁', color: '#f43f5e' },
  { id: 'utilities', name: '水电', icon: '💡', color: '#eab308' },
  { id: 'communication', name: '通讯', icon: '📱', color: '#14b8a6' },
  { id: 'other_expense', name: '其他', icon: '💰', color: '#64748b' }
]

export const INCOME_CATEGORIES = [
  { id: 'salary', name: '工资', icon: '💼', color: '#10b981' },
  { id: 'bonus', name: '奖金', icon: '🎉', color: '#f59e0b' },
  { id: 'investment', name: '理财', icon: '📈', color: '#3b82f6' },
  { id: 'red_envelope', name: '红包', icon: '🧧', color: '#ef4444' },
  { id: 'part_time', name: '兼职', icon: '💻', color: '#8b5cf6' },
  { id: 'refund', name: '退款', icon: '🔄', color: '#06b6d4' },
  { id: 'rental', name: '房租收入', icon: '🏘️', color: '#f97316' },
  { id: 'other_income', name: '其他', icon: '💵', color: '#64748b' }
]

export const MEMO_CATEGORIES = [
  { id: 'work', name: '工作', icon: '💼', color: '#3b82f6' },
  { id: 'personal', name: '个人', icon: '👤', color: '#10b981' },
  { id: 'study', name: '学习', icon: '📖', color: '#8b5cf6' },
  { id: 'life', name: '生活', icon: '🏠', color: '#f59e0b' },
  { id: 'shopping', name: '购物', icon: '🛒', color: '#ec4899' },
  { id: 'health', name: '健康', icon: '❤️', color: '#ef4444' },
  { id: 'travel', name: '旅行', icon: '✈️', color: '#06b6d4' }
]

export const getExpenseCategory = (id) => {
  return EXPENSE_CATEGORIES.find(cat => cat.id === id) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
}

export const getIncomeCategory = (id) => {
  return INCOME_CATEGORIES.find(cat => cat.id === id) || INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1]
}

export const getCategory = (type, id) => {
  if (type === 'expense') {
    return getExpenseCategory(id)
  }
  return getIncomeCategory(id)
}

export const getMemoCategory = (id) => {
  return MEMO_CATEGORIES.find(cat => cat.id === id) || MEMO_CATEGORIES[0]
}
