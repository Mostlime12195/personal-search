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
          <button @click="handleSearch" class="icon-btn search-icon-btn">
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
            @keydown.down.prevent="() => {}"
            type="text" 
            class="search-input"
            placeholder="Search the web..."
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
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
          All
        </button>
        <button 
          :class="['tab', searchType === 'images' ? 'active' : '']"
          @click="setSearchType('images')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          Images
        </button>
        <button 
          :class="['tab', searchType === 'videos' ? 'active' : '']"
          @click="setSearchType('videos')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
          </svg>
          Videos
        </button>
        <button 
          :class="['tab', searchType === 'news' ? 'active' : '']"
          @click="setSearchType('news')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
          News
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 20vh;
  padding-bottom: 20px;
}

.search-container {
  width: 100%;
  max-width: 584px;
  text-align: center;
  padding: 0;
}

.logo {
  font-size: 56px;
  font-weight: normal;
  color: #5c220c;
  margin-bottom: 12px;
  font-family: 'Merriweather', Georgia, serif;
  line-height: 1;
}

.search-box-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #dfe1e5;
  box-shadow: 0 1px 6px rgba(32,33,36,0.28);
  border-radius: 24px;
  padding: 0 14px;
  height: 44px;
  transition: box-shadow 0.2s;
}

.search-box:focus-within {
  box-shadow: 0 1px 6px rgba(32,33,36,0.28), 0 1px 6px rgba(32,33,36,0.28);
  border-color: transparent;
}

.search-box.has-suggestions {
  border-radius: 24px 24px 0 0;
}

.search-icon {
  width: 20px;
  height: 20px;
  color: #9aa0a6;
  flex-shrink: 0;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: #f1f3f4;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 0 10px;
  height: 100%;
}

.search-input::placeholder {
  color: #9aa0a6;
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn svg {
  width: 20px;
  height: 20px;
  color: #5f6368;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #dfe1e5;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 4px 6px rgba(32,33,36,0.28);
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
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.1s;
}

.suggestion-item:hover {
  background: #f1f3f4;
}

.suggestion-icon {
  width: 18px;
  height: 18px;
  color: #5f6368;
  margin-right: 12px;
  flex-shrink: 0;
}

.suggestion-item span {
  font-size: 16px;
  color: #202124;
}

.search-buttons {
  margin-bottom: 30px;
}

.search-btn {
  background: #f8f9fa;
  border: 1px solid #f8f9fa;
  border-radius: 4px;
  color: #3c4043;
  font-size: 14px;
  margin: 11px 4px;
  padding: 0 16px;
  line-height: 27px;
  height: 36px;
  min-width: 54px;
  text-align: center;
  cursor: pointer;
  user-select: none;
}

.search-btn:hover {
  box-shadow: 0 1px 1px rgba(0,0,0,0.1);
  background: #f8f9fa;
  border: 1px solid #dadce0;
  color: #202124;
}

.search-type-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 20px;
  color: #5f6368;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  background: #f1f3f4;
}

.tab.active {
  color: #5c220c;
  background: #f1f3f4;
}

.tab svg {
  width: 18px;
  height: 18px;
}

/* Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  .home-page {
    padding-top: 15vh;
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .logo {
    font-size: 42px;
  }
  
  .search-container {
    padding: 0 8px;
  }
  
  .search-box {
    height: 42px;
    padding: 0 12px;
  }
  
  .search-input {
    font-size: 15px;
  }
  
  .search-type-tabs {
    gap: 6px;
  }
  
  .tab {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .tab svg {
    width: 16px;
    height: 16px;
  }
}

@media screen and (max-width: 480px) {
  .home-page {
    padding-top: 12vh;
    padding-left: 12px;
    padding-right: 12px;
  }
  
  .logo {
    font-size: 36px;
    margin-bottom: 8px;
  }
  
  .search-box {
    height: 40px;
    border-radius: 20px;
  }
  
  .search-input {
    font-size: 14px;
  }
  
  .search-type-tabs {
    gap: 4px;
  }
  
  .tab {
    padding: 8px 10px;
    font-size: 12px;
  }
  
  .tab span {
    display: none;
  }
  
  .tab svg {
    width: 18px;
    height: 18px;
  }
  
  .suggestions-dropdown {
    border-radius: 0 0 20px 20px;
  }
  
  .suggestion-item {
    padding: 10px 12px;
  }
  
  .suggestion-item span {
    font-size: 15px;
  }
}
</style>


