import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

/* Auth Pages */
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'


/* Layout */
import AppLayout from './components/layout/AppLayout'

/* Student Pages */
import StudentDashboard from './pages/student/StudentDashboard'
import WriteEssay from './pages/student/WriteEssay'
import MyProgress from './pages/student/MyProgress'
import SetWeeklyGoals from './pages/student/SetWeeklyGoals'
import AIFeedbackReview from './pages/student/AIFeedbackReview'
import VocabularyLibrary from './pages/student/VocabularyLibrary'
import FlashcardReview from './pages/student/FlashcardReview'
import GameHub from './pages/game/GameHub'
import WordMatching from './pages/game/WordMatching'
import WordScramble from './pages/game/WordScramble'
import ContextFiller from './pages/game/ContextFiller'
import VocabHunter from './pages/game/VocabHunter'
const DailyWordQuest = lazy(() => import('./pages/game/DailyWordQuest'))
import EssayHistory from './pages/student/EssayHistory'
import StudentClassDetail from './pages/student/StudentClassDetail'
import Explore from './pages/student/Explore'
import LearningSession from './pages/student/LearningSession'
import Onboarding from './pages/student/Onboarding'
import GrowthGarden from './pages/student/GrowthGarden'

/* Parent Pages */
import ParentDashboard from './pages/parent/ParentDashboard'
import ChildProgress from './pages/parent/ChildProgress'

/* Teacher Pages */
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import ClassOverview from './pages/teacher/ClassOverview'
import ClassManagement from './pages/teacher/ClassManagement'
import StudentAnalyticsDetail from './pages/teacher/StudentAnalyticsDetail'
import ManualFeedbackReview from './pages/teacher/ManualFeedbackReview'
import EarlyWarningAlerts from './pages/teacher/EarlyWarningAlerts'
import SystemPromptsManagement from './pages/teacher/SystemPromptsManagement'
import ProfileSettings from './pages/teacher/ProfileSettings'
import AssignmentDetail from './pages/teacher/AssignmentDetail'
import AssignmentManagement from './pages/teacher/AssignmentManagement'

/* Admin Pages */
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminClassManagement from './pages/admin/AdminClassManagement'
import AdminAIMonitoring from './pages/admin/AdminAIMonitoring'
import AdminVocabulary from './pages/admin/AdminVocabulary'
import AdminLogs from './pages/admin/AdminLogs'
import AdminPricing from './pages/admin/AdminPricing'

/* Pricing & Payment Pages */
import PricingPage from './pages/pricing/PricingPage'
import PaymentSuccess from './pages/pricing/PaymentSuccess'
import PaymentCancel from './pages/pricing/PaymentCancel'

import TextTranslator from './components/common/TextTranslator'
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

function App() {
  return (
    <>
      <Routes>
        {/* Auth routes (no sidebar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />


        {/* Student routes */}
        <Route path="/student" element={<AppLayout role="student" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="write-essay" element={<WriteEssay />} />
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
        <Route path="/teacher" element={<AppLayout role="teacher" />}>
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
      <TextTranslator />
    </>
  )
}

export default App
