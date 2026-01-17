import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePatientStore = defineStore('patient', () => {
  // 待搜索的患者病历号
  const pendingSearchQuery = ref<string>('')

  // 设置待搜索的病历号
  function setPendingSearch(query: string) {
    console.log('设置待搜索病历号:', query)
    pendingSearchQuery.value = query
  }

  // 获取并清除待搜索的病历号
  function getAndClearPendingSearch(): string {
    const query = pendingSearchQuery.value
    console.log('获取待搜索病历号:', query)
    pendingSearchQuery.value = ''
    return query
  }

  // 检查是否有待搜索的内容
  function hasPendingSearch(): boolean {
    return !!pendingSearchQuery.value
  }

  return {
    pendingSearchQuery,
    setPendingSearch,
    getAndClearPendingSearch,
    hasPendingSearch
  }
})
