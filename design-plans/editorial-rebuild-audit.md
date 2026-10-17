# Audit độc lập bản rebuild giao diện LexiGrow

Đối chiếu `bd09375..bde29d6` trên nhánh `feat/editorial-academic-ui-rebuild`.
Các commit có thật: `c22d85a`, `fea9977`, `bde29d6`. Diff gồm 48 file.
Ngày audit: 2026-10-12.

## Kết luận

Đã triển khai nền tảng và một số surface chính, nhưng chưa đủ điều kiện nghiệm thu là rebuild toàn bộ giao diện. Có lỗi tái hiện ở nội dung dài, responsive, dark mode, i18n và component mới. Build thành công không chứng minh hoàn tất UX hay giữ đúng 100% hành vi với backend thật.

Audit này không thay đổi source sản phẩm, không merge/push/deploy. Chỉ thêm báo cáo và bằng chứng. Mức độ dưới đây nói về UI/khả năng sử dụng; không phải kết luận về lỗ hổng bảo mật backend.

## Phương pháp và phạm vi xác minh

- Kiểm tra diff, component, CSS, token, tài liệu, asset và consumer của primitive mới.
- Chạy Chromium local với API fixtures có nhãn audit; không gọi backend sản xuất, không phát sinh AI charge hoặc thay dữ liệu học tập.
- 48 trạng thái render: Dashboard, Explore, Game Hub × EN/VI × light/dark × 360/768/1100/1440px. Đồng bộ font trước phép đo cuối. Không gọi đây là 48 test nghiệp vụ passed.
- Thêm 4 trạng thái Explore chứa nghĩa Việt dài, cụm từ nhiều từ và từ rất dài ở 360/768/1141/1440px.
- Reproduce trên route LearningSession thật bằng session/draft/revision/analysis API giả lập, nộp bài hợp lệ và giữ analysis pending để quan sát loader.
- Mount các primitive thực tế để kiểm tra lỗi ảnh→đổi src, ArrowRight/Tab, ID form, variant và CSS contrast.
- Xem trực tiếp sáu ảnh WebP và năm SVG. Trang nguồn Unsplash không truy cập được bằng công cụ web; chưa xác minh độc lập danh tính tác giả/license của từng ảnh. Không kết luận các ảnh vi phạm bản quyền.
- Graft CLI không có trong PATH; dùng graph markdown và kiểm tra lại source. Graph card hiện chưa phản ánh đầy đủ span mới.

## Kết quả checks

| Kiểm tra | Kết quả thực tế |
| --- | --- |
| `npm run build` | PASS, Vite 8.0.16, 401ms, không lỗi/warning trong log build |
| `npm run lint` | Exit 0, **0 errors / 116 warnings**; không phải sạch cảnh báo |
| ESLint so với baseline trên JSX thay đổi | 9 warnings hiện tại vs 1 baseline; 8 warnings mới do import React không dùng ở component mới |
| `git diff --check bd09375..HEAD` | FAIL, exit 2, 6 trailing-whitespace lines trong 3 SVG |
| 48 trạng thái browser | Không pageerror; có vấn đề layout/theme/copy bên dưới |
| Explore long text | Không pageerror; cột nghĩa bị ép còn 0–4px tại một số độ rộng |
| Loader thực tế với API fixtures | Không pageerror; xác nhận chữ nhạt trên nền sáng ở dark mode; EN vẫn hiển thị copy tiếng Việt |
| Backend/SRS/XP end-to-end | Chưa chạy với backend thật; diff không sửa file server, API client, route hay logic SRS/XP |

## Những phần được xác nhận đã làm

| Hạng mục | Đã xác minh | Giới hạn |
| --- | --- | --- |
| Git | Đúng nhánh và ba commit được báo cáo | Không xác nhận đã push/merge; lượt audit không thực hiện |
| Tokens | Cobalt sáng `#1E40AF`, hover/active, shadow-card, border-card | Dark token chưa đồng bộ với DESIGN.md; không đổi toàn bộ surface như tài liệu ghi |
| Primitives | Có Button/Card/Badge/Input/Select/Tabs/Table và chỉnh Modal.css | Input/Select/Tabs/Table chưa có consumer trong app; accessibility chưa hoàn chỉnh |
| Dashboard | Có main/rail, CTA, SRS, stats/chart/goals/recent essays/garden | Rail fixed 340/360px, không phải tỷ lệ 68/32 cố định; link garden đổi từ `/student/progress` sang `/student/garden` |
| Explore | Ảnh theo manifest, cover frame 16:9, layout 3/2/1 cột, rows nghĩa đầy đủ | Multi-word/long target làm cột nghĩa suy sụp; breakpoints khác DESIGN.md |
| Assets | 6 WebP và 5 SVG thực sự tồn tại; 5 cover được dùng ở Explore | auth-study chưa được tích hợp; có nội dung/alt sai và chưa xác minh nguồn từng ảnh |
| LearningSession | Chỉnh CSS stepper, editor/prompt/target chips và loader | Không sửa JSX/logic; chưa rebuild toàn bộ flow theo roadmap |
| Feedback/Flashcard/Progress | Có chỉnh CSS ở các khối cụ thể | Chưa redesign toàn bộ rubric/flashcard/progress/garden/leaderboard |
| Game Hub | Ambient container ẩn, bỏ ambient element khỏi card, thêm artwork | Dot glow/pulse, button glow, gradient widget, PRO PLAY và nhiều nhãn vẫn còn |
| Login | Ẩn particles bằng CSS | Không phải rebuild Auth/Onboarding/Pricing/Settings toàn diện |
| Backend contracts | Không có server/API client/route/i18n catalog diff trong ba commit | Giữ source không đồng nghĩa mọi tương tác UI đã được kiểm thử end-to-end |

## Ba vấn đề trực tiếp nên xử lý trước

| ID | Vấn đề | Bằng chứng / cách tái hiện | Sửa đề xuất | Phạm vi | Confidence |
| --- | --- | --- | --- | --- | --- |
| UI-01 | Nghĩa từ dài thành dải chữ dọc | `Explore.css:388–415`: grid `auto minmax(0,1fr)`; ở 768px cụm `environmentally friendly renewable energy` để lại 4px cho nghĩa, cao ~1478px; ở 1141/1440px còn 0px. Quy tắc long-text đã được chốt trong roadmap/plan trước | Giới hạn chiều rộng cả hai cột; cho term wrap; stack theo chiều rộng card thay vì chỉ viewport ≤480px | Explore, cả published/completed/new-round | Confirmed — browser fixtures |
| UI-02 | Dark loader gần như không đọc được | `LearningSession.css:664–671,709–723`: current/done nền sáng nhưng title lấy dark foreground `#E2E8F0`; actual submit→pending render đúng cascade. Contrast title/current ~1.13:1, description ~2.36:1. Roadmap yêu cầu dark/light đọc rõ | Dùng semantic surface/status token phù hợp từng theme cho cả current/done; xác minh ở loader đang chạy | LearningSession AI progress | Confirmed — actual UI flow với fixtures |
| UI-03 | Dashboard bị ép và clipping | `StudentDashboard.css:29–40`: 1100px với sidebar để lại main 386px nhưng stats vẫn 4 cột theo viewport; main scrollWidth 538px. Chart được bọc thêm Card `overflow:hidden`; mobile screenshot mất một phần header/chart. Long essay title extends đến x532 trong viewport360 | Breakpoint theo chiều rộng main; stats minmax(0,1fr) và giảm cột; bỏ card nesting dư; constrain wrapper title và giữ badge không shrink | Dashboard mobile/tablet, long titles | Confirmed — layout measurements/screenshots |

## Các lỗi kỹ thuật, nội dung và phần chưa hoàn thiện khác

### UI-04 — Medium: primary Button thiếu tương phản trong dark mode
- `src/components/common/Button.css:52–54`: chữ hardcode `#FFF`, nền lấy `--color-primary`.
- Dark token thật `#789DFF`; ratio ~2.60:1. Browser xác nhận trên Dashboard và component mount. Nút mới không dùng cặp `--color-on-primary` hiện có.
- Sửa dùng cặp foreground/background phù hợp theme; kiểm tra hover/active/disabled. Không đổi global primary tối hơn mà chưa kiểm tra các consumer.

### UI-05 — Medium: SRS và một số khối status chưa hỗ trợ dark theme đúng
- `StudentDashboard.css:223–229`, `StudentDashboard.jsx:97,240–245`: SRS/fallback dùng nền và màu inline sáng.
- Badge primary dark `#93C5FD` trên nền SRS `#EFF6FF` ~1.66:1; screenshot thể hiện label rất nhạt.
- `LearningSession.css:762–765` override target-chip used sang nền dark nhưng word vẫn xanh đậm; cần kiểm tra cùng status đã dùng, chưa dùng và loader.
- Sửa status token hoặc theme override có chủ đích; không chỉ đổi background của outer card.

### UI-06 — Medium: i18n chưa hoàn chỉnh
- Mới: `StudentDashboard.jsx:169` dùng `dashboard.recentEssaysDesc` nhưng cả EN/VI catalog thiếu key, VI hiện câu fallback tiếng Anh.
- Mới: `StudentDashboard.jsx:240` hardcode `Spaced Repetition`; fallback mới ở dòng87/92 vẫn EN.
- Tồn tại từ baseline: chart `Vocabulary Growth/Weekly/Monthly`, `vs last month`, `Level:`; AI loader ở `LearningSession.jsx:351–445` hardcode VI, thực tế locale EN vẫn hiện VI. Không quy mọi chuỗi này là regression của ba commit.
- Artwork mới: Vocab Hunter chứa `Khả năng phục hồi`, Matching chứa nghĩa Việt, Daily Quest chứa nhãn EN cố định; external SVG không đổi theo LanguageContext.
- Sửa key mới và copy cũ trong phạm vi rebuild; với illustration dùng text ngoài ảnh hoặc bản locale tương ứng. Từ tiếng Anh đang học vẫn giữ nguyên.

### UI-07 — Medium: EditorialCoverImage bị kẹt fallback khi src đổi
- `EditorialCoverImage.jsx:17–25,53–54`: hasError/isLoaded không reset theo resolvedSrc.
- Browser: mount URL lỗi→fallback; rerender cùng instance với ảnh environment hợp lệ→vẫn fallback, `<img>` count=0.
- Hiện catalog key theo slug hạn chế một số tình huống reuse; lỗi vẫn confirmed ở shared component, ảnh đổi cho cùng slug hoặc retry sẽ bị ảnh hưởng.
- Sửa vòng đời ảnh theo src hoặc isolate state trong keyed child; verify error→valid, valid→new, valid→error; không chỉ thêm key tùy tiện ở một consumer.

### UI-08 — Medium, latent: Tabs thiếu bàn phím và variant sai contract
- `Tabs.jsx:21–30`: tab không active có tabIndex=-1 nhưng không có ArrowLeft/Right/Home/End handler. Browser ArrowRight giữ `tab-one`, Tab bỏ qua hai tab còn lại.
- Contract ghi `pill`; CSS chỉ hỗ trợ `pills` (`Tabs.css:42–71`). Mount variant=pill nhận padding0/radius0.
- Chưa thấy app import Tabs mới, vì vậy chưa tuyên bố các tab đang dùng của sản phẩm bị lỗi do component này.
- Sửa roving focus/key handling, namespaced IDs/aria-controls/panel contract; thống nhất variant hoặc alias; tích hợp sau khi verify.

### UI-09 — Medium, latent: form primitives chưa đạt claim accessibility
- `Input.jsx:16`, `Select.jsx:16`: ID suy từ label; hai input Email cho ra cùng `lexi-input-email`; label/error link có thể trỏ nhầm.
- Select không liên kết helper/error bằng aria-describedby, không đặt aria-invalid tự động (`Select.jsx:26–49`). Browser xác nhận null attributes khi có error.
- Input không có label/id mà có error tạo `undefined-error`.
- Chưa có consumer của Input/Select trong route app. Sửa useId ổn định và kết nối label/helper/error; bảo toàn ID người gọi cấp.

### UI-10 — Medium: interactive Card không dùng được bằng keyboard
- `Card.jsx:23` render div onClick, không tabindex/keyboard/native link.
- Consumer thật: `StudentDashboard.jsx:300–305` garden card. Tab không đến card để Enter mở garden.
- Đây là thiếu sót tiếp tục tồn tại từ teaser div cũ, không phải khẳng định backend/navigation mới bị hỏng.
- Sửa consumer thành link hoặc action native phù hợp; không biến mọi Card chứa nhiều control thành button.

### UI-11 — Medium: phần hình ảnh/copy chưa đúng brief
- Technology WebP là ảnh ký tự Matrix xanh/đen, không phải workspace tự nhiên; manifest alt mô tả workspace không đúng ảnh.
- Travel là flat-lay bản đồ/camera, auth-study là giá sách trong thư viện; alt tương ứng ghi kiến trúc thành phố và bàn học không đúng.
- `word-scramble.svg:6–18` có R/O/W/G/T, thiếu H so với target G-R-O-W-T-H ở dòng22.
- `daily-quest.svg:32` ghi cố định `5 Words Solved Today`, không lấy progress; cần loại bỏ nhãn kết quả giả hoặc biến thành caption minh họa rõ.
- Sửa asset Technology theo brief, alt mô tả đúng, chữ/mẫu gameplay chuẩn. Hoàn thiện asset acquisition/verification evidence; nguồn chưa kiểm chứng không được ghi là đã xác thực.

### UI-12 — Medium, completion gap: rollout chưa đạt toàn bộ roadmap
- Chưa có diff trực tiếp ở Teacher/Parent/Admin, WriteEssay/VocabularyLibrary, gameplay bốn game, DailyWordQuest, Garden/Leaderboard/Goals, Register/ForgotPassword/Onboarding, Pricing/Payment/Settings và overlay.
- Shell/token có ảnh hưởng gián tiếp đến các page này, nhưng không chứng minh đã migrate layout/copy/component hoặc kiểm thử chúng.
- R08–R16 còn phần chưa triển khai; R17/R18 chưa đủ bằng chứng nghiệm thu. `auth-study` chỉ có asset/manifest, không có consumer ngoài manifest.
- Hoàn tất theo route inventory đã sửa, không chỉ tiếp tục sửa màu ở vài page.

### UI-13 — Low/Medium: Game Hub còn các pattern mà DESIGN.md yêu cầu loại bỏ
- `GameHub.css:132–138` dot glow/ping; `184–200` blur/gradient widget; `235–256` gradient quest/hover shadow; `569–679` color glow khi hover và button glow.
- JSX vẫn render hero dot và PRO PLAY. Việc ẩn ambient-orb và bỏ card-ambient-glow đã làm thật, nhưng không tương đương loại bỏ mọi glow.
- Chốt ngoại lệ gameplay trong DESIGN.md; gỡ trang trí liên tục ở hub và giữ chỉ feedback chơi game có mục đích.

### UI-14 — Low: DESIGN.md và inventory chưa phản ánh thực tế
- DESIGN dark primary `#60A5FA`, thực tế `#789DFF`; surface/default dark, shadow và hover cũng không khớp bảng.
- DESIGN grid: mobile<680, desktop≥1100; Explore CSS mobile≤720, 2cols≤1140; Dashboard từ1024 dùng rail fixed.
- DESIGN Modal backdrop rgba(15,23,42,.4), actual Modal.css:11 rgba(0,0,0,.5) kèm blur6px.
- DESIGN Badge info/error khác CSS primary/danger. DESIGN nêu zero CLS nhưng chưa có phép đo CLS toàn trang; aspect-ratio chỉ giúp reserve cover space.
- Inventory Dashboard ghi `/api/learning-sessions/active`, `/api/recommendations`, `/api/srs/due-today`; source gọi `/sessions/current`, `/sessions/recommendation`, `/vocabulary/due-today` qua base `/api`. Explore inventory ghi topics, source learning-sets. Đây là inventory chưa được trace đầy đủ, không phải bằng chứng contract đã đổi.
- Sửa tài liệu theo trạng thái thực tế, phần chưa triển khai ghi future/proposed. Ghi validation screenshot/state thật thay vì chỉ danh sách tính năng.

### UI-15 — Low: lint/format và asset pipeline chưa hoàn thiện
- 8 warning React import mới; 6 dòng whitespace lỗi ở daily-quest/vocab-hunter/word-scramble SVG.
- Image component chưa dùng focalPoint trong manifest, chưa có responsive srcset/sizes, tất cả cover Explore dùng lazy; chưa đo LCP/CLS. Không khẳng định những điều này chắc chắn gây chậm, cần đo baseline.
- Dọn warning mới/whitespace; bổ sung crop/size/priority có căn cứ; không ghi zero warnings hoặc zero CLS từ riêng kết quả build.

## Thứ tự xử lý đề xuất

1. Sửa UI-01/02/03/04/05: nội dung dài, layout theo content width và các cặp màu dark. Verify lại bằng các fixture này và content thật.
2. Sửa UI-06/07/08/09/10: i18n, lifecycle ảnh và accessibility primitive/consumer. Test Arrow/Home/End, errors, ID, src retry và native navigation.
3. Sửa UI-11/13/14/15: asset, copy, styling còn lại, docs/inventory và checks.
4. Hoàn tất UI-12 theo từng role/surface; giữ từng flow/backend contract; chạy smoke với tài khoản và backend test thật được phép sử dụng.
5. Nghiệm thu route/state EN/VI light/dark/mobile, commit theo nhóm và báo cáo tồn đọng. Chỉ xem đây là bản rebuild hoàn chỉnh khi coverage có bằng chứng.

## Bằng chứng đi kèm

- [48 trạng thái render và computed style](editorial-rebuild-audit-evidence/matrix.json).
- [Kiểm tra component](editorial-rebuild-audit-evidence/components.json).
- [Nghĩa dài/cụm từ dài](editorial-rebuild-audit-evidence/long-content.json).
- [Loader pending thực tế với fixtures](editorial-rebuild-audit-evidence/learning.json).
- [Dashboard mobile VI light](editorial-rebuild-audit-evidence/dashboard-360-vi-light.png).
- [Dashboard VI dark](editorial-rebuild-audit-evidence/dashboard-1440-vi-dark.png).
- [Explore long content 768px](editorial-rebuild-audit-evidence/explore-long-768-vi-light.png).
- [Learning loader EN dark](editorial-rebuild-audit-evidence/learning-loader-en-dark.png).

Không pageerror trong các fixture đã chạy không loại trừ lỗi khác với dữ liệu thật. Không đánh dấu SRS/XP/feedback/backend phân quyền passed chỉ từ các phép kiểm tra frontend này. Các account/password ví dụ trong inventory chưa được xác minh là tài khoản test hoạt động; audit không dùng chúng để đăng nhập production.
