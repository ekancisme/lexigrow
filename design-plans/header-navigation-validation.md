# Header ngang và navigation dropdown

Triển khai trên `feat/editorial-academic-ui-rebuild`, ngày 2026-10-12.

## Thay đổi

- `AppLayout` bỏ sidebar và khoảng trống bên trái; nội dung dùng container đầy đủ, căn giữa.
- Header desktop hiển thị logo, tổng quan và vài nhóm chức năng; dropdown mở bằng hover hoặc click.
- Học viên: Học tập, Luyện tập, Tiến độ, Lớp học; giáo viên: Giảng dạy, Theo dõi, Công cụ; admin: Quản lý, Vận hành, Thanh toán; phụ huynh: Học tập của con, Gia đình.
- Menu tài khoản chứa cài đặt, gói cước/tài trợ và đăng xuất; vẫn có ngôn ngữ, theme, thông báo và field tìm kiếm hiện có.
- Dưới 1100px dùng panel trong header và tap mở nhóm; dưới 480px điều khiển theme nằm trong panel để tránh chen chúc.
- Native links và disclosure buttons hỗ trợ Tab, ArrowDown/ArrowUp, Escape, click ngoài và đóng khi chuyển route. Escape cũng đóng menu hover khi focus ở ngoài header.
- Bộ chọn con giữ view đang xem khi đổi con; liên kết/cảnh báo cập nhật theo con; trường hợp chưa có con có hướng dẫn và action bị vô hiệu hóa.
- More của ParentBottomNav mở panel header. Nâng chat widget trên mobile phụ huynh để không che More.
- Các nhãn mới có 27 keys EN/VI tương ứng. Gói tài khoản và planName tài trợ vẫn có trong menu tài khoản.

## Ownership và lịch sử

Phần header ban đầu (`HeaderNavigation`, `NavigationDisclosure`, `TopNav`, layout, locales và DESIGN.md) được ghi nhận trong commit đồng thời `e87718b`. Commit `9b40873` bổ sung dismiss bằng Escape cho menu hover, role marker và vị trí chat trên mobile phụ huynh. Báo cáo/bằng chứng được ghi nhận riêng sau validation. Không ghi nhận các bản sửa audit khác như công việc kiểm thử của task navigation.

Các owner: `src/components/layout/AppLayout.jsx`, `.css`, `TopNav.jsx`, `.css`, `HeaderNavigation.jsx`, `NavigationDisclosure.jsx`; labels ở `src/locales/{en,vi}.json` và quy tắc navigation tại DESIGN.md mục 6.

## Validation

| Kiểm tra | Kết quả |
| --- | --- |
| Production build | PASS, không lỗi/warning trong log build |
| ESLint bốn file JSX của navigation, `--max-warnings 0` | PASS |
| `git diff --check` | PASS tại lúc kiểm tra |
| Header browser matrix | 64 cases: 4 roles × EN/VI × light/dark × 360/768/1100/1440px; 0 failures, 0 pageerror |
| Matrix assertions | Không còn sidebar; header không overflow; hover/tap mở nhóm; Escape đóng; ArrowDown focus vào panel và Escape trả focus; click ngoài đóng; cài đặt/pricing/logout có đủ |
| Parent/account checks | 11 checks PASS: đổi con giữ essays view, route/links theo con mới, đóng menu sau đổi con, More mở panel, Escape đóng, giữ tên gói tài trợ, logout xóa user/chuyển login, chưa có con thì disable action và vẫn có liên kết học sinh |
| Locale catalog | 27 headerNavigation keys; EN/VI key parity PASS |
| Graft | CLI không có trong PATH; chưa chạy lại graph build |

Browser dùng Chromium và production build snapshot tại local, API fixtures và service workers bị block để fixtures không bị worker cache/intercept. Những checks này xác minh presentation/navigation; không phải kiểm thử backend authorization, thanh toán thật, SRS hoặc AI grading. Không phát sinh thao tác production.

## Bằng chứng

- [Matrix kết quả](header-navigation-evidence/results.json)
- [Parent/account checks](header-navigation-evidence/parent-results.json)
- [Desktop VI](header-navigation-evidence/desktop.png)
- [Mobile VI](header-navigation-evidence/mobile.png)

Ảnh dùng profile fixture để quan sát navigation trong app. Nội dung của trang Settings trong ảnh không thuộc phạm vi redesign của task này. Task không tự thực hiện push hoặc deploy.
