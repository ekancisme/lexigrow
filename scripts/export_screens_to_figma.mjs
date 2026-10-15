/**
 * LexiGrow Automated Screen Exporter for Figma
 *
 * Automatically captures and exports all application screens into:
 *  1. High-Resolution 2x Retina PNGs (ready to drag-and-drop into Figma frames)
 *  2. Figma Node JSON layers (editable layers via Builder.io Figma plugin)
 *  3. Design Tokens JSON (color styles, typography, radius)
 *
 * Usage:
 *   npm run export:figma              # exports from production URL
 *   npm run export:figma -- --local   # exports from localhost:5173
 */

import puppeteer from 'puppeteer-core'
import { execFileSync } from 'node:child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const outDir = path.join(rootDir, 'exports/figma_screens')
const svgDir = path.join(outDir, 'svg')

const isLocal = process.argv.includes('--local')
const svgOnly = process.argv.includes('--svg-only')
const screenFilter = process.argv.find(arg => arg.startsWith('--only='))?.slice('--only='.length)
const BASE_URL = isLocal ? 'http://localhost:5173' : 'https://lexigrow.ltcuong24.io.vn'

const CREDENTIALS = {
  student: { email: 'student@lexigrow.com', password: 'password123' },
  teacher: { email: 'teacher@lexigrow.com', password: 'password123' },
  admin: { email: 'admin@lexigrow.com', password: 'password123' },
  parent: { email: 'parent@lexigrow.com', password: 'password123' },
}

const SCREENS = [
  // ── 1. Public & Marketing Pages (8 screens) ──
  { id: '01_Public_LandingPage', path: '/', role: 'public', title: 'Trang Chủ LexiGrow' },
  { id: '02_Public_PricingPage', path: '/pricing', role: 'public', title: 'Bảng Giá & Gói Dịch Vụ' },
  { id: '03_Public_AboutUs', path: '/about', role: 'public', title: 'Về Chúng Tôi' },
  { id: '04_Public_Courses', path: '/courses', role: 'public', title: 'Khám Phá Khóa Học Công Khai' },
  { id: '05_Public_ContactUs', path: '/contact', role: 'public', title: 'Liên Hệ & Trợ Giúp' },
  { id: '06_Public_LoginPage', path: '/login', role: 'public', title: 'Đăng Nhập Hệ Thống' },
  { id: '07_Public_RegisterPage', path: '/register', role: 'public', title: 'Đăng Ký Tài Khoản' },
  { id: '08_Public_ForgotPassword', path: '/forgot-password', role: 'public', title: 'Khôi Phục Mật Khẩu' },

  // ── 2. Student Experience (23 screens) ──
  { id: '09_Student_Home', path: '/student/home', role: 'student', title: 'Trang Chủ Học Sinh' },
  { id: '10_Student_Dashboard', path: '/student/dashboard', role: 'student', title: 'Dashboard Học Tập' },
  { id: '11_Student_Onboarding', path: '/student/onboarding', role: 'student', title: 'Khảo Sát Mục Tiêu Ban Đầu' },
  { id: '12_Student_ExploreCourses', path: '/student/explore', role: 'student', title: 'Kho Khóa Học & Chủ Đề' },
  { id: '13_Student_GrowthGarden', path: '/student/garden', role: 'student', title: 'Vườn Tri Thức (Growth Garden)' },
  { id: '14_Student_VocabularyLibrary', path: '/student/vocabulary', role: 'student', title: 'Thư Viện Từ Vựng Cá Nhân' },
  { id: '15_Student_FlashcardReview', path: '/student/vocabulary/review', role: 'student', title: 'Ôn Tập Flashcards Lặp Lại Ngắt Quãng' },
  { id: '16_Student_GameHub', path: '/student/game', role: 'student', title: 'Trung Tâm Trò Chơi (Game Hub)' },
  { id: '17_Student_Game_WordMatching', path: '/student/game/matching', role: 'student', title: 'Game Ghép Từ (Word Matching)' },
  { id: '18_Student_Game_WordScramble', path: '/student/game/scramble', role: 'student', title: 'Game Xếp Từ (Word Scramble)' },
  { id: '19_Student_Game_ContextFiller', path: '/student/game/filler', role: 'student', title: 'Game Điền Từ Vào Ngữ Cảnh' },
  { id: '20_Student_Game_VocabHunter', path: '/student/game/hunter', role: 'student', title: 'Game Thợ Săn Từ Vựng (Vocab Hunter)' },
  { id: '21_Student_Game_DailyQuest', path: '/student/game/daily-quest', role: 'student', title: 'Nhiệm Vụ Hàng Ngày (Daily Quest)' },
  { id: '22_Student_MyProgress', path: '/student/progress', role: 'student', title: 'Biểu Đồ Tiến Độ Học Tập' },
  { id: '23_Student_SetGoals', path: '/student/goals', role: 'student', title: 'Thiết Lập Mục Tiêu Hàng Tuần' },
  { id: '24_Student_EssayHistory', path: '/student/essays', role: 'student', title: 'Lịch Sử Bài Viết Đã Nộp' },
  { id: '25_Student_WriteEssay', path: '/student/write', role: 'student', title: 'Không Gian Viết Bài Luận Tự Do' },
  { id: '26_Student_LearningSession_Step1_Vocab', path: '/student/writing?set=daily-life', role: 'student', title: 'Phiên Học 3 Bước - Bước 1: Từ Vựng' },
  { id: '27_Student_LearningSession_Step2_Practice', path: '/student/writing?set=daily-life', role: 'student', title: 'Phiên Học 3 Bước - Bước 2: Bài Tập Nhanh', customAction: 'step2_practice' },
  { id: '28_Student_ClassDetail', path: '/student/class', role: 'student', title: 'Chi Tiết Lớp Học Của Học Sinh' },
  { id: '29_Student_Profile', path: '/profile', role: 'student', title: 'Hồ Sơ & Thành Tích Học Sinh' },
  { id: '30_Student_WebSettings', path: '/settings', role: 'student', title: 'Cài Đặt Hệ Thống' },

  // ── 3. Teacher Management (5 screens) ──
  { id: '31_Teacher_Dashboard', path: '/teacher/dashboard', role: 'teacher', title: 'Dashboard Giáo Viên' },
  { id: '32_Teacher_ClassManagement', path: '/teacher/classes', role: 'teacher', title: 'Quản Lý Danh Sách Lớp Học' },
  { id: '33_Teacher_AssignmentManagement', path: '/teacher/assignments', role: 'teacher', title: 'Quản Lý Bài Tập & Hạn Nộp' },
  { id: '34_Teacher_EarlyWarningAlerts', path: '/teacher/alerts', role: 'teacher', title: 'Hệ Thống Cảnh Báo Sớm' },
  { id: '35_Teacher_SystemPrompts', path: '/teacher/prompts', role: 'teacher', title: 'Cấu Hình System Prompts AI' },

  // ── 4. Admin Management (8 screens) ──
  { id: '36_Admin_Dashboard', path: '/admin/dashboard', role: 'admin', title: 'Tổng Quan Quản Trị Hệ Thống' },
  { id: '37_Admin_Users', path: '/admin/users', role: 'admin', title: 'Quản Lý Tài Khoản Người Dùng' },
  { id: '38_Admin_ClassManagement', path: '/admin/classes', role: 'admin', title: 'Quản Lý Toàn Bộ Lớp Học' },
  { id: '39_Admin_AIMonitoring', path: '/admin/ai-monitoring', role: 'admin', title: 'Giám Sát AI Providers & Quota' },
  { id: '40_Admin_Vocabulary', path: '/admin/vocabulary', role: 'admin', title: 'Quản Lý Kho Từ Điển Gốc' },
  { id: '41_Admin_Pricing', path: '/admin/pricing', role: 'admin', title: 'Quản Lý Gói Dịch Vụ & Thanh Toán' },
  { id: '42_Admin_AuditLogs', path: '/admin/logs', role: 'admin', title: 'Nhật Ký Bảo Mật & Hoạt Động' },
  { id: '43_Admin_Announcements', path: '/admin/announcements', role: 'admin', title: 'Quản Lý Thông Báo Hệ Thống' },

  // ── 5. Parent Management (1 screen) ──
  { id: '44_Parent_Dashboard', path: '/parent/dashboard', role: 'parent', title: 'Dashboard Giám Sát Của Phụ Huynh' },
]

// Exact Material Symbols glyph outlines (Google, Apache-2.0), so Figma never
// needs the icon font and all other text and shapes stay editable.
const MATERIAL_ICON_PATHS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'material_symbols_paths.json'), 'utf8'),
)

const embeddedImageCache = new Map()

async function inlineSvgImages(svgContent) {
  const imageRefs = [...svgContent.matchAll(/(?:xlink:href|href)="([^"]+)"/g)]
  const urls = [...new Set(imageRefs.map(match => match[1]).filter(value => value.startsWith('http://') || value.startsWith('https://')))]
  for (const url of urls) {
    try {
      let dataUrl = embeddedImageCache.get(url)
      if (!dataUrl) {
        const response = await fetch(url)
        if (!response.ok) continue
        let mimeType = response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream'
        let imageBytes = Buffer.from(await response.arrayBuffer())
        if (mimeType === 'image/webp') {
          imageBytes = execFileSync('python3', [
            '-c', 'import sys; from io import BytesIO; from PIL import Image; Image.open(BytesIO(sys.stdin.buffer.read())).convert("RGB").save(sys.stdout.buffer, format="JPEG", quality=93, optimize=True)',
          ], { input: imageBytes, maxBuffer: 32 * 1024 * 1024 })
          mimeType = 'image/jpeg'
        }
        dataUrl = `data:${mimeType};base64,${imageBytes.toString('base64')}`
        embeddedImageCache.set(url, dataUrl)
      }
      svgContent = svgContent.replaceAll(`"${url}"`, `"${dataUrl}"`)
    } catch (err) {
      console.warn(`   ⚠️ Không nhúng được ảnh ${url}: ${err.message}`)
    }
  }
  return svgContent
    .replace(/<image\b[^>]*>/g, tag => /\bpreserveAspectRatio=/.test(tag) ? tag : tag.replace(/\s*\/?\s*>$/, ending => ` preserveAspectRatio="xMidYMid slice"${ending}`))
    .replace(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/g, (_, r, g, b, a = '1') => {
      const rgb = [r, g, b].map(value => Math.round(Number(value) * 255))
      return Number(a) < 1 ? `rgba(${rgb.join(', ')}, ${a})` : `rgb(${rgb.join(', ')})`
    })
}

function findBrowserPath() {
  const candidates = [
    '/usr/bin/brave-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

function exportDesignTokens() {
  const tokensPath = path.join(rootDir, 'src/styles/tokens.css')
  if (!fs.existsSync(tokensPath)) return

  const content = fs.readFileSync(tokensPath, 'utf8')
  const colors = {}
  const fontSizes = {}
  const radius = {}

  const regex = /--([a-zA-Z0-9_-]+):\s*([^;]+);/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const key = match[1]
    const val = match[2].trim()

    if (val.startsWith('#') || val.startsWith('rgb')) {
      colors[key] = { value: val, type: 'color' }
    } else if (key.includes('radius')) {
      radius[key] = { value: val, type: 'borderRadius' }
    } else if (key.includes('size') && val.includes('px')) {
      fontSizes[key] = { value: val, type: 'fontSizes' }
    }
  }

  const tokenOutput = {
    LexiGrow_Eduvia_Design_System: {
      colors,
      fontSizes,
      radius: Object.keys(radius).length > 0 ? radius : {
        sm: { value: '6px', type: 'borderRadius' },
        md: { value: '10px', type: 'borderRadius' },
        lg: { value: '16px', type: 'borderRadius' },
        full: { value: '9999px', type: 'borderRadius' },
      },
      typography: {
        fontFamily: { value: 'Be Vietnam Pro, Inter, system-ui, sans-serif', type: 'fontFamilies' },
        headlineLarge: { value: { fontSize: '32px', fontWeight: '700', lineHeight: '40px' }, type: 'typography' },
        headlineMedium: { value: { fontSize: '24px', fontWeight: '600', lineHeight: '32px' }, type: 'typography' },
        bodyLarge: { value: { fontSize: '18px', fontWeight: '400', lineHeight: '28px' }, type: 'typography' },
        bodyMedium: { value: { fontSize: '16px', fontWeight: '400', lineHeight: '24px' }, type: 'typography' },
      },
    },
  }

  const outTokenFile = path.join(outDir, '00_LexiGrow_Design_Tokens.json')
  fs.writeFileSync(outTokenFile, JSON.stringify(tokenOutput, null, 2), 'utf8')
  console.log(`🎨 Đã xuất Design System Tokens sang: ${outTokenFile}`)
}

function createReadmeInstructions() {
  const tableRows = SCREENS.map(s => `| \`${s.id}.png\` / \`${s.id}.svg\` | ${s.role.toUpperCase()} | \`${s.path}\` | ${s.title} |`).join('\n')

  const readmeContent = `# Hướng Dẫn Đưa Toàn Bộ Giao Diện LexiGrow Lên Figma (100% Miễn Phí)

Thư mục này chứa toàn bộ các màn hình của hệ thống **LexiGrow** được trích xuất tự động từ ứng dụng thực tế.

> ⚠️ **LƯU Ý QUAN TRỌNG VỀ PLUGIN TRẢ PHÍ**:
> Các extension / plugin như **html.to.design** là dịch vụ thương mại có phí (giới hạn ~10 file/tháng và đòi file \`.h2d\`).
> **BẠN HOÀN TOÀN KHÔNG CẦN CÀI EXTENSION HAY MUA GÓI NÀY!** Hãy làm theo các cách miễn phí 100% dưới đây:

---

## 🚀 Cách 1: Kéo Thả Trực Tiếp Ảnh PNG (Nhanh nhất - 10 giây)
- **Đặc điểm**: Nhanh, chuẩn nét 2x Retina, không cần bất kỳ plugin nào.
- **Các bước thực hiện**:
  1. Mở file mới trên **Figma** (Web hoặc App).
  2. Mở thư mục này trên máy tính: \`exports/figma_screens/\`.
  3. Chọn tất cả các file \`.png\` (nhấn \`Ctrl + A\`).
  4. **Kéo thả chuột trực tiếp vào khung vẽ Figma** (hoặc dùng phím tắt \`Ctrl + Shift + K\` > chọn các file PNG).
  5. Figma sẽ tự động dàn đều toàn bộ các màn hình thành các Artboard chuẩn nét!
  6. Sang tab **Prototype** kéo mũi tên giữa các nút để chạy demo tương tác.

---

## 🎨 Cách 2: Kéo Thả File SVG (Layer Vector + Text chỉnh sửa được - 100% Miễn Phí)
- **Đặc điểm**: Mọi chữ, button, icon, form đều là **vector và text có thể click sửa trực tiếp trên Figma**, KHÔNG bị giới hạn số lượng, KHÔNG cần plugin.
- **Vị trí file**:
  - Thư mục riêng: \`exports/figma_screens/svg/\`
  - Hoặc giải nén từ file nén: \`exports/figma_screens/LexiGrow_All_Screens_SVG.zip\`
- **Các bước thực hiện**:
  1. Mở Figma.
  2. Mở thư mục con \`exports/figma_screens/svg/\`.
  3. Chọn các file \`.svg\` (ví dụ: \`01_Public_LandingPage.svg\`, \`09_Student_Home.svg\`,...).
  4. **Kéo thả trực tiếp vào Figma**.
  5. Figma tự động mở các layer vector, text, thẻ màu để bạn thoải mái chỉnh sửa chữ, đổi màu nút, dời vị trí components.

---

## 💎 Cách 3: Đồng Bộ Bảng Màu & Typography Vào Figma Variables
1. File \`00_LexiGrow_Design_Tokens.json\` chứa toàn bộ bảng màu chuẩn Eduvia Design System (\`#051A2E\`, \`#1CB886\`, \`#9E89FB\`,...).
2. Mở plugin miễn phí **Tokens Studio for Figma** trong Figma.
3. Chọn **Load Tokens** > Chọn file \`00_LexiGrow_Design_Tokens.json\`.
4. Toàn bộ bảng màu và typography sẽ xuất hiện tự động trong Figma Variables!

---

## 📋 Danh Sách Màn Hình Đã Xuất (${SCREENS.length} Màn Hình)

| Tên File | Phân Quyền | Tuyến Đường (Route) | Mô Tả Màn Hình |
|---|---|---|---|
${tableRows}
`
  fs.writeFileSync(path.join(outDir, 'README.md'), readmeContent, 'utf8')
}

async function run() {
  console.log('🚀 Bắt đầu quá trình xuất tự động màn hình LexiGrow sang Figma...')
  console.log(`🌐 Base URL: ${BASE_URL}`)

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  if (!fs.existsSync(svgDir)) {
    fs.mkdirSync(svgDir, { recursive: true })
  }

  if (!svgOnly) {
    exportDesignTokens()
    createReadmeInstructions()
  }

  const browserPath = findBrowserPath()
  if (!browserPath) {
    console.error('❌ Không tìm thấy trình duyệt Brave/Chrome trên hệ thống!')
    process.exit(1)
  }

  console.log(`🖥️ Sử dụng trình duyệt: ${browserPath}`)
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  })

  const htmlToFigmaBundlePath = path.join(rootDir, 'node_modules/@builder.io/html-to-figma/dist/browser.js')
  const hasHtmlToFigmaBundle = fs.existsSync(htmlToFigmaBundlePath)

  // Map to cache authenticated browser contexts
  const contexts = {}

  async function getContextForRole(role) {
    if (role === 'public') {
      if (contexts['public']) return contexts['public']
      const ctx = await browser.createBrowserContext()
      const page = await ctx.newPage()
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
      contexts['public'] = { ctx, page }
      return contexts['public']
    }

    if (contexts[role]) {
      return contexts[role]
    }

    const cred = CREDENTIALS[role]
    if (!cred) {
      const ctx = await browser.createBrowserContext()
      const page = await ctx.newPage()
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
      contexts[role] = { ctx, page }
      return contexts[role]
    }

    console.log(`🔑 Đang xác thực tài khoản vai trò [${role}] (${cred.email})...`)
    const ctx = await browser.createBrowserContext()
    const page = await ctx.newPage()
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

    // Perform instant API login directly
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {})
    try {
      const loginRes = await page.evaluate(async (c) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: c.email, password: c.password }),
        })
        const data = await res.json()
        if (res.ok && data.user) {
          localStorage.setItem('lexigrow_user', JSON.stringify(data.user))
          return { ok: true, user: data.user.email }
        }
        return { ok: false, error: data.message || 'Login failed' }
      }, cred)

      if (loginRes.ok) {
        console.log(`   ✅ Đăng nhập thành công: ${loginRes.user}`)
      } else {
        console.warn(`   ⚠️ Đăng nhập không thành công: ${loginRes.error}`)
      }
    } catch (loginErr) {
      console.warn(`   ⚠️ Ngoại lệ đăng nhập [${role}]: ${loginErr.message}`)
    }

    await new Promise(r => setTimeout(r, 1200))

    contexts[role] = { ctx, page }
    return { ctx, page }
  }

  const screensToExport = screenFilter ? SCREENS.filter(item => item.id === screenFilter) : SCREENS
  if (screenFilter && screensToExport.length === 0) {
    throw new Error(`Không tìm thấy màn hình: ${screenFilter}`)
  }
  let successCount = 0

  for (const item of screensToExport) {
    console.log(`📸 [${item.id}] Đang chụp: ${item.title} (${item.path})...`)
    try {
      const { page } = await getContextForRole(item.role)
      const targetUrl = `${BASE_URL}${item.path}`

      try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 })
      } catch {
        await new Promise(r => setTimeout(r, 1200))
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 })
      }

      // Custom action if specified (e.g. advance to step 2 practice)
      if (item.customAction === 'step2_practice') {
        try {
          await page.waitForSelector('.word-lesson__btn-next', { timeout: 3000 })
          for (let i = 0; i < 3; i++) {
            await page.click('.word-lesson__btn-next')
            await new Promise(r => setTimeout(r, 600))
          }
        } catch {
          // If not in step 1, proceed
        }
      }

      // Wait for web fonts and lazy-loaded media before capturing the page.
      let pageReady = false
      for (let attempt = 0; attempt < 3 && !pageReady; attempt++) {
        try {
          await page.evaluate(async () => {
            window.scrollTo(0, document.body.scrollHeight / 3)
            await new Promise(r => setTimeout(r, 500))
            window.scrollTo(0, 0)
            await document.fonts.ready
            await Promise.all([...document.images].map(image => image.decode().catch(() => {})))
          })
          pageReady = true
        } catch (err) {
          if (!err.message.includes('Execution context was destroyed') || attempt === 2) throw err
          await new Promise(r => setTimeout(r, 700))
        }
      }
      await new Promise(r => setTimeout(r, 600))

      // 1. Save High-Res 2x Retina PNG unless regenerating SVGs only.
      if (!svgOnly) {
        const pngPath = path.join(outDir, `${item.id}.png`)
        await page.screenshot({ path: pngPath, fullPage: true })
      }

      // 2. Preserve editable text and shapes. Replace Material Symbols ligatures
      //    with their exact font outlines so Figma never needs the icon font.
      try {
        const svgResult = await page.evaluate(async ({ icons, unitsPerEm }) => {
          let replacedIcons = 0
          const missingIcons = []
          const iconSpans = document.querySelectorAll('.material-symbols-outlined')
          for (const span of iconSpans) {
            const key = span.textContent.trim()
            const pathData = icons[key.toLowerCase()]
            if (!pathData) {
              missingIcons.push(key)
              continue
            }

            const style = getComputedStyle(span)
            const size = parseFloat(style.fontSize) || 24
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            svg.setAttribute('width', String(size))
            svg.setAttribute('height', String(size))
            svg.setAttribute('viewBox', `0 0 ${unitsPerEm} ${unitsPerEm}`)
            svg.setAttribute('fill', style.color)
            svg.setAttribute('aria-label', key)
            const glyph = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            glyph.setAttribute('d', pathData)
            svg.appendChild(glyph)
            span.replaceChildren(svg)
            span.style.fontSize = `${size}px`
            span.style.verticalAlign = 'middle'
            replacedIcons++
          }

          const { documentToSVG } = await import('https://esm.sh/dom-to-svg')
          const svgDocument = documentToSVG(document)
          return {
            svg: new XMLSerializer().serializeToString(svgDocument),
            replacedIcons,
            missingIcons: [...new Set(missingIcons)],
          }
        }, MATERIAL_ICON_PATHS)
        if (svgResult.missingIcons.length) {
          throw new Error(`Thiếu vector Material Symbols: ${svgResult.missingIcons.join(', ')}`)
        }
        const svgContent = await inlineSvgImages(svgResult.svg)
        console.log(`   ↳ SVG: ${svgResult.replacedIcons} Material Symbols vector paths`)
        const svgPath = path.join(svgDir, `${item.id}.svg`)
        fs.writeFileSync(svgPath, svgContent, 'utf8')
      } catch (svgErr) {
        console.error(`   ❌ SVG [${item.id}]: ${svgErr.message}`)
        throw svgErr
      }

      // 3. Extract Figma Node JSON layer tree (if htmlToFigma bundle available)
      if (!svgOnly && hasHtmlToFigmaBundle) {
        try {
          await page.addScriptTag({ path: htmlToFigmaBundlePath })
          const figmaJson = await page.evaluate(async () => {
            const fn = window.htmlToFigma?.htmlToFigma || window.htmlToFigma
            return typeof fn === 'function' ? await fn('body') : null
          })

          if (figmaJson) {
            const jsonPath = path.join(outDir, `${item.id}.figma.json`)
            fs.writeFileSync(jsonPath, JSON.stringify(figmaJson, null, 2), 'utf8')
          }
        } catch (jsonErr) {
          // Non-blocking
        }
      }

      console.log(`   ✅ Đã xuất: ${item.id}.${svgOnly ? 'svg' : 'png & .svg'}`)
      successCount++
    } catch (err) {
      console.error(`   ❌ Lỗi khi xuất [${item.id}]:`, err.message)
    }
  }

  // Close all contexts
  for (const key of Object.keys(contexts)) {
    try {
      await contexts[key].ctx.close()
    } catch {}
  }
  await browser.close()

  console.log(`\n🎉 HOÀN TẤT! Đã xuất thành công ${successCount}/${screensToExport.length} màn hình vào thư mục:`)
  console.log(`📂 ${outDir}\n`)
}

run().catch(err => {
  console.error('Fatal error in exporter:', err)
  process.exit(1)
})
