# Hướng Dẫn Đưa Toàn Bộ Giao Diện LexiGrow Lên Figma

Thư mục này chứa toàn bộ các màn hình của hệ thống **LexiGrow** được trích xuất tự động từ ứng dụng thực tế với độ phân giải siêu nét **2x Retina**.

---

## 🚀 Cách 1: Kéo Thả Trực Tiếp Vào Figma (Nhanh nhất - Chỉ mất 10 giây)

1. Mở Figma (trên trình duyệt web hoặc ứng dụng máy tính) và tạo một file mới (**New design file**).
2. Mở thư mục này trên máy tính của bạn: `exports/figma_screens/`.
3. Nhấn `Ctrl + A` chọn toàn bộ các file ảnh `.png`.
4. **Kéo thả trực tiếp vào khung vẽ Figma**.
5. Figma sẽ tự động dàn đều toàn bộ các màn hình thành các Artboard chuẩn nét sắc sảo!
6. *(Tạo Prototype tương tác)*: Chuyển sang tab **Prototype** ở cột bên phải Figma và kéo mũi tên nối giữa các nút bấm để tạo bản demo tương tác hoàn chỉnh.

---

## 🎨 Cách 2: Biến Thành Layer Có Thể Chỉnh Sửa (.figma.json)

Nếu bạn muốn chỉnh sửa chữ, đổi màu icon, chỉnh layout từng nút bấm dạng vector:
1. Trong file Figma, nhấn phím tắt `Ctrl + /` (hoặc mở menu **Plugins**).
2. Tìm plugin miễn phí: **Builder.io (Figma to Code / HTML to Figma)** hoặc **HTML to Design**.
3. Chọn tab **Import JSON / Upload File**.
4. Chọn file `.figma.json` tương ứng với màn hình bạn muốn chỉnh sửa.
5. Plugin sẽ tự động vẽ lại cây layer Vector, Text, Button, Form chuẩn 100% theo code.

---

## 💎 Cách 3: Đồng Bộ Bảng Màu & Tokens Vào Figma Variables

1. File `00_LexiGrow_Design_Tokens.json` chứa toàn bộ bảng màu chuẩn Eduvia Design System (`#051A2E`, `#1CB886`, `#9E89FB`,...).
2. Mở plugin **Tokens Studio for Figma** (miễn phí) trong Figma.
3. Chọn **Load Tokens** > Chọn file `00_LexiGrow_Design_Tokens.json`.
4. Toàn bộ bảng màu và typography sẽ xuất hiện tự động trong Figma Variables!

---

## 📋 Danh Sách Màn Hình Đã Xuất (44 Màn Hình)

| Tên File | Phân Quyền | Tuyến Đường (Route) | Mô Tả Màn Hình |
|---|---|---|---|
| `01_Public_LandingPage.png` | PUBLIC | `/` | Trang Chủ LexiGrow |
| `02_Public_PricingPage.png` | PUBLIC | `/pricing` | Bảng Giá & Gói Dịch Vụ |
| `03_Public_AboutUs.png` | PUBLIC | `/about` | Về Chúng Tôi |
| `04_Public_Courses.png` | PUBLIC | `/courses` | Khám Phá Khóa Học Công Khai |
| `05_Public_ContactUs.png` | PUBLIC | `/contact` | Liên Hệ & Trợ Giúp |
| `06_Public_LoginPage.png` | PUBLIC | `/login` | Đăng Nhập Hệ Thống |
| `07_Public_RegisterPage.png` | PUBLIC | `/register` | Đăng Ký Tài Khoản |
| `08_Public_ForgotPassword.png` | PUBLIC | `/forgot-password` | Khôi Phục Mật Khẩu |
| `09_Student_Home.png` | STUDENT | `/student/home` | Trang Chủ Học Sinh |
| `10_Student_Dashboard.png` | STUDENT | `/student/dashboard` | Dashboard Học Tập |
| `11_Student_Onboarding.png` | STUDENT | `/student/onboarding` | Khảo Sát Mục Tiêu Ban Đầu |
| `12_Student_ExploreCourses.png` | STUDENT | `/student/explore` | Kho Khóa Học & Chủ Đề |
| `13_Student_GrowthGarden.png` | STUDENT | `/student/garden` | Vườn Tri Thức (Growth Garden) |
| `14_Student_VocabularyLibrary.png` | STUDENT | `/student/vocabulary` | Thư Viện Từ Vựng Cá Nhân |
| `15_Student_FlashcardReview.png` | STUDENT | `/student/vocabulary/review` | Ôn Tập Flashcards Lặp Lại Ngắt Quãng |
| `16_Student_GameHub.png` | STUDENT | `/student/game` | Trung Tâm Trò Chơi (Game Hub) |
| `17_Student_Game_WordMatching.png` | STUDENT | `/student/game/matching` | Game Ghép Từ (Word Matching) |
| `18_Student_Game_WordScramble.png` | STUDENT | `/student/game/scramble` | Game Xếp Từ (Word Scramble) |
| `19_Student_Game_ContextFiller.png` | STUDENT | `/student/game/filler` | Game Điền Từ Vào Ngữ Cảnh |
| `20_Student_Game_VocabHunter.png` | STUDENT | `/student/game/hunter` | Game Thợ Săn Từ Vựng (Vocab Hunter) |
| `21_Student_Game_DailyQuest.png` | STUDENT | `/student/game/daily-quest` | Nhiệm Vụ Hàng Ngày (Daily Quest) |
| `22_Student_MyProgress.png` | STUDENT | `/student/progress` | Biểu Đồ Tiến Độ Học Tập |
| `23_Student_SetGoals.png` | STUDENT | `/student/goals` | Thiết Lập Mục Tiêu Hàng Tuần |
| `24_Student_EssayHistory.png` | STUDENT | `/student/essays` | Lịch Sử Bài Viết Đã Nộp |
| `25_Student_WriteEssay.png` | STUDENT | `/student/write` | Không Gian Viết Bài Luận Tự Do |
| `26_Student_LearningSession_Step1_Vocab.png` | STUDENT | `/student/writing?set=daily-life` | Phiên Học 3 Bước - Bước 1: Từ Vựng |
| `27_Student_LearningSession_Step2_Practice.png` | STUDENT | `/student/writing?set=daily-life` | Phiên Học 3 Bước - Bước 2: Bài Tập Nhanh |
| `28_Student_ClassDetail.png` | STUDENT | `/student/class` | Chi Tiết Lớp Học Của Học Sinh |
| `29_Student_Profile.png` | STUDENT | `/profile` | Hồ Sơ & Thành Tích Học Sinh |
| `30_Student_WebSettings.png` | STUDENT | `/settings` | Cài Đặt Hệ Thống |
| `31_Teacher_Dashboard.png` | TEACHER | `/teacher/dashboard` | Dashboard Giáo Viên |
| `32_Teacher_ClassManagement.png` | TEACHER | `/teacher/classes` | Quản Lý Danh Sách Lớp Học |
| `33_Teacher_AssignmentManagement.png` | TEACHER | `/teacher/assignments` | Quản Lý Bài Tập & Hạn Nộp |
| `34_Teacher_EarlyWarningAlerts.png` | TEACHER | `/teacher/alerts` | Hệ Thống Cảnh Báo Sớm |
| `35_Teacher_SystemPrompts.png` | TEACHER | `/teacher/prompts` | Cấu Hình System Prompts AI |
| `36_Admin_Dashboard.png` | ADMIN | `/admin/dashboard` | Tổng Quan Quản Trị Hệ Thống |
| `37_Admin_Users.png` | ADMIN | `/admin/users` | Quản Lý Tài Khoản Người Dùng |
| `38_Admin_ClassManagement.png` | ADMIN | `/admin/classes` | Quản Lý Toàn Bộ Lớp Học |
| `39_Admin_AIMonitoring.png` | ADMIN | `/admin/ai-monitoring` | Giám Sát AI Providers & Quota |
| `40_Admin_Vocabulary.png` | ADMIN | `/admin/vocabulary` | Quản Lý Kho Từ Điển Gốc |
| `41_Admin_Pricing.png` | ADMIN | `/admin/pricing` | Quản Lý Gói Dịch Vụ & Thanh Toán |
| `42_Admin_AuditLogs.png` | ADMIN | `/admin/logs` | Nhật Ký Bảo Mật & Hoạt Động |
| `43_Admin_Announcements.png` | ADMIN | `/admin/announcements` | Quản Lý Thông Báo Hệ Thống |
| `44_Parent_Dashboard.png` | PARENT | `/parent/dashboard` | Dashboard Giám Sát Của Phụ Huynh |
