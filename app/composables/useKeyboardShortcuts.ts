// Keyboard shortcuts composable
export function useKeyboardShortcuts() {
  const router = useRouter()
  const route = useRoute()
  
  const handleKeydown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement
    const isInputFocused = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable
    
    // Don't trigger shortcuts when typing in inputs (except for specific cases)
    if (isInputFocused && event.key !== 'Escape') {
      return
    }
    
    // Escape - Close suggestions/dialogs
    if (event.key === 'Escape') {
      // Emit event that can be caught by components
      window.dispatchEvent(new CustomEvent('keyboard:escape'))
      return
    }
    
    // / - Focus search input
    if (event.key === '/' && !isInputFocused) {
      event.preventDefault()
      const searchInput = document.querySelector('.search-input, .search-bar .search-input') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
      return
    }
    
    // Alt + H - Go to home
    if (event.altKey && event.key.toLowerCase() === 'h') {
      event.preventDefault()
      router.push('/')
      return
    }
    
    // Alt + S - Go to settings
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault()
      router.push('/settings')
      return
    }
  }
  
  const setupKeyboardShortcuts = () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeydown)
    }
  }
  
  const cleanupKeyboardShortcuts = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown)
    }
  }
  
  return {
    setupKeyboardShortcuts,
    cleanupKeyboardShortcuts
  }
}
