# LexiGrow — Kế hoạch thiết kế lại toàn bộ giao diện

Trạng thái: kế hoạch đề xuất để triển khai; chưa thay đổi giao diện sản phẩm.
Mốc mã nguồn đối chiếu: `bd09375`.
Phạm vi: toàn bộ route hiện có của học viên, giáo viên, phụ huynh, admin, xác thực, hồ sơ và thanh toán; các tab nội bộ, popup và widget liên quan.

## 1. Mục tiêu và căn cứ

Xây dựng giao diện học tập chuyên nghiệp, có nhận diện LexiGrow, phân cấp rõ và nội dung phong phú. Tham khảo cách DOL tổ chức tài nguyên học theo kỹ năng/chủ đề; màu sắc, typography và bố cục dưới đây là đề xuất riêng cho LexiGrow, không phải các thông số đã đo từ DOL.

Nguồn tham khảo: https://tuhoc.dolenglish.vn/.

Căn cứ trong repo:
- `src/App.jsx`: danh sách route và phân quyền theo vai trò.
- `src/components/layout/AppLayout.jsx`: shell chung, navigation mobile, vùng full-bleed của flashcard, ChatWidget và AnnouncementPopup.
- `src/styles/tokens.css`: màu semantic, Inter, spacing, radius, shadow, theme sáng/tối đã tồn tại.
- `src/pages/student/StudentDashboard.jsx` và `.css`: dữ liệu phiên học, recommendation, SRS, thống kê, biểu đồ, mục tiêu, garden, bài viết; hero có gradient/glow/blur.
- `src/pages/student/Explore.jsx`: năm nhóm chủ đề fallback; ảnh hiện được thay thế bằng icon/gradient.
- `src/pages/game/GameHub.jsx` và `.css`: glow, HUD, PRO PLAY, metadata game; XP, streak và ranking có nguồn dữ liệu.
- `src/locales/en.json`, `src/locales/vi.json`, `src/contexts/LanguageContext.jsx`: hệ thống song ngữ.
- `design-plans/explore-target-vocabulary-long-text.md`: yêu cầu bố trí nghĩa từ dài đã được ghi nhận; kế hoạch này kế thừa yêu cầu đó.

Giới hạn bằng chứng: chưa có baseline screenshot đăng nhập đầy đủ theo bốn vai trò. Mỗi nhóm trang phải được mở và ghi nhận trạng thái thực tế trước khi triển khai nhóm đó; không coi mọi page đều có các vấn đề đã thấy ở Dashboard/Game Hub.

## 2. Quyết định thiết kế

Hướng: Modern Academic / Editorial Learning.

Ba cấp trình bày:
1. Shell và điều khiển: nhất quán xuyên suốt hệ thống.
2. Bố cục: phù hợp nhiệm vụ của từng nhóm trang, không ép tất cả thành một grid card.
3. Nội dung hình ảnh: ảnh thật cho chủ đề học; artwork có cùng phong cách cho game; giữ hình thức biểu đạt cây/vườn và trạng thái tiến độ.

Quy chuẩn đề xuất:
| Thành phần | Quyết định |
| --- | --- |
| Nền và màu chữ | Dùng `--color-background`, `--color-surface-container-lowest`, `--color-on-surface`, `--color-on-surface-variant`; nền trung tính, chữ có phân cấp |
| Màu thương hiệu | Giữ cobalt của `--color-primary`; màu ấm chỉ dành cho thành tựu/điểm nhấn; màu semantic giữ ý nghĩa trạng thái |
| Card thường | `--radius-lg` (12px), viền outline variant, mặc định không bóng; không dùng glass/glow |
| Điều khiển | `--radius-md` (8px), trạng thái hover/focus/disabled/loading thống nhất |
| Badge/filter | Capsule khi là trạng thái hoặc bộ lọc; không dùng badge để trang trí mọi tiêu đề |
| Typography | Giữ Inter ở giai đoạn đầu; sử dụng scale hiện có: tiêu đề trang 24–32px, mục 20px, body 16px, metadata 13–14px; không thêm font chỉ để tạo cảm giác mới |
| Khoảng cách | Scale 4/8/12/16/24/32/48px hiện có; gutter desktop 24–32px, mobile 16px |
| Icon | Tiếp tục Material Symbols, đồng nhất kích thước/weight; không trộn thêm hệ icon trong cùng surface; emoji có thể xuất hiện trong nội dung học, không là icon điều hướng/tiêu đề mặc định |
| Hình ảnh | Chủ đề cụ thể, ánh sáng tự nhiên, màu vừa phải; bố cục crop nhất quán; không thêm ảnh cho bảng quản trị chỉ để lấp chỗ trống |
| Motion | Phản hồi thao tác ngắn; giữ lật flashcard và feedback game; bỏ pulse/glow chạy liên tục ở khu vực điều hướng và học tập thông thường |
| AI trong copy | Giữ thông tin nguồn AI, fallback và cảnh báo độ tin cậy ở nơi cần; CTA diễn đạt nhiệm vụ học cụ thể |
| Theme tối | Dùng token dark hiện có; kiểm tra viền, chữ, chart, trạng thái và vùng ảnh; không phủ trắng cứng ở component |

Một trang chỉ nên có một hành động chính nổi bật trong ngữ cảnh hiện tại. Các hành động phụ vẫn hiện diện và có nhãn rõ. Không thêm số liệu, thời lượng, thành tích hay nội dung quảng cáo không có căn cứ.

## 3. Kiểm kê chức năng trước khi thay đổi

Tạo `design-plans/ui-route-inventory.md` trong nhiệm vụ R01. Mỗi route và tab nội bộ có các cột:
`role | route/query | component | tab | data sources | actions | state | locale/theme | before screenshot | after screenshot | verification`.

Danh mục route bắt buộc, lấy từ `src/App.jsx` tại mốc đối chiếu:
- Học viên: dashboard; explore; writing; write-essay/write; garden; my-words/vocabulary; vocabulary/review; game và matching/scramble/filler/hunter/daily-quest; essays; progress; goals; feedback; class và class/:classId; onboarding.
- Giáo viên: dashboard; classes; class/:id; assignments; assignment/:id; student/:id; feedback/:id; alerts; prompts.
- Phụ huynh: dashboard; children/:id; children/:id/progress, essays, vocabulary, goals, alerts; bộ chọn con và bottom navigation.
- Admin: dashboard; users; classes; ai-monitoring; vocabulary; pricing; logs; chat; announcements. Bao gồm các tab provider/combo/settings thực sự đang được render trong component; tên file không chứng minh route đang được sử dụng.
- Chung: login; register; forgot-password; settings; pricing; payment/success; payment/cancel; các route alias/redirect.
- Overlay: announcement popup, đóng/ẩn 24 giờ, ảnh/banner song ngữ; notification bell; chat; discussion; modal; toast; xác nhận thao tác.

Tài khoản kiểm thử nội bộ phục vụ chụp baseline (mật khẩu mặc định: `123456`, script khởi tạo: `node server/scripts/seedFullDemo.js`):
- Học viên: `student@lexigrow.com`
- Giáo viên: `teacher@lexigrow.com`
- Phụ huynh: `parent@lexigrow.com`
- Quản trị viên: `admin@lexigrow.com`

Tại thời điểm triển khai phải đọc lại route để cập nhật thay đổi sau `bd09375`. Không bỏ qua component chỉ vì nó nằm trong tab thay vì một route riêng.

## 4. Hướng bố cục theo nhóm trang

| Nhóm | Bố cục đích | Hành vi cần đối chiếu |
| --- | --- | --- |
| Student Dashboard | Header gọn; phiên học/gợi ý là khối chính; rail mục tiêu và ôn tập; thống kê compact; chart; danh sách bài gần đây; lối vào garden | Resume/start, recommendation/fallback/retry, SRS, tất cả chỉ số và liên kết hiện có |
| Explore | Catalog chủ đề có ảnh; filter/search rõ; card có title, level, thời lượng, mô tả, target words, trạng thái và CTA | Bộ lọc, tìm kiếm, completed/new rounds, bộ từ và chuyển vào session |
| LearningSession | Header và stepper gọn; nội dung từng bước chiếm trọng tâm; target vocabulary có từ/IPA/nghĩa/ví dụ nếu dữ liệu có; flashcard lật được điều khiển | Explore→practice→writing→feedback→revision/completion, lưu nháp, retry và pending đúng trạng thái |
| WriteEssay | Đề/rubric/target words ở panel tham khảo; editor chính rộng; toolbar và word count gọn | Query essay/assignment, autosave, chỉnh sửa, helper, correction, submit và revision |
| AI/Manual Feedback | Rubric và evidence rõ; bài viết dễ đọc; feedback nhóm theo tiêu chí; nguồn AI/teacher, detector và plagiarism tách bạch | Reanalyze, pending/fallback, revision, teacher score/draft/submit, discussion |
| VocabularyLibrary | Thanh tìm kiếm/filter; list hoặc grid theo chức năng hiện có; từ/nghĩa/IPA/status/SRS dễ quét | CRUD, batch save/import nếu có, category, search, audio, review và game entry |
| FlashcardReview | Không gian tập trung; trước/sau card rõ; tiến độ và điều khiển nằm cố định trong bố cục | Flip, pronunciation, SRS grading, due/all/category, trạng thái hết từ và retry |
| Game Hub và game | Catalog có artwork theo game; metadata ngắn; game giữ sân chơi và phản hồi riêng | Cấu hình nguồn/chủ đề, start/restart, score/result, save words, XP theo cơ chế thực tế |
| Progress/Garden/Leaderboard/Goals | Header và tab cùng hệ; chart/table có nhãn; garden có visual riêng nhưng chung điều khiển | Tất cả tab hiện có, usage evidence, scope/rank, mục tiêu, tiến độ và XP |
| Lớp học/Bài viết | Danh sách dễ quét, trạng thái rõ, detail có hierarchy | Class/assignment context, essay history và navigation |
| Teacher | Workspace ưu tiên hàng chờ, lớp, bài tập, bảng và detail | CRUD lớp/bài tập, xem học sinh, feedback, analytics, alert và prompt |
| Parent | Tổng quan con đang chọn; tiến độ và thông tin cần theo dõi; mobile dễ đọc | Child switch, các view, lịch sử và navigation theo con |
| Admin | Console có table/filter/form; density vừa phải; thông báo lỗi và xác nhận rõ | Tất cả thao tác quản trị, provider/combo, announcement, chat, billing, logs |
| Auth/Onboarding/Pricing/Settings | Bố cục thương hiệu bình tĩnh; form là trọng tâm; ảnh dùng chọn lọc | Validation, authentication, onboarding, theme/language/profile và thanh toán |

### 4.1 Đặc tả cấu trúc trang mẫu Dashboard (Student Dashboard)

Bố cục hai cột Desktop (khoảng 68% cột chính : 32% cột phụ) khi chiều rộng nội dung >= 1024px:
- **Cột chính (Trọng tâm học tập - 68%)**:
  1. *Greeting & Active Unit Banner*: Nền trung tính sạch (`--color-surface-container-lowest`), viền 1px outline variant, không bóng đổ glow. Hiển thị thông tin phiên học dở dang hoặc gợi ý phù hợp nhất từ AI; CTA chính nổi bật dạng Solid Cobalt (`--color-primary`).
  2. *Daily Focus Pathway*: 2-3 bộ bài học hoặc chủ đề đề xuất cho ngày hôm nay, hiển thị rõ số từ vựng và kỹ năng rèn luyện.
  3. *Recent Submissions & Feedback*: Danh sách các bài viết gần đây với nhãn trạng thái tinh tế (Chờ phản hồi, Đã chấm, Cần chỉnh sửa) kèm điểm số CEFR nếu có.
- **Cột phụ (Thống kê & Động lực - 32%, min-width 300px)**:
  1. *Streak & Daily Time Goal*: Widget đo tiến độ học trong ngày thanh lịch, thay emoji bằng icon vector mảnh, hiển thị phút học thực tế / mục tiêu.
  2. *SRS Flashcards Due Today*: Đếm số lượng từ vựng đến hạn ôn tập trong ngày (`dueToday`) kèm nút bấm "Ôn tập ngay" dẫn thẳng vào `/student/vocabulary/review`.
  3. *Growth Garden Summary*: Tóm tắt cấp độ cây và số giọt nước hiện có kèm liên kết chuyển nhanh tới trang vườn đầy đủ `/student/garden`.
  4. *Weekly Leaderboard Snippet*: Vị trí xếp hạng cá nhân và top 3 học viên trong tuần.

Thứ tự xếp chồng trên Mobile (viewport <= 768px):
1. Greeting & Active Unit Banner (Hành động học tập số 1).
2. SRS Flashcards Due Today (Nhiệm vụ ôn từ nhanh).
3. Daily Focus Pathway (Chọn bài học).
4. Recent Submissions (Theo dõi bài nộp).
5. Streak & Daily Goal (Chỉ số cá nhân).
6. Growth Garden & Leaderboard (Xếp ở cuối cùng để không đẩy nội dung học xuống dưới).

### 4.2 Đặc tả cấu trúc trang mẫu Explore (Topic Catalog & Long Text)

Bố cục lưới đáp ứng (Responsive Grid): 3 cột (desktop >= 1200px), 2 cột (tablet 768px–1199px), 1 cột (mobile < 768px):
- **Phần đầu trang (Catalog Header)**: Thanh tìm kiếm chủ đề kết hợp hàng nút lọc (Filter Pills: Tất cả, Đời sống, Công nghệ, Du lịch, Môi trường, Sở thích).
- **Cấu trúc thẻ chủ đề (Topic Card)**:
  1. *Ảnh bìa (16:9 Aspect Ratio)*: Đặt ở trên cùng, không phủ chữ hoặc gradient lên bề mặt ảnh; góc dưới có thể gắn badge cấp độ CEFR (`B1`, `B2`).
  2. *Tiêu đề & Thông tin (Card Body)*: Tên chủ đề (font 18px, weight 600), mô tả ngắn gọn (giới hạn 2-3 dòng có thể xem thêm).
  3. *Khối từ vựng mục tiêu (Target Vocabulary)*: Hiển thị 3-4 từ tiêu biểu dưới dạng danh sách hàng. Mỗi hàng bao gồm: Từ vựng đậm, phiên âm IPA xám nhạt, và nghĩa tiếng Việt đầy đủ. **Quy tắc bắt buộc:** Nghĩa từ dài tự động xuống dòng tự nhiên, tuyệt đối không cắt cụt dấu ba chấm (`...`) làm mất nghĩa học tập (kế thừa triệt để quy chuẩn `explore-target-vocabulary-long-text.md`).
  4. *Chân thẻ (Card Footer)*: Huy hiệu trạng thái học (Chưa học / Đã hoàn thành vòng 1) và nút "Bắt đầu học" rõ ràng.

## 5. Nhiệm vụ AI tự tìm và bổ sung ảnh

AI thực thi nhiệm vụ R03 chủ động tìm, đánh giá và tích hợp ảnh, không yêu cầu người dùng cung cấp từng ảnh. Asset được chọn trước khi chốt bố cục card.

### 5.1 Brief ảnh theo chủ đề hiện có

| Chủ đề / vị trí | Brief | Truy vấn khởi đầu |
| --- | --- | --- |
| daily-life | Cảnh đọc sách, đi làm, sinh hoạt thật; màu nhẹ, không tạo dáng quảng cáo | `daily routine desk morning natural light` |
| travel | Kiến trúc/đường phố/cảnh du lịch có ngữ cảnh, có thể crop ngang | `travel city architecture street photography` |
| hobbies | Hoạt động sáng tạo: làm gốm, vẽ, nhiếp ảnh, làm vườn | `creative hobby pottery painting natural light` |
| technology | Thiết bị/cộng tác trong đời thực; tránh robot neon và hologram | `technology workspace collaboration natural light` |
| environment | Rừng, bảo tồn, năng lượng tái tạo; không đồng nhất môi trường với mọi ảnh cây xanh | `forest conservation renewable energy landscape` |
| Auth/Onboarding | Một ảnh học tập có chủ đích, ít vật thể; dùng lại crop cùng bộ | `quiet study library desk daylight` |
| Game Hub | Artwork mô tả đúng thao tác matching/scramble/context/hunter/crossword | Ưu tiên dựng SVG từ thao tác game; ảnh raster chỉ khi cùng phong cách và nguồn rõ |
| Garden | Giữ hoặc tinh chỉnh asset cây/vườn theo stage hiện có | Không dùng ảnh stock thay thế trạng thái tăng trưởng |

Các truy vấn chỉ là đầu vào nghiên cứu, không phải danh sách asset đã được chọn. Tìm theo chủ đề thực tế mà API trả về, bổ sung mapping cho nội dung ngoài năm fallback topics.

### 5.2 Quy trình chọn ảnh

1. Tìm ảnh qua image search và trang nguồn Pexels/Unsplash; lấy 3 ứng viên cho mỗi nhóm cần ảnh, ghi nguồn tác giả/asset.
2. Mở ảnh và kiểm tra bằng mắt: đúng chủ đề, crop mobile còn ý nghĩa, không có chữ/logo gây nhiễu, không có dấu hiệu ảnh tạo sinh hoặc retouch quá mức.
3. Kiểm tra license của asset/trang nguồn tại thời điểm lấy. Không lấy ảnh trực tiếp từ DOL hoặc dùng ảnh tìm kiếm mà chưa xác định nguồn.
4. Chọn một bộ có độ sáng, sắc độ và cách crop nhất quán. Ảnh stock người học không được trình bày như testimonial hay người dùng thật của LexiGrow.
5. Với ảnh tải thủ công từ website theo license cho phép, lưu asset trong repo hoặc CDN của dự án. Nếu dùng Unsplash API, tuân theo API terms: hotlink ảnh trả về và attribution; không áp quy trình tải static cho ảnh API một cách máy móc.
6. Tạo manifest cho từng asset: id, topic, source page, author, license URL, ngày kiểm tra, acquisition mode, local path/remote URL, kích thước, dung lượng, focal point, altVi, altEn, bề mặt sử dụng.
7. Tạo crop và định dạng WebP/AVIF phù hợp; giữ original ở nơi lưu asset nếu cần, không đưa ảnh gốc nhiều MB vào build.
8. Kiểm tra ảnh lỗi, ảnh chậm và chủ đề chưa có mapping. Fallback dùng một cover biên tập chung và tên chủ đề, không dùng URL random hoặc gọi dịch vụ ảnh theo mỗi page load.

Nguồn tham khảo điều khoản:
- Pexels: https://www.pexels.com/license/
- Unsplash static license: https://unsplash.com/license
- Unsplash API: https://unsplash.com/api-terms

### 5.3 Đầu ra, Manifest Schema và Fallback Component

Đầu ra dự kiến:
1. Thư mục asset tĩnh: `src/assets/editorial/topics/` (ảnh WebP/AVIF đã tối ưu).
2. Tệp kê khai bản quyền: `src/assets/editorial/image-manifest.json`.
3. Thành phần hiển thị ảnh kèm Fallback: `src/components/common/EditorialCoverImage.jsx`.

**Cấu trúc chuẩn của `image-manifest.json`:**
```json
{
  "version": "1.0",
  "updatedAt": "2026-10-12",
  "assets": {
    "technology": {
      "id": "editorial-topic-technology-01",
      "topic": "Technology",
      "source": "Unsplash",
      "author": "Author Name",
      "sourceUrl": "https://unsplash.com/photos/...",
      "license": "Unsplash License",
      "licenseUrl": "https://unsplash.com/license",
      "localPath": "/assets/editorial/topics/technology.webp",
      "width": 960,
      "height": 540,
      "aspectRatio": "16:9",
      "focalPoint": "50% 50%",
      "alt": {
        "vi": "Không gian làm việc và thiết bị công nghệ hiện đại",
        "en": "Modern technology workspace and devices"
      }
    }
  }
}
```

**Quy chuẩn Component `<EditorialCoverImage />`:**
- Tự động lấy ảnh từ manifest dựa theo `topicId` hoặc URL truyền vào.
- Hỗ trợ `loading="lazy"` cho ảnh dưới fold, và `fetchPriority="high"` khi là banner chính của trang.
- **Cơ chế Fallback Typographic:** Khi ảnh bị lỗi 404, mạng chậm hoặc gặp chủ đề động chưa có ảnh tĩnh trong manifest, component tự động render một khung bìa biên tập chuẩn mực:
  * Nền xám nhạt cao cấp (`--color-surface-container-low`) kết hợp viền mảnh 1px.
  * Hiển thị ký tự viết tắt hoặc tên chủ đề với font Inter bán đậm, kèm một biểu tượng vector tối giản của danh mục.
  * Tuyệt đối không để xảy ra hiện tượng icon ảnh vỡ (broken image icon) hoặc màn hình giật layout (layout shift) khi ảnh đang nạp.

Ngân sách khởi đầu: 5 cover chủ đề hiện tại (Daily Life, Travel, Hobbies, Technology, Environment), 1 ảnh auth/onboarding dùng lại, artwork cho 4 game và daily quest. Chỉ mở rộng theo nội dung thật. Ảnh chủ đề trong catalog không tự động được chèn vào mọi flashcard.

Mục tiêu file: thumbnail 640–960px rộng, khoảng 60–140KB; banner 1280–1600px, khoảng 150–250KB. Dùng `srcset/sizes`, kích thước khai báo, lazy loading dưới fold; không lazy ảnh quan trọng nhất của viewport. Không tô thêm overlay gradient mặc định; đặt chữ dưới ảnh.

## 6. Backlog triển khai và phụ thuộc

| ID | Nhiệm vụ | Phụ thuộc | Đầu ra / điều kiện hoàn tất |
| --- | --- | --- | --- |
| R01 | Kiểm kê route/tab/action/state và chụp baseline | — | Inventory đầy đủ theo role; query params/alias được ghi nhận; có tài khoản test được phép dùng |
| R02 | Chốt design direction bằng mẫu Dashboard và Explore | R01 | Mockup desktop/mobile, EN/VI, sáng/tối; nội dung dùng dữ liệu thật hoặc fixture có nhãn rõ |
| R03 | AI tìm và tuyển chọn ảnh | R01 | Brief, contact sheet, asset manifest và bộ ảnh đã kiểm tra nguồn; không dùng ảnh chưa truy xuất được nguồn |
| R04 | Áp dụng quy chuẩn vào token và primitive đang tồn tại | R02 | Button, input, card, badge, tab, table, modal có đủ trạng thái; không phá consumer chưa migrate |
| R05 | Redesign shell chung | R04 | AppLayout, Sidebar, TopNav, ParentBottomNav; menu/role/child switch/theme/language hoạt động |
| R06 | Dashboard mẫu | R02–R05 | Toàn bộ dữ liệu/action cũ có vị trí mới; trạng thái từng resource vẫn rõ |
| R07 | Explore và long vocabulary content | R03–R06 | Ảnh thật, filter/search giữ logic, nghĩa dài không tràn; cả completed/new rounds |
| R08 | LearningSession và WriteEssay | R04–R07 | Tất cả step/state/editor/autosave/revision giữ hành vi; long text và mobile được kiểm tra |
| R09 | Feedback AI và giáo viên | R08 | Rubric/evidence/source/teacher score hiển thị rõ; polling/pending/fallback không bị che khuất |
| R10 | VocabularyLibrary và FlashcardReview | R04–R06 | CRUD/category/review/all/due/audio/game entry và empty/error state được đối chiếu |
| R11 | Game Hub, bốn game và DailyWordQuest | R03, R10 | Artwork có cùng phong cách; gameplay/result/recap/save words và trạng thái XP giữ đúng |
| R12 | Progress/Garden/Leaderboard/Goals và lớp/bài viết học viên | R04, R06 | Tab, filter, chart, ranking và evidence không mất; stage garden vẫn khớp dữ liệu |
| R13 | Teacher workspace | R05, R09 | Toàn bộ route teacher và modal CRUD đạt kiểm tra giao diện/hành động |
| R14 | Parent workspace | R05, R12 | Các child view, child switch và mobile nav giữ đúng ngữ cảnh |
| R15 | Admin console | R04, R05 | Route/tab/form/table hiện có, provider/combo, announcements và chat được migrate |
| R16 | Auth/onboarding/settings/pricing/payment và overlay chung | R03–R05 | Form, validation, popup song ngữ/24h, chat, notification, discussion đủ trạng thái |
| R17 | Audit toàn bộ và sửa drift | R06–R16 | Route inventory không còn mục bỏ sót; ảnh/typography/theme/copy nhất quán |
| R18 | Nghiệm thu, commit và chuẩn bị phát hành | R17 | Build/lint/checks phù hợp đạt; báo cáo route/state, assets, commit, tồn đọng; release/rollback sẵn sàng |

R02/R03 làm trước khi rollout, vì chọn ảnh và hierarchy ảnh hưởng trực tiếp đến bố cục. R04/R05 phải được kiểm tra trên các page chưa migrate. R13–R16 có thể làm song song theo file ownership sau khi shell ổn định; tránh nhiều người cùng sửa tokens/global/locales.

### 6.1 Đặc tả 8 thành phần nguyên tử cốt lõi (UI Primitives - Nhiệm vụ R04)

Để xóa bỏ tình trạng CSS rời rạc "sặc mùi AI" và đảm bảo tính nhất quán trên toàn bộ 18 nhiệm vụ, R04 sẽ chuẩn hóa 8 UI Primitives tại `src/components/common/`:
1. **`Button`**: Các biến thể `primary` (Solid Cobalt `#1E40AF`), `secondary` (Slate `#F1F5F9`), `outline` (Viền 1px `#E2E8F0`), `ghost`; các kích thước `sm` (32px), `md` (40px), `lg` (48px); hỗ trợ icon slot trước/sau và trạng thái loading spinner tích hợp.
2. **`Card`**: Thẻ phẳng nền trắng (`#FFFFFF` sáng / `#1E293B` tối), viền 1px outline variant, góc bo `--radius-lg` (12px), loại bỏ hoàn toàn gradient phát sáng và glassmorphism dày.
3. **`Badge / Tag`**: Dạng viên thuốc (Pill/Capsule) màu pastel nhã nhặn (`info`, `success`, `warning`, `neutral`, `error`), typography kích thước 12-13px sắc nét, không dùng emoji làm biểu tượng chính.
4. **`Input & Textarea`**: Viền 1px Slate-200, hiệu ứng focus ring Cobalt thanh mảnh (2px), hỗ trợ nhãn label rõ ràng, chú thích helper và hiển thị lỗi validation.
5. **`Tabs`**: Hỗ trợ 2 kiểu hiển thị: gạch chân hiện đại (Modern Underline) cho trang quản trị/tiến độ và nút bấm phân đoạn (Segmented Capsule) cho bộ lọc; hỗ trợ điều hướng phím mũi tên.
6. **`Modal`**: Chuẩn hóa từ modal hiện tại, nền backdrop mờ tối giản (`rgba(15, 23, 42, 0.4)`), bẫy focus bàn phím, đóng bằng phím Escape, phân tách rõ Header / Body / Footer.
7. **`Table`**: Bảng dữ liệu quản trị sạch sẽ, viền phân cách 1px mỏng, thanh tiêu đề cố định (Sticky Header), vùng chứa hỗ trợ cuộn ngang mượt mà trên mobile.
8. **`Select / Dropdown`**: Menu lựa chọn chuẩn Accessibility, hiển thị rõ ràng mũi tên dropdown vector thay cho các thành phần select HTML mặc định thô ráp.

## 7. Cách giữ chức năng khi viết lại giao diện

- Mỗi task bắt đầu từ inventory và source của nhóm đó, không dựng component mới từ screenshot rồi bỏ logic cũ.
- Tách thay đổi markup/CSS/presentational component khỏi các hook/service/domain handler. Reuse logic hiện có; nếu cần thay đổi logic để hỗ trợ presentation phải giải thích riêng và thêm kiểm tra tương ứng.
- Giữ identifier, route/query, tab state, event handler, form validation, upload, quyền và trạng thái request. Không đổi nghĩa enum backend vì nhãn UI mới.
- Trình bày loading/error/timeout/pending/fallback/empty theo dữ liệu thật. Không dùng skeleton hoặc progress animation để báo giả rằng job AI đã hoàn tất.
- Những copy như PRO PLAY, Target speed hoặc chỉ số demo phải được đối chiếu trước khi giữ/sửa. Không xóa metadata học tập thật cùng với trang trí.
- Bản rebuild không thay cơ chế XP, SRS, idempotency, AI gateway hay phân quyền. Nếu phát hiện bug chức năng, ghi finding riêng và xử lý theo mức độ; không đánh dấu redesign đã sửa nghiệp vụ chưa kiểm tra.
- Giữ từng feature có mặt trong giao diện, gồm các thao tác mở qua modal/tab. Có thể thay vị trí nhưng phải còn đường truy cập rõ và có đối chiếu trước/sau.

## 8. Song ngữ, theme và responsive

UI mới dùng `en.json`/`vi.json` và LanguageContext. Tránh thêm chuỗi EN hardcode hoặc dùng một translation key cho hai nghĩa khác nhau. Nội dung người dùng, bài viết và từ tiếng Anh đang học không bị dịch cưỡng bức khi chuyển ngôn ngữ UI.

Phải kiểm tra nhãn tiếng Việt dài, dấu tiếng Việt, IPA, từ ghép, Unicode, số/ngày theo locale; chuyển ngôn ngữ tại chỗ không làm mất draft hoặc bước học. Metadata ảnh có alt song ngữ; ảnh trang trí dùng alt rỗng. Banner có chữ nên dùng HTML text hoặc hai asset ngôn ngữ nếu nghiệp vụ banner yêu cầu.

### 8.1 Hệ thống Breakpoints và quy tắc dàn trang

| Breakpoint | Kích thước (CSS px) | Thiết bị mục tiêu | Quy tắc dàn trang và hành vi |
|---|---|---|---|
| **`sm`** | 360px – 639px | Mobile dọc | 1 cột duy nhất; rail phụ xếp sau nội dung chính; Bottom Navigation cho các vai trò hỗ trợ; lề trang 16px |
| **`md`** | 640px – 1023px | Tablet dọc / Mobile ngang | 1–2 cột tùy bề mặt; Sidebar chuyển chế độ thu gọn (Icon-only hoặc Drawer); bảng tự cuộn ngang; lề trang 20px |
| **`lg`** | 1024px – 1279px | Laptop nhỏ / Tablet lớn | Bắt đầu chia 2 cột (Dashboard 65/35); Sidebar mở rộng 240px; Explore chia 2 cột thẻ; lề trang 24px |
| **`xl`** | 1280px – 1535px | Desktop tiêu chuẩn | Bố cục chuẩn 68% : 32%; Explore chia 3 cột thẻ; container tối đa 1360px căn giữa |
| **`2xl`** | >= 1536px | Màn hình lớn / TV | Khống chế max-width nội dung chính 1440px để tránh độ dài dòng văn bản quá lớn gây mỏi mắt khi đọc bài viết |

Viewport kiểm tra tối thiểu: 360, 390, 768, 1024, 1440 CSS px; thêm 1920px cho wide layout và browser zoom 200%. Kiểm tra theo chiều rộng nội dung sau sidebar, không chỉ viewport. Form/editor không bị keyboard mobile che mất thao tác chính; table cuộn trong container; tabs wrap/scroll có chủ đích.

## 9. Nghiệm thu và bằng chứng

| Nhóm kiểm tra | Tiêu chí |
| --- | --- |
| Coverage | Mỗi route/tab/overlay trong inventory có kết quả; route alias và deep link vẫn mở đúng nội dung |
| Giao diện | EN/VI × sáng/tối; nội dung ngắn/dài; không overflow ngoài vùng table/game có chủ đích; ảnh không làm mất trọng tâm hành động |
| Tương tác | Keyboard, focus, modal close/return focus, menu, form error, mobile; reduced motion không làm mất thao tác |
| Học tập | Resume/draft, submit, pending/fallback/retry, revision, feedback; flashcard/SRS; game/result/save words; progress/ranking |
| Vai trò | Teacher/class context, parent/child context, admin form và popup thông báo; UI không thay quyền truy cập |
| Assets | Nguồn/license/alt/crop/fallback đầy đủ, không random URL, không ảnh lỗi; font và ảnh không gây nhảy layout |
| Build/check | `npm run build`; `npm run lint`; `git diff --check`; lỗi sẵn có phải tách khỏi lỗi phát sinh |
| Regression | Ưu tiên kiểm tra sẵn có cho flow bị ảnh hưởng; thêm test khi thay tương tác/state có rủi ro, không thêm test chỉ để chụp lại CSS |
| Báo cáo | Screenshot before/after, route/state đã kiểm tra, hành động đã chạy, asset provenance, commit và lỗi còn mở |

Không suy từ build thành công rằng chức năng đã được kiểm tra. Backend suite chỉ chạy khi task ảnh hưởng contract/backend hoặc có căn cứ regression; UI rebuild phải có kiểm tra tương tác qua browser.

Mục tiêu performance: không tăng JS bundle vì thêm thư viện trang trí; chỉ tải ảnh cần ở viewport; so sánh LCP/CLS và dung lượng tải của trang mẫu trước/sau bằng cùng môi trường. Ngưỡng phát hành dựa trên baseline đo được, không tuyên bố số đạt khi chưa đo.

## 10. Commit, phát hành và điểm dừng

Làm trên branch riêng; bảo toàn thay đổi sẵn có của người dùng. Commit theo nhóm review được, ví dụ:
1. `docs: define interface rebuild direction and asset inventory`
2. `style: unify shared controls and application shell`
3. `feat: redesign student dashboard and topic catalog`
4. `style: redesign writing and feedback surfaces`
5. `style: redesign vocabulary and game surfaces`
6. `style: unify progress and role workspaces`
7. `style: refresh account payment and shared overlays`
8. `fix: resolve bilingual responsive and theme regressions`

Mỗi commit mô tả surface, hành vi được giữ và validation thực tế. Push/deploy theo yêu cầu triển khai của người dùng ở lượt thực thi; việc lập kế hoạch không tự kích hoạt production release. Chuẩn bị rollback về release trước, không cần database migration cho thay đổi thuần presentation. Sau thay đổi lớn chạy `graft build` nếu CLI khả dụng; nếu chưa khả dụng ghi rõ trong báo cáo.

Điểm dừng cục bộ: không đủ quyền/tài khoản để kiểm tra flow; nguồn ảnh không xác định; source đã đổi làm plan không còn đúng; thay đổi presentation đòi hỏi sửa quyền/contract nghiệp vụ. Tiếp tục task độc lập, ghi rõ phần bị chặn, không lấp bằng dữ liệu giả.

Sau khi direction được chấp nhận và exemplar được kiểm tra, ghi quy tắc thực sự triển khai vào `DESIGN.md`; giữ quyết định, component owner và ngoại lệ game/garden rõ ràng. Không ghi mockup chưa triển khai như hiện trạng sản phẩm.

## 11. Điều kiện hoàn tất toàn dự án

Toàn bộ route/tab/overlay được kiểm kê và migrate; tất cả hành động hiện có có đối chiếu; EN/VI và dark/light hoàn chỉnh; ảnh có nguồn và dùng đúng ngữ cảnh; giao diện dài/mobile không vỡ; checks phù hợp đạt hoặc lỗi sẵn có được nêu; báo cáo có bằng chứng và commit rõ. Chưa được ghi “hoàn tất 100%” nếu còn route/state chưa kiểm tra.
