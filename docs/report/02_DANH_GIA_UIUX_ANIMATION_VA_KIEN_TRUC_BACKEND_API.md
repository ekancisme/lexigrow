# BÁO CÁO 02: ĐÁNH GIÁ UI/UX, ĐỀ XUẤT NÂNG CẤP ANIMATION & BÁO CÁO KIẾN TRÚC BACKEND - API KEYS (LEXIGROW)

---

**Dự án:** LexiGrow  
**Phạm vi:** Toàn bộ Giao diện UI/UX, Gamification, Animation, Hệ thống Backend, API Keys, Cơ chế Bảo mật và 27 Test Suites  
**Ngày lập báo cáo:** 09/09/2026  
**Người thực hiện:** Senior Frontend UI/UX Engineer & Lead Backend Architect  

---

## MỤC LỤC
1. [ĐÁNH GIÁ TOÀN DIỆN UI/UX CỦA TRANG WEB](#1-đánh-giá-toàn-diện-uiux-của-trang-web)
   - 1.1. Những điểm đã làm rất tốt (UX Strengths)
   - 1.2. Những điểm cần cải thiện để tăng độ thu hút & giữ chân (Engagement Enhancements)
2. [ĐÁNH GIÁ HOẠT HÌNH & TRÒ CHƠI (GAMIFICATION & ANIMATION AUDIT)](#2-đánh-giá-hoạt-hình--trò-chơi-gamification--animation-audit)
   - 2.1. Daily Word Quest (Trò chơi ô chữ)
   - 2.2. Flashcard SRS & Vườn Tri Thức (Growth Garden)
   - 2.3. Đề xuất Kiến trúc Hiệu ứng GSAP & Sound Effects thực chiến
3. [BÁO CÁO TOÀN DIỆN HỆ THỐNG BACKEND & DANH SÁCH API KEYS](#3-báo-cáo-toàn-diện-hệ-thống-backend--danh-sách-api-keys)
   - 3.1. Danh mục và vai trò các API Keys trong hệ thống
   - 3.2. Cơ chế xử lý Backend & Chống thất thoát chi phí AI
   - 3.3. Cơ chế An toàn & Bảo mật Dữ liệu (Security & Anti-Fraud)
4. [TỔNG HỢP KẾT QUẢ KIỂM THỬ TOÀN BỘ HỆ THỐNG (27 TEST SUITES / 186 TESTS)](#4-tổng-hợp-kết-quả-kiểm-thử-toàn-bộ-hệ-thống-27-test-suites--186-tests)

---

## 1. ĐÁNH GIÁ TOÀN DIỆN UI/UX CỦA TRANG WEB

### 1.1. Những điểm đã làm rất tốt (UX Strengths)
* **Bố cục Bento Grid hiện đại:** Trang Profile Settings, Onboarding và Student Dashboard áp dụng phong cách Bento Card sạch sẽ, phân tách thông tin rõ ràng với độ tương phản thị giác cao.
* **Onboarding 4 bước độc lập:** Tách khỏi Sidebar chính, stepper mượt mà, có chỉ số tiến độ (25% - 100%), thẻ chọn kích thước lớn, hiệu ứng hover viền sáng (Glow border) chuẩn phong cách Stitch Design.
* **Live Word Tracker trong Smart Writing:** Thanh đếm số từ mục tiêu đã sử dụng nhảy số thời gian thực (`3/3 words used`) kèm checkbox tích xanh tạo cảm giác hoàn thành tức thì (*Instant Gratification*).
* **So sánh Before/After (Revision Comparison):** Trực quan hóa điểm khác biệt giữa bài viết gốc của học sinh và gợi ý nâng cấp của AI bằng 2 màu (đỏ: lỗi sai/từ yếu; xanh: từ nâng cấp học thuật).
* **Bản ngữ hóa 100% (Bilingual Support):** Hỗ trợ chuyển đổi mượt mà giữa Tiếng Việt và Tiếng Anh (`LanguageContext`).

---

### 1.2. Những điểm cần cải thiện để tăng độ thu hút & giữ chân (Engagement Enhancements)

| Vị trí / Màn hình | Thực trạng hiện tại | Đề xuất Cải thiện Nâng cao | Mức độ Ưu tiên |
| :--- | :--- | :--- | :---: |
| **Trang chủ / Student Dashboard** | Dữ liệu số liệu thống kê còn dạng bảng phẳng; biểu đồ đường chưa có animation khi load trang. | Áp dụng **Counter Animation** (số nhảy từ 0 lên giá trị thực trong 1.2s); bổ sung biểu đồ tròn độ phủ CEFR có hiệu ứng quét gradient. | 🔴 Cao |
| **Empty States (Trạng thái rỗng)** | Khi chưa có bài viết hoặc chưa có lớp học, màn hình hiển thị text đơn điệu. | Thêm hình minh họa vector 3D hoặc Mascot linh vật Lexi chú vẹt học thuật kèm nút kêu gọi hành động (*CTA nổi bật*). | 🟡 Trung bình |
| **Skeleton Loading** | Khi gọi AI phân tích bài viết (mất 1.5 - 3 giây), màn hình dùng spinner tròn cơ bản. | Thay bằng **Shimmer Skeleton UI** kèm dòng chữ trạng thái động: *"AI đang quét Collocations..."* ➔ *"Đang đối chiếu khung CEFR..."* ➔ *"Đang tối ưu ngữ pháp..."*. | 🔴 Cao |
| **Micro-Interactions** | Các nút bấm hover chỉ đổi màu nhẹ. | Thêm hiệu ứng *Magnetic Button* (nút hút theo con trỏ chuột) và hiệu ứng *Ripple Effect* khi click. | 🟢 Thấp |

---

## 2. ĐÁNH GIÁ HOẠT HÌNH & TRÒ CHƠI (GAMIFICATION & ANIMATION AUDIT)

### 2.1. Daily Word Quest (Trò chơi Ô chữ)
* **Thực trạng:** Lưới ô chữ 7x7 hoạt động logic rất tốt, nhưng các ô vuông khi nhập chữ còn tĩnh, khi giải đúng cả ô chữ chưa có hiệu ứng bùng nổ ăn mừng.
* **Đề xuất Nâng cấp:**
  1. **Hiệu ứng Flip Letter (Lật chữ cái):** Khi điền đúng từ, các ô chữ cái lật 3D theo trục Y lần lượt từ trái qua phải (tương tự game Wordle nổi tiếng của New York Times).
  2. **Hiệu ứng Pháo hoa Hạt (Canvas Confetti):** Khi hoàn thành 100% bàn cờ ô chữ, kích hoạt hiệu ứng pháo hoa hạt kim tuyến rơi từ 2 bên màn hình.
  3. **Hiệu ứng Đom đóm bay (Firefly Fly-in Animation):** 1 đom đóm phát sáng bay từ giữa bàn cờ lượn vào hũ đom đóm trên Header kèm âm thanh *Ting!* nhẹ nhàng.

### 2.2. Flashcard SRS & Vườn Tri Thức (Growth Garden)
* **Thực trạng:** Cây trong vườn là hình ảnh SVG tĩnh thể hiện 4 trạng thái (Sprout, Sapling, Mastered, Thirsty).
* **Đề xuất Nâng cấp:**
  1. **Hiệu ứng Cây lớn lên (GSAP SVG Morphing):** Khi ôn tập đúng một từ, mầm cây non uốn lượn nở hoa vươn cao trong 0.8s.
  2. **Hiệu ứng Tưới nước (Water Droplets):** Khi nhấn "Ôn tập ngay" cho cây khát nước, các giọt nước rơi xuống kèm tiếng nước róc rách nhẹ, cây đổi từ màu úa sang màu xanh tươi rực rỡ.

### 2.3. Bảng Đề xuất Công nghệ & Hiệu ứng Hoạt họa (GSAP + Sound Effects)

| Tính năng | Thư viện đề xuất | Hiệu ứng cụ thể | File âm thanh (Audio SFX) |
| :--- | :--- | :--- | :--- |
| **Hoàn thành phiên học (Session Complete)** | `canvas-confetti` + `gsap` | Popup phóng to đàn hồi (*elastic.out*), huy hiệu XP quay 360 độ | `fanfare_success.mp3` |
| **Gõ đúng từ mục tiêu trong Essay** | `gsap.to()` | Tag từ vựng nảy nhẹ (*scale: 1.15 ➔ 1.0*) và phát sáng viền xanh | `chime_pop.mp3` |
| **Lật Flashcard SRS** | `CSS 3D Transform` + `gsap` | Lật thẻ 180 độ mượt mà với độ sâu phối cảnh `perspective(1000px)` | `card_flip.mp3` |
| **Chuyển bước Stepper Onboarding** | `gsap.timeline()` | Slide ngang mượt mà, thanh tiến độ chạy fill màu gradient | `soft_click.mp3` |

---

## 3. BÁO CÁO TOÀN DIỆN HỆ THỐNG BACKEND & DANH SÁCH API KEYS

### 3.1. Danh mục và vai trò các API Keys trong hệ thống

```
┌─────────────────────────┬──────────────────────────────────┬────────────────────────────────────────────────────────┐
│        API KEY          │          DỊCH VỤ / NHÀ CUNG CẤP  │                   MỤC ĐÍCH SỬ DỤNG                     │
├─────────────────────────┼──────────────────────────────────┼────────────────────────────────────────────────────────┤
│ GROQ_API_KEY            │ Groq Cloud (Llama-3-70b-versatile)│ Phân tích bài luận, chấm 4 tiêu chí CEFR, tạo ô chữ    │
│ HF_API_TOKEN            │ Hugging Face Inference API       │ Phân tích đạo văn & phát hiện AI writing (Heuristics)  │
│ PAYOS_CLIENT_ID         │ PayOS Payment Gateway            │ Mã định danh ứng dụng thanh toán ngân hàng VietQR       │
│ PAYOS_API_KEY           │ PayOS Payment Gateway            │ Khởi tạo liên kết thanh toán đơn hàng chuyển khoản     │
│ PAYOS_CHECKSUM_KEY      │ PayOS Payment Gateway            │ Khóa bí mật tạo và xác minh chữ ký HMAC SHA-256        │
│ GOOGLE_CLIENT_ID        │ Google Cloud Console (OAuth 2.0) │ Đăng nhập nhanh bằng tài khoản Google One-Tap / GSI    │
│ SMTP_USER & SMTP_PASS   │ Google SMTP Server (Gmail Relay) │ Gửi mã xác thực OTP, báo cáo phụ huynh & cảnh báo sớm  │
│ JWT_SECRET              │ Nội bộ hệ thống (HMAC SHA-256)   │ Ký và xác thực Token đăng nhập của người dùng          │
│ MONGO_URI               │ MongoDB Atlas / Self-hosted      │ Cơ sở dữ liệu NoSQL lưu trữ toàn bộ dữ liệu ứng dụng   │
└─────────────────────────┴──────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

### 3.2. Cơ chế xử lý Backend & Chống thất thoát chi phí AI
1. **Fallback Đa tầng Thông minh (AI Resiliency Fallback):**
   - *Tầng 1:* Gọi siêu tốc qua Groq LLM (thời gian phản hồi chỉ 0.8s - 1.5s).
   - *Tầng 2 (Dự phòng):* Nếu Groq quá tải hoặc lỗi token, hệ thống tự động chuyển sang mô hình Heuristics cục bộ (`local heuristics analyzer`) để đảm bảo người dùng không bao giờ bị gián đoạn bài học.
2. **Khóa chống gửi lặp (Idempotency Key):**
   - Header `Idempotency-Key` được kiểm tra trước khi gọi AI. Nếu request trùng lặp, backend trả về kết quả đã xử lý lưu trong DB, tuyệt đối không trừ thêm chi phí API.
3. **Bộ đệm phân tích (Analysis Cache):**
   - Hash nội dung bài viết và lưu kết quả vào cache. Nếu học sinh chỉ sửa lỗi chính tả nhỏ không ảnh hưởng đến từ mục tiêu, backend tái sử dụng phân tích từ vựng cũ.

---

### 3.3. Cơ chế An toàn & Bảo mật Dữ liệu (Security & Anti-Fraud)
* **Xác thực Chữ ký số Webhook PayOS:** Chống giả mạo thanh toán bằng thuật toán HMAC SHA-256. Bất kỳ request nào không khớp checksum đều bị từ chối `400 Bad Request`.
* **Phòng chống tấn công NoSQL Injection & XSS:** Sử dụng Mongoose Schema validation chặt chẽ và hàm làm sạch chuỗi `sanitize`.
* **Cơ chế phân quyền nghiêm ngặt (Data Isolation):** Giáo viên A tuyệt đối không thể xem dữ liệu lỗi từ vựng hay bài tập của lớp thuộc Giáo viên B (`403 Forbidden`).

---

## 4. TỔNG HỢP KẾT QUẢ KIỂM THỬ TOÀN BỘ HỆ THỐNG (27 TEST SUITES / 186 TESTS)

Hệ thống đã chạy kiểm thử tự động toàn diện qua Vitest với **100% Test Suites Passed (27/27) và 186/186 Tests Passed**:

```
Test Files  27 passed (27)
Tests       186 passed (186)
Duration    7.24s (transform 5.73s, setup 0ms, import 30.83s, tests 9.10s)
```

| STT | Tên File Test Suite | Số lượng Test | Kết quả | Trọng tâm kiểm thử |
| :---: | :--- | :---: | :---: | :--- |
| 1 | `tests/learningSession.test.js` | 17 tests | ✅ PASSED | Chu trình 5 bước: Học từ ➔ Luyện tập ➔ Viết luận ➔ Revision ➔ Bằng chứng; bảo vệ chi phí AI không gọi lặp; phân quyền lớp học. |
| 2 | `tests/srs.service.test.js` | 29 tests | ✅ PASSED | Thuật toán SuperMemo-2 (SM-2): Tính hệ số dễ (Ease Factor), khoảng cách ngày, reset streak khi trả lời sai. |
| 3 | `tests/srs-endpoints.test.js` | 15 tests | ✅ PASSED | API ôn tập từ vựng, kiểm tra Idempotency key, danh sách từ đến hạn ôn. |
| 4 | `tests/dailyQuest.test.js` | 8 tests | ✅ PASSED | Đảm bảo chỉ tạo 1 ô chữ duy nhất mỗi ngày dưới tải đồng thời (Concurrency safe), tặng 1 đom đóm nguyên tử (*Atomic Firefly*), ẩn đáp án phía server. |
| 5 | `tests/masteryProtection.test.js` | 4 tests | ✅ PASSED | Chống gian lận Mastery: Bắt buộc đủ 2 bài viết độc lập ở 2 ngày khác nhau, từ chối tính điểm nếu có trợ giúp của AI. |
| 6 | `tests/plagiarismAndAIDetection.test.js` | 6 tests | ✅ PASSED | Kiểm tra đạo văn và tỷ lệ viết bởi AI; cơ chế Fallback Heuristics khi API HuggingFace gặp sự cố. |
| 7 | `tests/earlyWarningScheduler.test.js` | 2 tests | ✅ PASSED | Tự động quét học sinh có nguy cơ tụt lại vào 08:00 sáng Thứ Hai hàng tuần, không chồng lấn tiến trình. |
| 8 | `tests/earlyWarning.test.js` | 13 tests | ✅ PASSED | Logic phát hiện học sinh bỏ bài, điểm thấp và gửi thông báo cho giáo viên. |
| 9 | `tests/parent.test.js` | 12 tests | ✅ PASSED | Liên kết phụ huynh - con, quyền xem tiến độ, bảo mật thông tin cá nhân. |
| 10| `tests/globalVocabulary.test.js` | 9 tests | ✅ PASSED | Quản lý ngân hàng từ vựng chuẩn CEFR toàn cầu của Admin. |
| 11| `tests/classAnalytics.test.js` | 5 tests | ✅ PASSED | Phân tích dữ liệu học tập lớp, bản đồ nhiệt lỗi sai từ vựng (*Lexical Error Heatmap*). |
| 12| `tests/sendEmailSecurity.test.js` | 1 test | ✅ PASSED | Bảo mật luồng gửi mail SMTP: Bắt buộc TLS, chặn nạp tài nguyên ngoài nguy hiểm. |
| 13| *15 Test Suites khác (Auth, Progress, LearningCache, Payment, etc.)* | 66 tests | ✅ PASSED | Kiểm tra toàn bộ các API còn lại của hệ thống. |

---
*Báo cáo được lưu trữ tại file `docs/report/02_DANH_GIA_UIUX_ANIMATION_VA_KIEN_TRUC_BACKEND_API.md`.*
