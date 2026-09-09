# BÁO CÁO 01: CHI TIẾT CÁC LUỒNG HOẠT ĐỘNG VÀ ĐÁNH GIÁ ĐỐI TƯỢNG MỤC TIÊU (LEXIGROW)

---

**Dự án:** LexiGrow - Nền tảng Nâng cao Vốn từ vựng Chủ động & Luyện Viết Luận Học Thuật cùng AI  
**Phiên bản:** 1.0.0 Production  
**Ngày lập báo cáo:** 09/09/2026  
**Người thực hiện:** Đội ngũ Kiến trúc Hệ thống & AI Product Team  

---

## MỤC LỤC
1. [TỔNG QUAN HỆ THỐNG VÀ 4 VAI TRÒ NGƯỜI DÙNG](#1-tổng-quan-hệ-thống-và-4-vai-trò-người-dùng)
2. [CHI TIẾT CÁC LUỒNG HOẠT ĐỘNG CHÍNH (USER FLOWS)](#2-chi-tiết-các-luồng-hoạt-động-chính-user-flows)
   - 2.1. Luồng Đăng ký, Xác thực & Phân quyền (Authentication & Onboarding)
   - 2.2. Luồng Khám phá & Chọn chủ đề (Explore Words)
   - 2.3. Luồng Phiên học Sâu 5 bước (5-Step Interactive Learning Session)
   - 2.4. Luồng Luyện tập & Ghi nhớ dài hạn (SRS Spaced Repetition & Growth Garden)
   - 2.5. Luồng Trò chơi Tư duy Hàng ngày (Daily Word Quest)
   - 2.6. Luồng Quản lý Lớp học & Giao bài của Giáo viên (Teacher & Assignment)
   - 2.7. Luồng Giám sát & Báo cáo của Phụ huynh (Parent Portal)
   - 2.8. Luồng Đăng ký Gói cước & Bảo trợ Lớp học (PayOS Payment & Sponsorship)
   - 2.9. Luồng Quản trị Toàn diện (Admin Dashboard)
3. [ĐÁNH GIÁ ĐỘ PHÙ HỢP CỦA DỰ ÁN VỚI CÁC ĐỐI TƯỢNG MỤC TIÊU](#3-đánh-giá-độ-phù-hợp-của-dự-án-với-các-đối-tượng-mục-tiêu)
   - 3.1. Bảng Ma trận Đối tượng & Mức độ Product-Market Fit
   - 3.2. Phân tích chi tiết từng phân khúc người dùng
4. [PHÂN TÍCH SWOT CỦA HỆ THỐNG HIỆN TẠI](#4-phân-tích-swot-của-hệ-thống-hiện-tại)
5. [KẾT LUẬN & ĐỀ XUẤT ĐỊNH VỊ CHIẾN LƯỢC](#5-kết-luận--đề-xuất-định-vị-chiến-lược)

---

## 1. TỔNG QUAN HỆ THỐNG VÀ 4 VAI TRÒ NGƯỜI DÙNG

LexiGrow là nền tảng EdTech kết hợp Trí tuệ Nhân tạo (AI) giúp giải quyết bài toán cốt lõi của người học ngoại ngữ: **Chuyển hóa từ vựng thụ động (Receptive Vocabulary - chỉ biết nghĩa khi đọc) thành từ vựng chủ động (Productive Vocabulary - sử dụng chuẩn xác, tự nhiên trong bài viết luận thực tế).**

Hệ thống phân quyền Role-Based Access Control (RBAC) nghiêm ngặt gồm 4 phân hệ độc lập:
1. 🎓 **Học sinh (Student):** Trung tâm trải nghiệm học tập, viết luận, luyện từ vựng và nhận phản hồi AI tức thì.
2. 👩‍🏫 **Giáo viên (Teacher):** Quản lý lớp học, phân tích lỗi sai từ vựng của học sinh, giao bài tập và bảo trợ gói học Pro cho học sinh.
3. 👨‍👩‍👦 **Phụ huynh (Parent):** Theo dõi thời gian thực tiến độ học tập, tần suất làm bài và nhận cảnh báo sớm khi con gặp lỗ hổng kiến thức.
4. 🛡️ **Quản trị viên (Admin):** Quản lý người dùng, ngân hàng từ vựng toàn cầu (Global Vocabulary), cấu hình gói cước (Pricing Plans), hệ thống và nhật ký kiểm toán (Audit Logs).

```
                                  ┌───────────────────────────┐
                                  │   LEXIGROW CORE ENGINE    │
                                  │ (Auth, AI, SRS, Database) │
                                  └─────────────┬─────────────┘
                                                │
         ┌───────────────────┬──────────────────┴─────────────────┬───────────────────┐
         ▼                   ▼                                    ▼                   ▼
  ┌──────────────┐    ┌──────────────┐                     ┌──────────────┐    ┌──────────────┐
  │   STUDENT    │    │   TEACHER    │                     │    PARENT    │    │    ADMIN     │
  │ • Onboarding │    │ • Class Hub  │                     │ • Child Link │    │ • User Mgmt  │
  │ • Explore    │    │ • Assignment │                     │ • Progress   │    │ • Vocab Bank │
  │ • 5-Step Ssn │    │ • Heatmap    │                     │ • Alerts     │    │ • Subscriptions
  │ • Garden/SRS │    │ • Sponsor Pro│                     │ • Reports    │    │ • Audit Logs │
  └──────────────┘    └──────────────┘                     └──────────────┘    └──────────────┘
```

---

## 2. CHI TIẾT CÁC LUỒNG HOẠT ĐỘNG CHÍNH (USER FLOWS)

### 2.1. Luồng Đăng ký, Xác thực & Phân quyền (Authentication & Onboarding)
* **Khởi tạo tài khoản:** Người dùng đăng ký bằng Email/Mật khẩu hoặc Google OAuth (GSI Client).
* **Xác thực bảo mật:** Mã OTP 6 chữ số được gửi qua email (hạn 10 phút, mã hóa trong MongoDB).
* **Onboarding độc lập (Chỉ dành cho Student):**
  - **Bước 1 - Mục tiêu Trình độ (Target CEFR):** Chọn trình độ hướng tới (A2, B1, B2, C1).
  - **Bước 2 - Sở thích & Chủ đề quan tâm:** Chọn tối thiểu 1 chủ đề (Technology, Business, Travel, Daily Life, Science...).
  - **Bước 3 - Nhịp độ học tập (Daily Pace):** Thiết lập 5, 10, 15 hoặc 20 phút mỗi ngày.
  - **Bước 4 - Khởi tạo Lộ trình AI:** Hệ thống tổng hợp hồ sơ và hiển thị Hero Preview về lộ trình học cá nhân hóa. Người dùng có thể quay lại điều chỉnh lộ trình bất cứ lúc nào tại trang Cài đặt (Profile Settings).

### 2.2. Luồng Khám phá & Chọn chủ đề (Explore Words)
* **Bộ sưu tập Thematic Sets:** Cung cấp 12+ bộ chủ đề đa dạng từ A2 đến C1.
* **Bộ lọc thích ứng:** Lọc theo cấp độ CEFR hoặc tìm kiếm từ khóa. Mỗi Card hiển thị: 3 từ vựng tiêu biểu, thời lượng ước tính (10-12 phút), huy hiệu cấp độ và tiến độ đã học.
* **Không giới hạn lượt học:** Sau khi hoàn thành một bộ từ, người học có thể chọn ngay bộ tiếp theo trong ngày mà không bị chặn cứng.

### 2.3. Luồng Phiên học Sâu 5 bước (5-Step Interactive Learning Session)
Đây là trái tim của hệ thống LexiGrow:
* **Step 1 - Word Lesson (Học sâu từ vựng):** Khám phá 3 từ lõi kèm phiên âm IPA chuẩn, audio phát âm bản xứ, định nghĩa tiếng Việt/tiếng Anh, ví dụ thực tế và các cụm từ kết hợp cố định (Collocations đắt giá).
* **Step 2 - Formative Practice (Luyện tập ngữ cảnh):** Trắc nghiệm ngữ cảnh động kiểm tra độ hiểu từ trước khi viết bài.
* **Step 3 - Smart Writing (Viết luận ứng dụng):** Đề bài theo chủ đề yêu cầu viết đoạn văn (60-100 từ) có chứa 3 từ lõi. Hệ thống tích hợp **Live Word Detector** (thanh tiến trình đếm số từ đã dùng chuẩn xác thời gian thực).
* **Step 4 - Revision & AI Feedback (Phân tích & So sánh Before/After):** AI chấm bài theo 4 tiêu chí quốc tế, tô màu điểm sửa lỗi ngữ pháp, nâng cấp từ vựng học thuật và giải thích chi tiết lý do cải thiện.
* **Step 5 - Completion & Evidence Logging (Ghi nhận bằng chứng):** Nạp từ vào hồ sơ năng lực (*Evidence Portfolio*), cộng điểm kinh nghiệm (XP) và mở khóa lượt học tiếp theo.

### 2.4. Luồng Luyện tập & Ghi nhớ dài hạn (SRS Spaced Repetition & Growth Garden)
* **Thuật toán SuperMemo-2 (SM-2):** Tự động tính toán khoảng cách ngày ôn tập tối ưu (1 ngày, 3 ngày, 7 ngày, 14 ngày, 30 ngày) dựa trên chất lượng tự đánh giá của người học (Again, Hard, Good, Easy).
* **Vườn tri thức (Growth Garden):** Biến từ vựng thành các mầm cây ảo:
  - Mới học: *Sprout (Mầm non)*
  - Đang ôn tập: *Sapling (Cây non)*
  - Đã thuần thục: *Mastered Tree (Cây đại thụ có hoa)*
  - Quá hạn ôn tập: *Thirsty (Cây khát nước)*
* **Quy chuẩn Chống gian lận Mastery:** Từ vựng chỉ đạt danh hiệu "Mastered" khi người học sử dụng đúng trong **ít nhất 2 bài viết độc lập ở 2 ngày khác nhau** và không có sự can thiệp sửa bài trợ giúp của AI.

### 2.5. Luồng Trò chơi Tư duy Hàng ngày (Daily Word Quest)
* Trò chơi ô chữ đan chéo (Crossword Puzzle) 7x7 hoặc 9x9 tạo mới mỗi ngày lúc 00:00 UTC.
* Cơ chế chơi: Đọc manh mối định nghĩa tiếng Anh, điền chữ cái vào lưới.
* Phần thưởng: 1 Đom đóm tri thức (Firefly) cộng vào hồ sơ mỗi ngày, tích lũy duy trì chuỗi Streak.

### 2.6. Luồng Quản lý Lớp học & Giao bài của Giáo viên (Teacher & Assignment)
* **Tạo lớp & Mã tham gia (Join Code):** Giáo viên tạo lớp học trực tuyến, cấp mã 6 ký tự để học sinh tham gia tự động.
* **Giao bài tập kèm bộ từ mục tiêu:** Giáo viên chọn chủ đề, hạn nộp (Deadline), bộ từ vựng bắt buộc.
* **Bản đồ nhiệt lỗi sai (Class Lexical Heatmap):** Thống kê từ vựng và cấu trúc ngữ pháp mà cả lớp hay dùng sai nhiều nhất để giáo viên giảng lại trên lớp.
* **Cảnh báo sớm (Early Warning System):** Thuật toán tự động phát hiện học sinh tụt giảm streak, điểm bài viết thấp hoặc bỏ bài quá 7 ngày để thông báo giáo viên.

### 2.7. Luồng Giám sát & Báo cáo của Phụ huynh (Parent Portal)
* **Liên kết tài khoản an toàn:** Phụ huynh nhập mã liên kết của con hoặc gửi yêu cầu kết nối.
* **Dashboard thời gian thực:** Xem tổng số từ con đã học, số bài viết đã hoàn thành, thời gian học trung bình và các từ con đang gặp khó khăn (*Struggling Words*).
* **Báo cáo định kỳ:** Tóm tắt tiến độ hàng tuần giúp phụ huynh đồng hành cùng con mà không tạo áp lực.

### 2.8. Luồng Đăng ký Gói cước & Bảo trợ Lớp học (PayOS Payment & Sponsorship)
* **Cổng thanh toán PayOS:** Tạo link thanh toán QR Code VietQR chuyển khoản nhanh trong 3 giây.
* **Xác thực chữ ký số HMAC SHA-256:** Webhook tự động kích hoạt gói ngay sau khi chuyển khoản thành công.
* **Cơ chế Thừa hưởng Bảo trợ (Teacher Sponsorship Inheritance):** Học sinh trong lớp học của Giáo viên sở hữu gói Pro/Ultra sẽ tự động được mở khóa toàn bộ quyền lợi Pro không giới hạn mà không cần bỏ tiền túi.

### 2.9. Luồng Quản trị Toàn diện (Admin Dashboard)
* Quản lý người dùng (khóa, mở khóa, phê duyệt tài khoản giáo viên).
* Quản lý ngân hàng từ vựng Global (thêm, sửa, duyệt từ vựng chuẩn).
* Quản lý cấu hình gói cước, giá tiền, hạn mức AI.
* Xem nhật ký kiểm toán (Audit Logs) đảm bảo an toàn dữ liệu và tuân thủ an ninh.

---

## 3. ĐÁNH GIÁ ĐỘ PHÙ HỢP CỦA DỰ ÁN VỚI CÁC ĐỐI TƯỢNG MỤC TIÊU

### 3.1. Bảng Ma trận Đối tượng & Mức độ Product-Market Fit (PMF)

| Nhóm Đối tượng Mục tiêu | Nỗi đau cốt lõi (Pain Points) | Giải pháp LexiGrow mang lại | Điểm phù hợp (PMF Score /10) | Mức độ Ưu tiên Khai thác |
| :--- | :--- | :--- | :---: | :---: |
| 🎯 **Thí sinh Luyện thi IELTS / TOEFL (Band 5.0 - 7.5)** | Học nhiều từ vựng nhưng khi viết Writing Task 2 chỉ dùng từ vựng A2/B1; bị trừ điểm *Lexical Resource* và sai *Collocations*. | Cơ chế học 3 từ kèm Collocations học thuật; AI chấm 4 tiêu chí chuẩn IELTS; so sánh bản sửa Before/After chi tiết. | **9.5 / 10** | 🔴 **Chiến lược số 1** |
| 🎓 **Học sinh THPT & Luyện thi Đại học / Chuyên Anh** | Quá tải bài tập ngữ pháp, thiếu môi trường viết thực tế; giáo viên trên trường không có đủ thời gian sửa chi tiết từng bài viết. | Bài học ngắn 10 phút phù hợp lịch học dày đặc; AI phản hồi lỗi tức thì; ngân hàng từ vựng bám sát khung chuẩn. | **9.0 / 10** | 🔴 **Chiến lược số 1** |
| 👩‍🏫 **Giáo viên Tiếng Anh Tự do / Gia sư (Freelance Teachers)** | Mất 30-45 phút để chấm 1 bài luận cho học sinh; khó theo dõi tiến độ nhớ từ của từng em trong lớp. | Tiết kiệm 80% thời gian chấm bài nhờ AI sơ loại; Heatmap thống kê lỗi cả lớp; tính năng bảo trợ Pro thu hút học viên. | **9.2 / 10** | 🔴 **Chiến lược số 1** |
| 🏫 **Trung tâm Ngoại ngữ & Trường Song ngữ** | Khó chuẩn hóa chất lượng trợ giảng; thiếu công cụ báo cáo minh bạch cho phụ huynh; chi phí mua phần mềm nước ngoài quá đắt. | Quản lý đa lớp học; Dashboard báo cáo phụ huynh minh bạch; tích hợp cổng thanh toán nội địa giá hợp lý. | **8.5 / 10** | 🟡 **Giai đoạn 2 (B2B)** |
| 👨‍💼 **Người đi làm cần cải thiện Email & Báo cáo Tiếng Anh** | Vốn từ hạn hẹp trong giao tiếp công việc; sợ viết sai ngữ pháp hoặc diễn đạt thiếu trang trọng (*Inappropriate Tone*). | Chủ đề Business & Technology; AI gợi ý văn phong chuyên nghiệp; học linh hoạt 10 phút giờ nghỉ trưa. | **8.0 / 10** | 🟡 **Giai đoạn 2** |
| 👨‍👩‍👦 **Phụ huynh có con từ 10 - 18 tuổi** | Không giỏi tiếng Anh để kèm con học; không biết con có thực sự tiến bộ hay chỉ đang chơi game. | Cổng thông tin Parent Portal cập nhật liên tục; nhận thông báo khi con học chăm hoặc cần hỗ trợ. | **8.8 / 10** | 🟢 **Đối tượng tài trợ (Buyer)** |

---

### 3.2. Phân tích chi tiết từng phân khúc người dùng

#### Phân khúc 1: Thí sinh IELTS & Học sinh THPT (B2C - Core Users)
* **Hành vi:** Có động lực học tập cực kỳ cao vì gắn liền với kỳ thi chứng chỉ hoặc tốt nghiệp. Sẵn sàng trả phí từ 59k - 99k/tháng nếu thấy rõ sự tiến bộ sau 2 tuần.
* **Đánh giá tính năng:** Tính năng **Revision Comparison (So sánh Before/After)** và **Live Word Tracker** là 2 tính năng "chốt sale" mạnh nhất đối với nhóm này.

#### Phân khúc 2: Giáo viên & Gia sư Tiếng Anh (B2B2C - Growth Channel)
* **Hành vi:** Giáo viên luôn tìm kiếm công cụ giảm tải việc chấm bài về nhà. Gói **Teacher Pro (bảo trợ 60 học sinh)** tạo ra hiệu ứng lan truyền (*Network Effect*): 1 giáo viên mua gói sẽ kéo theo 30 - 60 học sinh sử dụng nền tảng mỗi ngày.
* **Đánh giá tính năng:** Bảng nhiệt lỗi sai (*Lexical Heatmap*) và tính năng Giao bài tập (*Assignments*) là điểm mấu chốt giữ chân giáo viên.

#### Phân khúc 3: Phụ huynh (The Economic Buyer)
* **Hành vi:** Người bỏ tiền thanh toán gói học cho học sinh cấp 2 và cấp 3. Họ không trực tiếp làm bài tập nhưng cần sự **an tâm và minh bạch**.
* **Đánh giá tính năng:** Việc có báo cáo tiến độ tuần và thông báo tự động (*Parent Alerts*) giúp tăng tỷ lệ gia hạn gói (*Retention Rate*) lên trên 70%.

---

## 4. PHÂN TÍCH SWOT CỦA HỆ THỐNG HIỆN TẠI

```
┌───────────────────────────────────────────────┬───────────────────────────────────────────────┐
│               STRENGTHS (ĐIỂM MẠNH)           │             WEAKNESSES (ĐIỂM CẦN CẢI THIỆN)   │
├───────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ • Phương pháp Micro-Deep Learning 3 từ chuẩn  │ • Chưa có ứng dụng Native iOS/Android (chỉ PWA│
│   khoa học nhận thức, tránh quá tải não bộ.   │   và Web Responsive).                         │
│ • AI phản hồi 4 tiêu chí chuẩn xác, tốc độ    │ • Chưa tích hợp giọng đọc AI luyện Nói (Voice │
│   cao (Groq/Llama-3 & Claude fallback).       │   Speaking & Pronunciation Assessment).       │
│ • Luồng 5 bước hoàn chỉnh, có bằng chứng học. │ • Giao diện Daily Quest ô chữ còn tĩnh, chưa  │
│ • Cơ chế Teacher Sponsorship độc đáo, tạo lan │   có nhiều hiệu ứng âm thanh/hạt sinh động.   │
│   truyền lớp học tự nhiên.                    │ • Chưa có cổng thanh toán tự động định kỳ     │
│ • Tích hợp PayOS thanh toán QR 3 giây.        │   (Auto-recurring card subscription).         │
├───────────────────────────────────────────────┼───────────────────────────────────────────────┤
│            OPPORTUNITIES (CƠ HỘI)             │               THREATS (THÁCH THỨC)            │
├───────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ • Nhu cầu học thi IELTS & Viết luận Tiếng Anh │ • Chi phí token AI LLM có thể tăng nếu không  │
│   tại Việt Nam và Đông Nam Á tăng trưởng 25%/năm│  tối ưu cache và prompt engineering tốt.    │
│ • Xu hướng phụ huynh đầu tư mạnh cho EdTech AI│ • Các ứng dụng lớn (Duolingo, Elsa Speak) có  │
│   có báo cáo tiến độ minh bạch.               │   thể mở rộng thêm tính năng viết luận.       │
│ • Hợp tác trực tiếp với các trường THPT và   │ • Tâm lý người dùng ngại trả phí nếu bản Free │
│   trung tâm luyện thi trên toàn quốc.         │   quá đầy đủ hoặc ngược lại nếu paywall quá gắt│
└───────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 5. KẾT LUẬN & ĐỀ XUẤT ĐỊNH VỊ CHIẾN LƯỢC

1. **Định vị sản phẩm:** LexiGrow không cạnh tranh trực tiếp với các ứng dụng học từ vẹt (như Quizlet/Anki) hay ứng dụng phát âm (Elsa), mà định vị là **"Chuyên gia AI Luyện Viết Luận & Từ vựng Chủ động số 1 cho người học IELTS và học sinh Việt Nam"**.
2. **Kênh tiếp cận khách hàng tối ưu nhất (Go-to-Market):**
   - **Kênh 1 (B2B2C):** Tiếp cận qua Giáo viên/Gia sư dạy IELTS. Tặng gói Teacher Pro trải nghiệm 1 tháng để họ đưa cả lớp vào học.
   - **Kênh 2 (B2C Organic):** Chia sẻ các bài phân tích lỗi sai và mẫu bài viết Before/After trên các hội nhóm luyện thi IELTS, THPT Quốc Gia và TikTok/Reels giáo dục.
3. **Mức độ hoàn thiện luồng người dùng:** Đã đạt **95% mức sẵn sàng vận hành**. Toàn bộ 4 luồng người dùng (Student, Teacher, Parent, Admin) đã thông suốt từ khâu đăng ký, học tập, chấm bài đến thanh toán.

---
*Báo cáo được lưu trữ tại file `docs/report/01_LUONG_HOAT_DONG_VA_DOI_TUONG_MUC_TIEU.md`.*
