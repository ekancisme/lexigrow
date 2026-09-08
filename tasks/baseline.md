# LexiGrow — Báo cáo Hiện trạng & Baseline (Phase 0)

Ngày thực hiện: 08/09/2026.
Trạng thái: **ĐÃ HOÀN THÀNH (100% Pass)**

---

## 1. Kết quả kiểm thử tự động (Automated Test Baseline)
- **Framework:** Vitest v4.1.10 + Supertest + MongoDB In-Memory/Mongoose Mocks
- **Số lượng Test Files:** 16/16 files Passed (100%)
- **Tổng số Tests:** 120/120 tests Passed (100%)
- **Thời gian chạy:** ~1.8s

### Danh sách các test suites:
1. `tests/srs.service.test.js` (29 tests) - Passed
2. `tests/learningSet.test.js` (8 tests) - Passed
3. `tests/earlyWarningScheduler.test.js` (2 tests) - Passed
4. `tests/earlyWarning.test.js` (13 tests) - Passed
5. `tests/plagiarismAndAIDetection.test.js` (6 tests) - Passed
6. `tests/progress.test.js` (1 test) - Passed
7. `tests/parentAuth.test.js` (2 tests) - Passed
8. `tests/auditLogAndAnalytics.test.js` (4 tests) - Passed
9. `tests/assignment.test.js` (3 tests) - Passed
10. `tests/vocabulary.test.js` (3 tests) - Passed
11. `tests/commentsAndRevision.test.js` (4 tests) - Passed
12. `tests/classAnalytics.test.js` (5 tests) - Passed
13. `tests/aiConfigAndMonitoring.test.js` (4 tests) - Passed
14. `tests/globalVocabulary.test.js` (9 tests) - Passed
15. `tests/parent.test.js` (12 tests) - Passed
16. `tests/srs-endpoints.test.js` (15 tests) - Passed

---

## 2. Kết quả Build Frontend
- **Công cụ:** Vite v8.0.14 + React 19 + Rollup/Rolldown
- **Trạng thái:** `npm run build` Thành công (Build time: ~535ms).
- **Bundle Output:**
  - `dist/index.html`: 0.55 kB
  - `dist/assets/index.css`: 277.69 kB
  - `dist/assets/index.js`: 831.62 kB

---

## 3. Cấu trúc Layout & Routing Đã tinh gọn
- `src/components/layout/Sidebar.jsx` đã chuyển đổi sang 5 menu trọng tâm cho Học sinh:
  1. 🏠 **Hôm nay** (`/student/dashboard`)
  2. 🧭 **Khám phá** (`/student/explore`)
  3. ✍️ **Luyện viết** (`/student/writing`)
  4. 📚 **Từ của tôi** (`/student/my-words`)
  5. 🌳 **Khu vườn tiến bộ** (`/student/progress`)
- Các màn hình khung Wireframe đã được chuẩn bị sẵn:
  - `src/pages/student/LearningSession.jsx`
  - `src/pages/student/Explore.jsx`

---

## 4. Kết luận
Hạ tầng mã nguồn đã sẵn sàng 100% để bước vào **Phase 1: Onboarding cá nhân hóa & Tạo phiên học (LearningSession)**.
