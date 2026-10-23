/**
 * PR 9 — Dashboard UI Tests.
 *
 * Verifies rendering of KPI cards, country spend donut chart,
 * 12-month trend chart, recent activity table, and filter controls.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { dashboardApi } from '../features/dashboard/api'
import { theme } from '../lib/theme'

// Mock the API client methods
vi.mock('../features/dashboard/api', () => ({
  dashboardApi: {
    getSummary: vi.fn(),
    getSalaryByCountry: vi.fn(),
    getSalaryTrend: vi.fn(),
    getRecentChanges: vi.fn(),
    getAvailableMonths: vi.fn(),
  },
}))

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme}>
          <DashboardPage />
        </ConfigProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('PR 9 Dashboard UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(dashboardApi.getAvailableMonths).mockResolvedValue([
      '2024-03-01',
      '2024-02-01',
      '2024-01-01',
    ])

    vi.mocked(dashboardApi.getSummary).mockResolvedValue({
      headcount: 10000,
      total_salary_spend: 95200000.5,
      avg_salary: 9520.01,
      active_countries: 10,
      paid_ratio: 98.5,
      salary_month: '2024-03-01',
      currency: 'USD',
    })

    vi.mocked(dashboardApi.getSalaryByCountry).mockResolvedValue({
      items: [
        { country: 'United States', total_spend: 38000000, employee_count: 3000, percentage: 39.92 },
        { country: 'United Kingdom', total_spend: 19000000, employee_count: 1500, percentage: 19.96 },
        { country: 'Germany', total_spend: 15000000, employee_count: 1200, percentage: 15.76 },
        { country: 'India', total_spend: 12000000, employee_count: 1200, percentage: 12.61 },
      ],
      salary_month: '2024-03-01',
      currency: 'USD',
    })

    vi.mocked(dashboardApi.getSalaryTrend).mockResolvedValue({
      items: [
        { month: '2024-01-01', month_label: 'Jan 2024', total_spend: 94000000, employee_count: 9900, avg_salary: 9494 },
        { month: '2024-02-01', month_label: 'Feb 2024', total_spend: 94800000, employee_count: 9950, avg_salary: 9527 },
        { month: '2024-03-01', month_label: 'Mar 2024', total_spend: 95200000, employee_count: 10000, avg_salary: 9520 },
      ],
      currency: 'USD',
    })

    vi.mocked(dashboardApi.getRecentChanges).mockResolvedValue({
      items: [
        {
          id: 1,
          employee_code: 'EMP-00101',
          name: 'Sarah Connor',
          department: 'Engineering',
          country: 'United States',
          salary: 145000,
          currency: 'USD',
          effective_date: '2024-03-01',
          status: 'Paid',
        },
        {
          id: 2,
          employee_code: 'EMP-00102',
          name: 'John Miller',
          department: 'Marketing',
          country: 'United Kingdom',
          salary: 78000,
          currency: 'GBP',
          effective_date: '2024-03-01',
          status: 'Pending',
        },
      ],
    })
  })

  it('renders dashboard page title and controls', () => {
    renderDashboard()
    expect(screen.getByText('Executive Salary Dashboard')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ask Salary AI/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export Data/i })).toBeInTheDocument()
  })

  it('displays accurate KPI values from summary API', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('10,000')).toBeInTheDocument()
      expect(screen.getByText('$95,200,000.50')).toBeInTheDocument()
      expect(screen.getByText('$9,520.01')).toBeInTheDocument()
      expect(screen.getByText('98.5%')).toBeInTheDocument()
      expect(screen.getByText('10 operating countries')).toBeInTheDocument()
    })
  })

  it('renders salary distribution chart container and top country list', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Salary Distribution by Country')).toBeInTheDocument()
      expect(screen.getByTestId('country-donut-chart-container')).toBeInTheDocument()
      expect(screen.getAllByText('United States').length).toBeGreaterThan(0)
      expect(screen.getAllByText('United Kingdom').length).toBeGreaterThan(0)
    })
  })

  it('renders salary trend line chart container', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('12-Month Payroll Expenditure Trend')).toBeInTheDocument()
      expect(screen.getByTestId('salary-trend-chart-container')).toBeInTheDocument()
    })
  })

  it('renders recent payroll activities table with rows and status tags', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Recent Payroll Activity')).toBeInTheDocument()
      expect(screen.getByText('EMP-00101')).toBeInTheDocument()
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument()
      expect(screen.getByText('Paid')).toBeInTheDocument()
      expect(screen.getByText('EMP-00102')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })
  })

  it('displays error alert when API call fails', async () => {
    vi.mocked(dashboardApi.getSummary).mockRejectedValue(new Error('Network error loading summary'))
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/Network error loading summary/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })
  })
})

