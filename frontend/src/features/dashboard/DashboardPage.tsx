import React, { useState } from 'react'
import {
  Typography,
  Space,
  Select,
  Button,
  Row,
  Col,
  Alert,
  Tooltip,
} from 'antd'
import {
  ReloadOutlined,
  CommentOutlined,
  DownloadOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { dashboardApi } from './api'
import { KpiCards } from './components/KpiCards'
import { CountrySpendChart } from './components/CountrySpendChart'
import { SalaryTrendChart } from './components/SalaryTrendChart'
import { RecentChangesTable } from './components/RecentChangesTable'

const { Title, Text } = Typography

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD')

  // 1. Fetch available months for dropdown
  const { data: availableMonths = [] } = useQuery({
    queryKey: ['available-months'],
    queryFn: dashboardApi.getAvailableMonths,
  })

  // 2. Fetch Dashboard Summary KPIs
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', selectedMonth, selectedCurrency],
    queryFn: () =>
      dashboardApi.getSummary({
        month: selectedMonth || undefined,
        currency: selectedCurrency,
      }),
  })

  // 3. Fetch Country Spend Distribution
  const countrySpendQuery = useQuery({
    queryKey: ['dashboard-salary-by-country', selectedMonth, selectedCurrency],
    queryFn: () =>
      dashboardApi.getSalaryByCountry({
        month: selectedMonth || undefined,
        currency: selectedCurrency,
      }),
  })

  // 4. Fetch 12-Month Salary Trend
  const trendQuery = useQuery({
    queryKey: ['dashboard-salary-trend', selectedCurrency],
    queryFn: () =>
      dashboardApi.getSalaryTrend({
        months: 12,
        currency: selectedCurrency,
      }),
  })

  // 5. Fetch Recent Payroll Activities
  const recentQuery = useQuery({
    queryKey: ['dashboard-recent-changes'],
    queryFn: () => dashboardApi.getRecentChanges({ limit: 8 }),
  })

  const handleRefresh = () => {
    summaryQuery.refetch()
    countrySpendQuery.refetch()
    trendQuery.refetch()
    recentQuery.refetch()
  }

  const isAnyError =
    summaryQuery.isError || countrySpendQuery.isError || trendQuery.isError

  const errorMessage =
    summaryQuery.error?.message ||
    countrySpendQuery.error?.message ||
    trendQuery.error?.message ||
    'Failed to load dashboard metrics'

  const monthOptions = [
    { value: '', label: 'Latest Recorded Month' },
    ...availableMonths.map((m) => {
      const [year, month] = m.split('-')
      const label = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(
        'en-US',
        { month: 'short', year: 'numeric' }
      )
      return { value: `${year}-${month}`, label }
    }),
  ]

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD ($)' },
    { value: 'AUD', label: 'AUD ($)' },
    { value: 'INR', label: 'INR (₹)' },
    { value: 'SGD', label: 'SGD ($)' },
    { value: 'JPY', label: 'JPY (¥)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header & Filter Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#111827' }}>
            Executive Salary Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Organization-wide salary intelligence, payroll status, and multi-country spend insights
          </Text>
        </div>

        {/* Global Controls */}
        <Space size={12} wrap>
          {/* Month selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarOutlined style={{ color: '#6b7280' }} />
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={monthOptions}
              style={{ minWidth: 180 }}
              placeholder="Select Month"
              aria-label="Filter by Salary Month"
            />
          </div>

          {/* Currency selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarOutlined style={{ color: '#6b7280' }} />
            <Select
              value={selectedCurrency}
              onChange={setSelectedCurrency}
              options={currencyOptions}
              style={{ width: 120 }}
              aria-label="Select Currency"
            />
          </div>

          <Tooltip title="Refresh Dashboard Data">
            <Button
              icon={<ReloadOutlined spin={summaryQuery.isFetching} />}
              onClick={handleRefresh}
            />
          </Tooltip>

          <Button
            type="primary"
            icon={<CommentOutlined />}
            onClick={() => navigate('/ask')}
            style={{
              backgroundColor: '#16a34a',
              borderRadius: 8,
              fontWeight: 500,
            }}
          >
            Ask Salary AI
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={() => navigate('/employees')}
          >
            Export Data
          </Button>
        </Space>
      </div>

      {/* Error alert if backend request fails */}
      {isAnyError && (
        <Alert
          type="error"
          message="Dashboard Error"
          description={errorMessage}
          showIcon
          closable
          action={
            <Button size="small" type="primary" danger onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      )}

      {/* Row 1: 4 KPI Cards */}
      <KpiCards
        summary={summaryQuery.data}
        loading={summaryQuery.isLoading}
      />

      {/* Row 2: Charts Row (Trend Line + Country Donut) */}
      <Row gutter={[20, 20]} align="stretch">
        <Col xs={24} lg={15}>
          <SalaryTrendChart
            items={trendQuery.data?.items}
            loading={trendQuery.isLoading}
            currency={selectedCurrency}
          />
        </Col>
        <Col xs={24} lg={9}>
          <CountrySpendChart
            items={countrySpendQuery.data?.items}
            loading={countrySpendQuery.isLoading}
            currency={selectedCurrency}
          />
        </Col>
      </Row>

      {/* Row 3: Recent Payroll Activities */}
      <RecentChangesTable
        items={recentQuery.data?.items}
        loading={recentQuery.isLoading}
      />
    </div>
  )
}
