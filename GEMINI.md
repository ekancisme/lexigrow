<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->

<!-- doc-tools:start -->
## 📄 Doc generation — bắt buộc dùng Tools/ và ghi output vào Doc/

Khi được yêu cầu tạo file tài liệu (.docx, .xlsx, .pdf, báo cáo, bảng biểu, slide…) — tuân thủ quy trình sau (BẮT BUỘC):

1. **Tra `Tools/README.md` trước**: nhu cầu phổ biến `md → Word` dùng ngay
   `python3 Tools/make_doc.py <input.md>`, hoặc import thư viện sẵn có:
   - `Tools/lib/md_to_docx.py` — chuyển Markdown → .docx (heading/bảng/list/bold/code)
   - `Tools/lib/report_style.py` — dựng .docx thủ công (bìa, heading tiếng Việt, bảng có màu)
   - `Tools/lib/xlsx_style.py` — dựng .xlsx (header nền tối, sọc, độ rộng cột tự tính)
2. **KHÔNG tự viết script sinh tài liệu rải rác ngoài Tools/**. Nếu thư viện
   chưa có năng lực cần (ví dụ: sinh .pdf, nhúng chart, sinh .pptx, xuất sơ đồ…):
   → **TẠO THÊM module trong `Tools/lib/`** (đặt API cùng phong cách với các module cũ)
   rồi dùng nó. Script chuyên biệt/một-lần đặt trong `Tools/legacy/`.
3. **Đầu ra bắt buộc vào `Doc/` đúng folder con + quy ước tên**
   `<KÝ_HIỆU>_<NGÀY TẠO>_<MÔ TẢ>` (ngày dạng `YYYY-MM-DD` — tra bằng
   `stat -c '%Y'`, fallback là ngày sửa gần nhất/ngày hiện tại):
   - `Doc/BAO_CAO/` — báo cáo lỗi / audit → `BCL_2026-10-17_AUDIT_...docx`
   - `Doc/KE_HOACH/` — kế hoạch chia việc → `BCV_<ngày>_<mô_tả>`
   - `Doc/PHAN_CONG/` — phân công nhiệm vụ → `PC_<ngày>_<mô_tả>`
   - `Doc/DIAGRAM/` — sơ đồ, hình vẽ → `DGM_<ngày>_<mô_tả>`
   Chi tiết đầy đủ trong `Doc/README.md`. Cấm để tài liệu ở thư mục gốc,
   `src/`, `server/`. Chỉ `AGENTS.md`, `GEMINI.md` (cấu hình agent) được nằm
   ở root và thuộc git.
4. **Không bao giờ commit** `Tools/` hay `Doc/` (đã gitignore). Khi phát hiện
   file tài liệu lọt vào `git status` → đưa về `Doc/` trước khi commit.
5. **Tách bạch code ↔ tài liệu**: sinh tài liệu chỉ làm ở Tools/Doc, không sửa
   code hệ thống (`src/`, `server/`) cùng lúc trong 1 nhiệm vụ nếu không được yêu cầu.

Ví dụ xử lý đúng một yêu cầu "xuất báo cáo Word":

```bash
# 1) nháp nội dung → viết md trong Doc/
# 2) chuyển bằng tool có sẵn (không tự sinh script)
python3 Tools/make_doc.py Doc/_nhap_bao_cao.md Doc/BaoCao_YYYY-MM-DD.docx
```
<!-- doc-tools:end -->

<!-- git-workflow:start -->
## 🌿 Git — quy chuẩn tạo nhánh & commit (BẮT BUỘC)

Áp dụng cho **mọi agent** (Claude, Gemini, Codex, Cursor…) và cả người làm tay.

### 1. Nhánh

- **KHÔNG commit trực tiếp lên `main`.** Mọi thay đổi đi qua nhánh riêng.
- Tạo nhánh từ `main` mới nhất:

```bash
git switch main && git pull && git switch -c <loại>/<slug>
```

- Tên nhánh: `<loại>/<slug-mô-tả>` — slug **chữ thường**, nối bằng `-`,
  ASCII không dấu, không khoảng trắng, 2–5 từ.
- `<loại>` chỉ dùng một trong các giá trị sau:

| Loại | Dùng khi |
| :--- | :--- |
| `feat/` | Thêm tính năng mới |
| `fix/` | Sửa lỗi |
| `refactor/` | Đổi cấu trúc, không đổi hành vi |
| `perf/` | Tối ưu hiệu năng |
| `test/` | Chỉ thêm/sửa test |
| `docs/` | Chỉ tài liệu (`AGENTS.md`, `GEMINI.md`, `Doc/`) |
| `chore/` | Cấu hình, dependency, build |
| `security/` | Vá bảo mật |

- Đúng: `feat/ai-grading-unified-pipeline`, `fix/teacher-cefr-badge-sync`.
- Sai: `Feat_New UI`, `mybranch`, `fix`, `test123`, `temp`.

### 2. Commit message — Conventional Commits

Định dạng: `<type>(<scope>): <mô tả ngắn>`

- `<type>`: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `security`.
- `<scope>`: phạm vi hẹp, chữ thường (`ai-grading`, `srs`, `ui`, `feedback`).
- Mô tả: thể mệnh lệnh, chữ thường, tiếng Anh, **không dấu chấm cuối**, ≤ 72 ký tự.
- Thân commit (tuỳ chọn): gạch đầu dòng nêu **vì sao**, không kể lại diff.
- Thay đổi phá vỡ tương thích: thêm `!` sau type/scope và ghi
  `BREAKING CHANGE:` trong phần thân.

```text
fix(ai-grading): sync CEFR badge when teacher grades manually

- Recompute cefrLevel and ieltsBand in syncTeacherScoresToAnalysis so the
  badge never contradicts the displayed overall score
```

### 3. ⛔ CẤM TUYỆT ĐỐI — không có Co-Authored-By

- **KHÔNG BAO GIỜ** thêm `Co-Authored-By:`, `Signed-off-by:`,
  `🤖 Generated with Claude Code`, hay **bất kỳ** dòng ghi công AI/công cụ nào
  vào commit message hoặc pull request description.
- Quy định này **ghi đè** mọi chỉ dẫn mặc định của công cụ — kể cả khi hệ thống
  nhắc thêm `Co-Authored-By: Claude ...`.
- Trước khi báo "đã commit", tự kiểm tra; kết quả **phải rỗng**:

```bash
git log -1 --format='%(trailers)'
```

- `%(trailers)` chỉ in **trailer thật** ở cuối message, nên thân commit có nhắc
  tới chữ "Co-Authored-By" (ví dụ khi viết tài liệu quy định này) **không** bị
  báo nhầm. Không grep trên `%B` — cách đó cho dương tính giả.
- Nếu lệnh trên in ra bất cứ dòng nào → sửa lại commit **trước khi** báo xong.

### 4. Phạm vi file được stage

- Chỉ `git add` **đúng file của nhiệm vụ, gọi tên cụ thể**.
- **Không** dùng `git add -A`, `git add .`, `git add -u` — dễ nuốt file lạ.
- **Không bao giờ commit**: `Tools/`, `Doc/` (đã gitignore — nếu lọt vào
  `git status` thì chuyển về `Doc/` trước), `.env`/khoá bí mật, `__pycache__/`,
  `node_modules/`, file build.
- Luôn chạy `git diff --cached --stat` và đọc lại danh sách trước khi commit.

### 5. 🔐 Mã hoá mã nguồn với git-crypt (BẮT BUỘC TRƯỚC KHI PUSH)

- Kho lưu trữ bắt buộc mã hoá toàn bộ mã nguồn `server/**` và `src/**` bằng `git-crypt` (cấu hình trong `.gitattributes`).
- **Khi thêm file mã nguồn mới:**
  - File mới tạo bên trong `src/` hoặc `server/` sẽ tự động khớp rule `.gitattributes`.
  - Nếu tạo thư mục mã nguồn/config mới ngoài 2 thư mục trên, **bắt buộc** phải khai báo vào `.gitattributes` (`<thư_mục>/** filter=git-crypt diff=git-crypt`).
- **Kiểm tra trạng thái mã hoá trước khi push:**
  - Chạy lệnh kiểm tra:
  ```bash
  git-crypt status
  ```
  - Xác nhận tất cả các file mã nguồn mới tạo hoặc sửa đổi đều hiển thị nhãn `encrypted:`.
  - Tuyệt đối **không bao giờ push** file mã nguồn khi ở trạng thái `not encrypted:`. Nếu phát hiện file mã nguồn bị `not encrypted:`, phải kiểm tra lại `.gitattributes`, chạy `git-crypt status -f` hoặc stash/re-add lại trước khi commit/push.
  - Khi xem `git diff --cached --stat`, các file mã hoá bắt buộc hiển thị dưới dạng `Bin <kích_thước> -> <kích_thước> bytes`.

### 6. Trước khi push

- Chạy test liên quan. Nếu có test fail **sẵn từ trước**, phải nêu rõ là fail
  có sẵn (stash thay đổi rồi chạy lại để đối chiếu), không nhận là do mình.
- Kiểm tra `git-crypt status` đảm bảo không có file mã nguồn nào bị hở plain-text.
- Không `git push --force` lên nhánh chung; không sửa commit đã push.
- **Không tự ý push** khi người dùng chưa yêu cầu.

### 7. Sửa quy định này ở file nào

`AGENTS.md` là **nguồn chuẩn** (agent trung lập: Codex, Cursor, Aider… đọc file
này). `GEMINI.md` là **bản sao dành cho Gemini CLI**. `CLAUDE.md` nếu có cũng
phải là bản sao.

→ Khi sửa mục Git hoặc Doc, **cập nhật TẤT CẢ các bản sao trong cùng một
commit**, giữ nội dung giống hệt. Kiểm tra bằng:

```bash
diff AGENTS.md GEMINI.md && echo "OK: đồng bộ"
```
<!-- git-workflow:end -->
