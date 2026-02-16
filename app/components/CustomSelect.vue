<script setup>
import { Icon } from '@iconify/vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Select...'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const selectRef = ref(null)

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected ? selected.label : props.placeholder
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectOption = (option) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

const closeDropdown = (e) => {
  if (selectRef.value && !selectRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div ref="selectRef" class="custom-select">
    <button 
      type="button"
      class="select-trigger"
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
    >
      <span class="select-value">{{ selectedLabel }}</span>
      <Icon class="select-arrow" icon="material-symbols:keyboard-arrow-down" />
    </button>
    
    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="dropdown-option"
          :class="{ 'is-selected': option.value === modelValue }"
          @click="selectOption(option)"
        >
          <span>{{ option.label }}</span>
          <Icon v-if="option.value === modelValue" class="check-icon" icon="material-symbols:check" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-surface);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.9375rem;
  color: var(--text-primary);
  font-family: var(--font-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-trigger:hover {
  border-color: var(--color-secondary);
}

.select-trigger.is-open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(92, 34, 12, 0.15);
}

.select-value {
  flex: 1;
  text-align: left;
}

.select-arrow {
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.select-trigger.is-open .select-arrow {
  transform: rotate(180deg);
  color: var(--color-primary);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-surface);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(45, 42, 38, 0.15);
  z-index: 1000;
  overflow: hidden;
  max-height: 240px;
  overflow-y: auto;
}

.dropdown-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: none;
  border: none;
  font-size: 0.9375rem;
  color: var(--text-primary);
  font-family: var(--font-primary);
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;
}

.dropdown-option:hover {
  background: var(--bg-elevated);
}

.dropdown-option.is-selected {
  background: var(--bg-elevated);
  color: var(--color-primary);
  font-weight: 500;
}

.check-icon {
  width: 18px;
  height: 18px;
  color: var(--color-primary);
}

/* Dark mode */
[data-theme="dark"] .select-trigger {
  background: var(--bg-elevated);
}

[data-theme="dark"] .dropdown-menu {
  background: var(--bg-surface);
  border-color: var(--border-color);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .dropdown-option.is-selected {
  background: var(--bg-elevated);
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
