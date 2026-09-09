# 🎮 LexiGrow — Thiết kế lại toàn bộ hệ thống Game

**Ngày:** 2026-09-09  
**Dự án:** LexiGrow  
**Mục đích:** Prompt thiết kế cho Stitch Design — toàn bộ bố cục, màu sắc, animation GSAP và components

---

## Tổng quan

**Phong cách thiết kế:** Premium Gamification — kết hợp giữa học thuật và giải trí, lấy cảm hứng từ Duolingo + NYT Games, với bảng màu ấm áp, trẻ trung và chuyển động mượt mà.

**Mục tiêu:** Biến mỗi game thành một trải nghiệm đắm chìm, có hồn, với animation rõ ràng, phản hồi tức thì và cảm giác thành tựu.

---

## 1. GameHub — Trang chủ Play Zone

### Concept
Cổng vào thế giới game — mỗi game là một "khu vườn" riêng với màu sắc và tính cách độc lập. Thiết kế giống như một bảng điều khiển arcade hiện đại.

### Layout
```
┌──────────────────────────────────────────────────────┐
│  ← Library    🎮 LexiGrow Play Zone                │
│               Expand vocabulary through mini-games   │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐ │
│  │  🌱 Quest Garden (Daily Crossword)              │ │
│  │  Complete today's word puzzle to earn fireflies │ │
│  │  [Play Now →]                                  │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  🎯 Vocab Hunter     📝 Context Filler         │ │
│  │  [Play Now →]        [Play Now →]              │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  🔤 Word Scramble    🧩 Word Matching          │ │
│  │  [Play Now →]        [Play Now →]              │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Bảng màu
- **Nền chính:** `#0F1724` (dark) hoặc `#F8FAFC` (light)
- **Card game:** mỗi game có màu riêng:
  - Quest Garden: `#16A34A` (xanh lá)
  - Vocab Hunter: `#B35C00` (cam đất)
  - Context Filler: `#3B4858` (xám xanh)
  - Word Scramble: `#7C3AED` (tím)
  - Word Matching: `#0891B2` (xanh ngọc)

### Animation (GSAP)
1. **Cards xuất hiện:** stagger 0.1s, từ dưới lên, opacity 0 → 1, y: 30 → 0, ease: power2.out
2. **Hover card:** lift lên 8px, scale 1.02, shadow tăng, duration 0.3s
3. **Icon game:** pulse nhẹ khi hover, scale 1.1 → 1
4. **Play Now button:** glow effect, khi hover scale 1.05

### Components
- `GameCard`: card với icon, title, description, button, màu sắc theo game
- `PlayButton`: nút gradient với icon play, hover scale
- `QuestGardenCard`: card đặc biệt cho Daily Quest, hiển thị tiến độ

---

## 2. DailyWordQuest — Ô chữ hàng ngày

### Concept
Trải nghiệm như NYT Crossword nhưng được gamification hóa. Mỗi ô chữ là một "hạt giống" — khi giải đúng, hạt nảy mầm thành hoa.

### Layout
```
┌──────────────────────────────────────────────────────┐
│  ← Back    ⭐ Daily Word Quest   🔥 Day 3/30      │
│             Complete the crossword to earn rewards  │
├──────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌───────────────────────────┐ │
│  │  [  ] [  ] [  ] │  │  1 Across · 6 letters     │ │
│  │  [  ] [  ] [  ] │  │  "A word meaning..."      │ │
│  │  [  ] [  ] [  ] │  │  [ _ _ _ _ _ _ ]         │ │
│  │  [  ] [  ] [  ] │  │  [Check] [Context]       │ │
│  │  [  ] [  ] [  ] │  │                          │ │
│  │                  │  │  Clues:                   │ │
│  │  Grid: 6x6      │  │  1→ A word meaning...    │ │
│  │                  │  │  2↓ Another clue...      │ │
│  └─────────────────┘  └───────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│  Progress: ████████░░ 6/10 words solved  ✦         │
└──────────────────────────────────────────────────────┘
```

### Bảng màu
- **Nền grid:** `#1A1A2E` → `#16213E`
- **Ô trống:** `#FFFFFF` với border `#E2E8F0`
- **Ô đã điền:** `#16A34A` (xanh lá) với hiệu ứng flip
- **Ô đang chọn:** `#3B82F6` (xanh dương) glow
- **Clue panel:** nền trắng/sáng, border trái màu primary

### Animation (GSAP)
1. **Ô chữ xuất hiện:** từng ô stagger 0.03s, scale từ 0 → 1, ease: back.out(1.7)
2. **Điền chữ:** chữ xuất hiện với hiệu ứng typewriter, scale từ 0.5 → 1
3. **Flip 3D khi đúng:** `transform: rotateY(180deg)` với perspective 1000px, duration 0.4s
4. **Confetti khi hoàn thành:** 2 burst (100 hạt + 50 hạt sau 300ms)
5. **Progress bar:** fill từ 0 → target với ease: power2.out

### Components
- `GridCell`: ô chữ với number, letter, flip animation
- `CluePanel`: hiển thị clue hiện tại, input, nút Check/Context
- `ClueList`: danh sách tất cả clues, highlight active
- `ProgressBar`: thanh tiến độ với animation

---

## 3. VocabHunter — Thợ săn từ

### Concept
Game bắn bóng theo phong cách arcade retro-futuristic. Đọc định nghĩa, bắn bóng chứa từ đúng trước khi bóng rơi khỏi màn hình.

### Layout
```
┌──────────────────────────────────────────────────────┐
│  ← Exit    ❤️❤️❤️    Score: 12    Round: 5/15     │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐ │
│  │  🎯 Target Definition:                         │ │
│  │  "An award or privilege granted as special..." │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│            ┌──────┐                                   │
│       ┌────┤Eloquent├────┐                           │
│  ┌────┤    └──────┘     ├────┐                      │
│  │    │    ┌──────┐     │    │                      │
│  │    └────┤Frugal├─────┘    │                      │
│  │         └──────┘          │                      │
│  │    ┌──────┐  ┌──────┐    │                      │
│  └────┤Garrul├──┤Accolade├───┘                      │
│       └──────┘  └──────┘                            │
│  ════════════════ DANGER ZONE ════════════════════  │
└──────────────────────────────────────────────────────┘
```

### Bảng màu
- **Nền canvas:** radial-gradient từ `#1A1A2E` → `#0F1724`
- **Bubble đúng:** radial-gradient trắng → `#16A34A`, shadow xanh
- **Bubble sai khi click:** đỏ `#E53935` với shake
- **Danger zone:** vạch đỏ dashed `#E53935`
- **Target definition box:** border trái màu `#B35C00`

### Animation (GSAP)
1. **Bubble xuất hiện:** từ dưới đáy bay lên vị trí ban đầu, scale từ 0 → 1, ease: back.out(1.7)
2. **Bubble di chuyển:** y tăng dần theo tốc độ (linear)
3. **Click đúng:** bubble nổ tung (scale 2 → 0, opacity 1 → 0) + particles bay ra
4. **Click sai:** bubble shake (x: -10 ↔ 10, repeat: 3) + chuyển sang đỏ
5. **Mất mạng:** trái tim vỡ vụn (scale 0, rotation 45, duration 0.3s)
6. **Score +1:** popup bay lên (y: 0 → -60, opacity 1 → 0, duration 0.8s)
7. **Victory:** confetti 40 mảnh + fanfare

### Components
- `Bubble`: absolute positioned, radial gradient, border-radius: 50%, shadow
- `HeartIcon`: fill/unfill dựa trên lives, với animation khi mất
- `DangerZoneLine`: vạch đỏ dashed ở đáy
- `ScorePopup`: text bay lên + fade out

---

## 4. ContextFiller — Điền từ ngữ cảnh

### Concept
Học từ qua ngữ cảnh thực tế. Đọc câu, chọn từ đúng để điền vào chỗ trống. Phong cách editorial/learning với cảm giác như đang đọc một cuốn sách.

### Layout
```
┌──────────────────────────────────────────────────────┐
│  ← Exit    ⏱️ 01:23    Score: 4/8    Q: 3/8       │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐ │
│  │  "The economy has remained _______ for the      │ │
│  │   past few quarters, with no signs of growth."  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │ A.    │  │ B.    │  │ C.    │  │ D.    │           │
│  │stagnant│  │evaluate│  │grow   │  │decline│           │
│  └──────┘  └──────┘  └──────┘  └──────┘           │
│                                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │  ✅ Correct! "stagnant" means not growing.      │ │
│  │  [Next Question →]                             │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Bảng màu
- **Sentence box:** border-left `#3B4858`, nền `#F1F5F9`
- **Options:** card trắng, border `#E2E8F0`
- **Correct:** `#2E7D32` (xanh lá) + glow
- **Wrong:** `#E53935` (đỏ) + shake
- **Next panel:** nền `#F0FDF4`, border dashed xanh

### Animation (GSAP)
1. **Sentence hiện ra:** từng từ xuất hiện với hiệu ứng fade + y: 10 → 0, stagger 0.03s
2. **Blank highlight:** chỗ trống pulse nhẹ (opacity 0.5 ↔ 1)
3. **Options xuất hiện:** stagger 0.08s, từ dưới lên, ease: back.out(1.4)
4. **Chọn đúng:** option sáng xanh + scale 1.05 + border glow, duration 0.3s
5. **Chọn sai:** option shake + đỏ, cho phép thử lại ngay
6. **Điền từ vào blank:** từ xuất hiện với scale từ 0 → 1, ease: back.out(1.7)
7. **Next panel:** scale từ 0.95 → 1, ease: back.out(1.2)

### Components
- `SentenceDisplay`: block với border-left accent, italic text, blank highlight
- `OptionButton`: card với letter (A, B, C, D) + text, hover lift
- `ExplanationPanel`: hiện definition + Next button khi đúng
- `ProgressIndicator`: hiển thị tiến độ (current/total)

---

## 5. WordScramble — Xáo trộn chữ cái

### Concept
Xây dựng phản xạ đánh vần. Sắp xếp lại các chữ cái bị xáo trộn để tạo thành từ đúng với sự trợ giúp của clues, IPA và định nghĩa.

### Layout
```
┌──────────────────────────────────────────────────────┐
│  ← Exit    ⏱️ 00:45    Score: 3/5    Word: 3/5    │
├──────────────────────────────────────────────────────┤
│                                                       │
│        ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐        │
│        │ E │ │ L │ │ Q │ │ U │ │ O │ │ N │        │
│        └───┘ └───┘ └───┘ └───┘ └───┘ └───┘        │
│                                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Part of Speech: adjective                       │ │
│  │  IPA: /ɪˈkwɪvələnt/                             │ │
│  │  Definition: Equal in value, amount, or meaning │ │
│  │  💡 Hint: Starts with "E" and ends with "T"    │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  [ _ _ _ _ _ _ _ _ _ _ ]                            │
│  [Check] [Hint] [Skip]                              │
│                                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │  ✅ Correct! "EQUIVALENT"                       │ │
│  │  [Next Word →]                                 │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Bảng màu
- **Letter badges:** gradient từ `#7C3AED` → `#A78BFA`, shadow tím
- **Clues panel:** nền `#F5F3FF`, border trái tím
- **Hint text:** màu `#7C3AED`, italic
- **Input:** border `#E2E8F0`, focus glow tím

### Animation (GSAP)
1. **Letter badges xuất hiện:** từng chữ stagger 0.06s, scale từ 0 → 1, rotate -10 → 0, ease: back.out(1.7)
2. **Input focus:** border glow + scale 1.02
3. **Check đúng:** letter badges chuyển sang xanh + scale 1.1 + bounce
4. **Check sai:** input shake + đỏ
5. **Hint reveal:** chữ cái đầu/cuối hiện ra với glow
6. **Next word:** cards chuyển đổi với hiệu ứng slide left

### Components
- `LetterBadge`: từng chữ cái trong từ xáo trộn, có thể kéo thả (drag & drop)
- `CluePanel`: hiển thị part of speech, IPA, definition, hint
- `ScrambleInput`: input với auto-focus, real-time validation
- `ResultPanel`: hiển thị kết quả đúng/sai

---

## 6. WordMatching — Ghép từ với định nghĩa

### Concept
Memory challenge 3D! Lật thẻ để ghép từ vựng với định nghĩa tương ứng. Phong cách card game cao cấp với hiệu ứng 3D.

### Layout
```
┌──────────────────────────────────────────────────────┐
│  ← Exit    ⏱️ 01:23    Accuracy: 85%   4/8 pairs  │
├──────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │  📖  │  │  📖  │  │  📖  │  │  📖  │           │
│  │Word  │  │Def   │  │Word  │  │Def   │           │
│  └──────┘  └──────┘  └──────┘  └──────┘           │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │  📖  │  │  📖  │  │  📖  │  │  📖  │           │
│  │Def   │  │Word  │  │Def   │  │Word  │           │
│  └──────┘  └──────┘  └──────┘  └──────┘           │
│                                                       │
│  Matched: 🟢 4 pairs   Attempts: 6                  │
└──────────────────────────────────────────────────────┘
```

### Bảng màu
- **Card mặt trước:** `#0891B2` gradient với icon sách
- **Card mặt sau (Word):** nền trắng, text `#0F1724`, border xanh ngọc
- **Card mặt sau (Definition):** nền `#F0FDFA`, text `#0F1724`
- **Matched card:** nền xanh lá `#16A34A` với glow
- **Mismatch:** shake + đỏ

### Animation (GSAP)
1. **Cards xuất hiện:** stagger 0.08s, scale từ 0 → 1, rotateY 90 → 0, ease: back.out(1.4)
2. **Flip card:** rotateY 0 → 180, duration 0.4s, perspective 1200px
3. **Match found:** card glow + scale 1.05 → 1 + chime
4. **Mismatch:** shake + đỏ, sau 0.8s tự động lật lại
5. **Matched pair:** bay lên nhẹ + glow xanh
6. **Victory:** confetti + fanfare

### Components
- `MemoryCard`: 3D flip card với front/back
- `CardGrid`: grid responsive với stagger animation
- `StatsBar`: hiển thị timer, accuracy, attempts, matched

---

## 7. Component thư viện dùng chung

### Confetti System
```jsx
<Confetti burst={2} particleCount={100} spread={70} origin={{ y: 0.6 }} />
```

### Sound System
```jsx
const { play } = useSound('/sounds/effect.mp3', { volume: 0.5 })
// Types: 'correct', 'wrong', 'match', 'mismatch', 'victory', 'fanfare'
```

### Stat Pill
```jsx
<StatPill icon="schedule" label="01:23" />
```

### Progress Bar
```jsx
<ProgressBar value={6} max={10} label="6/10 words solved" />
```

---

## 8. Bảng màu tổng thể

| Vai trò | Màu sắc | Mã HEX |
|---------|---------|--------|
| Primary | Xanh dương đậm | `#005BBF` |
| Secondary | Tím | `#7C3AED` |
| Success | Xanh lá | `#16A34A` |
| Error | Đỏ | `#E53935` |
| Warning | Cam | `#B35C00` |
| Info | Xanh ngọc | `#0891B2` |
| Surface | Trắng/xám | `#F8FAFC` |
| On Surface | Đen/xám đậm | `#0F1724` |
| Border | Xám nhạt | `#E2E8F0` |

---

## 9. GSAP Presets dùng chung

```jsx
// Stagger xuất hiện
const appearStagger = { 
  from: { opacity: 0, y: 20, scale: 0.95 },
  to: { opacity: 1, y: 0, scale: 1 },
  stagger: 0.08,
  ease: 'power2.out',
  duration: 0.5
}

// Flip 3D
const flip3D = {
  rotationY: 180,
  duration: 0.4,
  ease: 'power2.inOut',
  perspective: 1200
}

// Pop success
const popSuccess = {
  scale: 1.05,
  duration: 0.25,
  ease: 'back.out(1.7)',
  onComplete: () => gsap.to(el, { scale: 1, duration: 0.2 })
}

// Shake error
const shakeError = {
  x: -8,
  duration: 0.08,
  repeat: 3,
  yoyo: true,
  ease: 'power1.inOut'
}

// Confetti burst
const burstConfetti = (count = 100, spread = 70) => {
  confetti({ particleCount: count, spread, origin: { y: 0.6 } })
}
```

---

## 10. User Journey & Flow

1. **User vào GameHub** → thấy 5 game cards với icon và mô tả
2. **Chọn game** → vào config screen (chọn độ khó, số lượng, category)
3. **Bắt đầu chơi** → game loop với animation và feedback
4. **Hoàn thành** → victory screen với stats và XP
5. **Quay lại** → GameHub hoặc Word Library

---

**Người thực hiện:** Claude Code  
**Ngày:** 2026-09-09  
🤖 Generated with [Claude Code](https://claude.com/claude-code)