# LexiGrow — Design System & Guidelines (Modern Academic / Editorial Learning)

Tài liệu quy chuẩn giao diện và hệ thống thiết kế chính thức của LexiGrow sau đợt chuyển đổi loại bỏ phong cách tạo sinh ("AI-vibes") và áp dụng triết lý học thuật hiện đại biên tập (Modern Academic / Editorial Learning), lấy cảm hứng từ cấu trúc phân phối tri thức của DOL English.

---

## 1. Triết lý thiết kế (Design Philosophy)

1. **Academic Clarity**: Giao diện hướng tới sự tập trung cao độ khi học, tôn trọng dòng chảy tư duy (cognitive flow). Loại bỏ hoàn toàn các viền neon phát sáng, đổ bóng mờ quá đà (glassmorphism), hạt chuyển động (floating particles) và animation trang trí không mục đích.
2. **Editorial Hierarchy**: Phân cấp nội dung rõ ràng như một ấn phẩm học thuật cao cấp. Tiêu đề đậm sắc sảo, phụ đề chỉ dẫn rõ ràng, thẻ học có viền mảnh 1px (`--color-outline-variant`), góc bo tiêu chuẩn 12px (`--radius-lg`).
3. **Curated Thematic Imagery**: Sử dụng ảnh tư liệu thực tế (curated WebP photography) có bản quyền, nguồn gốc và tác giả minh bạch từ Unsplash/Pexels. Ảnh được hiển thị theo tỷ lệ chuẩn 16:9, không bị phủ chữ hoặc gradient đè lên ảnh.
4. **Resilient Typography & Long Text**: Không cắt cụt nghĩa từ vựng bằng dấu ba chấm (`...`). Định nghĩa tiếng Việt dài tự động xuống dòng tự nhiên trong các khối từ vựng mục tiêu.

---

## 2. Bảng mã màu & Tokens (`src/styles/tokens.css`)

| Token | Giá trị sáng | Giá trị tối | Mục đích sử dụng |
|---|---|---|---|
| `--color-primary` | `#1E40AF` (Deep Cobalt) | `#789DFF` | Nút bấm chính, tiêu đề nhấn mạnh, huy hiệu tích cực |
| `--color-on-primary` | `#FFFFFF` | `#002D65` | Chữ tương phản cao trên nền primary |
| `--color-surface` | `#FFFFFF` | `#0E1420` | Nền trang hoặc nền thành phần tương tác |
| `--color-surface-container-lowest` | `#FFFFFF` | `#0B0E14` | Nền thẻ Card tiêu chuẩn |
| `--color-surface-container-low` | `#F8FAFC` | `#131A26` | Nền vùng phụ, chip, khối ghi chú |
| `--color-surface-container` | `#F1F5F9` | `#1B2433` | Vùng nền phân cách trung cấp |
| `--color-outline-variant` | `#E2E8F0` | `#334155` | Viền thẻ Card 1px, phân cách bảng |
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.05)` | `0 1px 3px rgba(0,0,0,0.3)` | Đổ bóng phẳng tối giản cho Card |
| `--shadow-card-hover` | `0 6px 16px -2px rgba(15,23,42,0.08)` | `0 6px 16px -2px rgba(0,0,0,0.5)` | Đổ bóng khi hover thẻ Card |

---

## 3. Hệ thống 8 thành phần nguyên tử (UI Primitives)

Toàn bộ các thành phần nằm tại `src/components/common/`:

1. **`Button`** (`Button.jsx`, `Button.css`):
   - Biến thể: `primary` (Solid Cobalt), `secondary` (Slate nền phẳng), `outline` (viền 1px), `ghost`, `danger`.
   - Màu chữ: sử dụng `--color-on-primary` đảm bảo tương phản WCAG AAA trên cả nền sáng và tối.
   - Kích thước: `sm` (32px), `md` (40px), `lg` (48px).
   - Hỗ trợ slot icon trái/phải (`leftIcon`, `rightIcon`), trạng thái `loading` và `disabled`.
2. **`Card`** (`Card.jsx`, `Card.css`):
   - Nền trắng phẳng, viền 1px outline variant, góc bo 12px (`--radius-lg`), không bóng glow.
   - Hỗ trợ keyboard accessibility (`role="button"`, `tabIndex={0}`, Enter/Space) khi có `onClick`.
   - Các sub-component: `CardHeader`, `CardTitle`, `CardFooter`.
3. **`Badge`** (`Badge.jsx`, `Badge.css`):
   - Dạng viên thuốc thanh lịch, các biến thể: `neutral`, `primary` (hỗ trợ alias `info`), `success`, `warning`, `danger` (hỗ trợ alias `error`).
   - Typography 12-13px sắc nét, icon vector mảnh đi kèm.
4. **`Input`** (`Input.jsx`, `Input.css`):
   - Viền 1px Slate-200, focus ring Cobalt 2px. Hỗ trợ `useId()` sinh ID độc lập, liên kết `aria-describedby` với error/helper, và tự động đặt `aria-invalid`.
5. **`Select`** (`Select.jsx`, `Select.css`):
   - Dropdown chuẩn accessibility với `useId()`, liên kết `aria-describedby` và `aria-invalid`, icon mũi tên chevron vector sắc nét.
6. **`Tabs`** (`Tabs.jsx`, `Tabs.css`):
   - Hai chế độ: `underline` (gạch chân học thuật) và `pills` (hỗ trợ alias `pill`).
   - Điều hướng bàn phím chuẩn WAI-ARIA roving tabindex (ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, End).
7. **`Table`** (`Table.jsx`, `Table.css`):
   - Bảng quản trị phẳng, viền mỏng 1px, hỗ trợ cuộn ngang linh hoạt trên mobile.
8. **`Modal`** (`Modal.css`):
   - Hộp thoại góc bo 12px, nền backdrop `rgba(0, 0, 0, 0.5)` kết hợp `backdrop-filter: blur(6px)`, bẫy focus bàn phím.

---

## 4. Quản lý tài nguyên hình ảnh & Ảnh bìa

- **Thư mục ảnh tĩnh**: `public/assets/editorial/topics/` (WebP đã nén 60–150KB).
- **Thư mục artwork vector**: `public/assets/editorial/artwork/` (SVG minh họa phẳng cho 4 game và quest).
- **Kê khai bản quyền**: `src/assets/editorial/image-manifest.json` (Ghi nhận đầy đủ author, license URL, alt song ngữ VI/EN chính xác với ảnh).
- **Thành phần hiển thị**: `src/components/common/EditorialCoverImage.jsx`
  - Tự động nạp ảnh từ manifest theo `topicSlug`.
  - Hỗ trợ `focalPoint` căn chỉnh trọng tâm ảnh.
  - Vòng đời ảnh: tự động reset lỗi khi URL ảnh thay đổi.
  - Fallback thông minh: khi gặp chủ đề động chưa có ảnh tĩnh, tự động render khung bìa typographic nhã nhặn kèm tên chủ đề và biểu tượng vector, không làm vỡ layout (0 CLS).

---

## 5. Quy chuẩn dàn trang đáp ứng (Responsive Grid Breakpoints)

- **Mobile (`sm`: < 680px)**: 1 cột nội dung, lề trang 16px, rail phụ chuyển xuống đáy.
- **Tablet (`md`: 680px – 1099px)**: 2 cột thẻ danh mục Explore, Sidebar thu gọn hoặc dạng drawer.
- **Desktop (`lg` / `xl`: >= 1100px)**:
  - Explore: Lưới 3 cột thẻ chủ đề tỷ lệ 16:9 cân đối, max-width container 1280px căn giữa, các chip từ vựng hiển thị dạng flex dọc (wrap term trên hàng 1 và 100% card width cho định nghĩa tiếng Việt).
  - Student Dashboard: Bố cục 2 cột biên tập (cột chính học tập : rail phụ tiến độ 340-360px kích hoạt từ >= 1180px); stats grid dạng `repeat(auto-fit, minmax(170px, 1fr))` chống tràn số liệu.

## 6. Điều hướng header ngang

Shell đang sử dụng `TopNav.jsx`, `HeaderNavigation.jsx` và `NavigationDisclosure.jsx`. `AppLayout` không render sidebar và không dành khoảng trống 280px bên trái; nội dung căn giữa theo container hiện có.

- Desktop từ 1100px: logo, một mục tổng quan và các nhóm navigation trên cùng một hàng; chỉ hiện liên kết con khi mở dropdown.
- Nhóm học viên: Học tập, Luyện tập, Tiến độ; Lớp học có liên kết trực tiếp. Giáo viên: Giảng dạy, Theo dõi, Công cụ. Admin: Quản lý, Vận hành, Thanh toán. Phụ huynh: Học tập của con, Gia đình.
- Hover chuột mở dropdown; click/tap cũng mở được. Trigger có `aria-expanded` và `aria-controls`. Liên kết giữ Tab order tự nhiên; ArrowDown/ArrowUp từ trigger mở và focus liên kết đầu/cuối; Escape đóng và trả focus về trigger. Click ngoài hoặc chuyển route đóng navigation.
- Dưới 1100px: nút menu mở panel ngay dưới header; nhóm con mở bằng tap. Đây là navigation responsive trong header, không phải sidebar off-canvas.
- Tài khoản chứa hồ sơ, gói cước và đăng xuất. Ngôn ngữ và thông báo luôn có trên header; theme chuyển vào panel trên màn hình rất nhỏ. Tìm kiếm mở bằng nút trên desktop và xuất hiện trong panel mobile.
- Phụ huynh chọn con trong dropdown; giữ view đang xem khi đổi con, thể hiện badge cảnh báo và hướng dẫn liên kết khi chưa có con. Bottom navigation phụ huynh vẫn phục vụ thao tác nhanh trên mobile; nút More mở panel header.
- Mọi nhãn mới dùng `headerNavigation` trong EN/VI; màu và focus dùng token của theme hiện có. Không dùng glow hoặc animation trang trí cho navigation.

## 7. Student Home và Dashboard

- `/student/home` là trang khám phá LexiGrow: giới thiệu phương pháp học, lối vào các luồng học hiện có và thông báo/sự kiện đang xuất bản.
- `/student/dashboard` giữ nội dung cá nhân như phiên học, tiến độ, mục tiêu và hoạt động gần đây. Tab Dashboard luôn dẫn tới route này; logo và tab Home dẫn tới `/student/home`.
- Home dùng `GET /announcements/active` để lấy nội dung banner do admin quản lý; tiêu đề, mô tả, ảnh, CTA dùng bản dịch theo ngôn ngữ hiện tại. Carousel chuyển thủ công và không tự đổi slide.
- Ảnh chủ đề trên Home lấy từ `image-manifest.json` và `EditorialCoverImage`; ảnh thông báo dùng URL trong announcement hiện có. Tất cả tiêu đề và mô tả Home nằm trong `homePage` ở hai locale EN/VI.
- Bố cục editorial dùng ảnh tỷ lệ cố định, phân cách bằng khoảng trắng/đường viền, và thu về một cột trên màn hình nhỏ. CTA giữ nguyên route học hiện tại.

## 8. Current editorial rebuild (2026-10-13)

This section records the current implementation and supersedes older palette and radius values above where they differ. It extends the existing Modern Academic / Editorial direction with the confirmed Eduvia visual reference; all learning content and workflows remain LexiGrow's.

### Current palette and type

- Urbanist is the interface and heading typeface. Material Symbols Outlined remains the icon system.
- Navy `#051A2E` anchors navigation and primary structure; lime `#E9FA49` highlights the main call to action; mint `#1CB886` signals progress and positive actions; lavender `#9E89FB` adds secondary emphasis; pale blue `#DDE9FF` marks featured panels; `#F4F7FA` is the soft surface.
- Dark theme keeps semantic roles with darker surfaces and lighter accent values. Keep text contrast readable in progress, loader, and disabled states.
- Main content uses a 1240px maximum width. Major cards use 18–24px radii; primary controls and filter tabs use pill shapes. Use quiet borders and restrained shadows.

### Page structure

- **Student home:** learning-led hero, topic collections, writing/review/game actions, a concise learning sequence, and a direct next step.
- **Explore:** a distinct title/search hero followed by proficiency and completion filters and a responsive topic catalog. Keep long word meanings wrap-safe.
- **Writing session:** keep prompt and target words in a supporting brief beside the writing editor on wide screens; stack them on narrow screens. Retain the five-step LexiGrow learning flow.
- **Pricing:** present the plan message, audience/billing controls, plan cards, and FAQs in separate hierarchy levels; preserve existing plan data and PayOS actions.
- **Role workspaces:** student progress, teacher classroom management, parent child progress, and admin operations each get a clear page overview and task-specific sections. Do not force these workspaces into the same dashboard grid.
- **Game and garden:** retain LexiGrow's arcade and growth visuals; use the shared type, spacing, focus, and surface tokens around them.
- **Shared shell:** top navigation, role navigation, mobile parent navigation, and the LexiGrow footer appear across authenticated and standalone layouts.

### Product behavior and content

The reference site contributes layout and visual hierarchy only. Do not copy its courses, teachers, testimonials, prices, or claims. Keep LexiGrow's copy, vocabulary, images, role permissions, SRS, AI feedback, daily quest, games, classes, and PayOS contracts. Presentation changes must not alter API contracts or learning state transitions.

### Release checks

For a meaningful visual change, build the production client, run the applicable tests, check the changed route set in a browser with test fixtures, and inspect desktop and mobile screenshots. Check English/Vietnamese strings, light/dark surfaces, keyboard behavior, and horizontal overflow where the changed surface uses them. Record unverified states and existing lint warnings in the release report; do not infer complete functional coverage from a successful build alone.
