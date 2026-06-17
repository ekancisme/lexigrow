# TỔNG HỢP USE CASES HỆ THỐNG LEXIGROW HOÀN CHỈNH

Tài liệu này tổng hợp toàn bộ các Use Case của hệ thống LexiGrow sau khi tích hợp kế hoạch nâng cấp hệ thống theo dõi học từ mới hoàn hảo.

Hệ thống có tổng cộng **35 Use Cases**, được phân chia theo 4 nhóm tác nhân (Actors): **Học sinh (Student)**, **Giáo viên (Teacher)**, **Phụ huynh (Parent)** và **Hệ thống/AI Agent (System/AI Background Tasks)**.

- Ký hiệu **`[x]`**: Các Use Case đã có sẵn trong hệ thống hiện tại.
- Ký hiệu **`[+]`**: Các Use Case mới hoặc đang phát triển cần triển khai theo kế hoạch.

---

## I. Nhóm Học sinh (Student) - 17 Use Cases

| ID | Tên Use Case | Trạng thái | Mô tả chi tiết |
| :--- | :--- | :---: | :--- |
| **UC01** | Đăng ký & Đăng nhập | `[x]` | Đăng ký, đăng nhập tài khoản với quyền hạn của Học sinh. |
| **UC02** | Chọn chủ đề viết bài | `[x]` | Chọn chủ đề tự do hoặc theo các gợi ý viết bài từ AI. |
| **UC03** | Viết & Lưu nháp bài luận | `[x]` | Soạn thảo bài viết trực tuyến và lưu lại dưới dạng nháp. |
| **UC04** | Nộp bài luận chấm điểm | `[x]` | Gửi bài viết chính thức để hệ thống phân tích ngôn ngữ và AI chấm điểm. |
| **UC05** | Xem phản hồi AI tổng quan | `[x]` | Xem điểm số tổng quan và chi tiết các chỉ số (TTR, ngữ pháp, mạch lạc, độ phức tạp). |
| **UC06** | Xem cảnh báo lặp từ | `[x]` | Xem thống kê các từ vựng bị lặp quá nhiều trong bài viết. |
| **UC07** | Thêm từ gợi ý vào thư viện | `[+]` | Thêm trực tiếp các từ đồng nghĩa nâng cao được AI gợi ý thay thế vào danh sách học (`Study List`). |
| **UC08** | Xem đề xuất câu & từ nối | `[+]` | Nhận hướng dẫn cải thiện cấu trúc câu (chuyển câu bị động sang chủ động), đề xuất từ nối phù hợp. |
| **UC09** | Tìm kiếm & lọc từ vựng | `[+]` | Tìm kiếm từ khóa và lọc thư viện từ vựng theo Chủ đề, Phân loại, và Mức độ thành thạo. |
| **UC10** | Xem chi tiết từ vựng AI | `[+]` | Tra cứu chi tiết từ vựng: phiên âm IPA, loại từ, định nghĩa tiếng Anh, câu ví dụ trích từ bài viết thực tế. |
| **UC11** | Đổi mức thành thạo thủ công | `[+]` | Học sinh tự tay thay đổi trạng thái thành thạo của từ vựng (`New` -> `Learning` -> `Mastered`). |
| **UC12** | Tự thêm từ vựng thủ công | `[+]` | Tự nhập thêm các từ học được bên ngoài hệ thống, AI tự động tra cứu làm giàu thông tin (Enrich). |
| **UC13** | Ôn tập Flashcards | `[+]` | Ôn tập các từ vựng chưa thuộc thông qua thẻ lật 3D, tự đánh giá mức độ nhớ để cập nhật trạng thái. |
| **UC14** | Đặt mục tiêu tuần | `[x]` | Tự đặt mục tiêu cá nhân hàng tuần (số lượng từ mới, độ dài bài viết, cấp độ phức tạp). |
| **UC15** | Xem biểu đồ phân phối học tập | `[+]` | Xem biểu đồ tròn tỷ lệ phần trăm phân bổ mức độ thành thạo từ vựng. |
| **UC16** | Xem so sánh chỉ số tuần | `[+]` | Xem thống kê so sánh sự thay đổi các chỉ số (TTR, từ mới, độ dài) giữa tuần này và tuần trước. |
| **UC17** | Xem lịch sử bài viết đầy đủ | `[+]` | Truy cập trang danh sách đầy đủ tất cả các bài luận đã nộp để xem lại. |

---

## II. Nhóm Giáo viên (Teacher) - 10 Use Cases

| ID | Tên Use Case | Trạng thái | Mô tả chi tiết |
| :--- | :--- | :---: | :--- |
| **UC18** | Đăng ký & Đăng nhập giáo viên | `[x]` | Đăng ký, đăng nhập tài khoản với quyền hạn của Giáo viên. |
| **UC19** | Quản lý danh sách lớp | `[x]` | Tạo lớp mới, thêm học sinh vào lớp bằng email hoặc xóa học sinh ra khỏi lớp. |
| **UC20** | Xem Dashboard lớp học | `[x]` | Xem thống kê số lượng bài viết, số học sinh và tổng quan tình hình học tập của lớp. |
| **UC21** | Xem biểu đồ tiến độ học sinh | `[x]` | Theo dõi chi tiết biểu đồ tăng trưởng từ vựng, biến động điểm số của từng học sinh. |
| **UC22** | Xem kho từ vựng học sinh | `[+]` | Xem thư viện từ vựng đã tích lũy và tỷ lệ thành thạo từ của từng học sinh cụ thể. |
| **UC23** | Nhận xét thủ công bài viết | `[x]` | Nhập lời phê, nhận xét bổ sung bằng tay cho bài viết của học sinh song song với AI. |
| **UC24** | Điều chỉnh mục tiêu học sinh | `[x]` | Thay đổi chỉ tiêu mục tiêu tuần trực tiếp cho một học sinh bất kỳ. |
| **UC25** | Đánh dấu học sinh cần hỗ trợ | `[x]` | Gắn cờ đánh dấu học sinh đang học yếu để tập trung kèm cặp. |
| **UC26** | Xem danh sách cảnh báo sớm | `[+]` | Xem danh sách học sinh bị hệ thống cảnh báo do chững học lực hoặc sụt giảm chỉ số. |
| **UC27** | Cấu hình System Prompts | `[x]` | Quản lý, kiểm thử và thay đổi cấu hình Prompt hướng dẫn AI chấm điểm bài viết. |

---

## III. Nhóm Phụ huynh (Parent) - 3 Use Cases

| ID | Tên Use Case | Trạng thái | Mô tả chi tiết |
| :--- | :--- | :---: | :--- |
| **UC28** | Liên kết tài khoản học sinh | `[+]` | Nhập mã định danh học sinh để liên kết tài khoản theo dõi tiến độ của con. |
| **UC29** | Xem Dashboard tiến độ của con | `[+]` | Xem biểu đồ tăng trưởng từ vựng, mức độ thành thạo và lịch sử viết bài của con. |
| **UC30** | Nhận thông báo cảnh báo sớm | `[+]` | Nhận email hoặc thông báo từ hệ thống khi học lực của con có dấu hiệu sụt giảm hoặc chững lại. |

---

## IV. Nhóm Hệ thống & AI Agent (System/AI Background Tasks) - 5 Use Cases

| ID | Tên Use Case | Trạng thái | Mô tả chi tiết |
| :--- | :--- | :---: | :--- |
| **UC31** | Phân tích cú pháp văn bản | `[x]` | Chạy lõi spaCy tách từ, tách câu, gán nhãn từ loại, nhận diện câu bị động và mệnh đề phụ. |
| **UC32** | Làm giàu từ vựng tự động | `[+]` | Tự động gọi AI làm giàu nghĩa tiếng Anh, phiên âm IPA, từ đồng/trái nghĩa cho từ vựng mới. |
| **UC33** | Quét cảnh báo sớm định kỳ | `[+]` | Công việc ngầm (Cronjob) tự động quét phân tích dữ liệu hàng tuần để phát hiện sụt giảm học lực. |
| **UC34** | Phân tích mẫu học tập nâng cao | `[+]` | AI phân tích phát hiện viết câu kéo dài vô nghĩa, plateau, hoặc đạo văn. |
| **UC35** | Đo độ đa dạng từ vựng thực sự | `[+]` | Triển khai đo chỉ số đa dạng từ vựng chuẩn xác qua thuật toán MTLD hoặc HD-D. |
