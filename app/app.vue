<script setup>
import '~/assets/css/main.css'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'

// Apply theme on app mount
const themeCookie = useCookie('theme', { default: () => 'system' })

const applyTheme = () => {
  if (typeof window === 'undefined') return
  
  const theme = themeCookie.value || 'system'
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

// Setup keyboard shortcuts
const { setupKeyboardShortcuts, cleanupKeyboardShortcuts } = useKeyboardShortcuts()

onMounted(() => {
  applyTheme()
  setupKeyboardShortcuts()
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (themeCookie.value === 'system') {
      applyTheme()
    }
  })
})

onUnmounted(() => {
  cleanupKeyboardShortcuts()
})
</script>

<template>
  <div>
    <NuxtPage />
  </div>
</template>
