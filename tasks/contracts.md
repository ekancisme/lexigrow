# LexiGrow — Đặc tả API Contracts (Phase 0 -> Phase 4)

---

## 1. Onboarding & Hồ sơ học tập (Phase 1)
- `GET /api/profile/learning`: Lấy sở thích, trình độ tự đánh giá, mục tiêu phút/ngày.
- `PUT /api/profile/learning`: Cập nhật hồ sơ học tập.

## 2. Quản lý Phiên học - LearningSession (Phase 1 & 2)
- `POST /api/sessions/start`: Khởi tạo phiên 3–5 từ (hoặc trả về session đang active nếu có).
  - Body: `{ learningSetSlug: "daily-life" }`
- `GET /api/sessions/current`: Lấy phiên học hiện tại.
- `PUT /api/sessions/:id/step`: Chuyển bước (`lesson` -> `practice` -> `writing` -> `feedback` -> `completed`).

## 3. Bài Luyện Tập & SRS Ôn tập (Phase 2)
- `POST /api/practice/submit`: Nộp câu trả lời quiz (trắc nghiệm / điền từ).
  - Body: `{ sessionId, wordId, questionType, answer }`
- `POST /api/srs/review`: Ghi nhận kết quả ôn thẻ Flashcard.
  - Body: `{ vocabularyId, rating: 1 | 2 | 3 | 4 }`

## 4. Viết Đoạn Văn & AI Phân Tích (Phase 3)
- `POST /api/essays/submit-revision`: Nộp đoạn văn 60–100 từ kèm từ mục tiêu.
  - Body: `{ sessionId, content, targetWords: ["routine", "commute"] }`
  - Response: Kết quả phân tích có cấu trúc JSON từ Gemini AI.

## 5. Bằng chứng Vận dụng & Tiến bộ (Phase 4)
- `GET /api/progress/active-vocabulary`: Lấy biểu đồ tăng trưởng từ vựng phân tầng (Saved -> SRS -> Mastered).
- `GET /api/progress/evidence/:word`: Lấy danh sách các câu văn thật học sinh đã viết thành công.
