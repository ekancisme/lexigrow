# LexiGrow — Đặc tả Bộ Từ Vựng & Rubric Phân Tích AI (Phase 0)

---

## 1. Ba bộ từ vựng mục tiêu mẫu

### 1.1 Bộ 1: Daily Life (Trình độ A2)
- **Slug:** `daily-life`
- **Mục tiêu:** Kể lại các hoạt động thường ngày, thói quen sinh hoạt.
- **Từ mục tiêu:**
  1. `routine` (noun): Thói quen, lịch trình sinh hoạt. Collocations: `daily routine`, `morning routine`.
  2. `commute` (verb): Đi lại giữa nhà và nơi làm việc. Collocations: `commute to work`, `daily commute`.
  3. `grocery` (noun): Thực phẩm, đồ tạp hóa. Collocations: `grocery shopping`, `grocery list`.

### 1.2 Bộ 2: Travel (Trình độ B1)
- **Slug:** `travel`
- **Mục tiêu:** Miêu tả chuyến đi, địa điểm và trải nghiệm du lịch.
- **Từ mục tiêu:**
  1. `itinerary` (noun): Lịch trình chuyến đi. Collocations: `travel itinerary`, `planned itinerary`.
  2. `accommodation` (noun): Chỗ ở, nơi lưu trú. Collocations: `book accommodation`, `hotel accommodation`.
  3. `landmark` (noun): Địa danh nổi tiếng. Collocations: `famous landmark`, `historical landmark`.

### 1.3 Bộ 3: Hobbies (Trình độ B1)
- **Slug:** `hobbies`
- **Mục tiêu:** Chia sẻ sở thích cá nhân và hoạt động giải trí.
- **Từ mục tiêu:**
  1. `photography` (noun): Nhiếp ảnh. Collocations: `digital photography`, `photography hobby`.
  2. `gardening` (noun): Làm vườn. Collocations: `gardening tools`, `gardening hobby`.
  3. `cooking` (noun): Nấu ăn. Collocations: `cooking skills`, `cooking class`.

---

## 2. Rubric & Tiêu chuẩn Phân tích của AI

AI kiểm tra từng từ mục tiêu dựa trên 4 trạng thái:
- **`correct` (Xanh lá):** Dùng đúng ngữ cảnh, đúng loại từ và ngữ pháp.
- **`needs_improvement` (Vàng):** Dùng được từ nhưng sai collocation, sai giới từ hoặc dạng từ (word form).
- **`incorrect` (Đỏ):** Dùng sai hoàn toàn nghĩa hoặc sai lệch ngữ cảnh nghiêm trọng.
- **`not_used` (Xám):** Học sinh chưa sử dụng từ này trong bài viết.

---

## 3. Định nghĩa Tiến bộ (Operational Definitions)
- **Đã lưu (Saved):** Từ vựng có trong hệ thống hoặc được người học thêm vào thư viện.
- **Đang học (Learning):** Từ vựng nằm trong một phiên học (`LearningSession`) đang diễn ra.
- **Ghi nhớ (Retained - SRS):** Từ vựng đã vượt qua các mốc ôn tập Spaced Repetition (Interval $\ge 7$ ngày).
- **Vận dụng độc lập (Mastered):** Từ vựng đã được học sinh viết đúng trong **ít nhất 2 bài viết độc lập ở 2 ngày khác nhau**.
