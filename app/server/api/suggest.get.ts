export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = query.q as string

  if (!searchQuery) {
    return { suggestions: [] }
  }

  const config = useRuntimeConfig()
  const apiKey = config.public.searchApiKey as string

  if (!apiKey) {
    return { suggestions: [] }
  }

  try {
    const response = await fetch(
      `https://search.hackclub.com/res/v1/suggest/search?q=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    )

    if (!response.ok) {
      return { suggestions: [] }
    }

    const data = await response.json()
    // Transform the response to a simple array of suggestions
    const suggestions = data.results?.map(r => r.query) || []
    return { suggestions }
  } catch (error) {
    return { suggestions: [] }
  }
})
