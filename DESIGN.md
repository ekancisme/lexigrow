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
| `--color-primary` | `#1E40AF` (Deep Cobalt) | `#60A5FA` | Nút bấm chính, tiêu đề nhấn mạnh, huy hiệu tích cực |
| `--color-surface` | `#FFFFFF` | `#0F172A` | Nền trang hoặc nền thành phần tương tác |
| `--color-surface-container-lowest` | `#FFFFFF` | `#0F172A` | Nền thẻ Card tiêu chuẩn |
| `--color-surface-container-low` | `#F8FAFC` | `#1E293B` | Nền vùng phụ, chip, khối ghi chú |
| `--color-outline-variant` | `#E2E8F0` | `#334155` | Viền thẻ Card 1px, phân cách bảng |
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.05)` | `0 1px 3px rgba(0,0,0,0.3)` | Đổ bóng phẳng tối giản cho Card |
| `--shadow-card-hover` | `0 6px 16px -2px rgba(15,23,42,0.08)` | `0 6px 16px -2px rgba(0,0,0,0.5)` | Đổ bóng khi hover thẻ Card |

---

## 3. Hệ thống 8 thành phần nguyên tử (UI Primitives)

Toàn bộ các thành phần nằm tại `src/components/common/`:

1. **`Button`** (`Button.jsx`, `Button.css`):
   - Biến thể: `primary` (Solid Cobalt), `secondary` (Slate nền phẳng), `outline` (viền 1px), `ghost`.
   - Kích thước: `sm` (32px), `md` (40px), `lg` (48px).
   - Hỗ trợ slot icon trái/phải (`leftIcon`, `rightIcon`), trạng thái `loading` và `disabled`.
2. **`Card`** (`Card.jsx`, `Card.css`):
   - Nền trắng phẳng, viền 1px outline variant, góc bo 12px (`--radius-lg`), không bóng glow.
   - Các sub-component: `CardHeader`, `CardTitle`.
3. **`Badge`** (`Badge.jsx`, `Badge.css`):
   - Dạng viên thuốc thanh lịch, các biến thể: `neutral`, `info`, `success`, `warning`, `error`.
   - Typography 12-13px sắc nét, icon vector mảnh đi kèm.
4. **`Input`** (`Input.jsx`, `Input.css`):
   - Viền 1px Slate-200, focus ring Cobalt 2px. Hỗ trợ label, helper text, error message và slot icon.
5. **`Select`** (`Select.jsx`, `Select.css`):
   - Dropdown chuẩn accessibility, icon mũi tên chevron vector sắc nét.
6. **`Tabs`** (`Tabs.jsx`, `Tabs.css`):
   - Hai chế độ: `underline` (gạch chân học thuật) và `pill` (nút phân đoạn danh mục).
7. **`Table`** (`Table.jsx`, `Table.css`):
   - Bảng quản trị phẳng, viền mỏng 1px, hỗ trợ cuộn ngang linh hoạt trên mobile.
8. **`Modal`** (`Modal.css`):
   - Hộp thoại góc bo 12px, nền backdrop làm mờ nhẹ (`rgba(15, 23, 42, 0.4)`), bẫy focus bàn phím.

---

## 4. Quản lý tài nguyên hình ảnh & Ảnh bìa

- **Thư mục ảnh tĩnh**: `public/assets/editorial/topics/` (WebP đã nén 60–150KB).
- **Thư mục artwork vector**: `public/assets/editorial/artwork/` (SVG minh họa phẳng cho 4 game và quest).
- **Kê khai bản quyền**: `src/assets/editorial/image-manifest.json` (Ghi nhận đầy đủ author, license URL, alt song ngữ VI/EN).
- **Thành phần hiển thị**: `src/components/common/EditorialCoverImage.jsx`
  - Tự động nạp ảnh từ manifest theo `topicSlug`.
  - Fallback thông minh: khi gặp chủ đề động chưa có ảnh tĩnh, tự động render khung bìa typographic nhã nhặn kèm tên chủ đề và biểu tượng vector, không làm vỡ layout (0 CLS).

---

## 5. Quy chuẩn dàn trang đáp ứng (Responsive Grid Breakpoints)

- **Mobile (`sm`: < 680px)**: 1 cột nội dung, lề trang 16px, rail phụ chuyển xuống đáy.
- **Tablet (`md`: 680px – 1099px)**: 2 cột thẻ danh mục Explore, Sidebar thu gọn hoặc dạng drawer.
- **Desktop (`lg` / `xl`: >= 1100px)**:
  - Student Dashboard: Bố cục 2 cột biên tập (68% cột chính học tập : 32% rail phụ tiến độ).
  - Explore: Lưới 3 cột thẻ chủ đề tỷ lệ 16:9 cân đối, max-width container 1280px căn giữa.
