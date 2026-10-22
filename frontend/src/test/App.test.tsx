/**
 * PR 1 — Application smoke test.
 *
 * Verifies the app renders without crashing and shows the
 * placeholder dashboard content.
 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { describe, it, expect } from 'vitest'
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

describe('App smoke test', () => {
  it('renders without crashing', () => {
    renderApp()
    expect(document.body).toBeTruthy()
  })

  it('shows ACME brand name on dashboard', () => {
    renderApp('/dashboard')
    expect(screen.getByText('ACME Salary Intelligence')).toBeInTheDocument()
  })

  it('redirects root path to /dashboard', () => {
    renderApp('/')
    expect(screen.getByText('ACME Salary Intelligence')).toBeInTheDocument()
  })

  it('redirects unknown routes to /dashboard', () => {
    renderApp('/unknown-route')
    expect(screen.getByText('ACME Salary Intelligence')).toBeInTheDocument()
  })
})
