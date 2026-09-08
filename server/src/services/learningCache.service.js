// Per-process bounded cache. TTL limits stale reads on multi-instance deployments.
export function createLearningCache({
  ttlMs = 30000,
  maxEntries = 100,
  now = Date.now,
} = {}) {
  const entries = new Map()
  let generation = 0
  return {
    clear() {
      generation++
      entries.clear()
    },
    async get(key, load) {
      const found = entries.get(key)
      if (found && found.expires > now())
        return structuredClone(await found.value)
      if (entries.size >= maxEntries)
        entries.delete(entries.keys().next().value)
      const version = generation
      const value = Promise.resolve()
        .then(load)
        .then((data) => JSON.parse(JSON.stringify(data)))
      entries.set(key, { value, expires: now() + ttlMs })
      try {
        return structuredClone(await value)
      } catch (err) {
        if (generation === version && entries.get(key)?.value === value)
          entries.delete(key)
        throw err
      }
    },
  }
}
export const learningSetCache = createLearningCache({})
