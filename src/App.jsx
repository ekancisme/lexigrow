import { Routes, Route, Navigate } from 'react-router-dom'

/* Auth Pages */
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import GoogleOAuthMock from './pages/auth/GoogleOAuthMock'

/* Layout */
import AppLayout from './components/layout/AppLayout'

/* Student Pages */
import StudentDashboard from './pages/student/StudentDashboard'
import WriteEssay from './pages/student/WriteEssay'
import MyProgress from './pages/student/MyProgress'
import SetWeeklyGoals from './pages/student/SetWeeklyGoals'
import AIFeedbackReview from './pages/student/AIFeedbackReview'

/* Teacher Pages */
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import ClassOverview from './pages/teacher/ClassOverview'
import ClassManagement from './pages/teacher/ClassManagement'
import StudentAnalyticsDetail from './pages/teacher/StudentAnalyticsDetail'
import ManualFeedbackReview from './pages/teacher/ManualFeedbackReview'
import EarlyWarningAlerts from './pages/teacher/EarlyWarningAlerts'
import SystemPromptsManagement from './pages/teacher/SystemPromptsManagement'
import ProfileSettings from './pages/teacher/ProfileSettings'

function App() {
  return (
    <Routes>
      {/* Auth routes (no sidebar) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/v3/signin/accountchooser" element={<GoogleOAuthMock />} />

      {/* Student routes */}
      <Route path="/student" element={<AppLayout role="student" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="write-essay" element={<WriteEssay />} />
        <Route path="progress" element={<MyProgress />} />
        <Route path="goals" element={<SetWeeklyGoals />} />
        <Route path="feedback" element={<AIFeedbackReview />} />
      </Route>

      {/* Teacher routes */}
      <Route path="/teacher" element={<AppLayout role="teacher" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="class/:id" element={<ClassOverview />} />
        <Route path="classes" element={<ClassManagement />} />
        <Route path="student/:id" element={<StudentAnalyticsDetail />} />
        <Route path="feedback/:id" element={<ManualFeedbackReview />} />
        <Route path="alerts" element={<EarlyWarningAlerts />} />
        <Route path="prompts" element={<SystemPromptsManagement />} />
      </Route>

      {/* Shared routes */}
      <Route path="/settings" element={<AppLayout role="teacher" />}>
        <Route index element={<ProfileSettings />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
