import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './WeeklyComparisonWidget.css'

/** Minutes helper: from "X" minutes to "2 g 30 p" / "2h 30m" */
export function formatStudyTime(minutes, isVi) {
  if (minutes == null || Number.isNaN(minutes)) return '0'
  const total = Math.max(0, Math.round(minutes))
  const hours = Math.floor(total / 60)
  const mins = total % 60
  if (hours === 0) return `${mins} ${isVi ? 'phút' : 'min'}`
  if (mins === 0) return `${hours} ${isVi ? 'giờ' : 'h'}`
  return `${hours} ${isVi ? 'giờ' : 'h'} ${mins} ${isVi ? 'phút' : 'min'}`
}

export default function WeeklyComparisonWidget({ studentId }) {
  const { t, language } = useLanguage()
  const isVi = language === 'vi'
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function fetchComparison() {
      try {
        setLoading(true)
        const url = studentId
          ? `/progress/weekly-comparison?studentId=${studentId}`
          : '/progress/weekly-comparison'
        const res = await api.get(url)
        if (!active) return
        if (res.success) {
          setComparison(res.data)
        } else {
          setError(t('progress.comparisonFetchError', 'Failed to fetch comparison data'))
        }
      } catch (err) {
        if (!active) return
        setError(err.message || t('progress.comparisonFetchError', 'Error fetching comparison data'))
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchComparison()
    return () => {
      active = false
    }
  }, [studentId, t])

  if (loading) {
    return (
      <div className="weekly-comparison-loading">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        <span className="text-body-sm">
          {t('progress.comparisonLoading', 'Đang tải so sánh tuần…')}
        </span>
      </div>
    )
  }

  if (error || !comparison) {
    return (
      <div className="weekly-comparison-error text-body-sm">
        <span className="material-symbols-outlined text-color-error">warning</span>
        <span>{error || t('progress.comparisonEmpty', 'Chưa có dữ liệu so sánh')}</span>
      </div>
    )
  }

  const renderTrend = (change) => {
    const isZero = change === 0
    const isPositive = change > 0

    let trendClass = 'weekly-comparison__trend'
    let icon = 'trending_flat'

    if (!isZero) {
      if (isPositive) {
        trendClass += ' weekly-comparison__trend--up-good'
        icon = 'trending_up'
      } else {
        trendClass += ' weekly-comparison__trend--down-bad'
        icon = 'trending_down'
      }
    } else {
      trendClass += ' weekly-comparison__trend--flat'
    }

    return (
      <span className={trendClass}>
        <span className="material-symbols-outlined">{icon}</span>
        <span>
          {isZero
            ? t('progress.comparisonNoChange', 'Không đổi')
            : `${isPositive ? '+' : ''}${change}%`}
        </span>
      </span>
    )
  }

  const metrics = [
    {
      title: t('progress.metricNewWords', 'Từ vựng mới'),
      icon: 'dictionary',
      color: 'success',
      thisWeek: comparison.newWords?.thisWeek ?? 0,
      lastWeek: comparison.newWords?.lastWeek ?? 0,
      change: comparison.newWords?.change ?? 0,
      desc: t('progress.metricNewWordsDesc', 'Số từ đã thêm vào thư viện'),
    },
    {
      title: t('progress.metricEssays', 'Bài viết'),
      icon: 'edit_note',
      color: 'primary',
      thisWeek: comparison.essays?.thisWeek ?? 0,
      lastWeek: comparison.essays?.lastWeek ?? 0,
      change: comparison.essays?.change ?? 0,
      desc: t('progress.metricEssaysDesc', 'Số bài viết đã nộp/nhận xét AI'),
    },
    {
      title: t('progress.metricTime', 'Thời gian học'),
      icon: 'schedule',
      color: 'secondary',
      thisWeek: formatStudyTime(comparison.studyTime?.thisWeek ?? 0, isVi),
      lastWeek: formatStudyTime(comparison.studyTime?.lastWeek ?? 0, isVi),
      change: comparison.studyTime?.change ?? 0,
      desc: t('progress.metricTimeDesc', 'Tổng thời gian trong phiên học'),
    },
    {
      title: t('progress.metricTtr', 'Độ phong phú từ vựng'),
      icon: 'insights',
      color: 'primary',
      thisWeek: (comparison.ttr?.thisWeek ?? 0).toFixed(2),
      lastWeek: (comparison.ttr?.lastWeek ?? 0).toFixed(2),
      change: comparison.ttr?.change ?? 0,
      desc: t('progress.metricTtrDesc', 'Tỷ lệ đa dạng từ trong bài viết'),
    },
    {
      title: t('progress.metricComplexity', 'Độ phức tạp câu'),
      icon: 'architecture',
      color: 'tertiary',
      thisWeek: (comparison.complexity?.thisWeek ?? 0).toFixed(2),
      lastWeek: (comparison.complexity?.lastWeek ?? 0).toFixed(2),
      change: comparison.complexity?.change ?? 0,
      desc: t('progress.metricComplexityDesc', 'Điểm cấu trúc & mệnh đề trung bình'),
    },
  ]

  return (
    <div className="weekly-comparison">
      <div className="weekly-comparison__header">
        <h4 className="text-title-md">
          {t('progress.comparisonTitle', 'So sánh tiến bộ tuần')}
        </h4>
        <p className="text-body-sm" style={{ color: 'var(--color-outline)' }}>
          {t(
            'progress.comparisonSubtitle',
            'Đối chiếu hiệu suất 7 ngày gần nhất với 7 ngày trước đó',
          )}
        </p>
      </div>

      <div className="weekly-comparison__grid">
        {metrics.map((metric, i) => (
          <div key={i} className="weekly-comparison__card card-base">
            <div className="weekly-comparison__card-header">
              <div className={`weekly-comparison__icon-wrapper weekly-comparison__icon-wrapper--${metric.color}`}>
                <span className="material-symbols-outlined">{metric.icon}</span>
              </div>
              <span className="text-label-md" style={{ fontWeight: 600 }}>{metric.title}</span>
            </div>

            <div className="weekly-comparison__card-body">
              <div className="weekly-comparison__value-block">
                <span className="text-headline-sm">{metric.thisWeek}</span>
                <span className="text-body-xs" style={{ color: 'var(--color-outline)' }}>
                  {t('progress.comparisonThisWeek', 'tuần này')}
                </span>
              </div>

              <div className="weekly-comparison__divider-line"></div>

              <div className="weekly-comparison__value-block">
                <span className="text-title-sm" style={{ color: 'var(--color-outline)' }}>{metric.lastWeek}</span>
                <span className="text-body-xs" style={{ color: 'var(--color-outline)' }}>
                  {t('progress.comparisonLastWeek', 'tuần trước')}
                </span>
              </div>
            </div>

            <div className="weekly-comparison__card-footer">
              {renderTrend(metric.change)}
              <span className="text-body-xs" style={{ color: 'var(--color-outline)' }}>{metric.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
