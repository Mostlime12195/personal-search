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

// Fetch data based on search type
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

// Wikipedia details
const { data: wikiData } = await useFetch(() => {
  if (!searchQuery.value.trim()) return null
  return `/api/wiki?q=${encodeURIComponent(searchQuery.value)}&lang=${wikiLang.value}`
}, {
  watch: [searchQuery, wikiLang],
  lazy: true,
  server: false
})

const wikipediaResult = computed(() => wikiData.value)

// Compute results
const allResults = ref([])
const currentOffset = ref(0)
const isLoadingMore = ref(false)
const hasMoreResults = ref(true)

// Fetch more results when scrolling
const loadMoreResults = async () => {
  if (isLoadingMore.value || !hasMoreResults.value || !searchQuery.value.trim()) return
  
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

// Watch for new searches
watch([searchQuery, searchType], () => {
  allResults.value = []
  currentOffset.value = 0
  hasMoreResults.value = true
})

// Update results when initial data changes
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

// Scroll handler
const handleScroll = () => {
  if (searchType.value === 'images') return
  
  const scrollTop = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  if (scrollTop + windowHeight >= documentHeight - 200) {
    loadMoreResults()
  }
}

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

// Local search input
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
              <button @click="handleSearch" class="icon-btn" aria-label="Search">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </button>
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
              <button v-if="localQuery" @click="localQuery = ''" class="clear-btn" aria-label="Clear">
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
          
          <button 
            :class="['tab tools-tab', showSettings ? 'active' : '']"
            @click="showSettings = !showSettings"
          >
            <span>Tools</span>
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
              <a 
                v-for="(result, index) in results" 
                :key="index" 
                :href="result.url"
                class="result-item"
              >
                <div class="result-source">
                  <img v-if="result.profile?.img" :src="result.profile.img" class="favicon" />
                  <span class="source-name">{{ result.profile?.name || result.url }}</span>
                </div>
                <h3 class="result-title" v-html="result.title"></h3>
                <p class="result-url">{{ result.url }}</p>
                <p class="result-snippet" v-html="result.description"></p>
              </a>
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
              <a 
                v-for="(result, index) in results" 
                :key="index" 
                :href="result.url"
                class="news-result"
              >
                <div class="news-source">
                  <img v-if="result.profile?.img" :src="result.profile.img" class="favicon" />
                  <span class="source-name">{{ result.profile?.name }}</span>
                  <span class="news-date">{{ result.age }}</span>
                </div>
                <h3 class="result-title" v-html="result.title"></h3>
                <p class="result-snippet" v-html="result.description"></p>
              </a>
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
        
        <!-- Right Side: Wikipedia sidebar -->
        <div v-if="searchType === 'web'" class="sidebar-section">
          <div v-if="wikipediaResult" class="knowledge-panel">
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
  background: var(--bg-body);
}

/* Header */
.search-header {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-md) var(--space-md) var(--space-sm);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.logo-link {
  text-decoration: none;
  flex-shrink: 0;
}

.logo-text {
  font-size: 1.5rem;
  color: var(--color-primary);
  font-family: var(--font-primary);
  font-weight: 400;
}

.search-bar-wrapper {
  flex: 1;
  max-width: 690px;
  position: relative;
}

.search-bar {
  display: flex;
  gap: var(--space-sm);
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  padding: 0 var(--space-md);
  height: 44px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-normal), border-color var(--transition-normal);
}

.search-input-wrapper:focus-within {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.search-input-wrapper.has-suggestions {
  border-radius: 22px 22px 0 0;
}

.search-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.icon-btn {
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

.icon-btn:hover {
  color: var(--color-primary);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  padding: 0 var(--space-sm);
  font-family: var(--font-primary);
  color: var(--text-primary);
  background: transparent;
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xs);
  display: flex;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.clear-btn:hover {
  color: var(--color-primary);
}

.clear-btn svg {
  width: 16px;
  height: 16px;
}

/* Suggestions Dropdown */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 22px 22px;
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

/* Navigation Tabs */
.nav-tabs {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
}

.tabs-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
  display: flex;
  align-items: center;
}

.tabs-left {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--space-sm) var(--space-md);
  background: none;
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
  width: 16px;
  height: 16px;
}

.tools-tab {
  margin-left: var(--space-sm);
}

/* Tools Dropdown */
.tools-dropdown {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  padding: var(--space-md);
}

.tools-section {
  max-width: 1200px;
  margin: 0 auto;
}

.tools-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 var(--space-sm) 0;
}

.tools-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.tool-group {
  min-width: 140px;
}

.tool-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: var(--space-xs);
}

.tool-select {
  padding: 6px var(--space-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  background: var(--bg-surface);
  cursor: pointer;
  min-width: 130px;
  font-family: var(--font-primary);
  color: var(--text-primary);
}

.tool-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-lg) var(--space-md);
}

.content-layout {
  display: flex;
  gap: var(--space-lg);
}

.results-section {
  flex: 1;
  min-width: 0;
}

.sidebar-section {
  width: 360px;
  flex-shrink: 0;
  padding-left: var(--space-lg);
  border-left: 1px solid var(--border-subtle);
}

.results-info {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: var(--space-lg);
  padding-left: var(--space-xs);
}

/* Web Results */
.result-item {
  display: block;
  padding: var(--space-md) var(--space-xs);
  border-bottom: 1px solid var(--border-subtle);
  text-decoration: none;
  transition: background var(--transition-fast);
}

.result-source {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.favicon {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.source-name {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.result-title {
  color: var(--color-link);
  font-size: 1.25rem;
  font-weight: 400;
  margin: 0 0 var(--space-xs) 0;
  line-height: 1.3;
}

.result-item:hover .result-title {
  text-decoration: underline;
  color: var(--color-link-hover);
}

.result-url {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0 0 var(--space-xs) 0;
  word-break: break-all;
}

.result-snippet {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0;
  word-wrap: break-word;
}

/* Images Grid */
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-md);
}

.image-result {
  display: block;
  text-decoration: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.image-result:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.image-result img {
  width: 100%;
  height: auto;
  display: block;
}

.image-title {
  color: var(--text-primary);
  font-size: 0.8125rem;
  margin: var(--space-sm) 0 0 0;
  padding: 0 var(--space-xs);
  line-height: 1.4;
}

/* Videos Grid */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-lg);
}

.video-result {
  display: block;
  text-decoration: none;
}

.video-thumbnail {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.video-thumbnail img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: var(--space-sm);
  right: var(--space-sm);
  background: rgba(0,0,0,0.8);
  color: #fff;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.video-title {
  color: var(--text-primary);
  font-size: 0.9375rem;
  margin: var(--space-sm) 0 var(--space-xs) 0;
  font-weight: 500;
  line-height: 1.4;
}

.video-source {
  color: var(--text-muted);
  font-size: 0.75rem;
  margin: 0;
}

/* News Results */
.news-result {
  display: block;
  padding: var(--space-md) var(--space-xs);
  border-bottom: 1px solid var(--border-subtle);
  text-decoration: none;
  transition: background var(--transition-fast);
}

.news-result:hover {
  background: var(--bg-elevated);
}

.news-source {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.news-date {
  color: var(--text-muted);
  font-size: 0.75rem;
}

/* Knowledge Panel */
.knowledge-panel {
  padding: var(--space-md) 0;
}

.wiki-image {
  width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-sm);
}

.wiki-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.wiki-description {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0 0 var(--space-sm) 0;
}

.wiki-extract {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 var(--space-sm) 0;
}

.wiki-link {
  font-size: 0.875rem;
  color: var(--color-link);
  text-decoration: none;
}

.wiki-link:hover {
  text-decoration: underline;
}

/* Loading State */
.loading-state {
  padding: var(--space-lg) 0;
}

.skeleton {
  padding: var(--space-md) var(--space-xs);
}

.skeleton-title {
  height: 24px;
  width: 60%;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-sm);
}

.skeleton-url {
  height: 16px;
  width: 40%;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-sm);
}

.skeleton-text {
  height: 16px;
  width: 80%;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
}

/* Error & Empty States */
.error-state, .no-results, .initial-state {
  text-align: center;
  padding: var(--space-2xl) var(--space-md);
  color: var(--text-muted);
}

.retry-btn {
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.retry-btn:hover {
  background: var(--color-secondary);
}

/* Loading More */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-xl) var(--space-md);
  color: var(--text-muted);
  font-size: 0.875rem;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mobile Responsive */
@media screen and (max-width: 1024px) {
  .sidebar-section {
    display: none;
  }
}

@media screen and (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md);
  }
  
  .logo-link {
    align-self: center;
  }
  
  .logo-text {
    font-size: 1.25rem;
  }
  
  .search-bar-wrapper {
    width: 100%;
    max-width: 100%;
  }
  
  .search-input-wrapper {
    height: 40px;
  }
  
  .tabs-inner {
    padding: 0 var(--space-sm);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .tabs-left {
    gap: 2px;
    flex-wrap: nowrap;
    padding-bottom: var(--space-sm);
  }
  
  .tab {
    padding: var(--space-xs) var(--space-sm);
    font-size: 0.8125rem;
    white-space: nowrap;
  }
  
  .tab svg {
    width: 14px;
    height: 14px;
  }
  
  .tools-dropdown {
    padding: var(--space-sm);
  }
  
  .tools-grid {
    gap: var(--space-sm);
  }
  
  .tool-group {
    min-width: 100px;
    flex: 1 1 45%;
  }
  
  .tool-select {
    min-width: 100%;
    font-size: 0.8125rem;
  }
  
  .main-content {
    padding: var(--space-md);
  }
  
  .result-item {
    padding: var(--space-md) 0;
  }
  
  .result-title {
    font-size: 1.125rem;
  }
  
  .result-url {
    font-size: 0.8125rem;
  }
  
  .result-snippet {
    font-size: 0.875rem;
  }
  
  .images-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-sm);
  }
  
  .image-result img {
    height: auto;
  }
  
  .videos-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
  
  .video-thumbnail img {
    height: 120px;
  }
  
  .video-title {
    font-size: 0.8125rem;
  }
}

@media screen and (max-width: 480px) {
  .header-content {
    padding: var(--space-sm);
    gap: var(--space-sm);
  }
  
  .logo-text {
    font-size: 1.125rem;
  }
  
  .search-input-wrapper {
    height: 38px;
    border-radius: 19px;
    padding: 0 var(--space-sm);
  }
  
  .search-icon {
    width: 16px;
    height: 16px;
  }
  
  .search-input {
    font-size: 0.875rem;
  }
  
  .tabs-inner {
    padding: 0 var(--space-xs);
  }
  
  .tabs-left {
    gap: 0;
  }
  
  .tab {
    padding: 6px 8px;
    font-size: 0.75rem;
  }
  
  .tab span {
    display: none;
  }
  
  .tools-tab span {
    display: inline;
  }
  
  .tab svg {
    width: 16px;
    height: 16px;
  }
  
  .tools-dropdown {
    padding: var(--space-sm);
  }
  
  .tool-group {
    flex: 1 1 100%;
  }
  
  .main-content {
    padding: var(--space-sm);
  }
  
  .results-info {
    font-size: 0.75rem;
    margin-bottom: var(--space-sm);
  }
  
  .result-title {
    font-size: 1rem;
  }
  
  .result-url {
    font-size: 0.75rem;
  }
  
  .result-snippet {
    font-size: 0.8125rem;
  }
  
  .images-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-xs);
  }
  
  .image-result img {
    height: auto;
  }
  
  .image-title {
    font-size: 0.6875rem;
    padding: 0 2px;
  }
  
  .videos-grid {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }
  
  .video-thumbnail img {
    height: 140px;
  }
  
  .video-title {
    font-size: 0.8125rem;
  }
  
  .news-result {
    padding: var(--space-sm) 0;
  }
  
  .result-title {
    font-size: 1rem;
  }
  
  .error-state, .no-results, .initial-state {
    padding: var(--space-xl) var(--space-sm);
  }
  
  .retry-btn {
    padding: var(--space-xs) var(--space-md);
    font-size: 0.8125rem;
  }
  
  .suggestions-dropdown {
    border-radius: 0 0 19px 19px;
  }
  
  .suggestion-item {
    padding: var(--space-xs) var(--space-sm);
  }
  
  .suggestion-item span {
    font-size: 0.875rem;
  }
}
</style>
