import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'

import App from '../App'
import { dashboardApi } from '../features/dashboard/api'
import { employeesApi } from '../features/employees/api'
import { analyticsApi } from '../features/analytics/api'
import { askSalaryApi } from '../features/ask-salary/api'
import { theme } from '../lib/theme'

// Mock all backend API endpoints
vi.mock('../features/dashboard/api', () => ({
  dashboardApi: {
    getSummary: vi.fn(),
    getSalaryByCountry: vi.fn(),
    getSalaryTrend: vi.fn(),
    getRecentChanges: vi.fn(),
    getAvailableMonths: vi.fn(),
  },
}))

vi.mock('../features/employees/api', () => ({
  employeesApi: {
    listEmployees: vi.fn(),
    getEmployeeDetail: vi.fn(),
    getCountries: vi.fn(),
    getMonths: vi.fn(),
    exportToExcel: vi.fn(),
  },
}))

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

vi.mock('../features/ask-salary/api', () => ({
  askSalaryApi: {
    askQuestion: vi.fn(),
    getSuggestedQuestions: vi.fn(),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

const renderApp = (initialRoute = '/dashboard') => {
  const queryClient = createTestQueryClient()
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme}>
          <App />
        </ConfigProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('PR 13 End-to-End HR Manager Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Dashboard API mocks
    vi.mocked(dashboardApi.getSummary).mockResolvedValue({
      headcount: 10000,
      total_salary_spend: 95000000.75,
      avg_salary: 9500.01,
      active_countries: 8,
      paid_ratio: 92.5,
      salary_month: '2024-03-01',
      currency: 'USD',
    })
    vi.mocked(dashboardApi.getSalaryByCountry).mockResolvedValue({
      items: [
        { country: 'United States', total_spend: 38000000, employee_count: 3500, percentage: 40.0 },
        { country: 'United Kingdom', total_spend: 22000000, employee_count: 2200, percentage: 23.2 },
      ],
      salary_month: '2024-03-01',
      currency: 'USD',
    })
    vi.mocked(dashboardApi.getSalaryTrend).mockResolvedValue({
      items: [
        { month: '2024-01-01', month_label: 'Jan 2024', total_spend: 91000000, employee_count: 9800, avg_salary: 9285 },
        { month: '2024-02-01', month_label: 'Feb 2024', total_spend: 93000000, employee_count: 9900, avg_salary: 9393 },
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
          salary: 14500,
          currency: 'USD',
          effective_date: '2024-03-28T10:00:00Z',
          status: 'Paid',
        },
      ],
    })
    vi.mocked(dashboardApi.getAvailableMonths).mockResolvedValue(['2024-03-01', '2024-02-01'])

    // 2. Employees API mocks
    vi.mocked(employeesApi.getCountries).mockResolvedValue(['United States', 'United Kingdom', 'Germany'])
    vi.mocked(employeesApi.getMonths).mockResolvedValue(['2024-03-01', '2024-02-01'])
    vi.mocked(employeesApi.listEmployees).mockResolvedValue({
      data: [
        {
          id: 101,
          employee_code: 'EMP-00101',
          first_name: 'Sarah',
          last_name: 'Connor',
          full_name: 'Sarah Connor',
          email: 'sconnor@acme.test',
          department: 'Engineering',
          job_title: 'Principal Architect',
          country: 'United States',
          hire_date: '2021-04-12',
          salary: {
            id: 501,
            salary_month: '2024-03-01',
            base_salary: 14500,
            currency: 'USD',
            is_paid: true,
            paid_date: '2024-03-28',
            month_label: 'Mar 2024',
          },
        },
      ],
      meta: {
        total: 1,
        page: 1,
        page_size: 25,
        pages: 1,
        has_next: false,
        has_prev: false,
      },
      salary_month: '2024-03-01',
    })
    vi.mocked(employeesApi.getEmployeeDetail).mockResolvedValue({
      id: 101,
      employee_code: 'EMP-00101',
      first_name: 'Sarah',
      last_name: 'Connor',
      full_name: 'Sarah Connor',
      email: 'sconnor@acme.test',
      department: 'Engineering',
      job_title: 'Principal Architect',
      country: 'United States',
      hire_date: '2021-04-12',
      salary_records: [
        {
          id: 501,
          salary_month: '2024-03-01',
          base_salary: 14500,
          currency: 'USD',
          is_paid: true,
          paid_date: '2024-03-28',
          month_label: 'Mar 2024',
        },
      ],
    })
    vi.mocked(employeesApi.exportToExcel).mockResolvedValue()

    // 3. Analytics API mocks
    vi.mocked(analyticsApi.getCountries).mockResolvedValue(['United States', 'United Kingdom'])
    vi.mocked(analyticsApi.getMonths).mockResolvedValue(['2024-03-01'])
    vi.mocked(analyticsApi.getOverview).mockResolvedValue({
      total_spend: 95000000.75,
      avg_salary: 9500.01,
      median_salary: 9200.0,
      headcount: 10000,
      highest_salary: 25000,
      lowest_salary: 3000,
      currency: 'USD',
      salary_month: '2024-03-01',
    })
    vi.mocked(analyticsApi.getByCountry).mockResolvedValue({
      items: [
        {
          country: 'United States',
          total_spend: 38000000,
          avg_salary: 10857,
          median_salary: 10500,
          headcount: 3500,
          percentage_of_total: 40.0,
        },
      ],
      currency: 'USD',
      salary_month: '2024-03-01',
    })
    vi.mocked(analyticsApi.getByDepartment).mockResolvedValue({
      items: [
        {
          department: 'Engineering',
          total_spend: 42000000,
          avg_salary: 12000,
          median_salary: 11500,
          headcount: 3500,
          percentage_of_total: 44.2,
        },
      ],
      currency: 'USD',
      salary_month: '2024-03-01',
    })
    vi.mocked(analyticsApi.getTrends).mockResolvedValue({
      items: [
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

    // 4. AI Query API mocks
    vi.mocked(askSalaryApi.getSuggestedQuestions).mockResolvedValue([
      'What is our total salary spend this month?',
      'Which country has the highest average salary?',
    ])
    vi.mocked(askSalaryApi.askQuestion).mockResolvedValue({
      question: 'What is our total salary spend this month?',
      answer_text: 'In 2024-03, ACME Corp total salary spend was USD 95,000,000.00 across 10,000 employees.',
      metric_type: 'total_cost',
      chart_type: 'metric',
      data: [{ total_spend: 95000000, headcount: 10000, avg_salary: 9500, median_salary: 9200 }],
      currency: 'USD',
      source: 'rule_based',
      is_demo_mode: true,
      suggested_followups: ['Which country has the highest average salary?'],
    })
  })

  it('Journey 1: Login -> App Shell -> Header & Navigation Bar', async () => {
    renderApp('/login')

    // On login page
    expect(screen.getByText('Global Salary Intelligence Platform')).toBeInTheDocument()
    const launchBtn = screen.getByRole('button', { name: /Launch Demo Workspace/i })
    fireEvent.click(launchBtn)

    // Lands on dashboard with executive KPIs
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Executive Salary Dashboard/i })).toBeInTheDocument()
      expect(screen.getByText(/Demo Mode · 10k Records/i)).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getAllByText('HR Manager').length).toBeGreaterThan(0)
    })
  })

  it('Journey 2: Cross-Tab Navigation and State Retention', async () => {
    renderApp('/dashboard')

    // 1. Check Dashboard is visible
    expect(screen.getByRole('heading', { name: /Executive Salary Dashboard/i })).toBeInTheDocument()

    // 2. Click Employees navigation link
    const employeesNav = screen.getByText('Employees')
    fireEvent.click(employeesNav)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Employees Directory/i })).toBeInTheDocument()
      expect(screen.getByText('EMP-00101')).toBeInTheDocument()
    })

    // 3. Click Salary Analytics navigation link
    const analyticsNav = screen.getByText('Salary Analytics')
    fireEvent.click(analyticsNav)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Salary Analytics & Intelligence/i })).toBeInTheDocument()
    })

    // 4. Click Ask Salary Data navigation link
    const askNav = screen.getByText('Ask Salary Data (AI)')
    fireEvent.click(askNav)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Ask Salary Data \(AI\)/i })).toBeInTheDocument()
    })
  })

  it('Journey 3: Employee Directory -> Details Drawer -> Excel Export', async () => {
    renderApp('/employees')

    await waitFor(() => {
      expect(screen.getByText('EMP-00101')).toBeInTheDocument()
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument()
    })

    // Click Details to open drawer
    const detailsButtons = screen.getAllByRole('button', { name: /Details/i })
    fireEvent.click(detailsButtons[0])

    await waitFor(() => {
      expect(employeesApi.getEmployeeDetail).toHaveBeenCalledWith(101)
      expect(screen.getByText('Salary Disbursement History')).toBeInTheDocument()
      expect(screen.getAllByText('Principal Architect').length).toBeGreaterThan(0)
    })

    // Click Export
    const exportBtn = screen.getByRole('button', { name: /Export to Excel/i })
    fireEvent.click(exportBtn)

    await waitFor(() => {
      expect(employeesApi.exportToExcel).toHaveBeenCalled()
    })
  })

  it('Journey 4: Interactive Natural Language AI Query Cycle', async () => {
    renderApp('/ask')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Ask Salary Data \(AI\)/i })).toBeInTheDocument()
      expect(screen.getByText('Deterministic Demo Mode')).toBeInTheDocument()
    })

    // Ask Question
    const input = screen.getByLabelText('Natural language query input')
    const sendBtn = screen.getByRole('button', { name: /Send Query/i })
    await userEvent.type(input, 'What is our total salary spend this month?')
    fireEvent.click(sendBtn)

    // Receive verified answer & KPI card
    await waitFor(() => {
      expect(
        screen.getByText('In 2024-03, ACME Corp total salary spend was USD 95,000,000.00 across 10,000 employees.')
      ).toBeInTheDocument()
      expect(screen.getByTestId('ai-metric-results')).toBeInTheDocument()
    })
  })
})
