import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import useDashboardResource from '../../hooks/useDashboardResource.js'
import StatCard from '../../components/common/StatCard'
import AnimatedCounter from '../../components/common/AnimatedCounter'
import CircularProgress from '../../components/common/CircularProgress'
import VocabGrowthChart from '../../components/charts/VocabGrowthChart'
import Card, { CardHeader, CardTitle } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { formatDate } from '../../utils/formatters.js'
import { getLearningPathRecommendationCacheKey } from '../../utils/learningPathRecommendationCache.js'
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
      {resource.error && (
        <Button variant="secondary" size="sm" onClick={resource.retry} style={{ marginTop: 8 }}>
          {isVi ? 'Thử lại' : 'Retry'}
        </Button>
      )}
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
  const recommendationResource = useDashboardResource('/sessions/recommendation', 40000, {
    key: getLearningPathRecommendationCacheKey(user?._id),
    ttlMs: 30 * 60 * 1000,
  })

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
      <div className="student-dash__grid">
        {/* ── LEFT COLUMN (68% - Main Focus) ── */}
        <main className="student-dash__main">
          {/* 1. Hero Action Banner: Clean Academic */}
          <section className="student-dash__hero-card">
            <div className="student-dash__hero-header">
              <Badge variant="primary" icon="schedule">
                {t('dashboard.continueLesson', "Today's Micro-Session · 10 Mins")}
              </Badge>
              {user?.englishLevel && (
                <Badge variant="neutral">
                  CEFR: {user.englishLevel}
                </Badge>
              )}
            </div>

            <div>
              <h1 className="student-dash__hero-title">
                {t('dashboard.recommendedSets', 'Learn & Apply Target Words')}
              </h1>
              <div className="student-dash__hero-words">
                {recommendation?.targetWords?.map((w) => w.word).join(' · ') || 'Adaptive vocabulary set'}
              </div>
            </div>

            <p className="student-dash__hero-desc">
              {recommendation?.rationale || 'Explore curated vocabulary in context, complete targeted quizzes, and compose a 60–100 word essay for instant evaluation.'}
            </p>

            <ResourceNotice resource={recommendationResource} label={isVi ? 'gợi ý học tập' : 'learning recommendations'} />
            {recommendationFallback && (
              <div role="status" aria-live="polite" style={{ padding: '8px 12px', background: 'var(--color-warning-bg, #fffbeb)', borderRadius: 8, fontSize: 13, border: '1px solid var(--color-outline-variant, #fde68a)', color: 'var(--color-on-surface)' }}>
                <p style={{ margin: 0 }}>{isVi ? 'Gợi ý AI tạm thời chưa sẵn sàng. Bạn vẫn có thể học với bộ từ được chọn từ tiến độ hiện tại.' : 'AI advice is temporarily unavailable. You can still study words selected from your current progress.'}</p>
                <Button variant="secondary" size="sm" onClick={recommendationResource.retry} style={{ marginTop: 6 }}>
                  {isVi ? 'Tải lại gợi ý' : 'Retry recommendations'}
                </Button>
              </div>
            )}
            <ResourceNotice resource={sessionResource} label={isVi ? 'phiên học hiện tại' : 'your current session'} />

            <div className="student-dash__hero-actions">
              <Button
                variant="primary"
                size="lg"
                leftIcon="play_circle"
                onClick={() => navigate(recommendation?.targetWords?.length ? '/student/writing?adaptive=true' : '/student/writing')}
              >
                {sessionResource.loading || sessionResource.error
                  ? (isVi ? 'Mở phiên học' : 'Open learning session')
                  : currentSession
                    ? t('dashboard.continueLesson', 'Resume Active Session')
                    : t('common.start', 'Start Session Now (10 mins)')}
              </Button>

              <Button
                variant="outline"
                size="lg"
                leftIcon="explore"
                onClick={() => navigate('/student/explore')}
              >
                {t('dashboard.exploreSets', 'Explore other topics')}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                leftIcon="history_edu"
                onClick={() => navigate('/student/essays')}
              >
                {isVi ? 'Xem lại bài viết & bản nháp' : 'Writing History & Drafts'}
              </Button>
            </div>
          </section>

          {/* 2. Stat Cards Grid */}
          <ResourceNotice resource={overviewResource} label={isVi ? 'thống kê học tập' : 'learning statistics'} />
          {!overviewResource.loading && !overviewResource.error && (
            <section className="student-dash__stats-grid">
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
            </section>
          )}

          {/* 3. Vocabulary Growth Chart */}
          <VocabGrowthChart />

          {/* 4. Recent Writing Submissions */}
          <Card padding="md">
            <CardHeader>
              <CardTitle subtitle={t('dashboard.recentEssaysDesc', 'Track your completed essays and review feedback')}>
                {t('dashboard.recentEssays', 'Recent Writing')}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                leftIcon="history_edu"
                onClick={() => navigate('/student/essays')}
              >
                {isVi ? 'Xem bài viết & bản nháp' : 'View All Essays & Drafts'}
              </Button>
            </CardHeader>

            <ResourceNotice resource={essaysResource} label={isVi ? 'bài viết gần đây' : 'recent writing'} />
            {!essaysResource.loading && !essaysResource.error && (recentEssays.length === 0 ? (
              <div className="student-dash__essays-empty">
                <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.5 }}>edit_note</span>
                <p>{t('dashboard.noEssays', 'No essays yet. Start your first writing exercise!')}</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button variant="primary" size="md" onClick={() => navigate('/student/explore')}>
                    {t('dashboard.writeEssay', 'Write Paragraph Now')}
                  </Button>
                  <Button variant="outline" size="md" leftIcon="history_edu" onClick={() => navigate('/student/essays')}>
                    {isVi ? 'Xem lại bài viết & bản nháp' : 'Writing History & Drafts'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="student-dash__essays-list">
                {recentEssays.map((essay) => (
                  <Link
                    key={essay._id}
                    className="student-dash__essay-item"
                    to={essay.status === 'draft' ? `/student/writing?id=${essay._id}` : `/student/feedback?id=${essay._id}`}
                  >
                    <div className="student-dash__essay-left">
                      <span className="material-symbols-outlined student-dash__essay-icon">article</span>
                      <div>
                        <h4 className="student-dash__essay-title">
                          {essay.title || t('writing.title', 'Vocabulary Practice Essay')}
                        </h4>
                        <div className="student-dash__essay-meta">
                          {formatDate(essay.createdAt, language)} · {essay.wordCount || 85} {t('dashboard.wordsCount', 'words')}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={essay.status === 'evaluated' ? 'success' : 'neutral'}
                      className="student-dash__essay-badge"
                    >
                      {essay.status === 'evaluated' ? t('essayHistory.statusGraded', 'AI Evaluated') : t('essayHistory.statusDraft', 'Draft')}
                    </Badge>
                  </Link>
                ))}
              </div>
            ))}
          </Card>
        </main>

        {/* ── RIGHT COLUMN (32% - Secondary Rail) ── */}
        <aside className="student-dash__rail">
          {/* 1. Streak & Daily Goal Counter */}
          <Card padding="md">
            <div className="student-dash__streak-card">
              <div className="student-dash__streak-icon-wrap">
                <span className="material-symbols-outlined">local_fire_department</span>
              </div>
              <div>
                <div className="student-dash__streak-number">
                  {user?.streakDays || 0} {t('dashboard.streak', 'day streak')}
                </div>
                <div className="student-dash__streak-label">
                  {t('dashboard.streakKeep', 'Daily goal achieved')}
                </div>
              </div>
            </div>
          </Card>

          {/* 2. SRS Due Today Flashcard Action */}
          <ResourceNotice resource={vocabularyResource} label={isVi ? 'từ cần ôn tập' : 'words due for review'} />
          {dueSrsCount > 0 && (
            <Card padding="md" className="student-dash__srs-card">
              <div className="student-dash__srs-header">
                <div>
                  <Badge variant="primary" icon="style">
                    {t('dashboard.spacedRepetition', 'Spaced Repetition')}
                  </Badge>
                  <h4 className="student-dash__srs-title">
                    {dueSrsCount} {t('dashboard.wordsDueReview', 'words due today')}
                  </h4>
                  <p className="student-dash__srs-subtitle">
                    {t('flashcards.tapToFlip', 'Tap to review before retention drops')}
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="md"
                fullWidth
                rightIcon="arrow_forward"
                onClick={() => navigate('/student/vocabulary/review')}
              >
                {t('vocabLib.reviewAll', 'Review Now')}
              </Button>
            </Card>
          )}

          {/* 3. Weekly Goals Progress */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>{t('dashboard.weeklyGoals', 'Weekly Goals')}</CardTitle>
              <Link to="/student/goals" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                {t('common.settings', 'Settings')}
              </Link>
            </CardHeader>

            <ResourceNotice resource={goalsResource} label={isVi ? 'mục tiêu tuần' : 'weekly goals'} />
            {!goalsResource.loading && !goalsResource.error && (!weeklyGoal?.goals?.length ? (
              <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', margin: 0 }}>
                {isVi ? 'Bạn chưa đặt mục tiêu tuần.' : 'No weekly goals set yet.'}
              </p>
            ) : (
              <div className="student-dash__goals-list">
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
              </div>
            ))}
          </Card>

          {/* 4. Growth Garden Teaser */}
          <Link
            to="/student/garden"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <Card
              padding="md"
              interactive
              className="student-dash__garden-card"
            >
              <div>
                <Badge variant="success" icon="yard">
                  {t('garden.title', 'Vocabulary Garden')}
                </Badge>
                <h4 style={{ margin: '8px 0 4px 0', fontSize: 15, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                  {t('garden.subtitle', 'Growing Knowledge Tree')}
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                  {isVi ? 'Mỗi từ thuộc sẽ tưới nước cho cây.' : 'Each mastered word waters your tree.'}
                </p>
              </div>
              <span className="material-symbols-outlined student-dash__garden-icon">
                potted_plant
              </span>
            </Card>
          </Link>
        </aside>
      </div>
    </div>
  )
}
