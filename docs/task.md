# Danh sách công việc chưa hoàn thành (Unfinished Tasks List)

Dưới đây là danh sách các tính năng chưa được thực hiện hoặc chưa hoàn thiện hoàn toàn từ `feature.txt` để tiếp tục triển khai:

## I. Chức năng của CON NGƯỜI

### 1. Học sinh
- [ ] **Lịch sử bài viết (Chưa hoàn thiện):**
  - Hiện tại chỉ hiển thị 5 bài gần nhất ở Dashboard. Nút "View All" dẫn sang trang Progress nhưng không có danh sách bài viết. Cần làm trang xem đầy đủ lịch sử tất cả bài viết.
- [ ] **Danh sách từ mới đã học (Chưa làm Frontend):**
  - Backend đã có API `GET /api/vocabulary` nhưng Frontend chưa gọi và chưa thiết kế giao diện hiển thị danh sách từ đã học cho học sinh.
- [ ] **So sánh tuần này với tuần trước (Chưa làm):**
  - Chưa có tính năng so sánh và hiển thị biến động chỉ số (TTR, số từ mới, độ phức tạp câu) giữa tuần này và tuần trước.

### 2. Giáo viên
- [ ] **Thông báo cho Phụ huynh (Chưa làm):**
  - Hệ thống chưa hỗ trợ vai trò Phụ huynh (Parent role) hay cơ chế gửi cảnh báo đến phụ huynh.

---

## II. Chức năng của AI

### 1. NLP Processing Engine (ĐÃ HOÀN THÀNH)
- [x] Tích hợp thư viện NLP local (spaCy) để thực hiện:
  - Tách câu và tách từ chuẩn.
  - Lemmatization (Chuẩn hóa từ).
  - POS tagging (Gán loại từ).
  - Nhận diện cấu trúc câu.
- [x] Lưu trữ chi tiết cấu trúc câu (passive voice, subordinate clauses, repeated words) vào DB.
- [x] Hiển thị thống kê câu bị động, mệnh đề phụ thuộc và từ lặp lên giao diện bài viết học sinh.

### 2. Vocabulary Tracking System (Chưa hoàn thiện)
- [x] Phát hiện từ bị lặp quá nhiều trong bài viết (Đã làm).
- [ ] Phát hiện vốn từ không tăng (stagnation) qua các bài viết.

### 3. Lexical Diversity Analyzer (Chưa hoàn thiện)
- [ ] Nâng cấp thuật toán đo mức độ đa dạng thực sự (như HD-D hoặc MTLD) để thay thế hoặc bổ sung cho chỉ số TTR cơ bản (tránh sai số do độ dài bài viết).

### 4. Sentence Complexity Analyzer (ĐÃ HOÀN THÀNH CHI TIẾT)
- [x] Phân tích sâu và hiển thị các số liệu thống kê cụ thể trên giao diện:
  - Số mệnh đề / Mệnh đề phụ thuộc (subordinate clauses).
  - Thể bị động (passive voice).

### 5. Learning Pattern Detection (Chưa hoàn thiện)
- [ ] Phát hiện học sinh đang mở rộng từ vựng thật hay chỉ cố tinh kéo dài câu.
- [ ] Phát hiện lặp lại từ quen thuộc.
- [x] Phát hiện đạo văn (plagiarism), chép bài bạn... (Hoàn thành: 3-grams Jaccard & Hugging Face)

### 6. Recommendation Engine & Topic Suggestions (ĐÃ HOÀN THÀNH MỘT PHẦN)
- [x] Chọn chủ đề chính (Theme) và gọi AI gợi ý 4 đề tài tương ứng bằng Groq API (Đã làm).
- [x] Tự động lưu từ mới kèm theo nhãn chủ đề đã viết vào database (Đã làm).
- [ ] Đề xuất từ nối nên dùng thêm.
- [ ] Đề xuất loại cấu trúc câu nên thử.
- [ ] Đề xuất nhóm từ vựng theo chủ đề.
- [ ] Gợi ý thay thế các từ lặp quen thuộc (Ví dụ phát hiện từ *"very"* để gợi ý dùng: *"extremely"*, *"highly"*, *"remarkably"*).

### 7. Early Warning System (Chưa hoàn thiện)
- [ ] Thêm điều kiện cảnh báo tự động: **Vocabulary growth = 0 trong 4 tuần**.
- [ ] Thêm điều kiện cảnh báo tự động: **Grammar accuracy giảm liên tục**.
- [ ] Gửi thông báo cho Phụ huynh.
