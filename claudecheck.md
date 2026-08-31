# LexiGrow — Báo Cáo Phân Tích Toàn Diện

> **Ngày phân tích:** 31/08/2026  
> **Công cụ:** claude-agy · graft code graph  
> **Trạng thái:** Chờ Duyệt — Chưa có thay đổi code nào

---

## Chẩn Đoán Tổng Thể

**Điểm tương thích đề tài: 3.8 / 10**

LexiGrow hiện là **hệ thống luyện viết luận (essay) có hỗ trợ phân tích từ vựng** — chưa phải nền tảng **học từ vựng chủ động** như tên đề tài hàm ý. Học sinh không có quy trình học có hệ thống, không có lịch ôn tập, không có kiểm tra khả năng nhớ từ.

| Chỉ số | Giá trị |
|--------|---------|
| Vấn đề nghiêm trọng (P0 Critical) | **5** — thiếu hoàn toàn khỏi đề tài |
| Cần nâng cấp (P1–P2) | **7** — tồn tại nhưng chưa đủ |
| Tính năng mới cần xây | **4** — cần làm từ đầu |
| Ưu tiên giải quyết trước | **3** — tác động tức thì cao nhất |

---

## Những Gì Đã Có (Trạng Thái Thực Tế)

| Tính năng | File | Trạng thái |
|-----------|------|-----------|
| Thư viện từ vựng (lọc/xem/thêm) | `src/pages/student/VocabularyLibrary.jsx:L7–L443` | ⚠️ Tải `limit=500` client-side |
| Flashcard lật thẻ + phát âm | `src/pages/student/FlashcardReview.jsx:L6–L487` | ⚠️ Không có SRS, không lịch ôn |
| Model từ vựng cá nhân | `server/src/models/Vocabulary.js` | ⚠️ Thiếu 4 trường SRS quan trọng |
| Từ điển toàn cục (Admin CRUD) | `server/src/models/GlobalVocabulary.js` | ⚠️ Thiếu example/synonyms/antonyms |
| AI làm giàu từ vựng | `server/src/services/ai.service.js:L721–L807` | ⚠️ Chỉ chạy qua essay pipeline |
| Mục tiêu tuần | `src/pages/student/SetWeeklyGoals.jsx:L6–L150` | ❌ Goals chỉ về writing |
| Cảnh báo sớm | `server/src/services/alert.service.js` | ⚠️ Không có overdue/retention alerts |
| Thống kê tiến độ | `src/pages/student/MyProgress.jsx` | ❌ Chỉ TTR/essay metrics |

---

## 🚨 5 Vấn Đề Nghiêm Trọng (P0 Critical — Phải Làm)

### 1. Không có Spaced Repetition System (SRS)

**File:** `server/src/models/Vocabulary.js`, `src/pages/student/FlashcardReview.jsx`

Model `Vocabulary.js` không có các trường: `nextReviewDate`, `easeFactor`, `reviewInterval`, `reviewCount`. `FlashcardReview.jsx` chỉ lật thẻ và gán mastery thủ công — không lên lịch ôn tiếp theo. Đây là tính năng **cốt lõi** của mọi hệ thống học từ vựng (Anki, Duolingo đều dùng nguyên lý này).

**Giải pháp:** Thêm SRS fields vào model, xây `srs.service.js` với thuật toán SM-2, thêm API `GET /vocabulary/due-today`.

---

### 2. Không có chế độ luyện tập đa dạng (Quiz/Test)

**File:** Mới hoàn toàn — `src/pages/student/QuizMode.jsx`

Hiện chỉ có một hình thức học: lật flashcard. Thiếu hoàn toàn: **trắc nghiệm MCQ**, **fill-in-the-blank**, **spelling test**. Nghiên cứu giáo dục học cho thấy active recall hiệu quả hơn passive review.

**Giải pháp:** Xây trang `/student/quiz` với ít nhất 2 chế độ: Multiple Choice (chọn đúng nghĩa) và Fill-in-blank (điền từ vào câu ví dụ từ GlobalVocabulary).

---

### 3. Dashboard không phản ánh quá trình học từ vựng

**File:** `src/pages/student/StudentDashboard.jsx:L11–L155`

Dashboard hiển thị: tổng bài luận, từ mới từ essay, điểm TTR, xếp hạng. Không có widget nào về **từ cần ôn hôm nay**, **chuỗi ngày học**, **retention rate**.

**Giải pháp:** Thêm vocabulary learning widgets: "Due Today" counter với CTA, learning streak, mastery donut chart.

---

### 4. VocabularyLibrary tải 500 từ lên client

**File:** `src/pages/student/VocabularyLibrary.jsx:L33`

```js
const response = await api.get('/vocabulary?limit=500')
```

Khi học sinh tích lũy 200–500 từ, đây là bottleneck hiệu suất nghiêm trọng và trải nghiệm kém.

**Giải pháp:** Chuyển sang server-side pagination `?page=1&limit=20&category=X&mastery=Y`. Controller đã hỗ trợ query params — cần cập nhật frontend.

---

### 5. Mục tiêu tuần hoàn toàn về writing, không phải vocabulary learning

**File:** `src/pages/student/SetWeeklyGoals.jsx`, `server/src/controllers/goals.controller.js`

Ba goals hiện tại: *New Words* (từ trong essay), *Length*, *Complexity* — không goal nào đo lường học từ vựng chủ động.

**Giải pháp:** Thêm goals: `wordsReviewedPerDay`, `retentionTarget`, `masteredTarget` vào model Goal + cập nhật UI.

---

## ⚡ 7 Điểm Cần Nâng Cấp (P1–P2)

| # | Vấn đề | File | Ưu tiên |
|---|--------|------|---------|
| 1 | GlobalVocabulary thiếu exampleSentence, synonyms, antonyms | `GlobalVocabulary.js` | P1 |
| 2 | FlashcardReview không có session summary screen | `FlashcardReview.jsx` | P1 |
| 3 | Không có trang thống kê từ vựng chi tiết (charts) | `MyProgress.jsx` | P1 |
| 4 | Không có "từ cần ôn hôm nay" — điểm vào học chủ động | Dashboard + API | P1 |
| 5 | Alert service thiếu: overdue_reviews, low_retention | `alert.service.js` | P2 |
| 6 | Teacher không xem tiến độ vocab của học sinh | `StudentAnalyticsDetail.jsx` | P2 |
| 7 | AI enrich chỉ chạy qua essay, không gọi được độc lập | `vocabulary.controller.js` | P1 |

---

## 🏗️ Kiến Trúc Học Từ Vựng Cần Bổ Sung

```
UI (Mới)
  ├── QuizMode              [tính năng mới]
  ├── DueTodayWidget        [tính năng mới]
  ├── VocabStats tab        [tính năng mới]
  ├── FlashcardReview + SRS [nâng cấp]
  └── Dashboard vocab widgets [nâng cấp]
          ↕
API (Mới)
  ├── GET  /vocabulary/due-today      [tính năng mới]
  ├── POST /vocabulary/review         [tính năng mới]
  ├── GET  /vocabulary/stats/learning [tính năng mới]
  ├── POST /vocabulary/enrich         [tính năng mới]
  └── GET  /quiz/generate             [tính năng mới]
          ↕
Models (Cập nhật)
  ├── Vocabulary + SRS fields         [nâng cấp]
  ├── GlobalVocabulary + example/syn  [nâng cấp]
  ├── Goal + vocab learning types     [nâng cấp]
  └── ReviewLog (tuỳ chọn)            [tính năng mới]
          ↕
Services (Mở rộng)
  ├── alert.service + overdue alerts  [nâng cấp]
  ├── ai.service standalone enrich    [nâng cấp]
  └── srs.service (SM-2 logic)        [tính năng mới]
```

---

## 📋 Kế Hoạch 16 Nhiệm Vụ Cụ Thể

| # | Nhiệm vụ | Ưu tiên | Effort | File ảnh hưởng |
|---|----------|---------|--------|----------------|
| 1 | Thêm SRS fields vào Vocabulary model | P0 | S · 1h | `Vocabulary.js` |
| 2 | Xây dựng `srs.service.js` với thuật toán SM-2 | P0 | M · 3h | `server/src/services/` (file mới) |
| 3 | API `GET /vocabulary/due-today` | P0 | S · 1.5h | `vocabulary.controller.js`, routes |
| 4 | API `POST /vocabulary/review` (ghi nhận kết quả + tính lịch tiếp) | P0 | M · 2h | `vocabulary.controller.js` |
| 5 | Nâng cấp FlashcardReview: SRS + Easy/Medium/Hard rating | P0 | M · 4h | `FlashcardReview.jsx` |
| 6 | Session Summary screen cho FlashcardReview | P1 | S · 2h | `FlashcardReview.jsx` |
| 7 | Fix VocabularyLibrary: server-side pagination thay `limit=500` | P0 | M · 3h | `VocabularyLibrary.jsx`, `vocabulary.controller.js` |
| 8 | Thêm vocabulary learning widgets vào StudentDashboard | P0 | M · 3h | `StudentDashboard.jsx` |
| 9 | Thêm `exampleSentence`, `synonyms`, `antonyms` vào GlobalVocabulary | P1 | S · 1h | `GlobalVocabulary.js`, `AdminVocabulary.jsx` |
| 10 | Xây dựng trang Quiz Mode (MCQ + Fill-in-blank) | P1 | L · 8h | `QuizMode.jsx` + quiz routes/controller (mới) |
| 11 | Expose `POST /vocabulary/enrich` endpoint độc lập | P1 | S · 1.5h | `vocabulary.controller.js`, `ai.service.js` |
| 12 | Vocabulary learning goals vào Goal model + SetWeeklyGoals UI | P0 | M · 4h | Goal model, `goals.controller.js`, `SetWeeklyGoals.jsx` |
| 13 | Vocabulary tab trong MyProgress (mastery/CEFR/retention charts) | P1 | L · 6h | `MyProgress.jsx`, `progress.controller.js` |
| 14 | Alert types mới: `overdue_reviews` + `low_retention` | P2 | M · 2h | `alert.service.js` |
| 15 | Teacher: Vocabulary Report tab trong StudentAnalyticsDetail | P2 | M · 3h | `StudentAnalyticsDetail.jsx`, `progress.controller.js` |
| 16 | Word-of-the-Day + Learning Streak indicator | P3 | M · 3h | `StudentDashboard.jsx` + API |

**Tổng ước tính: ~47 giờ thực hiện**

---

## 🗓️ Lộ Trình 3 Pha

> Pha 1 là **bắt buộc** để đề tài khớp tên. Pha 2–3 đưa dự án lên mức "trên mức đủ" để bảo vệ tốt.

### Pha 1 (~2–3 ngày) — Nền Tảng SRS & Fix Hiệu Suất

Mục tiêu: Tạo hạ tầng học từ vựng thực sự, sửa bottleneck hiệu suất.

- Task 1: Thêm SRS fields vào Vocabulary model
- Task 2: Xây `srs.service.js` với SM-2
- Task 3 + 4: API `due-today` và `review` endpoint
- Task 7: Fix VocabularyLibrary pagination
- Task 12: Vocabulary learning goals vào Goal model

### Pha 2 (~3–4 ngày) — Nâng Cấp Trải Nghiệm Học

Mục tiêu: Người dùng cảm nhận được sự thay đổi rõ ràng.

- Task 5 + 6: Nâng cấp FlashcardReview (SRS + Easy/Hard rating + Session Summary)
- Task 8: Dashboard vocabulary widgets + Due Today CTA
- Task 9: GlobalVocabulary thêm exampleSentence/synonyms/antonyms
- Task 11: Expose enrich endpoint độc lập

### Pha 3 (~3–4 ngày) — Phong Phú Hóa & Báo Cáo

Mục tiêu: Tính năng nổi bật cho demo bảo vệ, báo cáo đầy đủ cho giáo viên.

- Task 10: Quiz Mode (Multiple Choice + Fill-in-blank) — **tính năng ấn tượng nhất khi demo**
- Task 13: Vocabulary tab trong MyProgress
- Task 14: Alert types mới (overdue, low retention)
- Task 15: Teacher vocabulary report
- Task 16: Word-of-the-Day + Learning Streak

---

## Quyết Định Kiến Trúc

### Giữ Nguyên (Không Thay Đổi)
- AI essay analysis & TTR scoring
- AI enrichment pipeline (`enrichWordsList`)
- EarlyWarningAlerts infrastructure
- Teacher assignment management
- Admin GlobalVocabulary CRUD + Excel import
- Parent monitoring dashboard

### Thêm Mới Ưu Tiên
- `srs.service.js` (SM-2 algorithm)
- `GET /vocabulary/due-today`
- `POST /vocabulary/review`
- QuizMode page (Multiple Choice)
- Dashboard Due Today widget
- Vocab learning goals trong Goal model

---

*Báo cáo được tạo bởi claude-agy · graft · 31/08/2026 · v1.0*
