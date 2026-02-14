<script setup>
const router = useRouter()
const searchQuery = ref('')
const searchType = ref('web')
const showSuggestions = ref(false)
const suggestions = ref([])
const loadingSuggestions = ref(false)

// Debounced suggestion fetching
let suggestionTimeout = null

const handleInput = () => {
  if (searchQuery.value.trim().length > 1) {
    showSuggestions.value = true
    clearTimeout(suggestionTimeout)
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

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  handleSearch()
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    showSuggestions.value = false
    router.push(`/search?q=${encodeURIComponent(searchQuery.value.trim())}&type=${searchType.value}`)
  }
}

const setSearchType = (type) => {
  searchType.value = type
  if (searchQuery.value.trim()) {
    handleSearch()
  }
}

// Close suggestions when clicking outside
const closeSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}
</script>

<template>
  <div class="home-page">
    <div class="search-container">
      <h1 class="logo">Search</h1>
      
      <div class="search-box-wrapper">
        <div :class="['search-box', { 'has-suggestions': showSuggestions && suggestions.length > 0 }]">
          <button @click="handleSearch" class="icon-btn search-icon-btn" aria-label="Search">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <input 
            v-model="searchQuery"
            @input="handleInput"
            @focus="handleInput"
            @blur="closeSuggestions"
            @keydown.enter="handleSearch"
            type="text" 
            class="search-input"
            placeholder="Search the web..."
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn" aria-label="Clear">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <!-- Suggestions dropdown -->
        <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown">
          <ul class="suggestions-list">
            <li 
              v-for="(suggestion, index) in suggestions" 
              :key="index"
              @mousedown="selectSuggestion(suggestion)"
              class="suggestion-item"
            >
              <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <span v-html="suggestion"></span>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="search-type-tabs">
        <button 
          :class="['tab', searchType === 'web' ? 'active' : '']"
          @click="setSearchType('web')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span>All</span>
        </button>
        <button 
          :class="['tab', searchType === 'images' ? 'active' : '']"
          @click="setSearchType('images')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          <span>Images</span>
        </button>
        <button 
          :class="['tab', searchType === 'videos' ? 'active' : '']"
          @click="setSearchType('videos')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
          </svg>
          <span>Videos</span>
        </button>
        <button 
          :class="['tab', searchType === 'news' ? 'active' : '']"
          @click="setSearchType('news')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
          <span>News</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 15vh;
  padding-bottom: var(--space-xl);
}

.search-container {
  width: 100%;
  max-width: 584px;
  text-align: center;
  padding: 0 var(--space-md);
}

.logo {
  font-size: 3.5rem;
  font-weight: 400;
  color: var(--color-primary);
  margin-bottom: var(--space-lg);
  font-family: var(--font-primary);
  line-height: 1;
  letter-spacing: -0.02em;
}

.search-box-wrapper {
  position: relative;
  margin-bottom: var(--space-lg);
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-full);
  padding: 0 var(--space-md);
  height: 48px;
  transition: box-shadow var(--transition-normal), border-color var(--transition-normal);
}

.search-box:focus-within {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.search-box.has-suggestions {
  border-radius: 24px 24px 0 0;
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--text-secondary);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.icon-btn:hover {
  background: var(--bg-elevated);
  color: var(--color-primary);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  padding: 0 var(--space-sm);
  height: 100%;
  font-family: var(--font-primary);
  color: var(--text-primary);
  background: transparent;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.clear-btn:hover {
  color: var(--color-primary);
}

.clear-btn svg {
  width: 18px;
  height: 18px;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 24px 24px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  overflow: hidden;
}

.suggestions-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  color: var(--text-primary);
}

.suggestion-item:hover {
  background: var(--bg-elevated);
}

.suggestion-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  margin-right: var(--space-sm);
  flex-shrink: 0;
}

.suggestion-item span {
  font-size: 1rem;
}

.search-type-tabs {
  display: flex;
  justify-content: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab svg {
  width: 18px;
  height: 18px;
}

/* Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  .home-page {
    padding-top: 12vh;
  }
  
  .logo {
    font-size: 2.5rem;
    margin-bottom: var(--space-md);
  }
  
  .search-box {
    height: 44px;
  }
  
  .search-input {
    font-size: 0.9375rem;
  }
  
  .tab {
    padding: var(--space-xs) var(--space-sm);
    font-size: 0.8125rem;
  }
  
  .tab svg {
    width: 16px;
    height: 16px;
  }
}

@media screen and (max-width: 480px) {
  .home-page {
    padding-top: 10vh;
    padding-left: var(--space-sm);
    padding-right: var(--space-sm);
  }
  
  .logo {
    font-size: 2rem;
    margin-bottom: var(--space-md);
  }
  
  .search-container {
    padding: 0 var(--space-sm);
  }
  
  .search-box {
    height: 42px;
    border-radius: 21px;
  }
  
  .search-input {
    font-size: 0.875rem;
  }
  
  .search-type-tabs {
    gap: 2px;
  }
  
  .tab {
    padding: 6px 10px;
    font-size: 0.75rem;
  }
  
  .tab span {
    display: none;
  }
  
  .tab svg {
    width: 18px;
    height: 18px;
  }
  
  .suggestions-dropdown {
    border-radius: 0 0 21px 21px;
  }
  
  .suggestion-item {
    padding: var(--space-sm) var(--space-sm);
  }
  
  .suggestion-item span {
    font-size: 0.9375rem;
  }
}
</style>
