/**
 * PR 11 — Salary Analytics UI Tests.
 *
 * Verifies rendering of overview KPIs, By Country tab, By Department tab,
 * Trends tab, and filter controls.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalyticsPage } from '../features/analytics/AnalyticsPage'
import { analyticsApi } from '../features/analytics/api'
import { theme } from '../lib/theme'

vi.mock('../features/analytics/api', () => ({
  analyticsApi: {
    getOverview: vi.fn(),
    getByCountry: vi.fn(),
    getByDepartment: vi.fn(),
    getTrends: vi.fn(),
    getCountries: vi.fn(),
    getMonths: vi.fn(),
  },
}))

function renderAnalytics(initialRoute = '/analytics') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme}>
          <AnalyticsPage />
        </ConfigProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('PR 11 Salary Analytics UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(analyticsApi.getCountries).mockResolvedValue([
      'United States',
      'United Kingdom',
      'Germany',
    ])

    vi.mocked(analyticsApi.getMonths).mockResolvedValue([
      '2024-03-01',
      '2024-02-01',
    ])

    vi.mocked(analyticsApi.getOverview).mockResolvedValue({
      total_spend: 95000000.75,
      avg_salary: 9500.01,
      median_salary: 9200.0,
      headcount: 10000,
      highest_salary: 220000,
      lowest_salary: 45000,
      currency: 'USD',
      salary_month: '2024-03-01',
    })

    vi.mocked(analyticsApi.getByCountry).mockResolvedValue({
      items: [
        {
          country: 'United States',
          headcount: 3000,
          total_spend: 38000000,
          avg_salary: 12666.67,
          median_salary: 12000,
          percentage_of_total: 40.0,
        },
        {
          country: 'United Kingdom',
          headcount: 1500,
          total_spend: 19000000,
          avg_salary: 12666.67,
          median_salary: 11500,
          percentage_of_total: 20.0,
        },
      ],
      salary_month: '2024-03-01',
      currency: 'USD',
    })

    vi.mocked(analyticsApi.getByDepartment).mockResolvedValue({
      items: [
        {
          department: 'Engineering',
          headcount: 3500,
          total_spend: 42000000,
          avg_salary: 12000,
          median_salary: 11800,
          percentage_of_total: 44.2,
        },
        {
          department: 'Marketing',
          headcount: 1500,
          total_spend: 14000000,
          avg_salary: 9333.33,
          median_salary: 9000,
          percentage_of_total: 14.7,
        },
      ],
      salary_month: '2024-03-01',
      currency: 'USD',
    })

    vi.mocked(analyticsApi.getTrends).mockResolvedValue({
      items: [
        {
          month: '2024-02-01',
          month_label: 'Feb 2024',
          category: 'Engineering',
          total_spend: 41000000,
          avg_salary: 11900,
          headcount: 3450,
        },
        {
          month: '2024-03-01',
          month_label: 'Mar 2024',
          category: 'Engineering',
          total_spend: 42000000,
          avg_salary: 12000,
          headcount: 3500,
        },
      ],
      group_by: 'department',
      currency: 'USD',
    })
  })

  it('renders analytics title and filter controls', () => {
    renderAnalytics()
    expect(screen.getByText('Salary Analytics & Intelligence')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Filter by Month/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Filter by Country/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Filter by Department/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Select Currency/i })).toBeInTheDocument()
  })

  it('renders overview KPI cards with accurate values', async () => {
    renderAnalytics()
    await waitFor(() => {
      expect(screen.getByText('$95,000,000.75')).toBeInTheDocument()
      expect(screen.getByText('$9,500.01')).toBeInTheDocument()
      expect(screen.getByText('$9,200.00')).toBeInTheDocument()
      expect(screen.getByText('10,000')).toBeInTheDocument()
    })
  })

  it('renders By Country tab with chart and country breakdown table', async () => {
    renderAnalytics()
    await waitFor(() => {
      expect(screen.getByText('Compensation Comparison by Country')).toBeInTheDocument()
      expect(screen.getByTestId('country-chart-container')).toBeInTheDocument()
      expect(screen.getByText('United States')).toBeInTheDocument()
      expect(screen.getByText('United Kingdom')).toBeInTheDocument()
    })
  })

  it('switches to By Department tab upon clicking tab header', async () => {
    renderAnalytics()
    const deptTab = screen.getByRole('tab', { name: /By Department/i })
    await userEvent.click(deptTab)

    await waitFor(() => {
      expect(screen.getByText('Department Payroll Expenditure')).toBeInTheDocument()
      expect(screen.getByTestId('department-chart-container')).toBeInTheDocument()
      expect(screen.getByText('Engineering')).toBeInTheDocument()
      expect(screen.getByText('Marketing')).toBeInTheDocument()
    })
  })

  it('switches to Historical Trends tab upon clicking tab header', async () => {
    renderAnalytics()
    const trendsTab = screen.getByRole('tab', { name: /Historical Trends/i })
    await userEvent.click(trendsTab)

    await waitFor(() => {
      expect(screen.getByText('Historical Compensation Trends')).toBeInTheDocument()
      expect(screen.getByTestId('trends-chart-container')).toBeInTheDocument()
    })
  })

  it('displays error banner if API request fails', async () => {
    vi.mocked(analyticsApi.getOverview).mockRejectedValue(new Error('Failed to load analytics'))
    renderAnalytics()
    await waitFor(() => {
      expect(screen.getByText('Failed to load analytics')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })
  })
})
