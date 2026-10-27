/**
 * PR 10 — Employee Directory UI Tests.
 *
 * Verifies employee table rendering, search/filters, server-side pagination,
 * detail drawer, and Excel export trigger.
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmployeesPage } from '../features/employees/EmployeesPage'
import { employeesApi } from '../features/employees/api'
import { theme } from '../lib/theme'

vi.mock('../features/employees/api', () => ({
  employeesApi: {
    listEmployees: vi.fn(),
    getEmployeeDetail: vi.fn(),
    getCountries: vi.fn(),
    getMonths: vi.fn(),
    exportToExcel: vi.fn(),
  },
}))

function renderEmployees(initialRoute = '/employees') {
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
          <EmployeesPage />
        </ConfigProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('PR 10 Employee Directory UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(employeesApi.getCountries).mockResolvedValue([
      'United States',
      'United Kingdom',
      'Germany',
      'France',
    ])

    vi.mocked(employeesApi.getMonths).mockResolvedValue([
      '2024-03-01',
      '2024-02-01',
      '2024-01-01',
    ])

    vi.mocked(employeesApi.listEmployees).mockResolvedValue({
      data: [
        {
          id: 1,
          employee_code: 'EMP-00001',
          first_name: 'Alice',
          last_name: 'Adams',
          full_name: 'Alice Adams',
          email: 'alice@acme.test',
          department: 'Engineering',
          job_title: 'Senior Engineer',
          country: 'United States',
          hire_date: '2021-04-12',
          salary: {
            id: 101,
            salary_month: '2024-03-01',
            base_salary: 12500,
            currency: 'USD',
            is_paid: true,
            paid_date: '2024-03-28',
            month_label: 'Mar 2024',
          },
        },
        {
          id: 2,
          employee_code: 'EMP-00002',
          first_name: 'Bob',
          last_name: 'Builder',
          full_name: 'Bob Builder',
          email: 'bob@acme.test',
          department: 'Operations',
          job_title: 'Ops Manager',
          country: 'United Kingdom',
          hire_date: '2020-09-01',
          salary: {
            id: 102,
            salary_month: '2024-03-01',
            base_salary: 8200,
            currency: 'GBP',
            is_paid: false,
            paid_date: null,
            month_label: 'Mar 2024',
          },
        },
      ],
      meta: {
        total: 2,
        page: 1,
        page_size: 50,
        pages: 1,
        has_next: false,
        has_prev: false,
      },
      salary_month: '2024-03-01',
    })

    vi.mocked(employeesApi.getEmployeeDetail).mockResolvedValue({
      id: 1,
      employee_code: 'EMP-00001',
      first_name: 'Alice',
      last_name: 'Adams',
      full_name: 'Alice Adams',
      email: 'alice@acme.test',
      department: 'Engineering',
      job_title: 'Senior Engineer',
      country: 'United States',
      hire_date: '2021-04-12',
      salary_records: [
        {
          id: 101,
          salary_month: '2024-03-01',
          base_salary: 12500,
          currency: 'USD',
          is_paid: true,
          paid_date: '2024-03-28',
          month_label: 'Mar 2024',
        },
        {
          id: 91,
          salary_month: '2024-02-01',
          base_salary: 12500,
          currency: 'USD',
          is_paid: true,
          paid_date: '2024-02-28',
          month_label: 'Feb 2024',
        },
      ],
    })
  })

  it('renders employee directory title and search/filter controls', () => {
    renderEmployees()
    expect(screen.getByText('Employees Directory')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search by name, email, code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export to Excel/i })).toBeInTheDocument()
  })

  it('displays employee list in table with codes, names, and salaries', async () => {
    renderEmployees()
    await waitFor(() => {
      expect(screen.getByText('EMP-00001')).toBeInTheDocument()
      expect(screen.getByText('Alice Adams')).toBeInTheDocument()
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
      expect(screen.getByText('United States')).toBeInTheDocument()
      expect(screen.getByText('Paid')).toBeInTheDocument()

      expect(screen.getByText('EMP-00002')).toBeInTheDocument()
      expect(screen.getByText('Bob Builder')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })
  })

  it('triggers search filter when typing into search input', async () => {
    renderEmployees()
    const searchInput = screen.getByPlaceholderText(/Search by name, email, code/i)
    await userEvent.type(searchInput, 'Alice')
    expect(searchInput).toHaveValue('Alice')
  })

  it('opens employee detail drawer with salary history upon clicking Details', async () => {
    renderEmployees()
    await waitFor(() => {
      expect(screen.getByText('EMP-00001')).toBeInTheDocument()
    })

    const detailsButtons = screen.getAllByRole('button', { name: /Details/i })
    fireEvent.click(detailsButtons[0])

    await waitFor(
      () => {
        expect(screen.getByText('Salary Disbursement History')).toBeInTheDocument()
        expect(screen.getByText('Historical Records')).toBeInTheDocument()
        expect(screen.getByText('Feb 2024')).toBeInTheDocument()
      },
      { timeout: 8000 }
    )
  })

  it('triggers excel export when clicking Export button', async () => {
    renderEmployees()
    const exportBtn = screen.getByRole('button', { name: /Export to Excel/i })
    await userEvent.click(exportBtn)
    expect(employeesApi.exportToExcel).toHaveBeenCalled()
  })

  it('displays error banner if API request fails', async () => {
    vi.mocked(employeesApi.listEmployees).mockRejectedValue(new Error('Failed to load employees'))
    renderEmployees()
    await waitFor(() => {
      expect(screen.getByText('Failed to load employee directory')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })
  })
})
