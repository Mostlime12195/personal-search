export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = query.q as string

  if (!searchQuery) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query is required'
    })
  }

  const config = useRuntimeConfig()
  const apiKey = config.public.searchApiKey as string

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'API key not configured'
    })
  }

  // Build query parameters
  const params = new URLSearchParams()
  params.set('q', searchQuery)
  
  // Optional parameters
  if (query.count) params.set('count', query.count as string)
  if (query.offset) params.set('offset', query.offset as string)
  if (query.safesearch) params.set('safesearch', query.safesearch as string)
  if (query.freshness) params.set('freshness', query.freshness as string)

  try {
    const response = await fetch(
      `https://search.hackclub.com/res/v1/news/search?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    )

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `News API failed: ${response.status}`
      })
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `News search error: ${error.message}`
    })
  }
})
