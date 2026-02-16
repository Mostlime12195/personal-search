<script setup>
import { Icon } from '@iconify/vue'
import CustomSelect from '~/components/CustomSelect.vue'
import { countries, languages, safesearchOptions } from '~/composables/useConstants'

const router = useRouter()

// Theme options
const themeOptions = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'system' }
]

// Get theme from cookie
const themeCookie = useCookie('theme', {
  default: () => 'system',
  maxAge: 60 * 60 * 24 * 365 // 1 year
})

const selectedTheme = ref(themeCookie.value)

// Watch for theme changes and apply
watch(selectedTheme, (newTheme) => {
  themeCookie.value = newTheme
  applyTheme(newTheme)
})

// Apply theme to document
const applyTheme = (theme) => {
  if (typeof window === 'undefined') return
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

// Apply theme on mount
onMounted(() => {
  applyTheme(themeCookie.value)
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (themeCookie.value === 'system') {
      applyTheme('system')
    }
  })
})

// Additional settings (stored in cookies)
const countryCookie = useCookie('defaultCountry', { default: () => 'us' })
const languageCookie = useCookie('defaultLanguage', { default: () => 'en' })
const safesearchCookie = useCookie('defaultSafesearch', { default: () => 'moderate' })

const selectedCountry = ref(countryCookie.value)
const selectedLanguage = ref(languageCookie.value)
const selectedSafesearch = ref(safesearchCookie.value)

watch(selectedCountry, (val) => { countryCookie.value = val })
watch(selectedLanguage, (val) => { languageCookie.value = val })
watch(selectedSafesearch, (val) => { safesearchCookie.value = val })

// Keyboard shortcuts
const keyboardShortcuts = [
  { key: '/', description: 'Focus search input' },
  { key: 'Esc', description: 'Close suggestions/dialogs' },
  { key: 'Enter', description: 'Perform search' },
  { key: 'Alt + H', description: 'Go to home page' },
  { key: 'Alt + S', description: 'Go to settings' }
]

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-container">
      <!-- Header -->
      <header class="settings-header">
        <button @click="goBack" class="back-btn" aria-label="Go back">
          <Icon icon="material-symbols:arrow-back" />
        </button>
        <h1 class="settings-title">Settings</h1>
      </header>

      <!-- Theme Section -->
      <section class="settings-section">
        <div class="section-header">
          <Icon class="section-icon" icon="material-symbols:palette" />
          <h2 class="section-title">Appearance</h2>
        </div>
        
        <div class="theme-selector">
          <p class="section-description">Choose how Search looks to you. Select a single theme or sync with your system.</p>
          
          <div class="theme-options">
            <label 
              v-for="option in themeOptions" 
              :key="option.value"
              :class="['theme-option', { active: selectedTheme === option.value }]"
            >
              <input 
                type="radio" 
                :value="option.value" 
                v-model="selectedTheme"
                class="theme-radio"
              />
              <div class="theme-card">
                <div class="theme-icon-wrapper">
                  <!-- Light icon -->
                  <Icon v-if="option.icon === 'sun'" class="theme-icon" icon="material-symbols:light-mode" />
                  <!-- Dark icon -->
                  <Icon v-else-if="option.icon === 'moon'" class="theme-icon" icon="material-symbols:dark-mode" />
                  <!-- System icon -->
                  <Icon v-else class="theme-icon" icon="material-symbols:settings" />
                </div>
                <span class="theme-label">{{ option.label }}</span>
              </div>
              <div class="theme-check" v-if="selectedTheme === option.value">
                <Icon icon="material-symbols:check" />
              </div>
            </label>
          </div>
        </div>
      </section>

      <!-- Default Settings Section -->
      <section class="settings-section">
        <div class="section-header">
          <Icon class="section-icon" icon="material-symbols:tune" />
          <h2 class="section-title">Search Defaults</h2>
        </div>
        
        <div class="defaults-grid">
          <div class="default-option">
            <label class="default-label">Default Country</label>
            <CustomSelect 
              v-model="selectedCountry" 
              :options="countries" 
            />
          </div>
          
          <div class="default-option">
            <label class="default-label">Default Language</label>
            <CustomSelect 
              v-model="selectedLanguage" 
              :options="languages" 
            />
          </div>
          
          <div class="default-option">
            <label class="default-label">SafeSearch</label>
            <CustomSelect 
              v-model="selectedSafesearch" 
              :options="safesearchOptions" 
            />
          </div>
        </div>
        
        <p class="section-note">
          These settings will be used as defaults for new searches.
        </p>
      </section>

      <!-- Keyboard Shortcuts Section -->
      <section class="settings-section shortcuts-section">
        <div class="section-header">
          <Icon class="section-icon" icon="material-symbols:keyboard" />
          <h2 class="section-title">Keyboard Shortcuts</h2>
        </div>
        
        <div class="shortcuts-list">
          <div 
            v-for="shortcut in keyboardShortcuts" 
            :key="shortcut.key"
            class="shortcut-item"
          >
            <kbd class="shortcut-key">{{ shortcut.key }}</kbd>
            <span class="shortcut-description">{{ shortcut.description }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: var(--bg-body);
  padding: var(--space-lg);
}

.settings-container {
  max-width: 600px;
  margin: 0 auto;
}

/* Header */
.settings-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.back-btn :deep(svg) {
  width: 20px;
  height: 20px;
}

.settings-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* Sections */
.settings-section {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.section-icon {
  width: 22px;
  height: 22px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.section-description {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0 0 var(--space-lg) 0;
}

/* Theme Selector */
.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.theme-option {
  position: relative;
  cursor: pointer;
}

.theme-radio {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg) var(--space-md);
  background: var(--bg-elevated);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.theme-option:hover .theme-card {
  border-color: var(--color-secondary);
}

.theme-option.active .theme-card {
  border-color: var(--color-primary);
  background: var(--bg-body);
}

.theme-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface);
  border-radius: 50%;
  margin-bottom: var(--space-sm);
  box-shadow: var(--shadow-sm);
}

.theme-icon {
  width: 24px;
  height: 24px;
  color: var(--color-primary);
}

.theme-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
}

.theme-check {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popIn 0.2s ease;
}

.theme-check :deep(svg) {
  width: 18px;
  height: 18px;
  color: #ffffff;
  stroke-width: 3;
}

/* Dark mode checkmark */
[data-theme="dark"] .theme-check {
  background: var(--color-primary);
}

[data-theme="dark"] .theme-check :deep(svg) {
  color: #1a1816;
}

@keyframes popIn {
  0% {
    transform: scale(0);
  }
  70% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* Default Settings */
.defaults-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

.default-option {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.default-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.section-note {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: var(--space-md) 0 0 0;
  font-style: italic;
}

/* Keyboard Shortcuts */
.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
  box-shadow: 0 1px 0 var(--border-color);
}

.shortcut-description {
  font-size: 0.9375rem;
  color: var(--text-secondary);
}

/* Mobile Responsive */
@media screen and (max-width: 600px) {
  .settings-page {
    padding: var(--space-md);
  }
  
  .settings-title {
    font-size: 1.5rem;
  }
  
  .settings-section {
    padding: var(--space-md);
  }
  
  .theme-options {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }
  
  .theme-card {
    flex-direction: row;
    padding: var(--space-md);
    gap: var(--space-md);
  }
  
  .theme-icon-wrapper {
    width: 40px;
    height: 40px;
    margin-bottom: 0;
  }
  
  .theme-icon {
    width: 20px;
    height: 20px;
  }
  
  .theme-label {
    font-size: 1rem;
  }
  
  .defaults-grid {
    grid-template-columns: 1fr;
  }
  
  .shortcut-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
  }
  
  .shortcut-key {
    min-width: auto;
  }
}
</style>
