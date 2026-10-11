import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../../services/api.js'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './ExperienceRanking.css'

export default function ExperienceRanking() {
  const { t, language } = useLanguage()
  const [profile, setProfile] = useState(null)
  const [classes, setClasses] = useState([])
  const [scope, setScope] = useState('global')
  const [classId, setClassId] = useState('')
  const [rows, setRows] = useState([])
  const [period, setPeriod] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const boardRequest = useRef(0)
  const number = new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US')

  useEffect(() => {
    let alive = true
    Promise.allSettled([api.get('/progress/experience'), api.get('/classes?status=active')]).then(([xp, classResult]) => {
      if (!alive) return
      if (xp.status === 'fulfilled') setProfile(xp.value.data?.data || xp.value.data)
      if (classResult.status === 'fulfilled') {
        const list = classResult.value.data?.data?.classes || classResult.value.data?.data || classResult.value.data?.classes || classResult.value.data || []
        const active = Array.isArray(list) ? list.filter(item => !item.status || item.status === 'active') : []
        setClasses(active)
        setClassId(active[0]?._id || '')
      }
    }).catch(() => {}).finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const loadBoard = useCallback(async () => {
    const requestId = ++boardRequest.current
    if (scope === 'class' && !classId) { setRows([]); setPeriod(null); setLoading(false); return }
    setLoading(true); setError('')
    try {
      const query = scope === 'class' ? `?scope=class&classId=${encodeURIComponent(classId)}` : '?scope=global'
      const response = await api.get(`/progress/leaderboard${query}`)
      if (requestId !== boardRequest.current) return
      const result = response.data?.data || response.data
      setRows(result?.leaderboard || [])
      setPeriod(result)
    } catch (err) { if (requestId === boardRequest.current) setError(err.message || t('progress.leaderboard.loadError', 'Could not load the leaderboard.')) }
    finally { if (requestId === boardRequest.current) setLoading(false) }
  }, [scope, classId, t])
  useEffect(() => {
    let active = true
    Promise.resolve().then(() => active && loadBoard())
    return () => { active = false }
  }, [loadBoard])

  const percent = profile?.xpForNextLevel ? Math.min(100, Math.round(profile.xpIntoLevel / profile.xpForNextLevel * 100)) : 0
  const dateFormat = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })
  return <section className="experience-ranking card-base">
    <header className="experience-ranking__header">
      <div><h3>{t('progress.leaderboard.title', 'Weekly leaderboard')}</h3><p>{t('progress.leaderboard.subtitle', 'Earn experience through verified learning activity. Rankings reset every Monday.')}</p></div>
    </header>
    {profile && <div className="experience-ranking__stats">
      <article><span>{t('progress.leaderboard.level', 'Level')}</span><strong>{number.format(profile.level || 1)}</strong><small>{number.format(profile.xpIntoLevel || 0)} / {number.format(profile.xpForNextLevel || 100)} XP</small><div className="experience-ranking__bar"><i style={{ width: `${percent}%` }} /></div></article>
      <article><span>{t('progress.leaderboard.totalXp', 'Total experience')}</span><strong>{number.format(profile.totalXp || 0)} XP</strong></article>
      <article><span>{t('progress.leaderboard.weeklyXp', 'This week')}</span><strong>{number.format(profile.weeklyXp || 0)} XP</strong></article>
    </div>}
    <div className="experience-ranking__controls" role="group" aria-label={t('progress.leaderboard.scope', 'Leaderboard scope')}>
      <button type="button" aria-pressed={scope === 'global'} className={scope === 'global' ? 'is-active' : ''} onClick={() => setScope('global')}>{t('progress.leaderboard.global', 'All learners')}</button>
      <button type="button" aria-pressed={scope === 'class'} className={scope === 'class' ? 'is-active' : ''} onClick={() => setScope('class')}>{t('progress.leaderboard.myClass', 'My class')}</button>
      {scope === 'class' && <select aria-label={t('progress.leaderboard.selectClass', 'Select class')} value={classId} onChange={e => setClassId(e.target.value)}><option value="">{t('progress.leaderboard.noClasses', 'No active classes')}</option>{classes.map(c => <option key={c._id} value={c._id}>{c.name || c.title || t('progress.leaderboard.class', 'Class')}</option>)}</select>}
    </div>
    {period?.weekStartsAt && <p className="experience-ranking__period">{t('progress.leaderboard.weekOf', 'Week of')} {dateFormat.format(new Date(period.weekStartsAt))}{period.currentRank ? ` · ${t('progress.leaderboard.rank', 'Your rank')}: #${number.format(period.currentRank)}` : ''}</p>}
    {error && <div role="alert" className="experience-ranking__error">{error} <button onClick={loadBoard}>{t('common.retry', 'Retry')}</button></div>}
    {loading ? <p role="status">{t('common.loading', 'Loading...')}</p> : !error && (rows.length ? <ol className="experience-ranking__list">{rows.map(row => <li key={`${row.rank}-${row.anonymousNickname}`} className={row.isCurrentUser ? 'is-current' : ''}><span className="experience-ranking__rank">{row.rank <= 3 ? ['🥇','🥈','🥉'][row.rank - 1] : `#${row.rank}`}</span><span className="experience-ranking__name">{row.anonymousNickname}{row.isCurrentUser && <small> · {t('progress.leaderboard.you', 'You')}</small>}</span><strong>{number.format(row.weeklyXp)} XP</strong></li>)}</ol> : <p className="experience-ranking__empty">{t('progress.leaderboard.empty', 'No experience earned this week yet. Complete a review or daily quest to appear here.')}</p>)}
    <footer>{t('progress.leaderboard.rules', 'Verified rewards: first vocabulary review each day (+5 XP) and daily quest completion (+20 XP). Arcade scores do not grant XP yet.')}</footer>
  </section>
}
