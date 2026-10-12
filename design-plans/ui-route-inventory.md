# LexiGrow — Bảng kiểm kê lộ trình & giao diện (UI Route Inventory)

Mốc đối chiếu: commit `bd09375` (nhánh `feat/editorial-academic-ui-rebuild`)
Tài khoản kiểm thử phục vụ xác minh: mật khẩu chung `123456`
- Học viên: `student@lexigrow.com`
- Giáo viên: `teacher@lexigrow.com`
- Phụ huynh: `parent@lexigrow.com`
- Quản trị viên: `admin@lexigrow.com`

---

## 1. Không gian học viên (Student Workspace)

| Route | Component | Tab / Sub-views | Nguồn dữ liệu chính | Thao tác chính (Actions) | Trạng thái hiển thị (States) |
|---|---|---|---|---|---|
| `/student/dashboard` | `StudentDashboard` | — | `/api/learning-sessions/active`, `/api/recommendations`, `/api/srs/due-today`, `/api/essays`, `/api/garden` | Bắt đầu bài học, Tiếp tục nháp, Ôn từ nhanh, Chuyển đến game/vườn | Loading skeleton, Empty, Active session, Error retry |
| `/student/explore` | `Explore` | Filter pills theo danh mục | `/api/topics` (hoặc fallback topics) | Tìm kiếm, Lọc danh mục, Bắt đầu chủ đề (start session) | Loading, Search not found, Completed round |
| `/student/writing` | `LearningSession` | 5 bước: Explore → Practice → Writing → Feedback → Revision | `/api/learning-sessions/:id`, `/api/ai/analysis` | Lật thẻ từ, Trả lời trắc nghiệm/điền từ, Viết luận, Nộp bài, Sửa bài | Draft autosaving, Evaluating AI, Revision pending |
| `/student/write-essay`, `/student/write` | `WriteEssay` | Split view: đề bài + editor | `/api/essays/draft`, `/api/assignments/:id` | Soạn thảo luận, Kiểm tra từ vựng mục tiêu, Nộp bài | Word count validator, Autosave debounce, Submitting |
| `/student/garden` | `GrowthGarden` | Chi tiết vườn & lịch sử tưới | `/api/garden`, `/api/garden/water` | Tưới cây, Nhận giọt nước từ bài học/SRS, Xem tiến trình mầm | Cây theo các cấp độ phát triển (Sprout → Tree) |
| `/student/my-words`, `/student/vocabulary` | `VocabularyLibrary` | Danh mục từ, Trạng thái SRS | `/api/vocabulary` | Thêm từ mới, Tìm kiếm, Lọc theo SRS/Category, Phát âm | Empty state, Loading, Pronunciation audio state |
| `/student/vocabulary/review` | `FlashcardReview` | Chế độ Due Today vs All | `/api/srs/due-today`, `/api/srs/review` | Lật thẻ (Space/Click), Phát âm, Đánh giá nhớ (Again/Hard/Good/Easy) | Hết thẻ hôm nay, Đang gửi đánh giá, Hoàn thành |
| `/student/game` | `GameHub` | Arena danh sách game | `/api/experience/profile` | Chọn game, Xem cấp độ/XP, Chuyển sang Daily Quest | Energy indicator, XP level pill, Disabled pro |
| `/student/game/matching` | `WordMatching` | Setup rounds → Gameplay | Local/Global Vocabulary API | Nối từ vựng với định nghĩa, Chơi lại, Lưu từ sau game | Timer countdown, Match success/fail, Recap modal |
| `/student/game/scramble` | `WordScramble` | Setup rounds → Gameplay | Local/Global Vocabulary API | Sắp xếp chữ cái thành từ đúng, Gợi ý, Lưu từ | Streak combo, Game over recap |
| `/student/game/filler` | `ContextFiller` | Setup rounds → Gameplay | Local/Global Vocabulary API | Điền từ vào câu ngữ cảnh, Chọn đáp án | Score feedback, Explanation pill |
| `/student/game/hunter` | `VocabHunter` | Setup rounds → Gameplay | Local/Global Vocabulary API | Bắn bóng từ vựng đúng nghĩa, Tốc độ | Health bar, Speed selector, Game over recap |
| `/student/game/daily-quest` | `DailyWordQuest` | Crossword puzzle 5 từ | `/api/daily-quest/today` | Giải ô chữ hàng ngang/dọc, Nhận thưởng XP/Sprouts | Đã hoàn thành trong ngày, Nhận thưởng thành công |
| `/student/essays` | `EssayHistory` | Lịch sử bài viết | `/api/essays` | Xem danh sách bài, Lọc theo band điểm/thời gian, Xem chi tiết | Empty bài viết, Loading |
| `/student/progress` | `MyProgress` | 4 tab: Tổng quan, Biểu đồ, Từ vựng, Bảng xếp hạng | `/api/progress/analytics`, `/api/experience/leaderboard` | Xem phân tích năng lực CEFR, Lọc xếp hạng tuần/lớp | Loading chart, Rank outside top badge |
| `/student/goals` | `SetWeeklyGoals` | Đặt mục tiêu tuần | `/api/goals/weekly` | Chỉnh số phút học, số từ vựng, số bài viết, Lưu mục tiêu | Success toast, Invalid target |
| `/student/feedback` | `AIFeedbackReview` | Đánh giá chi tiết bài viết | `/api/essays/:id/feedback` | Xem tiêu chí Task/Coherence/Lexical/Grammar, Xem bằng chứng dùng từ | AI rubric heatmap, Teacher feedback badge |
| `/student/class`, `/student/class/:classId` | `StudentClassDetail` | Lớp học & Bài tập | `/api/classes/my-class` | Nhập mã tham gia lớp, Xem bài tập được giao, Nộp bài | Chưa tham gia lớp, Lớp học active |
| `/student/onboarding` | `Onboarding` | Các bước khảo sát ban đầu | `/api/profile/onboarding` | Chọn mục tiêu CEFR, Sở thích, Hoàn tất thiết lập | Stepper indicator, Form validation |

---

## 2. Không gian giáo viên (Teacher Workspace)

| Route | Component | Tab / Sub-views | Nguồn dữ liệu | Thao tác chính |
|---|---|---|---|---|
| `/teacher/dashboard` | `TeacherDashboard` | Tổng quan lớp, Hàng chờ chấm | `/api/teacher/dashboard` | Xem bài nộp mới, Xem thống kê sĩ số, Điều hướng nhanh |
| `/teacher/class/:id` | `ClassOverview` | Chi tiết lớp học | `/api/classes/:id` | Xem danh sách học sinh, Mã tham gia lớp, Tiến độ học sinh |
| `/teacher/classes` | `ClassManagement` | Quản lý danh sách lớp | `/api/classes` | Tạo lớp mới, Sửa tên/mô tả, Lưu trữ lớp |
| `/teacher/assignments` | `AssignmentManagement` | Quản lý bài tập | `/api/assignments` | Giao bài tập mới, Đặt hạn nộp, Gắn chủ đề từ vựng |
| `/teacher/assignment/:id` | `AssignmentDetail` | Chi tiết bài tập & nộp bài | `/api/assignments/:id` | Xem danh sách bài đã nộp, Lọc bài chưa chấm |
| `/teacher/student/:id` | `StudentAnalyticsDetail` | Hồ sơ năng lực học sinh | `/api/teacher/student/:id/analytics` | Xem biểu đồ phát triển CEFR, Điểm mạnh/yếu |
| `/teacher/feedback/:id` | `ManualFeedbackReview` | Chấm bài thủ công | `/api/teacher/essays/:id/review` | Chấm điểm từng tiêu chí, Ghi nhận xét, Gửi điểm học sinh |
| `/teacher/alerts` | `EarlyWarningAlerts` | Cảnh báo học sinh nguy cơ | `/api/teacher/alerts` | Lọc mức độ cảnh báo (High/Med/Low), Đánh dấu đã xử lý |
| `/teacher/prompts` | `SystemPromptsManagement` | Cấu hình prompt chấm | `/api/teacher/system-prompts` | Sửa prompt tiêu chí, Lưu cấu hình |

---

## 3. Không gian phụ huynh (Parent Workspace)

| Route | Component | Tab / Sub-views | Nguồn dữ liệu | Thao tác chính |
|---|---|---|---|---|
| `/parent/dashboard` | `ParentDashboard` | Tổng quan tiến độ con | `/api/parent/children` | Chuyển đổi giữa các con, Nhập mã liên kết con |
| `/parent/children/:id/progress` | `ChildProgress (progress)` | Tổng quan & Biểu đồ | `/api/parent/children/:id/progress` | Xem thời gian học, Điểm số, Cây tri thức |
| `/parent/children/:id/essays` | `ChildProgress (essays)` | Lịch sử bài viết con | `/api/parent/children/:id/essays` | Đọc bài viết của con, Xem điểm giáo viên/AI |
| `/parent/children/:id/vocabulary` | `ChildProgress (vocabulary)` | Thống kê từ vựng | `/api/parent/children/:id/vocabulary` | Xem số từ đã thuộc, Từ cần củng cố |
| `/parent/children/:id/goals` | `ChildProgress (goals)` | Mục tiêu tuần của con | `/api/parent/children/:id/goals` | Xem mức độ hoàn thành chỉ tiêu |
| `/parent/children/:id/alerts` | `ChildProgress (alerts)` | Cảnh báo từ giáo viên | `/api/parent/children/:id/alerts` | Xem phản ánh tiến độ học tập |

---

## 4. Không gian quản trị (Admin Console)

| Route | Component | Tab / Sub-views | Nguồn dữ liệu | Thao tác chính |
|---|---|---|---|---|
| `/admin/dashboard` | `AdminDashboard` | Thống kê toàn hệ thống | `/api/admin/stats` | Xem người dùng active, Doanh thu, Lượt chấm AI |
| `/admin/users` | `AdminUsers` | Danh sách người dùng | `/api/admin/users` | Tìm kiếm, Đổi vai trò, Khóa/Mở tài khoản |
| `/admin/classes` | `AdminClassManagement` | Quản lý toàn bộ lớp | `/api/admin/classes` | Xem phân bổ giáo viên - học sinh toàn trường |
| `/admin/ai-monitoring` | `AdminAIMonitoring` | Giám sát chi phí & Provider | `/api/admin/ai-monitoring` | Quản lý tài khoản API Key, Combo model, Chi phí |
| `/admin/vocabulary` | `AdminVocabulary` | Thư viện từ vựng toàn cục | `/api/admin/vocabulary` | Duyệt từ vựng hệ thống, Nhập batch từ file |
| `/admin/pricing` | `AdminPricing` | Quản lý gói cước & PayOS | `/api/admin/pricing` | Đổi giá gói, Sửa quyền lợi, Xem doanh thu |
| `/admin/logs` | `AdminLogs` | Nhật ký kiểm toán | `/api/admin/audit-logs` | Lọc IP, Hành vi nhạy cảm, Thời gian |
| `/admin/chat` | `AdminChat` | Hỗ trợ người dùng trực tiếp | `/api/admin/chat` | Trả lời tin nhắn hỗ trợ của học viên/giáo viên |
| `/admin/announcements` | `AdminAnnouncements` | Quản trị thông báo popup | `/api/announcements` | Tạo thông báo EN/VI, Đặt lịch đăng, Xem trước popup |

---

## 5. Màn hình chung, Xác thực & Thanh toán

| Route | Component | Nguồn dữ liệu | Thao tác chính |
|---|---|---|---|
| `/login` | `Login` | `/api/auth/login`, `/api/auth/google` | Đăng nhập bằng Email/Password hoặc Google OAuth |
| `/register` | `Register` | `/api/auth/register` | Đăng ký tài khoản (Học viên / Phụ huynh / Giáo viên) |
| `/forgot-password` | `ForgotPassword` | `/api/auth/forgot-password` | Gửi mã OTP khôi phục mật khẩu qua Email |
| `/settings` | `ProfileSettings` | `/api/profile` | Đổi biệt danh, Avatar, Ngôn ngữ, Mật khẩu |
| `/pricing` | `PricingPage` | `/api/pricing/plans` | Xem các gói cước Free vs Pro, Chọn nâng cấp |
| `/payment/success` | `PaymentSuccess` | `/api/payments/verify` | Kiểm tra giao dịch PayOS thành công, Kích hoạt gói |
| `/payment/cancel` | `PaymentCancel` | — | Thông báo hủy giao dịch, Nút thử lại |

---

## 6. Overlays & Thành phần nổi (Global Shell)

| Thành phần | File Component | Thao tác & Hành vi |
|---|---|---|
| `AnnouncementPopup` | `src/components/common/AnnouncementPopup.jsx` | Hiển thị sau khi đăng nhập, song ngữ theo giao diện, nút Đóng & nút Ẩn 24 giờ |
| `NotificationBell` | `src/components/common/NotificationBell.jsx` | Chuông thông báo trên TopNav, xem thông báo mới, đánh dấu đã đọc |
| `TextTranslator` | `src/components/common/TextTranslator.jsx` | Nút tra cứu nhanh từ vựng nổi ở góc màn hình |
| `ChatWidget` | `src/components/chat/ChatWidget.jsx` | Hộp thoại trò chuyện hỗ trợ khách hàng ở góc dưới |
| `AppLayout Shell` | `src/components/layout/AppLayout.jsx` | Điều hướng Sidebar (desktop), TopNav (chọn ngôn ngữ, theme, profile), BottomNav (mobile parent) |
