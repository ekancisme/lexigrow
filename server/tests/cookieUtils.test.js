import { describe, expect, it } from 'vitest'
import { parseCookies } from '../src/utils/cookie.js'

describe('parseCookies utility', () => {
  it('returns empty object for empty, null, undefined, or non-string inputs', () => {
    expect(parseCookies(null)).toEqual({})
    expect(parseCookies(undefined)).toEqual({})
    expect(parseCookies('')).toEqual({})
    expect(parseCookies('   ')).toEqual({})
    expect(parseCookies(123)).toEqual({})
  })

  it('parses standard cookie key-value pairs', () => {
    const header = 'token=abc123xyz; theme=dark; session_id=sess_999'
    expect(parseCookies(header)).toEqual({
      token: 'abc123xyz',
      theme: 'dark',
      session_id: 'sess_999',
    })
  })

  it('unquotes RFC 6265 quoted values', () => {
    const header = 'token="quoted_token_val"; user="john doe"'
    expect(parseCookies(header)).toEqual({
      token: 'quoted_token_val',
      user: 'john doe',
    })
  })

  it('handles cookies with multiple equals signs in value', () => {
    const header = 'token=eyJh.eyJ1c2VyIjoxfQ==; equation=1+1=2'
    expect(parseCookies(header)).toEqual({
      token: 'eyJh.eyJ1c2VyIjoxfQ==',
      equation: '1+1=2',
    })
  })

  it('safely handles malformed percent-encoding without throwing URIError', () => {
    const header = 'discount=50%off; bad=%E0%A4%A; regular=hello%20world'
    expect(parseCookies(header)).toEqual({
      discount: '50%off',
      bad: '%E0%A4%A',
      regular: 'hello world',
    })
  })

  it('ignores malformed pairs without equals sign or empty key', () => {
    const header = 'valid=1; ; =emptyKey; standaloneFlag; another=2'
    expect(parseCookies(header)).toEqual({
      valid: '1',
      another: '2',
    })
  })
})
