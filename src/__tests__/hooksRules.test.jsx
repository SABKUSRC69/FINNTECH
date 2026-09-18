import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import QuickActionModal from '../components/dashboard/QuickActionModal'
import UserProfileModal from '../components/auth/UserProfileModal'
import AuthModal from '../components/auth/AuthModal'

describe('React Rules of Hooks Compliance', () => {
  it('Requirement 3a: QuickActionModal renders and transitions isOpen without hook errors', () => {
    const onAdd = vi.fn()
    const onClose = vi.fn()

    // 1. Initial render with isOpen = false (0 hooks executed)
    const { rerender, queryByText } = render(
      <QuickActionModal isOpen={false} onClose={onClose} onAddTransaction={onAdd} />
    )
    expect(queryByText('บันทึกรายการด่วน (Quick Record)')).toBeNull()

    // 2. Re-render with isOpen = true (modal mounts and executes hooks without error)
    expect(() => {
      rerender(
        <QuickActionModal isOpen={true} onClose={onClose} onAddTransaction={onAdd} />
      )
    }).not.toThrow()
    expect(queryByText('บันทึกรายการด่วน (Quick Record)')).not.toBeNull()

    // 3. Re-render back to isOpen = false (clean unmount without error)
    expect(() => {
      rerender(
        <QuickActionModal isOpen={false} onClose={onClose} onAddTransaction={onAdd} />
      )
    }).not.toThrow()
    expect(queryByText('บันทึกรายการด่วน (Quick Record)')).toBeNull()
  })

  it('Requirement 3b: UserProfileModal renders and transitions isOpen without hook errors', () => {
    const mockUser = {
      id: 'user_test_123',
      name: 'Test Trader',
      email: 'test@finntech.local',
      tier: 'DEMO PROFILE',
      avatarColor: 'from-emerald-500 to-teal-600',
    }
    const onClose = vi.fn()

    // 1. Initial render with isOpen = false
    const { rerender, queryByText } = render(
      <UserProfileModal
        isOpen={false}
        currentUser={mockUser}
        balance={500000}
        positionsCount={0}
        tradesCount={0}
        onClose={onClose}
      />
    )
    expect(queryByText('ข้อมูลบัญชีผู้ใช้งาน (User Profile)')).toBeNull()

    // 2. Re-render with isOpen = true
    expect(() => {
      rerender(
        <UserProfileModal
          isOpen={true}
          currentUser={mockUser}
          balance={500000}
          positionsCount={0}
          tradesCount={0}
          onClose={onClose}
        />
      )
    }).not.toThrow()
    expect(queryByText('ข้อมูลบัญชีผู้ใช้งาน (User Profile)')).not.toBeNull()

    // Verify KYC claims were replaced with Local Profile
    expect(queryByText('KYC Verified')).toBeNull()
    expect(queryByText('Local Profile')).not.toBeNull()

    // 3. Re-render with isOpen = false
    expect(() => {
      rerender(
        <UserProfileModal
          isOpen={false}
          currentUser={mockUser}
          balance={500000}
          positionsCount={0}
          tradesCount={0}
          onClose={onClose}
        />
      )
    }).not.toThrow()
  })

  it('Requirement 3c: AuthModal renders and transitions isOpen without hook errors', () => {
    const onAuth = vi.fn()
    const onClose = vi.fn()

    // 1. Initial render with isOpen = false
    const { rerender, queryByText } = render(
      <AuthModal isOpen={false} onClose={onClose} onAuthSuccess={onAuth} />
    )
    expect(queryByText('FINNTECH Profile')).toBeNull()

    // 2. Re-render with isOpen = true
    expect(() => {
      rerender(
        <AuthModal isOpen={true} onClose={onClose} onAuthSuccess={onAuth} />
      )
    }).not.toThrow()
    expect(queryByText('FINNTECH Profile')).not.toBeNull()

    // 3. Re-render with isOpen = false
    expect(() => {
      rerender(
        <AuthModal isOpen={false} onClose={onClose} onAuthSuccess={onAuth} />
      )
    }).not.toThrow()
  })
})
