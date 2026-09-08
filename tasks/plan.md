# LexiGrow — Định hướng sản phẩm và lộ trình tái cấu trúc

Ngày lập: 08/09/2026.
Trạng thái: bản đề xuất triển khai; chưa thay đổi mã ứng dụng.
Task chi tiết: [todo.md](todo.md).

## 1. Quyết định tổng thể

Giữ tên: **LexiGrow – Hệ thống học tập và phát triển vốn từ vựng tiếng Anh tích hợp AI phân tích bài viết và phản hồi thông minh.**

Xây lại luồng học, mô hình bằng chứng tiến bộ và trải nghiệm học sinh trên nền React/Vite, Express, MongoDB hiện có. Không chuyển framework hoặc viết lại đăng nhập chỉ để làm mới dự án.

Lời hứa sản phẩm: **Mỗi ngày một phiên học ngắn, học từ có ngữ cảnh và dùng chúng để diễn đạt điều bạn muốn nói.**
“10 phút” là mục tiêu thiết kế phiên học, không phải cam kết về tốc độ của mọi người dùng.

Giả định phạm vi đầu: người học Việt Nam ở mức tự chọn A2–B1, dùng độc lập hoặc trong lớp; giao diện hướng dẫn tiếng Việt, nội dung luyện tiếng Anh. Đây là giả định sản phẩm cần xác nhận ở Phase 0; nhãn mức bài học không phải chứng nhận CEFR của người dùng.

## 2. Căn cứ từ dự án hiện tại

- StudentDashboard.jsx nhấn vào số bài luận, TTR, complexity, bài nộp.
- Sidebar.jsx ưu tiên lớp học, viết bài và lịch sử trước thư viện từ.
- ai.service.js tự lưu newWordsDetected vào Vocabulary.
- progress.controller.js đếm số bản ghi mới để tính tăng trưởng và suy rank từ số từ/TTR.
- Vocabulary và srs.service.js đã có lịch ôn, số lần ôn, ease factor, mức thành thạo.
- AIFeedbackReview có thêm từ gợi ý vào thư viện; WriteEssay có luồng sửa bài theo giáo viên.
- Các game hiện có đọc thư viện và có thể cập nhật masteryLevel trực tiếp.
- usecases.md và docs/task.md có trạng thái cũ không khớp mã nguồn; cần đối chiếu lại trước triển khai.
- Nhận định dựa trên đọc mã, chưa phải kết luận kiểm thử runtime.

## 3. Vòng học chủ đạo

Chọn mục tiêu/sở thích → học 3–5 từ → luyện nhớ → viết vận dụng → AI phản hồi → người học sửa → lưu bằng chứng → ôn lại.

Một ví dụ:
1. Chủ đề Travel, mục tiêu kể trải nghiệm; học explore, crowded, memorable, local.
2. Xem nghĩa theo ngữ cảnh, từ loại, âm thanh/IPA, kết hợp từ và ví dụ.
3. Chọn nghĩa, điền từ, tự đặt câu; đáp án sai được giải thích và cho thử lại.
4. Viết đoạn 60–100 từ, dùng 2–3 từ mục tiêu. Không yêu cầu mọi bài luôn dài như nhau.
5. AI nhận xét cách dùng từng từ và chọn tối đa 2 ưu tiên sửa để tránh quá tải.
6. Người học sửa; hệ thống đối chiếu phiên bản và ghi nhận thay đổi.
7. Kết quả: từ đã luyện, câu dùng đúng, điểm cần luyện tiếp, lịch ôn.
8. Lần sau ôn các từ đến hạn và có thể thử dùng chúng trong một ngữ cảnh khác.

Cho phép viết tự do; luồng có hướng dẫn là mặc định. Cho phép lưu/tiếp tục giữa chừng. Tách hoàn thành phiên học với thành thạo: người học có thể kết thúc với lỗi còn tồn tại, hệ thống ghi lại để luyện tiếp.

## 4. Trải nghiệm và màn hình

### 4.1 Trang giới thiệu và trải nghiệm thử
- Thông điệp rõ ràng; minh họa 1 vòng học thay cho danh sách hàng chục tính năng.
- Một bài thử ngắn với bộ nội dung đã duyệt; dùng phản hồi mẫu được ghi rõ là mẫu.
- Mời tạo tài khoản để lưu tiến bộ; không yêu cầu API AI công khai không giới hạn cho khách.

### 4.2 Khởi đầu cá nhân hóa
- Chọn mục đích, 2–3 sở thích, mức tự đánh giá và thời lượng mong muốn.
- Có thể bỏ qua/chỉnh lại. Bài kiểm tra đầu vào chỉ làm sau, không chặn phiên đầu.
- Gợi ý một nhiệm vụ có sẵn bằng quy tắc; chưa cần AI lập giáo trình.

### 4.3 Học hôm nay
- Nút chính: Tiếp tục phiên học hoặc Bắt đầu nhiệm vụ.
- Hiện số từ đến hạn, bài cần sửa, kết quả nhỏ gần nhất.
- Chỉ số kỹ thuật bài viết ở màn hình chi tiết, không chiếm vị trí dẫn dắt.
- Trạng thái người mới, đang học dở, không có từ ôn, API lỗi đều có hướng tiếp tục.

### 4.4 Khám phá và học từ
- Bộ từ theo sở thích/chủ đề, mỗi bộ 15–20 mục từ, chia phiên 3–5 mục.
- Mỗi mục có nghĩa cụ thể, từ loại, ví dụ, IPA/âm thanh nếu có, collocation.
- Ba dạng đầu: chọn nghĩa theo câu, điền từ, đặt câu ngắn.
- Nội dung xuất bản phải được duyệt; AI chỉ hỗ trợ soạn bản nháp.
- 3 bộ đầu phục vụ kiểm thử; mở rộng khoảng 6 bộ khi vòng học ổn định.
- Bộ từ nhiều nghĩa có thể có nhiều mục học; không gộp mọi nghĩa của một từ vào một điểm thành thạo.

### 4.5 Luyện viết và phản hồi
- Chọn viết theo nhiệm vụ hoặc tự do; có nhãn từ mục tiêu.
- Lưu nháp, nộp, trạng thái xử lý, thử lại khi thất bại.
- Phản hồi ba lớp: tổng quan ngắn; bằng chứng trên câu; hành động sửa.
- So sánh bản trước/sau, tiếp tục luyện lỗi chưa khắc phục.
- Lịch sử nằm trong Luyện viết, không cần thành mục điều hướng ngang hàng.

### 4.6 Từ của tôi và ôn tập
- Lọc theo bộ từ, nguồn, đến hạn, ghi nhớ, vận dụng.
- Phân biệt tự đánh giá flashcard và kết quả bài luyện có đáp án.
- Hiển thị câu của chính người học với nguồn bài viết khi có.
- Có lịch sử học, không chỉ một masteryLevel duy nhất.

### 4.7 Tiến bộ và khu vườn
- Cây đại diện một bộ từ, mức phát triển có giải thích.
- Cây liên kết với từ đến hạn và bằng chứng sử dụng; trang trí không cản truy cập bài học.
- Dashboard ưu tiên hành động tiếp theo; khu vườn là phần thưởng và điều hướng phụ.
- Desktop có sidebar; mobile ưu tiên Hôm nay, Khám phá, Luyện viết, Từ của tôi, Tiến bộ.
- Mục tiêu, lịch sử và lớp học đặt trong các màn hình liên quan.

## 5. Thu hút và giữ chân

### Làm sớm
- Phiên ngắn, nhiệm vụ thực tế, chủ đề theo sở thích.
- Trạng thái hoàn thành rõ ràng và kết quả dựa trên câu viết thật.
- Một hành động chính ở mỗi bước; không ép làm bài luận dài ở lần đầu.

### Sau khi vòng học ổn định
- Vườn: gieo hạt khi bắt đầu, nảy mầm khi luyện, ra lá khi ôn, nở hoa khi có bằng chứng vận dụng.
- Tính trạng thái cây từ dữ liệu học; không cộng thành tích mỗi lần reload.
- Mục tiêu số ngày học mỗi tuần, lịch sử chuỗi ngày và lời mời quay lại nhẹ nhàng.
- XP/huy hiệu là phụ; chỉ cấp một lần cho sự kiện hợp lệ.
- Không làm cây chết, không xóa thành quả khi nghỉ; không cần bảng xếp hạng toàn hệ thống.
- Giảm chuyển động, tương phản, bàn phím và màn hình nhỏ phải dùng được.

### Giai đoạn mở rộng
- Thử thách hợp tác tuần trong lớp, chia sẻ bài viết tự nguyện.
- Bộ từ do giáo viên tạo, bài tập tình huống theo nhu cầu.
- AI đề xuất bước tiếp theo từ dữ liệu học khi đã có đủ dữ liệu và cách đánh giá.
- Chưa ưu tiên chat AI mở, avatar phức tạp, game 3D, marketplace, thanh toán.

## 6. Phản hồi AI: đầu vào, đầu ra, giới hạn

Đầu vào: phiên bản bài, bộ từ và nghĩa mục tiêu, yêu cầu nhiệm vụ, mức bài học, phiên bản trước nếu có.
Đầu ra có cấu trúc:
- summary, strengths, priorities;
- targetWordResults: mục từ, trích đoạn, vị trí, dạng từ thực tế, trạng thái;
- trạng thái: chưa thấy / đúng / cần sửa / chưa đủ chắc chắn;
- issueType: nghĩa, dạng từ, spelling, collocation, sắc thái;
- explanationVi, suggestedRevision, followUpPractice;
- revisionComparison cho từng vấn đề liên quan.

Nguyên tắc:
- Nhận diện việc xuất hiện từ bằng chuẩn hóa văn bản/lemma phù hợp; dùng LLM cho đánh giá ngữ cảnh.
- Vị trí highlight theo bản plain text chuẩn hóa, có version/hash; không áp offset vào HTML khác phiên bản.
- Kiểm chứng trích đoạn tồn tại trước khi hiển thị.
- AI không chắc thì chưa cộng bằng chứng dùng đúng.
- Không mặc định từ khó tốt hơn từ đơn giản; không thay đồng nghĩa máy móc.
- Không tự sửa toàn bài rồi tính câu AI viết là năng lực của học sinh.
- Bản sửa có gợi ý được ghi là có hỗ trợ; lần dùng độc lập ở ngữ cảnh mới là bằng chứng riêng.
- Lỗi API/JSON sai/timeouts có retry có giới hạn và trạng thái rõ ràng; không giả phản hồi thành công.
- Mỗi lần phân tích gắn revisionId, promptVersion/model, trạng thái; tránh ghi đè kết quả của bản khác.
- Hạn mức theo tài khoản, giới hạn độ dài, cache theo revision + cấu hình và log latency/usage khi provider cung cấp.

Bộ kiểm định nội bộ tối thiểu đề xuất 30 đoạn có nhãn do người duyệt: dùng đúng/sai, thiếu từ, biến thể, nhiều nghĩa, collocation, bài ngắn, lỗi mạng. Mục tiêu dự kiến >=85% khớp nhãn đúng/cần sửa trên bộ này; báo cả số chưa chắc và lỗi cụ thể, không coi đây là độ chính xác tổng quát. Trích đoạn dùng để highlight phải khớp 100%; không vượt quality gate thì chưa tự cộng bằng chứng.

## 7. Tiến bộ: định nghĩa vận hành

- Đã lưu: có trong thư viện, không tương đương đã học.
- Đang học: có phiên hoặc bài luyện được ghi nhận.
- Ghi nhớ: trạng thái SRS và lịch sử ôn; hiển thị nguồn tự đánh giá/kiểm tra.
- Vận dụng: lịch sử dùng đúng/sai/chưa chắc theo nghĩa và ngữ cảnh.
- “Đã vận dụng trong nhiều ngữ cảnh” có thể dùng quy tắc sản phẩm ban đầu: 2 lần dùng đúng độc lập ở 2 nhiệm vụ vào 2 ngày khác nhau. Đây là quy tắc nội bộ có phiên bản, không phải chuẩn đo trình độ.
- Không suy CEFR tổng thể từ TTR và số bản ghi.
- TTR/HD-D/MTLD nếu giữ thì là phân tích bài viết phụ, có mô tả và không thay bằng chứng học.

Chỉ số học:
1. Số mục từ bắt đầu học trong tuần.
2. Số mục đến hạn, đã ôn; tỷ lệ đúng lần đầu của bài luyện có đáp án.
3. Số mục có bằng chứng vận dụng độc lập đúng.
4. Số lỗi đã khắc phục trong lần sửa có hỗ trợ.
5. Lịch sử theo nghĩa, nhiệm vụ, thời điểm.

Chỉ số sản phẩm: tỷ lệ hoàn thành phiên đầu, tỷ lệ quay lại ngày 7, số phiên có ý nghĩa/người/tuần, tỷ lệ sửa bài sau feedback, thời gian chờ và lỗi AI.
Xác định cohort và định nghĩa “quay lại”: có hoạt động học hợp lệ; không chỉ mở trang.
Không đặt mục tiêu tăng trưởng giả định thành kết quả thực tế.

## 8. Kiến trúc dữ liệu đề xuất

Tên dưới đây là đề xuất, chốt contract ở Phase 0:
- LearningProfile: sở thích, mục tiêu, mức tự chọn, timezone, phút mỗi phiên.
- LearningSet + LearningItem: bộ từ xuất bản; từ/phrase, nghĩa, từ loại, collocations, ví dụ và câu hỏi có phiên bản.
- LearningSession: snapshot mục tiêu/nội dung, bước hiện tại, trạng thái, thời điểm.
- PracticeAttempt/ReviewEvent: câu trả lời, đúng sai, có gợi ý không, nguồn đánh giá, thời điểm, khóa chống lặp.
- EssayRevision: snapshot văn bản bất biến, revision number, task/session, từ mục tiêu.
- Analysis theo revision: output AI, prompt/model, trạng thái.
- WordUsageEvidence: mục từ/nghĩa, revision, trích đoạn, đánh giá, mức hỗ trợ, nhiệm vụ/ngày.
- Vocabulary tiếp tục là thư viện cá nhân; bổ sung liên kết learning item theo lộ trình, không ép migrate tất cả nghĩa cũ ngay.
- Trạng thái tiến bộ/tổng hợp tính từ sự kiện hoặc projection có thể tính lại.
- RewardEvent chỉ bổ sung ở Phase 6, có khóa duy nhất theo người và sự kiện.

Quan hệ chính: bộ từ → phiên học → bài luyện + bài viết → revision → analysis → evidence → tiến bộ.
Mỗi task triển khai đi xuyên dữ liệu/API/UI vừa đủ, không dựng toàn bộ schema trước rồi bỏ trống UI.

## 9. Giữ, sửa, hoãn

Giữ sau kiểm tra: auth/phân quyền, API client, editor, thư viện, SRS, AI provider adapter, lớp cơ bản.
Sửa: dashboard, navigation, phiên học, AI feedback, tiến bộ, mastery writes trong game, đường dẫn lịch sử.
Hoãn mở rộng: phụ huynh, cảnh báo sớm, plagiarism, quản trị prompt phức tạp, thêm game.
Không xóa chức năng hoặc dữ liệu cũ chỉ vì hoãn. Giữ lối truy cập tương thích khi chuyển đổi.

## 10. Các phase và đầu ra

### Phase 0 — Chốt phạm vi và baseline (ước lượng 2–3 ngày làm việc)
Tasks T01–T03.
- Đối chiếu tài liệu với runtime; lập bản đồ tính năng.
- Chốt persona, 3 bộ từ đầu, rubric, trạng thái phiên và contract AI.
- Wireframe một phiên học và ghi baseline build/lint/tests.
Đạt khi có một kịch bản demo, hợp đồng dữ liệu và danh sách giữ/sửa/hoãn rõ ràng.

### Phase 1 — Người mới vào được phiên học (3–5 ngày)
Tasks T04–T06; phụ thuộc Phase 0.
- Onboarding tối giản; bộ nội dung đã duyệt; Học hôm nay và session tiếp tục được.
- Thay đổi điều hướng có đường lui, chưa mở rộng hoạt họa.
Đạt khi tài khoản mới chọn sở thích, mở đúng bài và reload vẫn tiếp tục được.

### Phase 2 — Học và ôn có lưu kết quả (4–6 ngày)
Tasks T07–T09; phụ thuộc Phase 1.
- Thẻ học ngữ cảnh; bài luyện; lịch sử lần thử.
- Tích hợp SRS, chuẩn hóa đường cập nhật mastery từ flashcard/game.
Đạt khi có đúng/sai thật, lịch ôn thay đổi đúng, không nhân đôi khi gửi lại.

### Phase 3 — Viết vận dụng và AI phân tích (5–8 ngày)
Tasks T10–T12; phụ thuộc Phase 2.
- Nhiệm vụ viết theo bộ từ; bản nháp và revision bất biến.
- Adapter/schema validation, feedback ngữ cảnh, xử lý lỗi.
Đạt khi AI phản hồi trên đúng phiên bản, highlight khớp và bộ kiểm định đạt ngưỡng đã chốt.

### Phase 4 — Sửa bài và chứng minh tiến bộ (4–6 ngày)
Tasks T13–T15; phụ thuộc Phase 3.
- So sánh revision; lưu evidence có/không hỗ trợ.
- Dashboard mới, dữ liệu lịch sử và kết quả phiên.
Đạt khi đi trọn học → viết → feedback → sửa → ôn; lưu từ đơn thuần không tăng số từ vận dụng.

**Mốc MVP đúng tên đề tài: hết Phase 4.**

### Phase 5 — Thử nghiệm với người học (3–5 ngày kỹ thuật + thời gian quan sát)
Tasks T16–T17; phụ thuộc Phase 4.
- Kiểm thử mobile, bàn phím, mất mạng, phiên dở, tài khoản cũ.
- Ghi sự kiện tối thiểu và tổ chức thử tự nguyện với khoảng 5–10 người học.
- Quan sát điểm bỏ cuộc, chất lượng giải thích; sửa 3 trở ngại nổi bật trước thêm tính năng.
Đạt khi không còn lỗi chặn vòng học; có báo cáo phản hồi và số liệu ban đầu. D7 cần đủ thời gian quan sát, không suy từ một buổi demo.

### Phase 6 — Vườn và động lực quay lại (3–5 ngày)
Tasks T18–T20; phụ thuộc bằng chứng Phase 5.
- Vườn từ kết quả học thật; mục tiêu tuần và phần thưởng chống lặp.
- Trang giới thiệu và bài thử; mở rộng bộ nội dung khoảng 6 bộ.
Đạt khi trạng thái vườn giải thích được, không thưởng trùng, người dùng tiếp cận phiên đầu thuận lợi.
So sánh với baseline trước đó; thay đổi số liệu chưa tự chứng minh quan hệ nhân quả.

### Phase 7 — Giáo viên và hoàn thiện bản phát hành (4–6 ngày)
Tasks T21–T23; phụ thuộc Phase 4, triển khai sau ổn định trải nghiệm.
- Giao bộ từ + nhiệm vụ, xem lỗi dùng từ, nhận xét bổ sung.
- Migration chạy thử, backup/rollback, tài liệu/demo cập nhật.
Đạt khi học độc lập và học theo lớp đều chạy trọn; dữ liệu cũ còn truy cập được.

Ước lượng tổng khoảng 28–44 ngày làm việc, tương đương khoảng 6–9 tuần ở 5 ngày/tuần, cộng thời gian chờ thử nghiệm. Đây là ước lượng sơ bộ cho một người quen codebase, không là cam kết; chốt lại sau baseline. MVP Phase 0–4 khoảng 18–28 ngày. Không cộng công việc nhóm tuyến tính để suy thời gian rút ngắn.

## 11. Chiến lược chuyển đổi

1. Triển khai ở nhánh riêng khi bắt đầu code; giữ stack và API cũ trong thời gian chuyển.
2. Thêm trường/model theo hướng tương thích; đặt phiên bản quy tắc tính tiến bộ.
3. Snapshot và chạy thử migration trên bản sao dữ liệu; không xuất dữ liệu người học ra artifact công khai.
4. Từ cũ giữ nguyên và gắn nguồn legacy khi không biết nguồn; không suy diễn nghĩa hoặc bằng chứng vận dụng.
5. Giữ SRS/mastery cũ như trạng thái lịch sử; không chuyển sang evidence độc lập.
6. Kết quả AI cũ được gắn snapshot baseline với nguồn migrated, không nhận là revision lịch sử chưa từng lưu.
7. Chuyển dashboard mới trước trên môi trường thử; tắt/bật luồng mới bằng cấu hình triển khai.
8. Rollback giao diện/API mới không xóa sự kiện học; kiểm tra tương thích đọc dữ liệu.
9. Dọn code cũ chỉ sau khi tham chiếu đã chuyển và kiểm thử đạt.

## 12. Kiểm chứng và rủi ro

Lệnh hiện có: frontend npm run build, npm run lint; backend npm test --prefix server.
Baseline chưa được chạy trong công việc lập kế hoạch này.
Mỗi task chạy test tập trung liên quan; checkpoint chạy nhóm hồi quy có ảnh hưởng và build/lint. Không gọi AI trả phí hàng loạt trong unit test; dùng fixtures, dành một bộ đánh giá provider có kiểm soát.

Rủi ro → xử lý:
- AI đánh giá sai → rubric, bộ nhãn thủ công, trạng thái chưa chắc, không tự cấp evidence khi lỗi.
- Nội dung nhiều nghĩa → learning item theo nghĩa, version nội dung.
- Chỉ học thuộc đáp án → lưu lần đầu/gợi ý; thêm nhiệm vụ ngữ cảnh mới.
- Đếm trùng → khóa idempotency cho submit/review/reward và retry an toàn.
- Lệch ngày ôn → timezone hồ sơ, kiểm thử gần ranh giới ngày.
- Quá tải phạm vi → Phase 4 là mốc MVP, không mở chat/game/social trước.
- Tài liệu cũ → task đối chiếu, không dựa dấu [x] làm bằng chứng.
- Truy cập bài người khác → authorization theo tài khoản/lớp và test chéo.
- Bài viết không đáng tin → coi nội dung người học là dữ liệu, không cho ghi đè rubric/system instruction.
- Giao diện đẹp nhưng khó học → kiểm thử nhiệm vụ với người mới, không chỉ chụp màn hình.

## 13. Các quyết định cần chốt ở Phase 0

Đề xuất mặc định để không chặn lập kế hoạch:
- A2–B1 tự chọn; người học Việt Nam; ưu tiên tự học.
- 3 bộ đầu: Daily Life, Travel, Hobbies.
- 3–5 từ/phiên, đoạn ngắn; điều chỉnh bằng thử nghiệm.
- Tận dụng nhà cung cấp AI đang cấu hình; chọn model bằng bộ đánh giá thay vì đổi theo tên.
- Không đổi React/Vite sang Next.js và không migrate toàn dự án sang TypeScript trong cùng đợt.
- Giữ các trang vai trò cũ nhưng không mở rộng trước MVP.

Tài liệu này là định hướng mới được đề xuất. Nó không xác nhận chức năng đã hoàn thành hoặc hiệu quả giữ chân đã được chứng minh.

