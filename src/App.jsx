import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

/* Auth Pages */
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))


/* Layout */
import AppLayout from './components/layout/AppLayout'

/* Student Pages */
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'))
const WriteEssay = lazy(() => import('./pages/student/WriteEssay'))
const MyProgress = lazy(() => import('./pages/student/MyProgress'))
const SetWeeklyGoals = lazy(() => import('./pages/student/SetWeeklyGoals'))
const AIFeedbackReview = lazy(() => import('./pages/student/AIFeedbackReview'))
const VocabularyLibrary = lazy(() => import('./pages/student/VocabularyLibrary'))
const FlashcardReview = lazy(() => import('./pages/student/FlashcardReview'))
const GameHub = lazy(() => import('./pages/game/GameHub'))
const WordMatching = lazy(() => import('./pages/game/WordMatching'))
const WordScramble = lazy(() => import('./pages/game/WordScramble'))
const ContextFiller = lazy(() => import('./pages/game/ContextFiller'))
const VocabHunter = lazy(() => import('./pages/game/VocabHunter'))
const DailyWordQuest = lazy(() => import('./pages/game/DailyWordQuest'))
const EssayHistory = lazy(() => import('./pages/student/EssayHistory'))
const StudentClassDetail = lazy(() => import('./pages/student/StudentClassDetail'))
const Explore = lazy(() => import('./pages/student/Explore'))
const LearningSession = lazy(() => import('./pages/student/LearningSession'))
const Onboarding = lazy(() => import('./pages/student/Onboarding'))
const GrowthGarden = lazy(() => import('./pages/student/GrowthGardenPage.jsx'))

/* Parent Pages */
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'))
const ChildProgress = lazy(() => import('./pages/parent/ChildProgress'))

/* Teacher Pages */
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'))
const ClassOverview = lazy(() => import('./pages/teacher/ClassOverview'))
const ClassManagement = lazy(() => import('./pages/teacher/ClassManagement'))
const StudentAnalyticsDetail = lazy(() => import('./pages/teacher/StudentAnalyticsDetail'))
const ManualFeedbackReview = lazy(() => import('./pages/teacher/ManualFeedbackReview'))
const EarlyWarningAlerts = lazy(() => import('./pages/teacher/EarlyWarningAlerts'))
const SystemPromptsManagement = lazy(() => import('./pages/teacher/SystemPromptsManagement'))
const ProfileSettings = lazy(() => import('./pages/teacher/ProfileSettings'))
const AssignmentDetail = lazy(() => import('./pages/teacher/AssignmentDetail'))
const AssignmentManagement = lazy(() => import('./pages/teacher/AssignmentManagement'))

/* Admin Pages */
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminClassManagement = lazy(() => import('./pages/admin/AdminClassManagement'))
const AdminAIMonitoring = lazy(() => import('./pages/admin/AdminAIMonitoring'))
const AdminVocabulary = lazy(() => import('./pages/admin/AdminVocabulary'))
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'))
const AdminPricing = lazy(() => import('./pages/admin/AdminPricing'))
const AdminChat = lazy(() => import('./pages/admin/AdminChat'))

/* Pricing & Payment Pages */
const PricingPage = lazy(() => import('./pages/pricing/PricingPage'))
const PaymentSuccess = lazy(() => import('./pages/pricing/PaymentSuccess'))
const PaymentCancel = lazy(() => import('./pages/pricing/PaymentCancel'))
const TextTranslator = lazy(() => import('./components/common/TextTranslator'))
import { useAuth } from './contexts/AuthContext.jsx'

// Route guard for Admins
function AdminProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/login" replace state={{ infoMessage: 'You do not have permission to access the admin workspace.' }} />
  }

  return children
}

function ParentProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'parent') {
    return <Navigate to="/login" replace state={{ infoMessage: 'You do not have access to the parent workspace.' }} />
  }

  return children
}

function RoleProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace state={{ infoMessage: 'You do not have permission to access this workspace.' }} />
  }

  return children
}

function App() {
  return (
    <>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>progress_activity</span>
        </div>
      }>
      <Routes>
        {/* Auth routes & Onboarding (no sidebar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/student/onboarding" element={<Onboarding />} />
        <Route path="/onboarding" element={<Navigate to="/student/onboarding" replace />} />

        {/* Student routes */}
        <Route
          path="/student"
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <AppLayout role="student" />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="write-essay" element={<WriteEssay />} />
          <Route path="write" element={<WriteEssay />} />
          <Route path="explore" element={<Explore />} />
          <Route path="writing" element={<LearningSession />} />
          <Route path="garden" element={<GrowthGarden />} />
          <Route path="my-words" element={<VocabularyLibrary />} />
          <Route path="vocabulary" element={<VocabularyLibrary />} />
          <Route path="vocabulary/review" element={<FlashcardReview />} />
          <Route path="game" element={<GameHub />} />
          <Route path="game/matching" element={<WordMatching />} />
          <Route path="game/scramble" element={<WordScramble />} />
          <Route path="game/filler" element={<ContextFiller />} />
          <Route path="game/hunter" element={<VocabHunter />} />
          <Route path="game/daily-quest" element={<Suspense fallback={<div role="status" aria-label="Loading">…</div>}><DailyWordQuest /></Suspense>} />
          <Route path="essays" element={<EssayHistory />} />
          <Route path="progress" element={<MyProgress />} />
          <Route path="goals" element={<SetWeeklyGoals />} />
          <Route path="feedback" element={<AIFeedbackReview />} />
          <Route path="class" element={<StudentClassDetail />} />
          <Route path="class/:classId" element={<StudentClassDetail />} />
        </Route>

        {/* Teacher routes */}
        <Route
          path="/teacher"
          element={
            <RoleProtectedRoute allowedRoles={['teacher']}>
              <AppLayout role="teacher" />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="class/:id" element={<ClassOverview />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="assignments" element={<AssignmentManagement />} />
          <Route path="student/:id" element={<StudentAnalyticsDetail />} />
          <Route path="feedback/:id" element={<ManualFeedbackReview />} />
          <Route path="assignment/:id" element={<AssignmentDetail />} />
          <Route path="alerts" element={<EarlyWarningAlerts />} />
          <Route path="prompts" element={<SystemPromptsManagement />} />
        </Route>

      {/* Parent routes */}
      <Route path="/parent" element={
        <ParentProtectedRoute>
          <AppLayout role="parent" />
        </ParentProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="children/:id" element={<ChildProgress view="progress" />} />
        <Route path="children/:id/progress" element={<ChildProgress view="progress" />} />
        <Route path="children/:id/essays" element={<ChildProgress view="essays" />} />
        <Route path="children/:id/vocabulary" element={<ChildProgress view="vocabulary" />} />
        <Route path="children/:id/goals" element={<ChildProgress view="goals" />} />
        <Route path="children/:id/alerts" element={<ChildProgress view="alerts" />} />
      </Route>


        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <AppLayout role="admin" />
          </AdminProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="classes" element={<AdminClassManagement />} />
          <Route path="ai-monitoring" element={<AdminAIMonitoring />} />
          <Route path="vocabulary" element={<AdminVocabulary />} />
          <Route path="pricing" element={<AdminPricing />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="chat" element={<AdminChat />} />
        </Route>

        {/* Pricing & Payment Routes */}
        <Route path="/pricing" element={<AppLayout />}>
          <Route index element={<PricingPage />} />
        </Route>
        <Route path="/payment/success" element={<AppLayout />}>
          <Route index element={<PaymentSuccess />} />
        </Route>
        <Route path="/payment/cancel" element={<AppLayout />}>
          <Route index element={<PaymentCancel />} />
        </Route>

        {/* Shared routes */}
        <Route path="/settings" element={<AppLayout />}>
          <Route index element={<ProfileSettings />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
      <TextTranslator />
    </>
  )
}

export default App
