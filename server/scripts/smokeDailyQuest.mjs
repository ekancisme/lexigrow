// Run after `npm run build` from the project root. Uses an isolated temporary DB.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import puppeteer from 'puppeteer'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = randomBytes(32).toString('hex')
const { default: app } = await import('../src/app.js')
const { default: User } = await import('../src/models/User.js')
const { default: DailyQuest } = await import('../src/models/DailyQuest.js')
const { initSocket, getIO } = await import('../src/services/socket.service.js')
const output = process.env.QUEST_SMOKE_OUTPUT || path.join(os.tmpdir(), 'lexigrow-daily-quest')
await fs.mkdir(output, { recursive: true })
let mongo, server, browser
try {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
  await DailyQuest.init()
  const user = await User.create({
    name: 'Daily Quest Tester',
    email: 'quest-smoke@example.test',
    password: randomBytes(16).toString('hex'),
    role: 'student',
  })
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET)
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  process.env.CLIENT_URL = base
  initSocket(server)
  browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage(),
    errors = []
  page.setDefaultTimeout(15_000)
  page.on('dialog', dialog => dialog.accept())
  page.on('pageerror', (err) => errors.push(err.message))
  await page.evaluateOnNewDocument(
    (token, user) => {
      localStorage.setItem('lexigrow_token', token)
      localStorage.setItem('lexigrow_user', JSON.stringify(user))
      localStorage.setItem('lexigrow_language', 'vi')
    },
    token,
    { _id: user.id, name: user.name, role: 'student' },
  )
  await page.setViewport({ width: 1440, height: 1000 })
  await page.goto(`${base}/student/game`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.quest-banner .quest-primary')
  await page.click('.quest-banner .quest-primary')
  await page.waitForSelector('#quest-answer')
  console.log('Smoke: game loaded')
  await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true })
  for (const width of [360, 768, 1440]) {
    await page.setViewport({ width, height: 950 })
    if (width < 1025)
      await page.waitForFunction(
        () => document.querySelector('.sidebar').getBoundingClientRect().right <= 1,
      )
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      false,
      `Overflow at ${width}px`,
    )
    if (width === 360)
      await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true })
  }
  const saved = page.waitForResponse(
    (r) => r.url().includes('/play') && r.request().method() === 'POST',
  )
  await page.type('#quest-answer', 'XYZ')
  await saved
  await page.waitForFunction(() => document.querySelector('.quest-meta span:last-child')?.textContent === 'Đã lưu tiến trình')
  await page.reload({ waitUntil: 'networkidle0' })
  await page.waitForSelector('#quest-answer')
  assert.equal(await page.$eval('#quest-answer', (el) => el.value), 'XYZ', 'Restored saved letters')
  console.log('Smoke: resume passed')

  // Network failure leaves an editable draft, then retry persists it.
  await page.setOfflineMode(true)
  await page.focus('#quest-answer')
  await page.keyboard.down('Control')
  await page.keyboard.press('KeyA')
  await page.keyboard.up('Control')
  await page.type('#quest-answer', 'ABC')
  await page.waitForSelector('.quest-error')
  await page.setOfflineMode(false)
  await page.click('.quest-error button')
  await page.waitForFunction(
    () =>
      !document.querySelector('.quest-error') &&
      !document.querySelector('.quest-actions button').disabled,
  )
  console.log('Smoke: offline retry passed')

  // A second tab receives a visible conflict, never silently overwrites progress.
  const second = await browser.newPage()
  await second.goto(`${base}/student/game/daily-quest`, { waitUntil: 'networkidle0' })
  await second.waitForSelector('#quest-answer')
  await page.bringToFront()
  console.log('Smoke: revealing first answer')
  await page.click('.quest-reveal')
  await page.waitForFunction(() => document.querySelector('#quest-answer')?.disabled)
  await second.bringToFront()
  await second.focus('#quest-answer')
  await second.keyboard.down('Control')
  await second.keyboard.press('KeyA')
  await second.keyboard.up('Control')
  await second.type('#quest-answer', 'TEST')
  await second.waitForSelector('.quest-error')
  assert.match(await second.$eval('.quest-error', (el) => el.textContent), /tab/)
  await second.click('.quest-error button')
  await second.waitForFunction(
    () =>
      !document.querySelector('.quest-error') && document.querySelector('#quest-answer')?.disabled,
  )
  await second.close()
  await page.bringToFront()
  console.log('Smoke: conflict recovery passed')

  const quest = await DailyQuest.findOne({ student: user.id }).lean()
  for (let i = 1; i < quest.words.length; i++) {
    await page.click(`.quest-clue-list button:nth-child(${i + 1})`)
    await page.waitForFunction(() => !document.querySelector('#quest-answer').disabled)
    await page.focus('#quest-answer')
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.type('#quest-answer', quest.words[i].answer)
    assert.equal(
      await page.$eval('#quest-answer', (el) => el.value),
      quest.words[i].answer,
      'Typing preserves the caret at locked crossings',
    )
    await page.waitForFunction(() => !document.querySelector('.quest-actions button').disabled)
    const checked = page.waitForResponse(
      (r) => r.url().includes('/play') && r.request().postData()?.includes('"check"'),
    )
    await page.click('.quest-actions button[type=submit]')
    assert.equal((await (await checked).json()).correct, true)
  }
  await page.waitForSelector('.quest-results')
  await page.screenshot({ path: path.join(output, 'completed.png'), fullPage: true })
  await page.click('.quest-results .quest-primary')
  await page.waitForFunction(() =>
    document.querySelector('.quest-banner small')?.textContent.includes('1 '),
  )
  assert.equal(await DailyQuest.countDocuments({ student: user.id, reward: 1 }), 1)
  await page.screenshot({ path: path.join(output, 'garden.png'), fullPage: true })
  assert.deepEqual(errors, [], 'No browser runtime errors')
  console.log(
    JSON.stringify({
      passed: true,
      checks: [
        'desktop/mobile layout',
        'resume',
        'offline retry',
        'tab conflict',
        'assisted answer',
        'solve',
        'single reward',
        'garden collection',
        'no runtime errors',
      ],
      screenshots: output,
    }),
  )
} catch (error) {
  console.error('Smoke failed:', error)
  throw error
} finally {
  await browser?.close()
  if (server) {
    try {
      await new Promise((resolve) => getIO().close(resolve))
    } catch {
      server.close()
    }
  }
  await mongoose.disconnect()
  await mongo?.stop()
}
