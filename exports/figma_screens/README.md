# Hướng Dẫn Đưa Toàn Bộ Giao Diện LexiGrow Lên Figma (100% Miễn Phí)

Thư mục này chứa toàn bộ các màn hình của hệ thống **LexiGrow** được trích xuất tự động từ ứng dụng thực tế.

> ⚠️ **LƯU Ý QUAN TRỌNG VỀ PLUGIN TRẢ PHÍ**:
> Các extension / plugin như **html.to.design** là dịch vụ thương mại có phí (giới hạn ~10 file/tháng và đòi file `.h2d`).
> **BẠN HOÀN TOÀN KHÔNG CẦN CÀI EXTENSION HAY MUA GÓI NÀY!** Hãy làm theo các cách miễn phí 100% dưới đây:

---

## 🚀 Cách 1: Kéo Thả Trực Tiếp Ảnh PNG (Nhanh nhất - 10 giây)
- **Đặc điểm**: Nhanh, chuẩn nét 2x Retina, không cần bất kỳ plugin nào.
- **Các bước thực hiện**:
  1. Mở file mới trên **Figma** (Web hoặc App).
  2. Mở thư mục này trên máy tính: `exports/figma_screens/`.
  3. Chọn tất cả các file `.png` (nhấn `Ctrl + A`).
  4. **Kéo thả chuột trực tiếp vào khung vẽ Figma** (hoặc dùng phím tắt `Ctrl + Shift + K` > chọn các file PNG).
  5. Figma sẽ tự động dàn đều toàn bộ các màn hình thành các Artboard chuẩn nét!
  6. Sang tab **Prototype** kéo mũi tên giữa các nút để chạy demo tương tác.

---

## 🎨 Cách 2: Kéo Thả File SVG (Layer Vector + Text chỉnh sửa được - 100% Miễn Phí)
- **Đặc điểm**: Mọi chữ, button, icon, form đều là **vector và text có thể click sửa trực tiếp trên Figma**, KHÔNG bị giới hạn số lượng, KHÔNG cần plugin.
- **Vị trí lưu file**:
  - Thư mục riêng: [`exports/figma_screens/svg/`](file:///home/youngltc/Documents/Coding/LexiYoungLTC/LexiGrow/exports/figma_screens/svg/)
  - Hoặc file nén trọn bộ: [`exports/figma_screens/LexiGrow_All_Screens_SVG.zip`](file:///home/youngltc/Documents/Coding/LexiYoungLTC/LexiGrow/exports/figma_screens/LexiGrow_All_Screens_SVG.zip)
- **Các bước thực hiện**:
  1. Mở Figma.
  2. Mở thư mục con [`exports/figma_screens/svg/`](file:///home/youngltc/Documents/Coding/LexiYoungLTC/LexiGrow/exports/figma_screens/svg/).
  3. Chọn các file `.svg` (ví dụ: `01_Public_LandingPage.svg`, `09_Student_Home.svg`, `31_Teacher_Dashboard.svg`,...).
  4. **Kéo thả trực tiếp vào Figma**.
  5. Figma tự động mở các layer vector, text, thẻ màu để bạn thoải mái chỉnh sửa chữ, đổi màu nút, dời vị trí components.

---

## 💎 Cách 3: Đồng Bộ Bảng Màu & Typography Vào Figma Variables
1. File `00_LexiGrow_Design_Tokens.json` chứa toàn bộ bảng màu chuẩn Eduvia Design System (`#051A2E`, `#1CB886`, `#9E89FB`,...).
2. Mở plugin miễn phí **Tokens Studio for Figma** trong Figma.
3. Chọn **Load Tokens** > Chọn file `00_LexiGrow_Design_Tokens.json`.
4. Toàn bộ bảng màu và typography sẽ xuất hiện tự động trong Figma Variables!

---

## 📋 Danh Sách Màn Hình Đã Xuất (44 Màn Hình)

| Tên File | Phân Quyền | Tuyến Đường (Route) | Mô Tả Màn Hình |
|---|---|---|---|
| `01_Public_LandingPage.png` / `01_Public_LandingPage.svg` | PUBLIC | `/` | Trang Chủ LexiGrow |
| `02_Public_PricingPage.png` / `02_Public_PricingPage.svg` | PUBLIC | `/pricing` | Bảng Giá & Gói Dịch Vụ |
| `03_Public_AboutUs.png` / `03_Public_AboutUs.svg` | PUBLIC | `/about` | Về Chúng Tôi |
| `04_Public_Courses.png` / `04_Public_Courses.svg` | PUBLIC | `/courses` | Khám Phá Khóa Học Công Khai |
| `05_Public_ContactUs.png` / `05_Public_ContactUs.svg` | PUBLIC | `/contact` | Liên Hệ & Trợ Giúp |
| `06_Public_LoginPage.png` / `06_Public_LoginPage.svg` | PUBLIC | `/login` | Đăng Nhập Hệ Thống |
| `07_Public_RegisterPage.png` / `07_Public_RegisterPage.svg` | PUBLIC | `/register` | Đăng Ký Tài Khoản |
| `08_Public_ForgotPassword.png` / `08_Public_ForgotPassword.svg` | PUBLIC | `/forgot-password` | Khôi Phục Mật Khẩu |
| `09_Student_Home.png` / `09_Student_Home.svg` | STUDENT | `/student/home` | Trang Chủ Học Sinh |
| `10_Student_Dashboard.png` / `10_Student_Dashboard.svg` | STUDENT | `/student/dashboard` | Dashboard Học Tập |
| `11_Student_Onboarding.png` / `11_Student_Onboarding.svg` | STUDENT | `/student/onboarding` | Khảo Sát Mục Tiêu Ban Đầu |
| `12_Student_ExploreCourses.png` / `12_Student_ExploreCourses.svg` | STUDENT | `/student/explore` | Kho Khóa Học & Chủ Đề |
| `13_Student_GrowthGarden.png` / `13_Student_GrowthGarden.svg` | STUDENT | `/student/garden` | Vườn Tri Thức (Growth Garden) |
| `14_Student_VocabularyLibrary.png` / `14_Student_VocabularyLibrary.svg` | STUDENT | `/student/vocabulary` | Thư Viện Từ Vựng Cá Nhân |
| `15_Student_FlashcardReview.png` / `15_Student_FlashcardReview.svg` | STUDENT | `/student/vocabulary/review` | Ôn Tập Flashcards Lặp Lại Ngắt Quãng |
| `16_Student_GameHub.png` / `16_Student_GameHub.svg` | STUDENT | `/student/game` | Trung Tâm Trò Chơi (Game Hub) |
| `17_Student_Game_WordMatching.png` / `17_Student_Game_WordMatching.svg` | STUDENT | `/student/game/matching` | Game Ghép Từ (Word Matching) |
| `18_Student_Game_WordScramble.png` / `18_Student_Game_WordScramble.svg` | STUDENT | `/student/game/scramble` | Game Xếp Từ (Word Scramble) |
| `19_Student_Game_ContextFiller.png` / `19_Student_Game_ContextFiller.svg` | STUDENT | `/student/game/filler` | Game Điền Từ Vào Ngữ Cảnh |
| `20_Student_Game_VocabHunter.png` / `20_Student_Game_VocabHunter.svg` | STUDENT | `/student/game/hunter` | Game Thợ Săn Từ Vựng (Vocab Hunter) |
| `21_Student_Game_DailyQuest.png` / `21_Student_Game_DailyQuest.svg` | STUDENT | `/student/game/daily-quest` | Nhiệm Vụ Hàng Ngày (Daily Quest) |
| `22_Student_MyProgress.png` / `22_Student_MyProgress.svg` | STUDENT | `/student/progress` | Biểu Đồ Tiến Độ Học Tập |
| `23_Student_SetGoals.png` / `23_Student_SetGoals.svg` | STUDENT | `/student/goals` | Thiết Lập Mục Tiêu Hàng Tuần |
| `24_Student_EssayHistory.png` / `24_Student_EssayHistory.svg` | STUDENT | `/student/essays` | Lịch Sử Bài Viết Đã Nộp |
| `25_Student_WriteEssay.png` / `25_Student_WriteEssay.svg` | STUDENT | `/student/write` | Không Gian Viết Bài Luận Tự Do |
| `26_Student_LearningSession_Step1_Vocab.png` / `26_Student_LearningSession_Step1_Vocab.svg` | STUDENT | `/student/writing?set=daily-life` | Phiên Học 3 Bước - Bước 1: Từ Vựng |
| `27_Student_LearningSession_Step2_Practice.png` / `27_Student_LearningSession_Step2_Practice.svg` | STUDENT | `/student/writing?set=daily-life` | Phiên Học 3 Bước - Bước 2: Bài Tập Nhanh |
| `28_Student_ClassDetail.png` / `28_Student_ClassDetail.svg` | STUDENT | `/student/class` | Chi Tiết Lớp Học Của Học Sinh |
| `29_Student_Profile.png` / `29_Student_Profile.svg` | STUDENT | `/profile` | Hồ Sơ & Thành Tích Học Sinh |
| `30_Student_WebSettings.png` / `30_Student_WebSettings.svg` | STUDENT | `/settings` | Cài Đặt Hệ Thống |
| `31_Teacher_Dashboard.png` / `31_Teacher_Dashboard.svg` | TEACHER | `/teacher/dashboard` | Dashboard Giáo Viên |
| `32_Teacher_ClassManagement.png` / `32_Teacher_ClassManagement.svg` | TEACHER | `/teacher/classes` | Quản Lý Danh Sách Lớp Học |
| `33_Teacher_AssignmentManagement.png` / `33_Teacher_AssignmentManagement.svg` | TEACHER | `/teacher/assignments` | Quản Lý Bài Tập & Hạn Nộp |
| `34_Teacher_EarlyWarningAlerts.png` / `34_Teacher_EarlyWarningAlerts.svg` | TEACHER | `/teacher/alerts` | Hệ Thống Cảnh Báo Sớm |
| `35_Teacher_SystemPrompts.png` / `35_Teacher_SystemPrompts.svg` | TEACHER | `/teacher/prompts` | Cấu Hình System Prompts AI |
| `36_Admin_Dashboard.png` / `36_Admin_Dashboard.svg` | ADMIN | `/admin/dashboard` | Tổng Quan Quản Trị Hệ Thống |
| `37_Admin_Users.png` / `37_Admin_Users.svg` | ADMIN | `/admin/users` | Quản Lý Tài Khoản Người Dùng |
| `38_Admin_ClassManagement.png` / `38_Admin_ClassManagement.svg` | ADMIN | `/admin/classes` | Quản Lý Toàn Bộ Lớp Học |
| `39_Admin_AIMonitoring.png` / `39_Admin_AIMonitoring.svg` | ADMIN | `/admin/ai-monitoring` | Giám Sát AI Providers & Quota |
| `40_Admin_Vocabulary.png` / `40_Admin_Vocabulary.svg` | ADMIN | `/admin/vocabulary` | Quản Lý Kho Từ Điển Gốc |
| `41_Admin_Pricing.png` / `41_Admin_Pricing.svg` | ADMIN | `/admin/pricing` | Quản Lý Gói Dịch Vụ & Thanh Toán |
| `42_Admin_AuditLogs.png` / `42_Admin_AuditLogs.svg` | ADMIN | `/admin/logs` | Nhật Ký Bảo Mật & Hoạt Động |
| `43_Admin_Announcements.png` / `43_Admin_Announcements.svg` | ADMIN | `/admin/announcements` | Quản Lý Thông Báo Hệ Thống |
| `44_Parent_Dashboard.png` / `44_Parent_Dashboard.svg` | PARENT | `/parent/dashboard` | Dashboard Giám Sát Của Phụ Huynh |
