# LexiGrow — Checklist triển khai

Tất cả task đang ở trạng thái đề xuất, chưa triển khai. Định hướng: [plan.md](plan.md).
Các đường dẫn là file hiện có hoặc dự kiến tạo; tinh chỉnh sau Phase 0. Mỗi task tối đa khoảng 5 file; nếu phát sinh thêm wiring/test cần tách task phụ. Không gộp đổi framework vào roadmap này.

## Phase 0

### T01: Đối chiếu hiện trạng

- [x] Hoàn thành

**Mô tả:** Lập ma trận chức năng/tài liệu/runtime và baseline trước thay đổi.

**Tiêu chí nghiệm thu:** Không bỏ sót luồng học, game và các vai trò; ghi rõ pass/fail và lỗi tồn tại trước sửa.

**Kiểm chứng:** Chạy npm run build, npm run lint, npm test --prefix server; smoke test đăng nhập, viết, thư viện, ôn.

**Phụ thuộc:** Không.

**File dự kiến:** usecases.md; docs/task.md; tasks/baseline.md.

**Quy mô:** M.

### T02: Chốt một phiên học mẫu

- [x] Hoàn thành

**Mô tả:** Soạn 3 bộ từ dự kiến và rubric AI; chọn một phiên để demo xuyên suốt.

**Tiêu chí nghiệm thu:** Có nghĩa cụ thể, đáp án, mục tiêu viết và ví dụ feedback đúng/sai; có quy tắc ghi nhớ/vận dụng.

**Kiểm chứng:** Duyệt thủ công ví dụ đa nghĩa, collocation, câu sai; đối chiếu tên đề tài.

**Phụ thuộc:** T01.

**File dự kiến:** tasks/learning-spec.md; tasks/content-sample.json.

**Quy mô:** S.

### T03: Chốt contract và wireframe

- [x] Hoàn thành

**Mô tả:** Định nghĩa trạng thái session, revision, analysis, evidence và các màn hình tương ứng.

**Tiêu chí nghiệm thu:** Có hợp đồng request/response và lỗi; có wireframe phiên mới/dở/lỗi; có thiết kế mapping legacy.

**Kiểm chứng:** Đi bộ qua demo bằng dữ liệu mẫu; kiểm tra retry và resume được biểu diễn.

**Phụ thuộc:** T02.

**File dự kiến:** tasks/contracts.md; tasks/wireframes.md; tasks/migration-design.md.

**Quy mô:** M.

### Checkpoint Phase 0

- [x] Tiêu chí phase trong plan.md đạt và có bằng chứng.
- [x] Test liên quan, build/lint được kiểm tra; phân biệt lỗi baseline và lỗi mới.
- [x] Demo luồng đã có, ghi điều chỉnh trước phase tiếp theo.

## Phase 1

### T04: Lưu hồ sơ học

- [ ] Hoàn thành

**Mô tả:** Cho người dùng chọn sở thích, mức tự chọn, mục tiêu và timezone.

**Tiêu chí nghiệm thu:** Lưu và sửa lại được; bỏ qua có mặc định; API không cho sửa hồ sơ người khác.

**Kiểm chứng:** Test validation/phân quyền; thử onboarding và reload; build frontend.

**Phụ thuộc:** T03.

**File dự kiến:** server/src/models/User.js; server/src/controllers/profile.controller.js; server/src/routes/profile.routes.js; src/pages/student/Onboarding.jsx; server/tests/learningProfile.test.js.

**Quy mô:** M.

### T05: Xuất bản bộ từ đầu

- [ ] Hoàn thành

**Mô tả:** Tạo bộ nội dung có phiên bản và danh sách Khám phá dùng được.

**Tiêu chí nghiệm thu:** Có 3 bộ đã duyệt; chỉ nội dung published hiện cho học sinh; seed chạy lại không nhân đôi.

**Kiểm chứng:** Kiểm tra seed hai lần trên DB thử, kiểm tra đọc bộ và ẩn draft.

**Phụ thuộc:** T03.

**File dự kiến:** server/src/models/LearningSet.js; server/src/controllers/learningSet.controller.js; server/src/routes/learningSet.routes.js; src/pages/student/Explore.jsx; server/scripts/seedLearningSets.js.

**Quy mô:** M.

### T06: Bắt đầu và tiếp tục phiên học

- [ ] Hoàn thành

**Mô tả:** Nối Học hôm nay với session được lưu server.

**Tiêu chí nghiệm thu:** Tạo snapshot mục tiêu; reload mở đúng bước; nhấn bắt đầu lặp không tạo phiên ngoài ý muốn.

**Kiểm chứng:** Test tạo/resume/ownership; thử tài khoản mới và session dở.

**Phụ thuộc:** T04,T05.

**File dự kiến:** server/src/models/LearningSession.js; server/src/controllers/session.controller.js; server/src/routes/session.routes.js; src/pages/student/StudentDashboard.jsx; src/App.jsx.

**Quy mô:** M.

### Checkpoint Phase 1

- [ ] Tiêu chí phase trong plan.md đạt và có bằng chứng.
- [ ] Test liên quan, build/lint được kiểm tra; phân biệt lỗi baseline và lỗi mới.
- [ ] Demo luồng đã có, ghi điều chỉnh trước phase tiếp theo.

## Phase 2

### T07: Học từ trong ngữ cảnh

- [ ] Hoàn thành

**Mô tả:** Làm màn hình phiên học với thẻ từ và ví dụ từ nội dung phiên.

**Tiêu chí nghiệm thu:** Hiển thị đúng nghĩa mục tiêu; tiếp tục được từ checkpoint; dùng bàn phím và mobile được.

**Kiểm chứng:** Kiểm tra bằng tay một phiên 5 mục, reload giữa chừng; build.

**Phụ thuộc:** T06.

**File dự kiến:** src/pages/student/LearningSession.jsx; src/components/learning/WordLesson.jsx; src/pages/student/LearningSession.css; src/App.jsx.

**Quy mô:** M.

### T08: Ghi kết quả bài luyện

- [ ] Hoàn thành

**Mô tả:** Thêm chọn nghĩa/điền từ với đáp án server và lịch sử lần thử.

**Tiêu chí nghiệm thu:** Lưu lần đầu và gợi ý riêng; không lộ đáp án trước submit qua payload học sinh; retry không nhân đôi.

**Kiểm chứng:** Test đúng/sai/gợi ý/request trùng/tài khoản khác; thử UI sai rồi sửa.

**Phụ thuộc:** T07.

**File dự kiến:** server/src/models/PracticeAttempt.js; server/src/controllers/practice.controller.js; server/src/routes/practice.routes.js; src/components/learning/PracticeStep.jsx; server/tests/practice.test.js.

**Quy mô:** M.

### T09a: Lưu sự kiện ôn và chuẩn hóa SRS

- [ ] Hoàn thành

**Mô tả:** Gắn lịch sử ôn vào endpoint hiện có, giữ tương thích thư viện cũ.

**Tiêu chí nghiệm thu:** Có nguồn tự đánh giá; gửi lại không tăng số lần; lịch ôn tính theo timezone đã chốt.

**Kiểm chứng:** Chạy tests SRS/endpoints; kiểm tra ngày biên và retry.

**Phụ thuộc:** T08.

**File dự kiến:** server/src/models/ReviewEvent.js; server/src/controllers/vocabulary.controller.js; server/src/services/srs.service.js; src/pages/student/FlashcardReview.jsx; server/tests/srs-endpoints.test.js.

**Quy mô:** M.

### T09b: Ngăn game ghi đè mức thành thạo

- [ ] Hoàn thành

**Mô tả:** Đổi các game sang gửi kết quả có nguồn hoặc bỏ cập nhật mastery trực tiếp.

**Tiêu chí nghiệm thu:** Không game nào tự ghi learning đè mastered; kết quả cũ không giả thành evidence viết.

**Kiểm chứng:** Tìm mọi mastery write, chơi mẫu từng game; xác nhận API từ chối ghi đè không hợp lệ theo contract.

**Phụ thuộc:** T09a.

**File dự kiến:** src/pages/game/WordMatching.jsx; src/pages/game/WordScramble.jsx; src/pages/game/ContextFiller.jsx; src/pages/game/VocabHunter.jsx.

**Quy mô:** M.

### Checkpoint Phase 2

- [ ] Tiêu chí phase trong plan.md đạt và có bằng chứng.
- [ ] Test liên quan, build/lint được kiểm tra; phân biệt lỗi baseline và lỗi mới.
- [ ] Demo luồng đã có, ghi điều chỉnh trước phase tiếp theo.

## Phase 3

### T10: Viết theo từ mục tiêu và lưu revision

- [ ] Hoàn thành

**Mô tả:** Nối nhiệm vụ với editor và snapshot khi nộp.

**Tiêu chí nghiệm thu:** Mục tiêu thuộc phiên được lưu; mỗi lần nộp có revision bất biến; nháp và nội dung đã nộp tách biệt.

**Kiểm chứng:** Test nộp lại/ownership/snapshot; thử reload nháp.

**Phụ thuộc:** T09b.

**File dự kiến:** server/src/models/EssayRevision.js; server/src/models/Essay.js; server/src/controllers/essay.controller.js; src/pages/student/WriteEssay.jsx; server/tests/essayRevision.test.js.

**Quy mô:** M.

### T11: Phân tích từ theo contract AI

- [ ] Hoàn thành

**Mô tả:** Bổ sung adapter phân tích ngữ cảnh theo revision và validate đầu ra.

**Tiêu chí nghiệm thu:** Có đúng/cần sửa/chưa chắc/chưa dùng; lỗi provider không giả thành công; trích đoạn được kiểm chứng.

**Kiểm chứng:** Fixtures và bộ nhãn 30 đoạn; test JSON sai, timeout, quote không tồn tại, prompt injection.

**Phụ thuộc:** T10.

**File dự kiến:** server/src/services/vocabularyAnalysis.service.js; server/src/models/AIAnalysis.js; server/src/controllers/analysis.controller.js; server/tests/vocabularyAnalysis.test.js; server/tests/fixtures/vocabularyAnalysis.json.

**Quy mô:** M.

### T12: Hiển thị phản hồi hành động được

- [ ] Hoàn thành

**Mô tả:** Làm feedback với câu gốc, giải thích và ưu tiên sửa.

**Tiêu chí nghiệm thu:** Highlight đúng revision; tối đa 2 ưu tiên mặc định; loading/lỗi/thử lại rõ ràng.

**Kiểm chứng:** Test kết quả về chậm cho bản cũ; kiểm tra bằng tay Unicode và HTML editor.

**Phụ thuộc:** T11.

**File dự kiến:** src/pages/student/AIFeedbackReview.jsx; src/components/learning/WordFeedback.jsx; src/pages/student/AIFeedbackReview.css; server/tests/analysisRevision.test.js.

**Quy mô:** M.

### Checkpoint Phase 3

- [ ] Tiêu chí phase trong plan.md đạt và có bằng chứng.
- [ ] Test liên quan, build/lint được kiểm tra; phân biệt lỗi baseline và lỗi mới.
- [ ] Demo luồng đã có, ghi điều chỉnh trước phase tiếp theo.

## Phase 4

### T13: So sánh bài sau sửa

- [ ] Hoàn thành

**Mô tả:** Giữ phiên bản và đối chiếu vấn đề trước/sau.

**Tiêu chí nghiệm thu:** Không ghi đè bản đầu; chỉ ghép lỗi liên quan; bản sửa có gợi ý có nhãn hỗ trợ.

**Kiểm chứng:** Kiểm tra sửa đúng, chưa sửa, lỗi mới và thay đổi toàn câu.

**Phụ thuộc:** T12.

**File dự kiến:** server/src/services/revisionComparison.service.js; server/src/controllers/analysis.controller.js; src/components/learning/RevisionComparison.jsx; server/tests/revisionComparison.test.js.

**Quy mô:** M.

### T14: Ghi bằng chứng vận dụng

- [ ] Hoàn thành

**Mô tả:** Lưu sự kiện dùng từ theo nghĩa, revision, ngữ cảnh, mức hỗ trợ.

**Tiêu chí nghiệm thu:** Không cộng khi chưa chắc/lỗi; reanalysis không nhân đôi; phân biệt tự viết và sửa có gợi ý.

**Kiểm chứng:** Test idempotency, sửa kết luận, nghĩa khác và ngữ cảnh khác.

**Phụ thuộc:** T13.

**File dự kiến:** server/src/models/WordUsageEvidence.js; server/src/services/wordEvidence.service.js; server/src/services/vocabularyAnalysis.service.js; server/tests/wordEvidence.test.js.

**Quy mô:** M.

### T15: Thay cách hiển thị tiến bộ

- [ ] Hoàn thành

**Mô tả:** Nối kết quả phiên với thống kê ghi nhớ/vận dụng và nguồn legacy.

**Tiêu chí nghiệm thu:** Thêm từ không tăng số vận dụng; xem được bằng chứng; loại nhãn CEFR suy từ số từ khỏi dashboard mới.

**Kiểm chứng:** Fixtures legacy/new/mixed; chạy toàn vòng đến summary và ôn; build.

**Phụ thuộc:** T14.

**File dự kiến:** server/src/controllers/progress.controller.js; src/pages/student/MyProgress.jsx; src/pages/student/StudentDashboard.jsx; src/components/learning/SessionSummary.jsx; server/tests/progress.test.js.

**Quy mô:** M.

### Checkpoint Phase 4

- [ ] Tiêu chí phase trong plan.md đạt và có bằng chứng.
- [ ] Test liên quan, build/lint được kiểm tra; phân biệt lỗi baseline và lỗi mới.
- [ ] Demo luồng đã có, ghi điều chỉnh trước phase tiếp theo.

## Phase 5

### T16: Kiểm tra khả năng hoàn thành vòng học

- [ ] Hoàn thành

**Mô tả:** Kiểm thử E2E và sửa lỗi chặn, ghi rõ kết quả.

**Tiêu chí nghiệm thu:** Mobile và bàn phím hoàn thành được; mất mạng/resume không mất bài; phân quyền chéo an toàn.

**Kiểm chứng:** npm test --prefix server, build/lint, browser smoke theo demo; tách mỗi lỗi sang task nhỏ nếu vượt 5 file.

**Phụ thuộc:** T15.

**File dự kiến:** tasks/verification.md; server/tests/learningFlow.test.js; các file lỗi cụ thể sau tái hiện.

**Quy mô:** M.

### T17: Ghi chỉ số và thử với người học

- [ ] Hoàn thành

**Mô tả:** Bổ sung sự kiện tối thiểu và kịch bản thử 5–10 người tự nguyện.

**Tiêu chí nghiệm thu:** Không ghi raw bài viết vào analytics; định nghĩa cohort rõ; có báo cáo quan sát và 3 ưu tiên sửa.

**Kiểm chứng:** Đối chiếu event với session thật; loại duplicate; D7 chỉ báo sau đủ thời gian.

**Phụ thuộc:** T16.

**File dự kiến:** server/src/models/LearningEvent.js; server/src/services/learningMetrics.service.js; tasks/pilot-script.md; tasks/pilot-results.md.

**Quy mô:** M.

### Checkpoint Phase 5

- [ ] Tiêu chí phase trong plan.md đạt và có bằng chứng.
- [ ] Test liên quan, build/lint được kiểm tra; phân biệt lỗi baseline và lỗi mới.
- [ ] Demo luồng đã có, ghi điều chỉnh trước phase tiếp theo.

## Phase 6

### T18: Khu vườn từ vựng

- [ ] Hoàn thành

**Mô tả:** Hiển thị cây theo kết quả của từng bộ từ.

**Tiêu chí nghiệm thu:** Mỗi mức có bằng chứng giải thích; click dẫn đến hành động học; reload không đổi thành tích.

**Kiểm chứng:** Test trạng thái từ fixtures; kiểm tra reduced motion và mobile.

**Phụ thuộc:** T17.

**File dự kiến:** server/src/services/garden.service.js; src/pages/student/VocabularyGarden.jsx; src/pages/student/VocabularyGarden.css; src/App.jsx; server/tests/garden.test.js.

**Quy mô:** M.

### T19: Mục tiêu tuần và phần thưởng

- [ ] Hoàn thành

**Mô tả:** Thêm mục tiêu ngày học và huy hiệu/XP tối giản.

**Tiêu chí nghiệm thu:** Một sự kiện chỉ thưởng một lần; tuần theo timezone; nghỉ học không mất thành quả vườn.

**Kiểm chứng:** Test submit lặp, tuần mới, ngày biên và hoạt động không đủ điều kiện.

**Phụ thuộc:** T18.

**File dự kiến:** server/src/models/RewardEvent.js; server/src/services/reward.service.js; src/pages/student/SetWeeklyGoals.jsx; src/components/learning/LearningRewards.jsx; server/tests/rewards.test.js.

**Quy mô:** M.

### T20: Trang giới thiệu và bài thử

- [ ] Hoàn thành

**Mô tả:** Làm lối vào dễ hiểu và trải nghiệm mẫu trước đăng ký.

**Tiêu chí nghiệm thu:** Ghi rõ feedback mẫu; CTA lưu tiến bộ rõ; không gọi AI khách vô hạn.

**Kiểm chứng:** Thử khách → bài mẫu → đăng ký → phiên đầu trên mobile; build.

**Phụ thuộc:** T17.

**File dự kiến:** src/pages/Landing.jsx; src/pages/TryLesson.jsx; src/App.jsx; src/pages/Landing.css; tasks/content-sample.json.

**Quy mô:** M.

### Checkpoint Phase 6

- [ ] Tiêu chí phase trong plan.md đạt và có bằng chứng.
- [ ] Test liên quan, build/lint được kiểm tra; phân biệt lỗi baseline và lỗi mới.
- [ ] Demo luồng đã có, ghi điều chỉnh trước phase tiếp theo.

## Phase 7

### T21: Giáo viên giao nhiệm vụ từ vựng

- [ ] Hoàn thành

**Mô tả:** Nối bộ từ và yêu cầu viết vào assignment hiện có.

**Tiêu chí nghiệm thu:** Lớp được giao đúng bộ; học sinh mở phiên tương ứng; học độc lập vẫn hoạt động.

**Kiểm chứng:** Test giáo viên/lớp khác và deadline; demo giao → học → nộp.

**Phụ thuộc:** T15.

**File dự kiến:** server/src/models/Assignment.js; server/src/controllers/assignment.controller.js; src/pages/teacher/AssignmentManagement.jsx; src/pages/student/StudentClassDetail.jsx; server/tests/assignment.test.js.

**Quy mô:** M.

### T22: Giáo viên xem bằng chứng học

- [ ] Hoàn thành

**Mô tả:** Đưa lỗi từ vựng và tiến bộ vào màn hình học sinh.

**Tiêu chí nghiệm thu:** Xem nguồn câu và trạng thái hỗ trợ; nhận xét được; không lộ dữ liệu lớp khác.

**Kiểm chứng:** Test quyền và fixture mixed legacy/new; demo feedback giáo viên.

**Phụ thuộc:** T21.

**File dự kiến:** server/src/controllers/teacher.controller.js; src/pages/teacher/StudentAnalyticsDetail.jsx; src/pages/teacher/ManualFeedbackReview.jsx; server/tests/classAnalytics.test.js.

**Quy mô:** M.

### T23a: Migration và phương án quay lại

- [ ] Hoàn thành

**Mô tả:** Viết script chuyển dữ liệu bổ sung, dry-run và tài liệu rollback.

**Tiêu chí nghiệm thu:** Chạy lại không nhân đôi; giữ dữ liệu/SRS cũ; không tạo evidence giả từ legacy.

**Kiểm chứng:** Dry-run trên bản sao, so sánh counts/hash, kiểm tra đọc dữ liệu sau rollback.

**Phụ thuộc:** T22,T19,T20.

**File dự kiến:** server/scripts/migrateLearningV2.js; server/tests/learningMigration.test.js; tasks/migration-runbook.md.

**Quy mô:** M.

### T23b: Hoàn thiện hồ sơ phát hành

- [ ] Hoàn thành

**Mô tả:** Cập nhật use cases, README và kịch bản demo đúng tính năng đã chạy.

**Tiêu chí nghiệm thu:** Tài liệu khớp runtime; tất cả quality gates được ghi; có giới hạn AI và hướng dẫn vận hành.

**Kiểm chứng:** Hồi quy backend, build/lint, chạy demo học độc lập và lớp học.

**Phụ thuộc:** T23a.

**File dự kiến:** README.md; usecases.md; docs/task.md; tasks/release-checklist.md; tasks/demo-script.md.

**Quy mô:** M.

### Checkpoint phát hành

- [ ] Chạy trọn demo học → luyện → viết → AI → sửa → evidence → ôn → vườn.
- [ ] Legacy, retry, quyền truy cập và rollback đã được kiểm chứng.
- [ ] Báo cáo chất lượng AI có số liệu và giới hạn; không tuyên bố hiệu quả học khi chưa đo.
- [ ] Tài liệu và kết quả kiểm thử khớp phiên bản phát hành.

