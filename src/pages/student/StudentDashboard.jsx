import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import useDashboardResource from '../../hooks/useDashboardResource.js'
import StatCard from '../../components/common/StatCard'
import AnimatedCounter from '../../components/common/AnimatedCounter'
import CircularProgress from '../../components/common/CircularProgress'
import VocabGrowthChart from '../../components/charts/VocabGrowthChart'
import './StudentDashboard.css'

function ResourceNotice({ resource, label }) {
  const { language } = useLanguage()
  const isVi = language === 'vi'
  if (!resource.loading && !resource.error) return null
  return (
    <div className="card-base" style={{ padding: 16 }} role="status" aria-live="polite">
      <p>{resource.loading
        ? (isVi ? `Đang tải ${label}…` : `Loading ${label}…`)
        : resource.error?.code === 'TIMEOUT'
          ? (isVi ? `Tải ${label} quá lâu. Vui lòng thử lại.` : `Loading ${label} timed out. Please retry.`)
          : (isVi ? `Chưa tải được ${label}.` : `Could not load ${label}.`)}</p>
      {resource.error && <button type="button" className="btn-secondary" onClick={resource.retry}>
        {isVi ? 'Thử lại' : 'Retry'}
      </button>}
    </div>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const isVi = language === 'vi'
  const navigate = useNavigate()
  const overviewResource = useDashboardResource('/progress/overview')
  const goalsResource = useDashboardResource('/goals')
  const essaysResource = useDashboardResource('/essays')
  const sessionResource = useDashboardResource('/sessions/current')
  const vocabularyResource = useDashboardResource('/vocabulary/due-today')
  const recommendationResource = useDashboardResource('/sessions/recommendation', 8000)
  const overview = overviewResource.response?.data
  const weeklyGoal = goalsResource.response?.data
  const recentEssays = essaysResource.response?.data?.slice(0, 5) || []
  const currentSession = sessionResource.response?.data
  const dueSrsCount = vocabularyResource.response?.count ?? vocabularyResource.response?.data?.length ?? 0
  const recommendation = recommendationResource.response?.data
  const recommendationFallback = recommendationResource.response?._meta?.isFallback

  const wordsGoal = weeklyGoal?.goals?.find(g => g.label === 'New Words')
  const lengthGoal = weeklyGoal?.goals?.find(g => g.label?.includes('Length'))
  const complexityGoal = weeklyGoal?.goals?.find(g => g.label?.includes('Complexity'))

  const wordsPercentage = wordsGoal && wordsGoal.target > 0 ? Math.min(100, Math.round((wordsGoal.current / wordsGoal.target) * 100)) : 0
  const lengthPercentage = lengthGoal && lengthGoal.target > 0 ? Math.min(100, Math.round((lengthGoal.current / lengthGoal.target) * 100)) : 0
  const complexityPercentage = complexityGoal && complexityGoal.target > 0 ? Math.min(100, Math.round((complexityGoal.current / complexityGoal.target) * 100)) : 0

  return (
    <div className="student-dash animate-fade-in">
      {/* ── 1. Hero Action Banner: Today's 10-min Session ── */}
      <section className="student-dash__hero">
        <div className="student-dash__hero-content">
          <div className="student-dash__hero-badge">
            <span className="material-symbols-outlined">schedule</span>
            {t('dashboard.continueLesson', "Today's Micro-Session · 10 Mins")}
          </div>
          <h2 className="student-dash__hero-title">
            {t('dashboard.recommendedSets', 'Learn & Apply Target Words')}: <span className="student-dash__hero-words">{recommendation?.targetWords?.map((word) => word.word).join(' · ') || 'Your next adaptive set'}</span>
          </h2>
          <p className="student-dash__hero-desc">
            {recommendation?.rationale || 'Explore in context, take quick quizzes, and write a 60–100 word paragraph for instant feedback.'}
          </p>

          <ResourceNotice resource={recommendationResource} label={isVi ? 'gợi ý học tập' : 'learning recommendations'} />
          {recommendationFallback && (
            <div role="status" aria-live="polite">
              <p>{isVi ? 'Gợi ý AI tạm thời chưa sẵn sàng. Bạn vẫn có thể học với bộ từ được chọn từ tiến độ hiện tại.' : 'AI advice is temporarily unavailable. You can still study words selected from your current progress.'}</p>
              <button type="button" className="btn-secondary" onClick={recommendationResource.retry}>{isVi ? 'Tải lại gợi ý' : 'Retry recommendations'}</button>
            </div>
          )}
          <ResourceNotice resource={sessionResource} label={isVi ? 'phiên học hiện tại' : 'your current session'} />
          <div className="student-dash__hero-actions">
            <button
              className="btn-primary student-dash__hero-btn"
              onClick={() => navigate(recommendation?.targetWords?.length ? '/student/writing?adaptive=true' : '/student/writing?set=daily-life')}
            >
              <span className="material-symbols-outlined">play_circle</span>
              {sessionResource.loading || sessionResource.error ? (isVi ? 'Mở phiên học' : 'Open learning session') : currentSession ? t('dashboard.continueLesson', 'Resume Active Session') : t('common.start', 'Start Session Now (10 mins)')}
            </button>

            <Link to="/student/explore" className="btn-secondary">
              <span className="material-symbols-outlined">explore</span>
              {t('dashboard.exploreSets', 'Explore other topics')}
            </Link>
          </div>
        </div>

        <div className="student-dash__hero-art">
          <div className="student-dash__streak-pill">
            <span className="material-symbols-outlined student-dash__streak-icon">local_fire_department</span>
            <div>
              <div className="student-dash__streak-count">{user?.streakDays || 0} {t('dashboard.streak', 'day streak')}</div>
              <div className="student-dash__streak-sub">{t('dashboard.streakKeep', 'Daily goal achieved')}</div>
            </div>
          </div>

          <ResourceNotice resource={vocabularyResource} label={isVi ? 'từ cần ôn tập' : 'words due for review'} />
          {dueSrsCount > 0 && (
            <div className="student-dash__srs-pill" onClick={() => navigate('/student/vocabulary/review')}>
              <span className="material-symbols-outlined">style</span>
              <div>
                <div className="student-dash__srs-count">{dueSrsCount} {t('dashboard.wordsDueReview', 'words due for SRS review')}</div>
                <div className="student-dash__srs-sub">{t('flashcards.tapToFlip', 'Tap to flip flashcards')}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Stat Cards Overview ── */}
      <ResourceNotice resource={overviewResource} label={isVi ? 'thống kê học tập' : 'learning statistics'} />
      {!overviewResource.loading && !overviewResource.error && <section className="student-dash__stats">
        <StatCard
          label={t('progress.essaysCount', 'Essays Submitted')}
          value={<AnimatedCounter value={overview?.totalEssays || 0} />}
          icon="description"
        />
        <StatCard
          label={t('progress.totalLearned', 'Vocab Growth')}
          value={<>+<AnimatedCounter value={overview?.thisMonthWords || 0} /></>}
          subtitle={`${overview?.growthRate >= 0 ? '+' : ''}${overview?.growthRate || 0}% vs last month`}
          icon="trending_up"
        />
        <StatCard
          label={t('writing.vocabDiversity', 'Lexical Diversity (TTR)')}
          value={<AnimatedCounter value={Math.round((overview?.avgTTR || 0) * 100)} format="percent" />}
          icon="analytics"
          progress={Math.round((overview?.avgTTR || 0) * 100)}
        />
        <StatCard
          label={t('writing.cefrLevel', 'Estimated CEFR')}
          value={<>{overview?.rank || '—'}</>}
          subtitle={t('dashboard.basedOnWriting', 'Based on active writing')}
          icon="equalizer"
        />
      </section>}

      {/* ── 3. Charts & Weekly Goals ── */}
      <section className="student-dash__charts">
        <div className="student-dash__chart-main">
          <VocabGrowthChart />
        </div>

        <div className="student-dash__side-cards">
          <div className="student-dash__goals card-base">
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <h3 className="text-title-lg">{t('dashboard.weeklyGoals', 'Weekly Goals')}</h3>
              <Link to="/student/goals" className="text-label-md" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                {t('common.settings', 'Settings')}
              </Link>
            </div>
            <ResourceNotice resource={goalsResource} label={isVi ? 'mục tiêu tuần' : 'weekly goals'} />
            {!goalsResource.loading && !goalsResource.error && (!weeklyGoal?.goals?.length ? (
              <p>{isVi ? 'Bạn chưa đặt mục tiêu tuần.' : 'No weekly goals set yet.'}</p>
            ) : <div className="student-dash__goals-list">
              <CircularProgress
                percentage={wordsPercentage}
                color="primary"
                label={t('dashboard.newWordsAcquired', 'New Words Acquired')}
                sublabel={`${wordsGoal?.current ?? 0} / ${wordsGoal?.target ?? '—'} ${t('dashboard.wordsCount', 'words')}`}
              />
              <CircularProgress
                percentage={lengthPercentage}
                color="secondary"
                label={t('dashboard.writingVolume', 'Writing Volume')}
                sublabel={`${lengthGoal?.current ?? 0} / ${lengthGoal?.target ?? '—'} ${t('dashboard.wordsCount', 'words')}`}
              />
              <CircularProgress
                percentage={complexityPercentage}
                color="tertiary"
                label={t('dashboard.targetLevel', 'Target Level')}
                sublabel={`Level: ${overview?.rank || '—'}`}
              />
            </div>)}
          </div>
        </div>
      </section>

      {/* ── 4. Quick Actions & Recent Writing ── */}
      <section className="student-dash__bottom-grid">
        {/* Growth Garden Teaser */}
        <div className="student-dash__garden-teaser card-base" onClick={() => navigate('/student/progress')}>
          <div className="student-dash__garden-info">
            <div className="student-dash__garden-badge">
              <span className="material-symbols-outlined">yard</span>
              {t('garden.title', 'Vocabulary Garden')}
            </div>
            <h3 className="text-title-lg">{t('garden.subtitle', 'Growing Knowledge Tree')}</h3>
            <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>
              {t('garden.subtitle', 'Visualize your vocabulary expansion. Every mastered word waters your tree!')}
            </p>
            <span className="student-dash__garden-link">
              {t('dashboard.viewGarden', 'Explore Growth Garden')} <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </div>

        {/* Recent Essays */}
        <div className="student-dash__recent-essays card-base">
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h3 className="text-title-lg">{t('dashboard.recentEssays', 'Recent Writing')}</h3>
            <Link to="/student/essays" className="text-label-md" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
              {t('common.all', 'All Essays')}
            </Link>
          </div>

          <ResourceNotice resource={essaysResource} label={isVi ? 'bài viết gần đây' : 'recent writing'} />
          {!essaysResource.loading && !essaysResource.error && (recentEssays.length === 0 ? (
            <div className="student-dash__essays-empty">
              <span className="material-symbols-outlined">edit_note</span>
              <p>{t('dashboard.noEssays', 'No essays yet. Start your first writing exercise!')}</p>
              <button className="btn-primary" onClick={() => navigate('/student/writing?set=daily-life')}>
                {t('dashboard.writeEssay', 'Write Paragraph Now')}
              </button>
            </div>
          ) : (
            <div className="student-dash__essays-list">
              {recentEssays.map(essay => (
                <div
                  key={essay._id}
                  className="student-dash__essay-item"
                  onClick={() => navigate(essay.status === 'draft' ? `/student/writing?id=${essay._id}` : `/student/feedback?id=${essay._id}`)}
                >
                  <div className="student-dash__essay-item-left">
                    <span className="material-symbols-outlined student-dash__essay-icon">article</span>
                    <div>
                      <h4 className="student-dash__essay-title">{essay.title || t('writing.title', 'Vocabulary Practice Essay')}</h4>
                      <span className="student-dash__essay-date">
                        {new Date(essay.createdAt).toLocaleDateString('en-US')} · {essay.wordCount || 85} {t('dashboard.wordsCount', 'words')}
                      </span>
                    </div>
                  </div>
                  <span className={`student-dash__essay-status student-dash__essay-status--${essay.status || 'evaluated'}`}>
                    {essay.status === 'evaluated' ? t('essayHistory.statusGraded', 'AI Evaluated') : t('essayHistory.statusDraft', 'Draft')}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
