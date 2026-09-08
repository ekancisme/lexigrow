// LexiGrow E2E read-only test harness (non-destructive)
import { execSync } from 'node:child_process'

const API = 'http://localhost:5000/api'
const results = []

function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  const mark = pass ? 'PASS' : 'FAIL'
  console.log(`${pass ? '✅' : '❌'} ${mark} | ${name}${detail ? ' | ' + detail : ''}`)
}

async function api(path, token, method = 'GET', body = null) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  let json = null
  try { json = await res.json() } catch { json = null }
  return { status: res.status, json }
}

async function login(email) {
  const { status, json } = await api('/auth/login', null, 'POST', { email, password: '123456' })
  if (status !== 200) throw new Error(`login failed for ${email}: ${status}`)
  return json.token
}

// ── PHASE 2: STUDENT ──────────────────────────────────────────────
const st = await login('student@lexigrow.com')
console.log('\n===== PHASE 2: STUDENT =====')

// Dashboard: overview
{
  const { status, json } = await api('/progress/overview', st)
  check('GET /progress/overview', status === 200, `HTTP ${status}`)
  if (json?.data) {
    const d = json.data
    check('Streak == 7', d.streak === 7 || d.streakDays === 7, `streak=${d.streak ?? d.streakDays}`)
  } else {
    check('overview data present', false, JSON.stringify(json).slice(0, 200))
  }
}

// Active vocabulary
{
  const { status, json } = await api('/progress/active-vocabulary', st)
  check('GET /progress/active-vocabulary', status === 200, `HTTP ${status}`)
  const arr = json?.data ?? json?.activeVocabulary ?? []
  check('Active vocabulary >= 8', arr.length >= 8, `count=${arr.length}`)
}

// Weekly goals
{
  const { status, json } = await api('/goals', st)
  check('GET /goals', status === 200, `HTTP ${status}`)
  // inspect shape
  console.log('   goals json:', JSON.stringify(json).slice(0, 400))
}

// Vocabulary stats (4 mastered / 4 learning / 3 new = 11)
{
  const { status, json } = await api('/vocabulary/stats', st)
  check('GET /vocabulary/stats', status === 200, `HTTP ${status}`)
  console.log('   vocab stats:', JSON.stringify(json).slice(0, 400))
}
{
  const { status, json } = await api('/vocabulary', st)
  check('GET /vocabulary', status === 200, `HTTP ${status}`)
  const arr = json?.data ?? json ?? []
  console.log('   vocab list count:', Array.isArray(arr) ? arr.length : 'n/a', JSON.stringify(arr).slice(0, 300))
}

// Due today (SRS)
{
  const { status, json } = await api('/vocabulary/due-today', st)
  check('GET /vocabulary/due-today', status === 200, `HTTP ${status}`)
  const arr = json?.data ?? json ?? []
  console.log('   due today:', Array.isArray(arr) ? `count=${arr.length}` : JSON.stringify(json).slice(0, 300))
}
{
  const { status, json } = await api('/srs/due', st)
  check('GET /srs/due', status === 200, `HTTP ${status}`)
  console.log('   srs due:', JSON.stringify(json).slice(0, 300))
}

// Garden status
{
  const { status, json } = await api('/garden/status', st)
  check('GET /garden/status', status === 200, `HTTP ${status}`)
  console.log('   garden:', JSON.stringify(json).slice(0, 500))
}

// Evidence (word usage with confidence)
{
  const { status, json } = await api('/progress/evidence', st)
  check('GET /progress/evidence', status === 200, `HTTP ${status}`)
  console.log('   evidence:', JSON.stringify(json).slice(0, 500))
}

// Classes (2 classes expected)
{
  const { status, json } = await api('/classes', st)
  check('GET /classes (student)', status === 200, `HTTP ${status}`)
  const arr = json?.data ?? json ?? []
  check('Student has 2 classes', arr.length >= 2, `count=${arr.length}`)
  console.log('   classes:', JSON.stringify(arr).slice(0, 600))
}

// Learning sets (explore)
{
  const { status, json } = await api('/learning-sets', st)
  check('GET /learning-sets', status === 200, `HTTP ${status}`)
  const arr = json?.data ?? json ?? []
  console.log('   learning sets:', JSON.stringify(arr).slice(0, 400))
}
{
  const { status, json } = await api('/learning-sets/technology', st)
  check('GET /learning-sets/technology', status === 200, `HTTP ${status}`)
  if (status === 200) console.log('   technology set title:', json?.data?.title ?? json?.title)
}

// Essays (writing)
{
  const { status, json } = await api('/essays', st)
  check('GET /essays', status === 200, `HTTP ${status}`)
  const arr = json?.data ?? json ?? []
  console.log('   essays:', JSON.stringify(arr).slice(0, 600))
}

// Assignment inbox
{
  const { status, json } = await api('/assignments/inbox', st)
  check('GET /assignments/inbox', status === 200, `HTTP ${status}`)
  console.log('   inbox:', JSON.stringify(json).slice(0, 500))
}

// ── PHASE 3: TEACHER ──────────────────────────────────────────────
const tt = await login('teacher@lexigrow.com')
console.log('\n===== PHASE 3: TEACHER =====')
{
  const { status, json } = await api('/teacher/dashboard', tt)
  check('GET /teacher/dashboard', status === 200, `HTTP ${status}`)
  console.log('   teacher dashboard:', JSON.stringify(json).slice(0, 600))
}
{
  const { status, json } = await api('/classes', tt)
  check('GET /classes (teacher)', status === 200, `HTTP ${status}`)
  const arr = json?.data ?? json ?? []
  console.log('   teacher classes:', JSON.stringify(arr).slice(0, 600))
}
{
  const { status, json } = await api('/assignments', tt)
  check('GET /assignments (teacher)', status === 200, `HTTP ${status}`)
  console.log('   assignments:', JSON.stringify(json).slice(0, 600))
}

// ── PHASE 4: PARENT ──────────────────────────────────────────────
const pt = await login('parent@lexigrow.com')
console.log('\n===== PHASE 4: PARENT =====')
{
  const { status, json } = await api('/parent/children', pt)
  check('GET /parent/children', status === 200, `HTTP ${status}`)
  const arr = json?.data ?? json?.children ?? []
  console.log('   children:', JSON.stringify(arr).slice(0, 400))
}
const childId = '6a9fb5e3572f84619691d786' // student Minh
{
  const { status, json } = await api(`/parent/children/${childId}/progress`, pt)
  check('GET /parent/children/:id/progress', status === 200, `HTTP ${status}`)
  console.log('   child progress:', JSON.stringify(json).slice(0, 500))
}
{
  const { status, json } = await api(`/parent/children/${childId}/goals`, pt)
  check('GET child goals', status === 200, `HTTP ${status}`)
  console.log('   child goals:', JSON.stringify(json).slice(0, 400))
}
{
  const { status, json } = await api(`/parent/children/${childId}/essays`, pt)
  check('GET child essays', status === 200, `HTTP ${status}`)
  console.log('   child essays:', JSON.stringify(json).slice(0, 500))
}
{
  const { status, json } = await api(`/parent/children/${childId}/vocabulary`, pt)
  check('GET child vocabulary', status === 200, `HTTP ${status}`)
  console.log('   child vocab:', JSON.stringify(json).slice(0, 300))
}

// ── PHASE 5: ADMIN ──────────────────────────────────────────────
const at = await login('admin@lexigrow.com')
console.log('\n===== PHASE 5: ADMIN =====')
{
  const { status, json } = await api('/admin/analytics', at)
  check('GET /admin/analytics', status === 200, `HTTP ${status}`)
  console.log('   admin analytics:', JSON.stringify(json).slice(0, 600))
}
{
  const { status, json } = await api('/admin/users', at)
  check('GET /admin/users', status === 200, `HTTP ${status}`)
  const arr = json?.data ?? json?.users ?? json ?? []
  console.log('   admin users count:', Array.isArray(arr) ? arr.length : 'n/a')
  console.log('   users:', JSON.stringify(arr).slice(0, 800))
}

// ── SUMMARY ──────────────────────────────────────────────────────
console.log('\n===== SUMMARY =====')
const passCount = results.filter(r => r.pass).length
const failCount = results.filter(r => !r.pass).length
console.log(`Total checks: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`)
if (failCount > 0) {
  console.log('\nFailed checks:')
  results.filter(r => !r.pass).forEach(r => console.log(`  - ${r.name}: ${r.detail}`))
}