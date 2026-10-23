/**
 * PR 8 — Design System & Shell Tests.
 *
 * Verifies AppShell rendering, navigation menu items, header profile,
 * demo mode badges, and login view.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { describe, it, expect, beforeEach } from 'vitest'
import App from '../App'
import { theme } from '../lib/theme'

function renderApp(initialRoute = '/dashboard') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme}>
          <App />
        </ConfigProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('PR 8 Design System & AppShell Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders AppShell with ACME brand and subtitle', () => {
    renderApp('/dashboard')
    expect(screen.getByText('ACME Corp')).toBeInTheDocument()
    expect(screen.getByText('Salary Intelligence')).toBeInTheDocument()
  })

  it('renders all core navigation links', () => {
    renderApp('/dashboard')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Employees')).toBeInTheDocument()
    expect(screen.getByText('Salary Analytics')).toBeInTheDocument()
    expect(screen.getByText('Ask Salary Data (AI)')).toBeInTheDocument()
  })

  it('renders demo environment badge and user profile in header', () => {
    renderApp('/dashboard')
    expect(screen.getByText(/Demo Mode · 10k Records/i)).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('HR Manager')).toBeInTheDocument()
  })

  it('renders demo login page when navigating to /login', () => {
    renderApp('/login')
    expect(screen.getByText('Launch Demo Workspace')).toBeInTheDocument()
    expect(screen.getByText('Global Salary Intelligence Platform')).toBeInTheDocument()
    expect(screen.getByText(/Demo Environment/i)).toBeInTheDocument()
  })

  it('navigates to dashboard after clicking Launch Demo Workspace on login', async () => {
    renderApp('/login')
    const button = screen.getByRole('button', { name: /Launch Demo Workspace/i })
    await userEvent.click(button)
    expect(screen.getByText('Executive Dashboard')).toBeInTheDocument()
  })

  it('navigates to employees directory when link is clicked', async () => {
    renderApp('/dashboard')
    const employeesLink = screen.getByText('Employees')
    await userEvent.click(employeesLink)
    expect(screen.getByText('Employees Directory')).toBeInTheDocument()
  })
})
