// Shared search composable for handling search suggestions
export function useSearch() {
  const router = useRouter()
  
  const searchQuery = ref('')
  const showSuggestions = ref(false)
  const suggestions = ref<string[]>([])
  const loadingSuggestions = ref(false)
  
  // Debounced suggestion fetching
  let suggestionTimeout: ReturnType<typeof setTimeout> | null = null
  
  const handleInput = () => {
    if (searchQuery.value.trim().length > 1) {
      showSuggestions.value = true
      if (suggestionTimeout) clearTimeout(suggestionTimeout)
      suggestionTimeout = setTimeout(fetchSuggestions, 300)
    } else {
      showSuggestions.value = false
      suggestions.value = []
    }
  }
  
  const fetchSuggestions = async () => {
    if (!searchQuery.value.trim()) return
    
    loadingSuggestions.value = true
    try {
      const data = await $fetch('/api/suggest', {
        query: { q: searchQuery.value }
      })
      suggestions.value = data.suggestions || []
    } catch (e) {
      suggestions.value = []
    } finally {
      loadingSuggestions.value = false
    }
  }
  
  const selectSuggestion = (suggestion: string) => {
    searchQuery.value = suggestion
    showSuggestions.value = false
    return suggestion
  }
  
  const handleSearch = (type = 'web') => {
    if (searchQuery.value.trim()) {
      showSuggestions.value = false
      router.push(`/search?q=${encodeURIComponent(searchQuery.value.trim())}&type=${type}`)
    }
  }
  
  const closeSuggestions = () => {
    setTimeout(() => {
      showSuggestions.value = false
    }, 200)
  }
  
  const clearSearch = () => {
    searchQuery.value = ''
    showSuggestions.value = false
    suggestions.value = []
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout)
    }
  })
  
  return {
    searchQuery,
    showSuggestions,
    suggestions,
    loadingSuggestions,
    handleInput,
    fetchSuggestions,
    selectSuggestion,
    handleSearch,
    closeSuggestions,
    clearSearch
  }
}
