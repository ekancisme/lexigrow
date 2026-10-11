/** Load every page from the student's paginated vocabulary endpoint. */
export async function fetchAllVocabularyWords(api, filters = {}, pageSize = 100) {
  const words = []
  let page = 1
  let pageCount = Infinity

  while (page <= pageCount) {
    const params = new URLSearchParams({
      ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value != null && value !== '')),
      page: String(page),
      limit: String(pageSize),
    })
    const response = await api.get(`/vocabulary?${params}`)
    const pageWords = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : []

    words.push(...pageWords)

    const reportedPages = Number(response?.pages ?? response?.data?.pages)
    if (Number.isFinite(reportedPages) && reportedPages >= 1) {
      pageCount = reportedPages
    } else if (pageWords.length < pageSize) {
      break
    }

    page += 1
  }

  return words
}
