import { describe, it, expect, beforeEach } from 'vitest'
import authService from '../services/authService'

describe('Local Demo Profile & Security Compliance', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('Requirement 2: Plaintext password must NEVER be stored in localStorage', () => {
    const user = authService.register('Trader Bob', 'bob@test.local', 'SecretPassword123')

    expect(user).toBeDefined()
    expect(user.email).toBe('bob@test.local')
    expect(user.password).toBeUndefined() // Stripped from user object

    // Inspect raw LocalStorage
    const rawDb = localStorage.getItem('finntech_users_db')
    expect(rawDb).not.toBeNull()
    expect(rawDb).not.toContain('SecretPassword123') // Plaintext password must NOT be in DB!

    const parsed = JSON.parse(rawDb)
    expect(parsed[0].passcodeHash).toBeDefined()
    expect(parsed[0].passcodeHash).not.toBe('SecretPassword123')
    expect(parsed[0].password).toBeUndefined()
  })

  it('Requirement 2b: Legacy stored plaintext passwords are auto-sanitized to hashes', () => {
    // Inject legacy user with plaintext password
    const legacyUser = {
      id: 'legacy_user_1',
      name: 'Old User',
      email: 'old@user.com',
      password: 'PlaintextOldPassword'
    }
    localStorage.setItem('finntech_users_db', JSON.stringify([legacyUser]))

    const users = authService.getUsers()
    expect(users[0].password).toBeUndefined()
    expect(users[0].passcodeHash).toBeDefined()

    // LocalStorage must now be sanitized
    const updatedDb = localStorage.getItem('finntech_users_db')
    expect(updatedDb).not.toContain('PlaintextOldPassword')
  })

  it('Requirement 2c: Login works with hashed passcode without exposing password', () => {
    authService.register('Alice', 'alice@test.local', 'MyPasscode999')

    const loggedIn = authService.login('alice@test.local', 'MyPasscode999')
    expect(loggedIn.name).toBe('Alice')
    expect(loggedIn.password).toBeUndefined()

    // Wrong password throws
    expect(() => {
      authService.login('alice@test.local', 'WrongPass')
    }).toThrow()
  })
})
