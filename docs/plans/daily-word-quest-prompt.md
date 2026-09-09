# Prompt lập kế hoạch Daily Word Quest

Bạn là Senior Product Engineer kiêm Game UX Designer. Hãy khảo sát dự án LexiGrow và lập kế hoạch chi tiết để bổ sung tính năng:

**Daily Word Quest — giải ô chữ từ vựng mỗi ngày, kết nối với Growth Garden.**

Ở giai đoạn này chỉ khảo sát và lập kế hoạch, chưa sửa mã nguồn ứng dụng. Kết quả phải đủ cụ thể để một agent khác triển khai theo từng giai đoạn.

## 1. Bối cảnh dự án

LexiGrow là ứng dụng học tiếng Anh theo chuỗi:
Học từ → Luyện tập → Viết bài → Nhận phản hồi AI → Ôn tập → Theo dõi tiến bộ.

Stack đã biết:
- Frontend: React 19, Vite, React Router.
- Mã frontend hiện chủ yếu là JavaScript/JSX.
- Backend theo README: Node.js, Express, MongoDB.
- Có cơ chế SRS và Growth Garden.
- Có đa ngôn ngữ tiếng Việt/tiếng Anh.
- Có hệ thống vai trò học sinh, giáo viên, phụ huynh, admin.

GameHub hiện có Word Matching, Word Scramble, Context Filler và Vocab Hunter.

Các đường dẫn đã biết:
- `src/pages/game/GameHub.jsx`
- `src/pages/game/GameHub.css`
- `src/pages/game/WordMatching.jsx`
- `src/pages/game/WordScramble.jsx`
- `src/pages/game/ContextFiller.jsx`
- `src/pages/game/VocabHunter.jsx`
- `src/pages/student/GrowthGarden.jsx`
- `src/pages/student/FlashcardReview.jsx`
- `src/components/learning/`
- `src/services/api.js`
- `src/locales/vi.json`
- `src/locales/en.json`
- `server/`

Đây là thông tin ban đầu. Phải kiểm tra code thực tế trước khi kết luận; không mặc định README phản ánh chính xác toàn bộ implementation.

## 2. Mục tiêu sản phẩm

Thiết kế một hoạt động 2–3 phút/ngày giúp người học:
- Chủ động nhớ lại từ qua nghĩa hoặc ngữ cảnh.
- Ôn những từ đã học và cần củng cố.
- Có lý do quay lại mỗi ngày.
- Nhìn thấy thành quả qua khu vườn cá nhân.

Daily Word Quest phải kết nối với luồng học hiện tại.

Phân biệt rõ điểm và phần thưởng trong game, khả năng nhớ từ, và trạng thái Mastered của hệ thống học tập.

Không nâng từ lên Mastered chỉ vì giải đúng ô chữ. Không đánh đồng tốc độ gõ với năng lực tiếng Anh. Không coi xu hướng thị trường là bằng chứng tính năng chắc chắn thành công.

## 3. Khảo sát code trước khi đề xuất

### Frontend
- Route, layout và cách đăng ký game.
- Cách các game hiện tại lấy từ vựng.
- Cấu trúc dữ liệu từ: word, definition, translation, example, pronunciation, level, category… nếu thực sự tồn tại.
- Component và CSS token có thể tái sử dụng.
- Cách quản lý loading, empty state, lỗi và thông báo.
- Cơ chế theme và i18n.
- Cách Growth Garden hiển thị và cập nhật tiến trình.

### Backend
- Models, routes và services liên quan đến vocabulary.
- Dữ liệu người dùng đã học và lịch ôn SRS.
- Dữ liệu lỗi dùng từ hoặc phản hồi bài viết có thể tái sử dụng.
- Cơ chế xác thực, phân quyền và validation.
- Hệ thống điểm, phần thưởng, streak hoặc inventory nếu đã tồn tại.
- Cách xử lý transaction, chống ghi trùng và giới hạn request.
- Bộ test và công cụ kiểm thử thực tế.

Với mỗi phát hiện, ghi đường dẫn file cụ thể. Phân biệt rõ “đã có”, “cần mở rộng”, “cần xây mới”. Không tự bịa endpoint hoặc model rồi mô tả như đã có.

## 4. Phạm vi MVP

1. Một Daily Quest cho mỗi người học mỗi ngày.
2. Một ô chữ khoảng 5–7 từ.
3. Gợi ý bằng nghĩa tiếng Việt hoặc câu tiếng Anh thiếu từ.
4. Tiến trình được lưu để có thể tiếp tục.
5. Có gợi ý hỗ trợ khi người học bí.
6. Màn kết quả giúp xem lại các từ.
7. Hoàn thành được nhận phần thưởng trang trí hoặc tài nguyên khu vườn.
8. Không nhận trùng phần thưởng khi gửi lại request.
9. Theo dõi dữ liệu tối thiểu để đánh giá hiệu quả.

Mục tiêu 2–3 phút là định hướng thiết kế, không phải giới hạn bắt buộc. MVP không cần đếm ngược gây áp lực.

Chưa đưa vào MVP:
- PvP thời gian thực.
- Bảng xếp hạng toàn hệ thống.
- Cửa hàng hoặc vật phẩm trả tiền.
- Gacha, loot box.
- Bản đồ phiêu lưu lớn.
- AI sinh nội dung ở mọi lượt chơi.
- Chế độ offline đầy đủ và đồng bộ phức tạp.

Nếu phát hiện hạng mục nào làm MVP quá lớn, đề xuất phương án thu nhỏ nhưng vẫn giữ vòng lặp ôn từ → giải đố → nhận thành quả.

## 5. Luồng trải nghiệm

### A. Điểm vào
- Thẻ Daily Word Quest trong GameHub.
- Cân nhắc một điểm vào phụ ở dashboard hoặc Growth Garden.
- Hiển thị trạng thái: chưa chơi, đang chơi, đã hoàn thành.
- Nêu vị trí tích hợp phù hợp với UI hiện tại.

### B. Màn bắt đầu
- Giải thích ngắn cách chơi.
- Hiển thị số từ và phần thưởng.
- Không lộ đáp án trước khi chơi.
- Hỗ trợ người dùng lần đầu mà không tạo tutorial dài.

### C. Màn giải ô chữ
- Lưới ô chữ.
- Gợi ý đang chọn.
- Chuyển giữa hàng ngang/hàng dọc.
- Hiển thị tiến độ.
- Hỗ trợ bàn phím máy tính và bàn phím điện thoại.
- Có thao tác xóa, chuyển ô và quay lại gợi ý.
- Cho phép bỏ dở rồi tiếp tục.

Phải xác định:
- Khi nào kiểm tra câu trả lời: từng chữ, từng từ hay khi người dùng bấm.
- Cách phản hồi sai mà không biến trò chơi thành đoán mò từng ký tự.
- Cách đánh dấu từ đã giải.
- Cách xử lý ô giao nhau.
- Hành vi khi nhấn Backspace, Enter và phím mũi tên.
- Focus sau khi chọn một gợi ý.
- Trường hợp bàn phím điện thoại che nội dung.

### D. Gợi ý hỗ trợ

Đề xuất tối đa 2–3 mức: xem thêm ngữ cảnh, hiện một chữ, hiện đáp án khi đã thử.

Ghi rõ ảnh hưởng đến thống kê và phần thưởng. Không phạt nặng việc cần hỗ trợ. Tách kết quả giải độc lập và giải có trợ giúp.

### E. Màn kết quả
- Số từ tự giải được.
- Số từ cần trợ giúp.
- Danh sách từ, nghĩa và câu ví dụ.
- Phần thưởng được nhận.
- Nút xem khu vườn.
- Bài viết một câu với từ vừa giải có thể là hoạt động tùy chọn.

Không bắt người học chờ AI chấm mới được hoàn thành game. Nếu tích hợp bài viết, ưu tiên tái sử dụng luồng hiện có.

### F. Các trạng thái phụ
- Không đủ từ để tạo ô chữ.
- Người dùng mới chưa có lịch sử.
- Mạng lỗi khi tải hoặc lưu.
- Tải lại trang giữa lượt.
- Mở nhiều tab hoặc nhiều thiết bị.
- Hoàn thành sát thời điểm chuyển ngày.
- Quest đã hoàn thành nhưng chưa xem hiệu ứng nhận thưởng.
- Nhận thưởng thành công nhưng response bị mất.

## 6. Chọn từ và sinh ô chữ

Thiết kế pipeline: Lấy ứng viên → Kiểm tra dữ liệu → Xếp ưu tiên → Sinh lưới → Kiểm tra chất lượng → Lưu phiên bản cố định.

### Chọn từ

Ưu tiên theo dữ liệu thực tế:
1. Từ đến hạn ôn.
2. Từ từng trả lời hoặc sử dụng sai.
3. Từ mới học gần đây.
4. Từ phù hợp trình độ/chủ đề làm phương án dự phòng.

Đề xuất cách phối hợp các nhóm thay vì chỉ lấy toàn bộ từ khó.

Xác định:
- Giới hạn độ dài đáp án.
- Xử lý khoảng trắng, dấu nối, dấu nháy và dạng biến thể.
- Xử lý từ trùng sau chuẩn hóa.
- Gợi ý thiếu nghĩa hoặc vô tình chứa đáp án.
- Không đủ từ có chữ giao nhau.
- Không đủ dữ liệu cá nhân.
- Từ bị sửa hoặc xóa sau khi quest đã được tạo.

### Sinh lưới

Đề xuất thuật toán có giới hạn thời gian/số lần thử. Yêu cầu:
- Các từ tạo thành lưới hợp lệ.
- Không tạo chuỗi chữ ngoài ý muốn do đặt sát nhau.
- Có quy tắc đánh số hàng ngang/hàng dọc.
- Ưu tiên kích thước dễ chơi trên điện thoại.
- Seed hoặc dữ liệu lưu giúp quest ổn định trong ngày.
- Có fallback khi không thể xếp đủ 5–7 từ.
- Không chạy vòng lặp tìm kiếm vô hạn.

Nêu rõ phần nào là thuật toán sinh lưới và phần nào là UI hiển thị.

## 7. Đánh giá mã nguồn có thể tái sử dụng

Nguồn tham khảo: https://github.com/JaredReisinger/react-crossword

Kiểm tra phiên bản hiện tại, license, dependency và khả năng tương thích với React 19 trước khi đề xuất.

So sánh:
- A. Dùng package.
- B. Fork/adapt phần cần thiết.
- C. Xây component React nhỏ theo yêu cầu MVP.

Đánh giá:
- Mobile và accessibility.
- Kiểm soát focus/input.
- Khả năng tùy chỉnh CSS.
- Lưu/khôi phục tiến trình.
- Callback chấm kết quả.
- Tình trạng bảo trì.
- Chi phí dependency và bảo trì.
- Cách package xử lý đáp án ở client.
- Nghĩa vụ giữ thông báo license khi tái sử dụng.

Chọn một phương án và giải thích. Không mặc định thư viện hiển thị ô chữ có thể tự sinh bố cục từ danh sách từ.

## 8. Daily Quest, ngày và lưu tiến trình

Đề xuất quyết định rõ ràng cho:
- Múi giờ dùng để tính ngày.
- Một quest mỗi user mỗi ngày.
- Quest đã tạo có thay đổi khi danh sách ôn thay đổi không.
- Hành vi khi đổi múi giờ.
- Quest cũ còn được chơi tiếp hoặc nhận thưởng không.
- Quy tắc chơi lại sau hoàn thành.
- Chống tạo nhiều quest khi request đồng thời.
- Lưu tiến trình theo debounce hoặc theo hành động.
- Cách giải quyết cập nhật cũ ghi đè cập nhật mới.
- Nguồn thời gian đáng tin cậy để xét điều kiện nhận thưởng.

Ưu tiên giải pháp đơn giản phù hợp MVP. Không thiết kế hệ đồng bộ phức tạp nếu chưa cần.

## 9. Kết nối Growth Garden

Khảo sát ý nghĩa khu vườn hiện tại trước khi thay đổi.

Nếu sự phát triển của cây đang đại diện cho mức thành thạo từ:
- Giữ nguyên ý nghĩa đó.
- Phần thưởng game nên dùng cho trang trí hoặc một lớp tiến trình tách biệt.
- Không cho điểm game làm tăng giả chỉ số học tập.

Đề xuất:
- Một loại phần thưởng MVP.
- Quy tắc cấp thưởng dễ hiểu.
- Hành vi khi người dùng chơi lại.
- Cách hiển thị phần thưởng và trạng thái đã nhận.
- Cơ chế cấp thưởng nguyên tử hoặc có thể phục hồi an toàn.
- Cách tránh nhận trùng bằng idempotency/unique constraint phù hợp.

Không thêm hệ thống tiền tệ lớn nếu phần thưởng đơn giản đã đáp ứng mục tiêu.

## 10. Kiến trúc và API đề xuất

Dựa vào cấu trúc thực tế, đề xuất:
- Files/components/hooks/services cần thêm hoặc sửa.
- Model hoặc collection cần thêm/mở rộng.
- Index và unique constraint.
- Hợp đồng API: request, response, mã lỗi.
- Trạng thái quest và các chuyển đổi hợp lệ.
- Tách dữ liệu nội bộ và dữ liệu trả về client.
- Cách version hóa puzzle để có thể khôi phục đúng phiên chơi.

Phải phân biệt API hiện có với API đề xuất.

Server xác thực quyền sở hữu quest và quyết định cấp thưởng. Không tin score, completed hoặc reward do client tự gửi.

Đánh giá thực tế việc đáp án xuất hiện ở client:
- Không tuyên bố có thể chống gian lận tuyệt đối trên trình duyệt.
- Chọn mức bảo vệ phù hợp game học tập, phần thưởng giá trị thấp.
- Nêu tradeoff nếu kiểm tra đáp án trên server làm tăng request.

## 11. UI, accessibility và hiệu năng

Thiết kế đồng bộ với UI LexiGrow hiện tại. Ưu tiên:
- Màn điện thoại từ khoảng 360px.
- Lưới có kích thước hợp lý, không buộc người dùng bấm ô quá nhỏ.
- Gợi ý đọc được khi bàn phím đang mở.
- Điều khiển bằng bàn phím.
- Nhãn và hướng dẫn phù hợp screen reader.
- Không chỉ dùng màu để báo đúng/sai.
- Tôn trọng reduced motion.
- Animation nhận thưởng ngắn, không chặn thao tác.
- i18n đầy đủ.
- Lazy-load màn game nếu phù hợp.
- Không thêm game engine chỉ để vẽ ô chữ.

## 12. Đo lường và kiểm chứng

Đề xuất bộ event tối thiểu:
- Quest được hiển thị.
- Bắt đầu.
- Tiếp tục.
- Dùng gợi ý.
- Hoàn thành.
- Nhận thưởng.
- Mở Growth Garden từ màn kết quả.

Xác định cách tránh đếm trùng và dữ liệu không nên thu thập.

Các chỉ số:
- Tỷ lệ bắt đầu trên số người thấy quest.
- Tỷ lệ hoàn thành trên số người bắt đầu.
- Thời gian hoàn thành thực tế.
- Tỷ lệ từ giải được không cần gợi ý.
- Tỷ lệ quay lại ngày tiếp theo và sau 7 ngày.
- Khả năng trả lời đúng từ đã chơi ở lần ôn sau.
- Ảnh hưởng đến tỷ lệ hoàn thành luồng học chính.

Phân biệt tương quan và tác động nhân quả. Đề xuất thử nghiệm nhỏ hoặc so sánh cohort phù hợp lượng người dùng. Không tự đặt số KPI như thể đã có baseline.

## 13. Kế hoạch kiểm thử

Chỉ đề xuất test có giá trị kiểm chứng hành vi. Bao gồm:
- Sinh lưới hợp lệ trên các bộ từ khác nhau.
- Không đủ từ, từ dài, từ trùng, ký tự đặc biệt.
- Kết quả sinh ổn định theo seed/version.
- Chấm đáp án và ô giao nhau.
- Lưu/khôi phục tiến trình.
- Hai request tạo quest đồng thời.
- Hai request hoàn thành/nhận thưởng đồng thời.
- Retry sau lỗi mạng không cấp thưởng hai lần.
- Truy cập quest của người khác bị từ chối.
- Chuyển ngày và múi giờ.
- Thao tác trên desktop và mobile.
- Kiểm tra không làm sai SRS/Mastered/Growth Garden hiện tại.

Nêu rõ test tự động nào dùng framework hiện có, và phần nào cần kiểm thử trình duyệt.

## 14. Chia giai đoạn triển khai

Đề xuất các giai đoạn nhỏ, mỗi giai đoạn có:
- Mục tiêu.
- Phạm vi file.
- Phụ thuộc.
- Công việc cụ thể.
- Acceptance criteria.
- Cách kiểm chứng.
- Rủi ro.
- Cách rollback.

Gợi ý:
1. Khảo sát và chốt quyết định kỹ thuật.
2. Prototype lưới với dữ liệu mẫu.
3. Chọn từ và sinh puzzle.
4. API Daily Quest và lưu tiến trình.
5. Kết nối phần thưởng/khu vườn.
6. Mobile, accessibility, i18n.
7. Đo lường và phát hành thử.

Điều chỉnh thứ tự nếu code thực tế yêu cầu. Ước lượng theo khoảng và nêu giả định, không cam kết số giờ quá chính xác.

## 15. Đầu ra yêu cầu

Viết kế hoạch bằng tiếng Việt vào `docs/plans/daily-word-quest-plan.md`.

Tài liệu phải gồm:
1. Khuyến nghị sản phẩm.
2. Phát hiện từ code thực tế.
3. Phạm vi MVP và phần để sau.
4. Luồng UX và trạng thái.
5. Quy tắc chọn từ, sinh lưới và fallback.
6. Quyết định dùng thư viện hay tự xây.
7. Data model và API đề xuất.
8. Cách kết nối Growth Garden.
9. Kế hoạch triển khai theo giai đoạn.
10. Acceptance criteria và test.
11. Đo lường, rollout và rollback.
12. Giả định và câu hỏi còn mở.

Thêm sơ đồ Mermaid cho luồng người dùng và vòng đời quest/nhận thưởng.

Chọn một phương án khuyến nghị rõ ràng cho từng quyết định quan trọng. Với điểm chưa xác minh được, ghi rõ và đề xuất cách xác minh. Chỉ hỏi người dùng khi thiếu thông tin thực sự cản trở kế hoạch; các lựa chọn thông thường hãy tự đề xuất cùng lý do.

Sau khi viết tài liệu, trả lời ngắn:
- Phương án khuyến nghị.
- Phạm vi MVP.
- Ba rủi ro quan trọng nhất.
- Link tới file kế hoạch.
