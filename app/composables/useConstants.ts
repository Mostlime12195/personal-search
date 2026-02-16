// Shared constants for search settings

export interface Option {
  value: string
  label: string
}

export const countries: Option[] = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'es', label: 'Spain' },
  { value: 'jp', label: 'Japan' }
]

export const languages: Option[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' }
]

export const safesearchOptions: Option[] = [
  { value: 'off', label: 'Off' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'strict', label: 'Strict' }
]

export const freshnessOptions: Option[] = [
  { value: '', label: 'Any time' },
  { value: 'pd', label: 'Past 24 hours' },
  { value: 'pw', label: 'Past week' },
  { value: 'pm', label: 'Past month' },
  { value: 'py', label: 'Past year' }
]

export const countOptions: Option[] = [
  { value: '10', label: '10 results' },
  { value: '20', label: '20 results' }
]

export const searchTypes = [
  { value: 'web', label: 'All', icon: 'globe' },
  { value: 'images', label: 'Images', icon: 'image' },
  { value: 'videos', label: 'Videos', icon: 'video' },
  { value: 'news', label: 'News', icon: 'news' }
] as const

export type SearchType = typeof searchTypes[number]['value']
