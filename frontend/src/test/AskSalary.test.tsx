import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'

import { AskSalaryPage } from '../features/ask-salary/AskSalaryPage'
import { askSalaryApi } from '../features/ask-salary/api'

// Mock askSalaryApi
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

const renderAskSalary = () => {
  const queryClient = createTestQueryClient()
  return render(
    <MemoryRouter initialEntries={['/ask']}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider>
          <AskSalaryPage />
        </ConfigProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('PR 12 Ask Salary Data (AI) UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(askSalaryApi.getSuggestedQuestions).mockResolvedValue([
      'What is our total salary spend this month?',
      'Which country has the highest average salary?',
      'What is the median salary in the United States?',
      'Compare Engineering vs Marketing salary costs',
      'How has our salary spend trended over the last 6 months?',
      'What is the breakdown of salaries by department?',
    ])
  })

  it('renders page title, demo mode tag, and starter suggested questions', async () => {
    renderAskSalary()

    expect(screen.getByText('Ask Salary Data (AI)')).toBeInTheDocument()
    expect(screen.getByText('Deterministic Demo Mode')).toBeInTheDocument()
    expect(screen.getByText('Allowlist Matcher Active')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('What is our total salary spend this month?')).toBeInTheDocument()
      expect(screen.getByText('Which country has the highest average salary?')).toBeInTheDocument()
      expect(screen.getByText('Compare Engineering vs Marketing salary costs')).toBeInTheDocument()
    })
  })

  it('submits a user question and renders assistant answer with metric cards', async () => {
    vi.mocked(askSalaryApi.askQuestion).mockResolvedValue({
      question: 'What is our total salary spend this month?',
      answer_text: 'In 2024-03, ACME Corp total salary spend was USD 95,000,000.00 across 10,000 employees.',
      metric_type: 'total_cost',
      chart_type: 'metric',
      data: [
        {
          total_spend: 95000000,
          headcount: 10000,
          avg_salary: 9500,
          median_salary: 9200,
          currency: 'USD',
          month: '2024-03',
        },
      ],
      currency: 'USD',
      source: 'rule_based',
      is_demo_mode: true,
      suggested_followups: ['What is the median salary in the United States?'],
    })

    renderAskSalary()

    const input = screen.getByLabelText('Natural language query input')
    const sendBtn = screen.getByRole('button', { name: /Send Query/i })

    await userEvent.type(input, 'What is our total salary spend this month?')
    await userEvent.click(sendBtn)

    // User message bubble appears
    const userBubble = screen.getByTestId('user-message-bubble')
    expect(userBubble).toBeInTheDocument()
    expect(userBubble).toHaveTextContent('What is our total salary spend this month?')

    // Assistant response appears
    await waitFor(() => {
      expect(
        screen.getByText(
          'In 2024-03, ACME Corp total salary spend was USD 95,000,000.00 across 10,000 employees.'
        )
      ).toBeInTheDocument()
      expect(screen.getByTestId('ai-metric-results')).toBeInTheDocument()
      expect(screen.getByText('$95,000,000.00')).toBeInTheDocument()
      expect(screen.getByText('10,000')).toBeInTheDocument()
    })
  })

  it('renders bar/column chart container for comparative queries', async () => {
    vi.mocked(askSalaryApi.askQuestion).mockResolvedValue({
      question: 'Which country has the highest average salary?',
      answer_text: 'In 2024-03, the top country by total spend was United States with USD 35,000,000.00.',
      metric_type: 'top_countries',
      chart_type: 'bar',
      data: [
        {
          country: 'United States',
          total_spend: 35000000,
          avg_salary: 11000,
          headcount: 3200,
        },
        {
          country: 'Germany',
          total_spend: 25000000,
          avg_salary: 9800,
          headcount: 2500,
        },
      ],
      currency: 'USD',
      source: 'rule_based',
      is_demo_mode: true,
      suggested_followups: ['Compare Engineering vs Marketing salary costs'],
    })

    renderAskSalary()

    const input = screen.getByLabelText('Natural language query input')
    const sendBtn = screen.getByRole('button', { name: /Send Query/i })

    await userEvent.type(input, 'Which country has the highest average salary?')
    await userEvent.click(sendBtn)

    await waitFor(() => {
      expect(screen.getByTestId('ai-bar-chart-container')).toBeInTheDocument()
      expect(screen.getByText('United States')).toBeInTheDocument()
      expect(screen.getByText('Germany')).toBeInTheDocument()
    })
  })

  it('submits query when clicking a suggested prompt card', async () => {
    vi.mocked(askSalaryApi.askQuestion).mockResolvedValue({
      question: 'Compare Engineering vs Marketing salary costs',
      answer_text: 'Engineering spend was USD 42M vs Marketing USD 18M.',
      metric_type: 'dept_comparison',
      chart_type: 'metric',
      data: [{ total_spend: 60000000, headcount: 5000 }],
      currency: 'USD',
      source: 'rule_based',
      is_demo_mode: true,
      suggested_followups: [],
    })

    renderAskSalary()

    await screen.findByTestId('starter-suggested-questions')
    const promptCard = await screen.findByRole('button', {
      name: /Compare Engineering vs Marketing salary costs/i,
    })
    await userEvent.click(promptCard)

    await waitFor(() => {
      expect(askSalaryApi.askQuestion).toHaveBeenCalledWith(
        'Compare Engineering vs Marketing salary costs',
        expect.objectContaining({ currency: 'USD' })
      )
      expect(screen.getByText('Engineering spend was USD 42M vs Marketing USD 18M.')).toBeInTheDocument()
    })
  })

  it('submits query when clicking a suggested follow-up tag in the assistant bubble', async () => {
    vi.mocked(askSalaryApi.askQuestion)
      .mockResolvedValueOnce({
        question: 'What is our total spend?',
        answer_text: 'Total spend is $95M.',
        metric_type: 'total_cost',
        chart_type: 'metric',
        data: [{ total_spend: 95000000 }],
        currency: 'USD',
        source: 'rule_based',
        is_demo_mode: true,
        suggested_followups: ['Show spend by country'],
      })
      .mockResolvedValueOnce({
        question: 'Show spend by country',
        answer_text: 'Here is spend by country.',
        metric_type: 'top_countries',
        chart_type: 'bar',
        data: [{ country: 'USA', total_spend: 35000000 }],
        currency: 'USD',
        source: 'rule_based',
        is_demo_mode: true,
        suggested_followups: [],
      })

    renderAskSalary()

    const input = screen.getByLabelText('Natural language query input')
    const sendBtn = screen.getByRole('button', { name: /Send Query/i })

    await userEvent.type(input, 'What is our total spend?')
    await userEvent.click(sendBtn)

    const followupTag = await screen.findByText('Show spend by country')
    await userEvent.click(followupTag)

    await waitFor(() => {
      expect(askSalaryApi.askQuestion).toHaveBeenLastCalledWith(
        'Show spend by country',
        expect.objectContaining({ currency: 'USD' })
      )
      expect(screen.getByText('Here is spend by country.')).toBeInTheDocument()
    })
  })

  it('displays error alert if query request fails', async () => {
    vi.mocked(askSalaryApi.askQuestion).mockRejectedValue(new Error('Network error connecting to AI engine'))

    renderAskSalary()

    const input = screen.getByLabelText('Natural language query input')
    const sendBtn = screen.getByRole('button', { name: /Send Query/i })

    await userEvent.type(input, 'Will this fail?')
    await userEvent.click(sendBtn)

    await waitFor(() => {
      expect(screen.getByText('Network error connecting to AI engine')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })
  })
})
