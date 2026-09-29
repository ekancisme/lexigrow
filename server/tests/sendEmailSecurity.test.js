import { describe, it, expect, vi } from 'vitest'
vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn() } }))
import nodemailer from 'nodemailer'
import sendEmail from '../src/utils/sendEmail.js'
describe('Mail transport safety after dependency update', () => {
  it('verifies TLS and blocks resource loading, and never forwards raw user options', async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: 'test' })
    nodemailer.createTransport.mockReturnValue({ sendMail })
    await sendEmail({
      email: 'test@example.test',
      subject: 'Test',
      message: 'Body',
      raw: 'not forwarded',
    })
    expect(nodemailer.createTransport.mock.calls[0][0]).toMatchObject({
      tls: { rejectUnauthorized: true },
      disableFileAccess: true,
      disableUrlAccess: true,
    })
    expect(sendMail.mock.calls[0][0]).not.toHaveProperty('raw')
  })

  it('uses LexiGrow branding when SMTP_FROM is not configured', async () => {
    delete process.env.SMTP_FROM
    process.env.SMTP_USER = 'noreply@example.test'
    const sendMail = vi.fn().mockResolvedValue({ messageId: 'branding-test' })
    nodemailer.createTransport.mockReturnValue({ sendMail })

    await sendEmail({
      email: 'student@example.test',
      subject: 'Feedback',
      message: 'Your feedback is ready',
    })

    expect(sendMail.mock.calls[0][0].from).toBe('"LexiGrow" <noreply@example.test>')
  })
})
