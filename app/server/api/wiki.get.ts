export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const title = (query.q as string) || ''
  const lang = (query.lang as string) || 'en'

  if (!title) {
    throw createError({
      statusCode: 400,
      message: 'Query is required'
    })
  }

  try {
    const headers = {
      'User-Agent': 'PersonalSearch/1.0 (https://github.com/Mostlime12195/personal-search; mostlime@outlook.com)'
    }
    
    // First get the search to find the best matching page
    const searchUrl = `https://${lang}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(title)}&limit=10`
    
    const searchResponse = await fetch(searchUrl, { headers })
    
    if (!searchResponse.ok) {
      throw createError({
        statusCode: searchResponse.status,
        message: 'Failed to search Wikipedia'
      })
    }
    
    const searchData = await searchResponse.json()
    
    if (!searchData.pages || searchData.pages.length === 0) {
      return null
    }
    
    // Find the first page that isn't a disambiguation page
    let pageTitle: string | null = null
    
    for (const p of searchData.pages) {
      // Skip if title contains "disambiguation"
      if (p.title?.toLowerCase().includes('disambiguation')) continue
      
      // Skip if description indicates it's a list/disambiguation
      const desc = p.description?.toLowerCase() || ''
      if (desc.includes('disambiguation') || desc.includes('list of')) continue
      
      pageTitle = p.key
      break
    }
    
    // If no valid page found, return null
    if (!pageTitle) {
      return null
    }
    
    // Get the summary endpoint
    const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`
    
    const summaryResponse = await fetch(summaryUrl, { headers })
    
    if (!summaryResponse.ok) {
      throw createError({
        statusCode: summaryResponse.status,
        message: 'Failed to fetch Wikipedia summary'
      })
    }
    
    const summaryData = await summaryResponse.json()
    
    // Check if the summary is a disambiguation page
    // If so, try to find a better page from search results
    if (summaryData.type === 'disambiguation' || summaryData.pageprops?.disambiguation) {
      // Try to find a non-disambiguation page from remaining search results
      const remainingPages = searchData.pages.filter((p: any) => p.key !== pageTitle)
      
      for (const p of remainingPages) {
        if (p.title?.toLowerCase().includes('disambiguation')) continue
        const desc = p.description?.toLowerCase() || ''
        if (desc.includes('disambiguation') || desc.includes('list of')) continue
        
        // Fetch summary for this page
        const newSummaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(p.key)}`
        const newSummaryResponse = await fetch(newSummaryUrl, { headers })
        
        if (newSummaryResponse.ok) {
          const newSummaryData = await newSummaryResponse.json()
          
          // Check if this one is also a disambiguation page
          if (newSummaryData.type !== 'disambiguation' && !newSummaryData.pageprops?.disambiguation) {
            return {
              title: newSummaryData.title,
              description: newSummaryData.description || '',
              extract: newSummaryData.extract || '',
              thumbnail: newSummaryData.thumbnail,
              url: newSummaryData.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${p.key}`
            }
          }
        }
      }
      
      // If all are disambiguation, return null
      return null
    }
    
    return {
      title: summaryData.title,
      description: summaryData.description || '',
      extract: summaryData.extract || '',
      thumbnail: summaryData.thumbnail,
      url: summaryData.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${pageTitle}`
    }
  } catch (error: any) {
    console.error('Wikipedia API error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch Wikipedia data'
    })
  }
})
