import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../../services/api.js'

const draftKey = (id) => `lexigrow_quest_${id}`
function storeDraft(quest, cells) {
  try {
    sessionStorage.setItem(draftKey(quest.id), JSON.stringify({ revision: quest.revision, cells }))
  } catch {
    /* Storage can be unavailable. Server saving still works. */
  }
}

export default function useDailyQuest() {
  const [quest, setQuest] = useState(null),
    [cells, setCells] = useState({})
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(null)
  const [busy, setBusy] = useState(''),
    [dirty, setDirty] = useState(false)
  const questRef = useRef(null),
    cellsRef = useRef({}),
    inFlight = useRef(null),
    mounted = useRef(false)
  const loadSequence = useRef(0)

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current
    try {
      const { data } = await api.post('/daily-quests/today', {})
      if (!mounted.current || sequence !== loadSequence.current) return
      let initial = data.cells || {}
      try {
        const draft = JSON.parse(sessionStorage.getItem(draftKey(data.id)))
        if (
          !data.completedAt &&
          draft?.revision === data.revision &&
          draft.cells &&
          typeof draft.cells === 'object'
        )
          initial = draft.cells
      } catch {
        /* Ignore invalid drafts. */
      }
      questRef.current = data
      cellsRef.current = initial
      setQuest(data)
      setCells(initial)
      setDirty(JSON.stringify(initial) !== JSON.stringify(data.cells || {}))
    } catch (err) {
      if (mounted.current && sequence === loadSequence.current) setError(err)
    } finally {
      if (mounted.current && sequence === loadSequence.current) setLoading(false)
    }
  }, [])

  // Loading synchronizes this screen with the server, including async error states.
  useEffect(() => {
    mounted.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    return () => {
      mounted.current = false
    }
  }, [load])

  const edit = useCallback((next) => {
    cellsRef.current = next
    setCells(next)
    setDirty(true)
    if (questRef.current) storeDraft(questRef.current, next)
  }, [])

  const play = useCallback(async (action = 'save', wordId) => {
    if (inFlight.current) await inFlight.current
    const current = questRef.current
    if (!current || current.completedAt) return null
    const snapshot = cellsRef.current
    setBusy(action)
    setError(null)
    const operation = (async () => {
      try {
        const result = await api.post(`/daily-quests/${current.id}/play`, {
          action,
          wordId,
          revision: current.revision,
          cells: snapshot,
        })
        questRef.current = result.data
        if (!mounted.current) return result
        setQuest(result.data)
        if (cellsRef.current === snapshot || action !== 'save') {
          cellsRef.current = result.data.cells
          setCells(result.data.cells)
          setDirty(false)
          try {
            sessionStorage.removeItem(draftKey(current.id))
          } catch {
            /* Optional draft. */
          }
        } else storeDraft(result.data, cellsRef.current)
        return result
      } catch (err) {
        if (mounted.current) setError(err)
        return null
      } finally {
        inFlight.current = null
        if (mounted.current) setBusy('')
      }
    })()
    inFlight.current = operation
    return operation
  }, [])

  useEffect(() => {
    if (!dirty || busy || error || quest?.completedAt) return
    const timer = setTimeout(() => play('save'), 800)
    return () => clearTimeout(timer)
  }, [cells, dirty, busy, error, quest?.completedAt, play])

  useEffect(() => {
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    if (dirty) window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    if (questRef.current) {
      try {
        sessionStorage.removeItem(draftKey(questRef.current.id))
      } catch {
        /* Optional draft. */
      }
    }
    return load()
  }, [load])

  return { quest, cells, edit, loading, error, busy, dirty, play, reload }
}
