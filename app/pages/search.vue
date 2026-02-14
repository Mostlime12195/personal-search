<script setup>
const route = useRoute()
const router = useRouter()

// Get search query and type from route
const searchQuery = computed(() => route.query.q || '')
const searchType = computed(() => route.query.type || 'web')

// Search parameters
const searchParams = ref({
  country: route.query.country || 'us',
  search_lang: route.query.search_lang || 'en',
  safesearch: route.query.safesearch || 'moderate',
  freshness: route.query.freshness || '',
  count: route.query.count || '20'
})

// Wikipedia language mapping
const wikiLang = computed(() => {
  const langMap = {
    'en': 'en',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'it': 'it',
    'pt': 'pt',
    'ru': 'ru',
    'ja': 'ja'
  }
  return langMap[searchParams.value.search_lang] || 'en'
})

// Fetch data based on search type - runs in parallel with Wikipedia search
const { data, pending, error, refresh } = await useFetch(() => {
  const type = searchType.value
  const endpoint = type === 'web' ? '/api/search' : `/api/${type}`
  return endpoint
}, {
  query: computed(() => ({
    q: searchQuery.value,
    ...(searchParams.value.country && searchParams.value.country !== 'us' ? { country: searchParams.value.country } : {}),
    ...(searchParams.value.search_lang && searchParams.value.search_lang !== 'en' ? { search_lang: searchParams.value.search_lang } : {}),
    ...(searchParams.value.safesearch && searchParams.value.safesearch !== 'moderate' ? { safesearch: searchParams.value.safesearch } : {}),
    ...(searchParams.value.freshness ? { freshness: searchParams.value.freshness } : {}),
    count: searchParams.value.count
  })),
  watch: [searchQuery, searchType, searchParams],
  lazy: true,
  server: false
})

// Wikipedia details via server API to bypass CORS
const { data: wikiData } = await useFetch(() => {
  if (!searchQuery.value.trim()) return null
  return `/api/wiki?q=${encodeURIComponent(searchQuery.value)}&lang=${wikiLang.value}`
}, {
  watch: [searchQuery, wikiLang],
  lazy: true,
  server: false
})

const wikipediaResult = computed(() => {
  return wikiData.value
})

// Compute results based on response structure
const allResults = ref([])
const currentOffset = ref(0)
const isLoadingMore = ref(false)
const hasMoreResults = ref(true)

// Fetch more results when scrolling
const loadMoreResults = async () => {
  if (isLoadingMore.value || !hasMoreResults.value || !searchQuery.value.trim()) return
  
  // Offset must be less than 10, increment by 1
  const nextOffset = currentOffset.value + 1
  if (nextOffset >= 10) {
    hasMoreResults.value = false
    return
  }
  
  isLoadingMore.value = true
  
  try {
    const type = searchType.value
    const endpoint = type === 'web' ? '/api/search' : `/api/${type}`
    
    const newData = await $fetch(endpoint, {
      query: {
        q: searchQuery.value,
        offset: nextOffset,
        ...(searchParams.value.country && searchParams.value.country !== 'us' ? { country: searchParams.value.country } : {}),
        ...(searchParams.value.search_lang && searchParams.value.search_lang !== 'en' ? { search_lang: searchParams.value.search_lang } : {}),
        ...(searchParams.value.safesearch && searchParams.value.safesearch !== 'moderate' ? { safesearch: searchParams.value.safesearch } : {}),
        ...(searchParams.value.freshness ? { freshness: searchParams.value.freshness } : {}),
        count: searchParams.value.count
      }
    })
    
    let newResults = []
    if (type === 'web') {
      newResults = newData?.web?.results || newData?.result?.results || newData?.results || []
    } else if (type === 'images') {
      newResults = newData?.images?.results || newData?.results || []
    } else if (type === 'videos') {
      newResults = newData?.videos?.results || newData?.results || []
    } else if (type === 'news') {
      newResults = newData?.news?.results || newData?.results || []
    }
    
    if (newResults.length > 0) {
      allResults.value = [...allResults.value, ...newResults]
      currentOffset.value = nextOffset
    } else {
      hasMoreResults.value = false
    }
  } catch (e) {
    console.error('Error loading more results:', e)
    hasMoreResults.value = false
  } finally {
    isLoadingMore.value = false
  }
}

// Watch for new searches to reset
watch([searchQuery, searchType], () => {
  allResults.value = []
  currentOffset.value = 0
  hasMoreResults.value = true
})

// Update allResults when initial data changes
watch(data, (newData) => {
  if (newData) {
    const type = searchType.value
    if (type === 'web') {
      allResults.value = newData?.web?.results || newData?.result?.results || newData?.results || []
    } else if (type === 'images') {
      allResults.value = newData?.images?.results || newData?.results || []
    } else if (type === 'videos') {
      allResults.value = newData?.videos?.results || newData?.results || []
    } else if (type === 'news') {
      allResults.value = newData?.news?.results || newData?.results || []
    }
  } else {
    allResults.value = []
  }
  currentOffset.value = 0
  hasMoreResults.value = true
})

const results = computed(() => allResults.value)
const totalResults = computed(() => results.value.length)

// Scroll handler - for web, video, and news (images don't support offset)
const handleScroll = () => {
  if (searchType.value === 'images') return // images don't support offset
  
  const scrollTop = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  // Load more when user is 200px from bottom
  if (scrollTop + windowHeight >= documentHeight - 200) {
    loadMoreResults()
  }
}

// Set up scroll listener
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// Navigation
const setSearchType = (type) => {
  router.push({
    path: '/search',
    query: { 
      q: searchQuery.value, 
      type,
      ...(searchParams.value.country && searchParams.value.country !== 'us' ? { country: searchParams.value.country } : {}),
      ...(searchParams.value.search_lang && searchParams.value.search_lang !== 'en' ? { search_lang: searchParams.value.search_lang } : {}),
      ...(searchParams.value.safesearch && searchParams.value.safesearch !== 'moderate' ? { safesearch: searchParams.value.safesearch } : {}),
      ...(searchParams.value.freshness ? { freshness: searchParams.value.freshness } : {}),
      ...(searchParams.value.count && searchParams.value.count !== '20' ? { count: searchParams.value.count } : {})
    }
  })
}

const applyParams = () => {
  router.push({
    path: '/search',
    query: { 
      q: searchQuery.value, 
      type: searchType.value,
      ...(searchParams.value.country && searchParams.value.country !== 'us' ? { country: searchParams.value.country } : {}),
      ...(searchParams.value.search_lang && searchParams.value.search_lang !== 'en' ? { search_lang: searchParams.value.search_lang } : {}),
      ...(searchParams.value.safesearch && searchParams.value.safesearch !== 'moderate' ? { safesearch: searchParams.value.safesearch } : {}),
      ...(searchParams.value.freshness ? { freshness: searchParams.value.freshness } : {}),
      ...(searchParams.value.count && searchParams.value.count !== '20' ? { count: searchParams.value.count } : {})
    }
  })
}

// Settings panel state
const showSettings = ref(false)

// For local search input
const localQuery = ref('')
const showSuggestions = ref(false)
const suggestions = ref([])

// Set local query from route
watch(() => route.query.q, (newVal) => {
  if (newVal) localQuery.value = newVal
}, { immediate: true })

const handleInput = () => {
  if (localQuery.value.trim().length > 1) {
    showSuggestions.value = true
    fetchSuggestions()
  } else {
    showSuggestions.value = false
    suggestions.value = []
  }
}

const fetchSuggestions = async () => {
  if (!localQuery.value.trim()) return
  
  try {
    const data = await $fetch('/api/suggest', {
      query: { q: localQuery.value }
    })
    suggestions.value = data.suggestions || []
  } catch (e) {
    suggestions.value = []
  }
}

const selectSuggestion = (suggestion) => {
  localQuery.value = suggestion
  showSuggestions.value = false
  handleSearch()
}

const handleSearch = () => {
  if (localQuery.value.trim()) {
    showSuggestions.value = false
    router.push(`/search?q=${encodeURIComponent(localQuery.value.trim())}&type=${searchType.value}`)
  }
}

const closeSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

// Parameter options
const countries = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'es', label: 'Spain' },
  { value: 'jp', label: 'Japan' }
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' }
]

const safesearchOptions = [
  { value: 'off', label: 'Off' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'strict', label: 'Strict' }
]

const freshnessOptions = [
  { value: '', label: 'Any time' },
  { value: 'pd', label: 'Past 24 hours' },
  { value: 'pw', label: 'Past week' },
  { value: 'pm', label: 'Past month' },
  { value: 'py', label: 'Past year' }
]

const countOptions = [
  { value: '10', label: '10 results' },
  { value: '20', label: '20 results' }
]
</script>

<template>
  <div class="search-page">
    <!-- Top Search Bar -->
    <div class="search-header">
      <div class="header-content">
        <NuxtLink to="/" class="logo-link">
          <span class="logo-text">Search</span>
        </NuxtLink>
        
        <div class="search-bar-wrapper">
          <div class="search-bar">
            <div :class="['search-input-wrapper', { 'has-suggestions': showSuggestions && suggestions.length > 0 }]">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input 
                v-model="localQuery"
                @input="handleInput"
                @focus="handleInput"
                @blur="closeSuggestions"
                @keydown.enter="handleSearch"
                type="text" 
                class="search-input"
                placeholder="Search..."
              />
              <button v-if="localQuery" @click="localQuery = ''" class="clear-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
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
                <span>{{ suggestion }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Navigation Tabs -->
    <div class="nav-tabs">
      <div class="tabs-inner">
        <div class="tabs-left">
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
          
          <!-- Tools button next to categories with larger spacing -->
          <button 
            :class="['tab tools-tab', showSettings ? 'active' : '']"
            @click="showSettings = !showSettings"
          >
            Tools
          </button>
        </div>
      </div>
      
      <!-- Tools Dropdown -->
      <div v-if="showSettings" class="tools-dropdown">
        <div class="tools-section">
          <h4 class="tools-title">Search Settings</h4>
          <div class="tools-grid">
            <div class="tool-group">
              <label class="tool-label">Country</label>
              <select v-model="searchParams.country" @change="applyParams" class="tool-select">
                <option v-for="c in countries" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
            <div class="tool-group">
              <label class="tool-label">Language</label>
              <select v-model="searchParams.search_lang" @change="applyParams" class="tool-select">
                <option v-for="l in languages" :key="l.value" :value="l.value">{{ l.label }}</option>
              </select>
            </div>
            <div class="tool-group">
              <label class="tool-label">SafeSearch</label>
              <select v-model="searchParams.safesearch" @change="applyParams" class="tool-select">
                <option v-for="s in safesearchOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div class="tool-group">
              <label class="tool-label">Time</label>
              <select v-model="searchParams.freshness" @change="applyParams" class="tool-select">
                <option v-for="f in freshnessOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
              </select>
            </div>
            <div class="tool-group">
              <label class="tool-label">Results</label>
              <select v-model="searchParams.count" @change="applyParams" class="tool-select">
                <option v-for="c in countOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <div class="content-layout">
        <!-- Left Side: Results -->
        <div class="results-section">
          <!-- Loading State -->
          <div v-if="pending" class="loading-state">
            <div class="skeleton" v-for="i in 5" :key="i">
              <div class="skeleton-title"></div>
              <div class="skeleton-url"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
          
          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <p>Something went wrong. Please try again.</p>
            <button @click="refresh()" class="retry-btn">Retry</button>
          </div>
          
          <!-- Results -->
          <div v-else-if="results.length > 0" class="results-container">
            <div class="results-info">
              About {{ totalResults }} results
            </div>
            
            <!-- Web Results -->
            <template v-if="searchType === 'web'">
              <div 
                v-for="(result, index) in results" 
                :key="index" 
                class="result-item"
              >
              <a :href="result.url" class="result-link">
                  <div class="result-source">
                    <img v-if="result.profile?.img" :src="result.profile.img" class="favicon" />
                    <span class="source-name">{{ result.profile?.name || result.url }}</span>
                  </div>
                  <h3 class="result-title" v-html="result.title"></h3>
                </a>
                <p class="result-url">{{ result.url }}</p>
                <p class="result-snippet" v-html="result.description"></p>
              </div>
            </template>
            
            <!-- Image Results -->
            <template v-else-if="searchType === 'images'">
              <div class="images-grid">
                <a 
                  v-for="(result, index) in results" 
                  :key="index"
                  :href="result.url" 
                  class="image-result"
                >
                  <img :src="result.thumbnail?.src || result.image" :alt="result.title" />
                  <p class="image-title">{{ result.title }}</p>
                </a>
              </div>
            </template>
            
            <!-- Video Results -->
            <template v-else-if="searchType === 'videos'">
              <div class="videos-grid">
                <a 
                  v-for="(result, index) in results" 
                  :key="index"
                  :href="result.url" 
                  class="video-result"
                >
                  <div class="video-thumbnail">
                    <img :src="result.thumbnail?.src || result.image" :alt="result.title" />
                    <span class="video-duration">{{ result.duration }}</span>
                  </div>
                  <p class="video-title">{{ result.title }}</p>
                  <p class="video-source">{{ result.source }}</p>
                </a>
              </div>
            </template>
            
            <!-- News Results -->
            <template v-else-if="searchType === 'news'">
              <div 
                v-for="(result, index) in results" 
                :key="index" 
                class="news-result"
              >
              <a :href="result.url" class="result-link">
                  <div class="news-source">
                    <img v-if="result.profile?.img" :src="result.profile.img" class="favicon" />
                    <span class="source-name">{{ result.profile?.name }}</span>
                    <span class="news-date">{{ result.age }}</span>
                  </div>
                  <h3 class="result-title" v-html="result.title"></h3>
                  <p class="result-snippet" v-html="result.description"></p>
                </a>
              </div>
            </template>
          </div>
          
          <!-- No Results -->
          <div v-else-if="searchQuery" class="no-results">
            <p>No results found for "{{ searchQuery }}"</p>
          </div>
          
          <!-- Initial State -->
          <div v-else class="initial-state">
            <p>Enter a search term to find results</p>
          </div>
          
          <!-- Loading More Indicator -->
          <div v-if="isLoadingMore" class="loading-more">
            <div class="loading-spinner"></div>
            <span>Loading more results...</span>
          </div>
        </div>
        
        <!-- Right Side: Wikipedia sidebar - only show for web search -->
        <div v-if="searchType === 'web'" class="sidebar-section">
          <!-- Wikipedia knowledge panel -->
          <div v-if="wikipediaResult" class="knowledge-panel">
            <!-- Featured Image -->
            <img 
              v-if="wikipediaResult.thumbnail?.source" 
              :src="wikipediaResult.thumbnail.source" 
              :alt="wikipediaResult.title"
              class="wiki-image"
            />
            <h3 class="wiki-title">{{ wikipediaResult.title }}</h3>
            <p class="wiki-description">{{ wikipediaResult.description }}</p>
            <p class="wiki-extract">{{ wikipediaResult.extract }}</p>
            <a :href="wikipediaResult.url" class="wiki-link">
              Read more on Wikipedia
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #fff;
}

.search-header {
  background: #fff;
  border-bottom: 1px solid #ebebeb;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 12px;
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo-link {
  text-decoration: none;
}

.logo-text {
  font-size: 24px;
  color: #5c220c;
  font-family: 'Merriweather', Georgia, serif;
}

.search-bar-wrapper {
  flex: 1;
  max-width: 690px;
  position: relative;
}

.search-bar {
  display: flex;
  gap: 8px;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #dfe1e5;
  border-radius: 24px;
  padding: 0 14px;
  height: 44px;
  box-shadow: 0 1px 6px rgba(32,33,36,0.28);
}

.search-input-wrapper:focus-within {
  box-shadow: 0 1px 6px rgba(32,33,36,0.28);
  border-color: transparent;
}

.search-input-wrapper.has-suggestions {
  border-radius: 24px 24px 0 0;
}

.search-icon {
  width: 18px;
  height: 18px;
  color: #9aa0a6;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 0 10px;
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.clear-btn svg {
  width: 18px;
  height: 18px;
  color: #5f6368;
}

/* Suggestions Dropdown */
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

.nav-tabs {
  border-bottom: 1px solid #ebebeb;
}

.tabs-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.tabs-left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 12px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #5f6368;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: #202124;
}

.tab.active {
  color: #5c220c;
  border-bottom-color: #5c220c;
}

.tab svg {
  width: 16px;
  height: 16px;
}

/* Tools button styling */
.tools-tab {
  margin-left: 8px;
}

/* Tools Dropdown */
.tools-dropdown {
  background: #fff;
  border-bottom: 1px solid #ebebeb;
  padding: 16px 20px;
}

.tools-section {
  max-width: 1200px;
  margin: 0 auto;
}

.tools-title {
  font-size: 14px;
  font-weight: 500;
  color: #5f6368;
  margin: 0 0 12px 0;
}

.tools-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.tool-group {
  min-width: 150px;
}

.tool-label {
  display: block;
  font-size: 12px;
  color: #5f6368;
  margin-bottom: 4px;
}

.tool-select {
  padding: 6px 10px;
  border: 1px solid #dfe1e5;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
  min-width: 140px;
}

.tool-select:focus {
  outline: none;
  border-color: #1a73e8;
}

.tools-apply-btn {
  margin-top: 16px;
  padding: 8px 24px;
  background: #1a73e8;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.tools-apply-btn:hover {
  background: #1557b0;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.content-layout {
  display: flex;
  gap: 24px;
}

.results-section {
  flex: 1;
  min-width: 0;
}

.sidebar-section {
  width: 450px;
  flex-shrink: 0;
}

.results-info {
  color: #70757a;
  font-size: 14px;
  margin-bottom: 20px;
  padding-left: 8px;
}

/* Web Results */
.result-item {
  padding: 12px 8px;
}

.result-link {
  text-decoration: none;
}

.result-source {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.favicon {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.source-name {
  color: #202124;
  font-size: 14px;
}

.result-title {
  color: #1a0dab;
  font-size: 20px;
  font-weight: normal;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.result-link:hover .result-title {
  text-decoration: underline;
}

.result-url {
  color: #202124;
  font-size: 14px;
  margin: 0 0 6px 0;
  word-break: break-all;
}

.result-snippet {
  color: #4d5156;
  font-size: 14px;
  line-height: 1.58;
  margin: 0;
  word-wrap: break-word;
}

/* Images Grid */
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.image-result {
  display: block;
  text-decoration: none;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.image-result:hover {
  transform: scale(1.02);
}

.image-result img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.image-title {
  color: #202124;
  font-size: 14px;
  margin: 8px 0 0 0;
  padding: 0 4px;
}

/* Videos Grid */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.video-result {
  display: block;
  text-decoration: none;
}

.video-thumbnail {
  position: relative;
}

.video-thumbnail img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 12px;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.8);
  color: #fff;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
}

.video-title {
  color: #202124;
  font-size: 16px;
  margin: 8px 0 4px 0;
  font-weight: 500;
}

.video-source {
  color: #70757a;
  font-size: 12px;
  margin: 0;
}

/* News Results */
.news-result {
  padding: 16px 8px;
  border-bottom: 1px solid #ebebeb;
}

.news-source {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.news-date {
  color: #70757a;
  font-size: 12px;
}

/* Knowledge Panel (Wikipedia) */
.knowledge-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  overflow: hidden;
}

.wiki-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 12px;
}

.wiki-title {
  font-size: 20px;
  font-weight: 500;
  color: #202124;
  margin: 0 0 4px 0;
}

.wiki-type {
  font-size: 12px;
  color: #70757a;
  text-transform: capitalize;
  margin: 0 0 8px 0;
}

.wiki-description {
  font-size: 14px;
  color: #4d5156;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.wiki-extract {
  font-size: 14px;
  color: #202124;
  line-height: 1.58;
  margin: 0 0 12px 0;
}

.wiki-link {
  font-size: 14px;
  color: #1a73e8;
  text-decoration: none;
}

.wiki-link:hover {
  text-decoration: underline;
}

/* Wikipedia Infobox */
.wiki-infobox {
  margin: 16px 0;
  border: 1px solid #a2a9b1;
  background: #f8f9fa;
  border-collapse: collapse;
  font-size: 14px;
  width: 100%;
}

.wiki-infobox :deep(th),
.wiki-infobox :deep(td) {
  padding: 8px;
  border: 1px solid #a2a9b1;
  vertical-align: top;
}

.wiki-infobox :deep(th) {
  background: #eaecf0;
  font-weight: 500;
  text-align: left;
  width: 40%;
}

.wiki-infobox :deep(img) {
  max-width: 100%;
  height: auto;
}

/* Loading State */
.loading-state {
  padding: 20px 0;
}

.skeleton {
  padding: 12px 8px;
}

.skeleton-title {
  height: 24px;
  width: 60%;
  background: #f1f3f4;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-url {
  height: 16px;
  width: 40%;
  background: #f1f3f4;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-text {
  height: 16px;
  width: 80%;
  background: #f1f3f4;
  border-radius: 4px;
}

/* Error & Empty States */
.error-state, .no-results, .initial-state {
  text-align: center;
  padding: 60px 20px;
  color: #70757a;
}

.retry-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: #1a73e8;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Loading More */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 30px 20px;
  color: #5f6368;
  font-size: 14px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #dfe1e5;
  border-top-color: #1a73e8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mobile Responsive Styles */
@media screen and (max-width: 1024px) {
  .sidebar-section {
    display: none;
  }
  
  .content-layout {
    flex-direction: column;
  }
}

@media screen and (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .logo-link {
    align-self: flex-start;
  }
  
  .logo-text {
    font-size: 20px;
  }
  
  .search-bar-wrapper {
    width: 100%;
    max-width: 100%;
  }
  
  .search-input-wrapper {
    height: 40px;
  }
  
  .tabs-inner {
    padding: 0 12px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .tabs-left {
    gap: 8px;
    flex-wrap: nowrap;
    padding-bottom: 8px;
  }
  
  .tab {
    padding: 10px 10px;
    font-size: 13px;
    white-space: nowrap;
  }
  
  .tab svg {
    width: 14px;
    height: 14px;
  }
  
  .tools-dropdown {
    padding: 12px;
  }
  
  .tools-grid {
    gap: 12px;
  }
  
  .tool-group {
    min-width: 120px;
    flex: 1 1 45%;
  }
  
  .tool-select {
    min-width: 100%;
    font-size: 13px;
    padding: 8px;
  }
  
  .main-content {
    padding: 16px;
  }
  
  .result-item {
    padding: 16px 0;
  }
  
  .result-title {
    font-size: 18px;
  }
  
  .result-url {
    font-size: 13px;
  }
  
  .result-snippet {
    font-size: 13px;
    line-height: 1.5;
  }
  
  /* Images Grid - Tablet */
  .images-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  .image-result img {
    height: 120px;
  }
  
  /* Videos Grid - Tablet */
  .videos-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .video-thumbnail img {
    height: 140px;
  }
  
  .video-title {
    font-size: 14px;
  }
  
  .results-info {
    font-size: 13px;
  }
}

@media screen and (max-width: 480px) {
  .header-content {
    padding: 12px;
    gap: 12px;
  }
  
  .logo-text {
    font-size: 18px;
  }
  
  .search-input-wrapper {
    height: 38px;
    border-radius: 20px;
    padding: 0 12px;
  }
  
  .search-icon {
    width: 16px;
    height: 16px;
  }
  
  .search-input {
    font-size: 14px;
  }
  
  .clear-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .tabs-inner {
    padding: 0 8px;
  }
  
  .tabs-left {
    gap: 4px;
  }
  
  .tab {
    padding: 8px 8px;
    font-size: 12px;
  }
  
  .tab span {
    display: none;
  }
  
  .tools-tab span {
    display: inline;
  }
  
  .tools-dropdown {
    padding: 10px;
  }
  
  .tools-title {
    font-size: 13px;
  }
  
  .tool-group {
    flex: 1 1 100%;
  }
  
  .main-content {
    padding: 12px;
  }
  
  .results-info {
    font-size: 12px;
    margin-bottom: 12px;
  }
  
  /* Web Results */
  .result-title {
    font-size: 16px;
  }
  
  .result-url {
    font-size: 12px;
  }
  
  .result-snippet {
    font-size: 13px;
  }
  
  /* Images Grid - Mobile */
  .images-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .image-result img {
    height: 100px;
  }
  
  .image-title {
    font-size: 12px;
    padding: 0 2px;
  }
  
  /* Videos Grid - Mobile */
  .videos-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .video-thumbnail img {
    height: 160px;
  }
  
  .video-title {
    font-size: 14px;
  }
  
  .video-source {
    font-size: 11px;
  }
  
  /* News Results */
  .news-result {
    padding: 12px 0;
  }
  
  .news-source {
    flex-wrap: wrap;
  }
  
  .result-title {
    font-size: 16px;
  }
  
  /* Loading & Error States */
  .error-state, .no-results, .initial-state {
    padding: 40px 16px;
  }
  
  .retry-btn {
    padding: 8px 16px;
    font-size: 14px;
  }
  
  /* Suggestions dropdown mobile */
  .suggestions-dropdown {
    border-radius: 0 0 20px 20px;
  }
  
  .suggestion-item {
    padding: 10px 12px;
  }
  
  .suggestion-item span {
    font-size: 14px;
  }
  
  /* Skeleton loading */
  .skeleton-title {
    width: 70%;
  }
  
  .skeleton-url {
    width: 50%;
  }
  
  .skeleton-text {
    width: 90%;
  }
}
</style>


