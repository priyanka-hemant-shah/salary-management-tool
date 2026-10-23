import React, { useState } from 'react'
import { Typography, Tabs, Alert, Button } from 'antd'
import {
  GlobalOutlined,
  ApartmentOutlined,
  LineChartOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'

import { analyticsApi } from './api'
import { AnalyticsFilters } from './components/AnalyticsFilters'
import { OverviewKpis } from './components/OverviewKpis'
import { ByCountryTab } from './components/ByCountryTab'
import { ByDepartmentTab } from './components/ByDepartmentTab'
import { TrendsTab } from './components/TrendsTab'

const { Title, Text } = Typography

export const AnalyticsPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined)
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined)
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(undefined)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD')
  const [activeTab, setActiveTab] = useState<string>('country')

  // 1. Fetch metadata
  const { data: countries = [] } = useQuery({
    queryKey: ['meta-countries'],
    queryFn: analyticsApi.getCountries,
  })

  const { data: months = [] } = useQuery({
    queryKey: ['meta-months'],
    queryFn: analyticsApi.getMonths,
  })

  // 2. Fetch Overview KPIs
  const overviewQuery = useQuery({
    queryKey: ['analytics-overview', selectedMonth, selectedCountry, selectedDepartment, selectedCurrency],
    queryFn: () =>
      analyticsApi.getOverview({
        month: selectedMonth,
        country: selectedCountry,
        department: selectedDepartment,
        currency: selectedCurrency,
      }),
  })

  // 3. Fetch By Country Data
  const countryQuery = useQuery({
    queryKey: ['analytics-by-country', selectedMonth, selectedDepartment, selectedCurrency],
    queryFn: () =>
      analyticsApi.getByCountry({
        month: selectedMonth,
        department: selectedDepartment,
        currency: selectedCurrency,
      }),
  })

  // 4. Fetch By Department Data
  const departmentQuery = useQuery({
    queryKey: ['analytics-by-department', selectedMonth, selectedCountry, selectedCurrency],
    queryFn: () =>
      analyticsApi.getByDepartment({
        month: selectedMonth,
        country: selectedCountry,
        currency: selectedCurrency,
      }),
  })

  const handleResetFilters = () => {
    setSelectedMonth(undefined)
    setSelectedCountry(undefined)
    setSelectedDepartment(undefined)
    setSelectedCurrency('USD')
  }

  const isAnyError =
    overviewQuery.isError || countryQuery.isError || departmentQuery.isError

  const errorMessage =
    overviewQuery.error?.message ||
    countryQuery.error?.message ||
    departmentQuery.error?.message ||
    'Failed to load salary analytics data'

  const tabItems = [
    {
      key: 'country',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
          <GlobalOutlined />
          By Country
        </span>
      ),
      children: (
        <ByCountryTab
          items={countryQuery.data?.items || []}
          loading={countryQuery.isLoading}
          currency={selectedCurrency}
        />
      ),
    },
    {
      key: 'department',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
          <ApartmentOutlined />
          By Department
        </span>
      ),
      children: (
        <ByDepartmentTab
          items={departmentQuery.data?.items || []}
          loading={departmentQuery.isLoading}
          currency={selectedCurrency}
        />
      ),
    },
    {
      key: 'trends',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
          <LineChartOutlined />
          Historical Trends
        </span>
      ),
      children: <TrendsTab currency={selectedCurrency} />,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page Header */}
      <div>
        <Title level={3} style={{ margin: 0, color: '#111827' }}>
          Salary Analytics & Intelligence
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Statistical compensation benchmarks, geographic distributions, and organizational salary trends
        </Text>
      </div>

      {/* Global Error Banner */}
      {isAnyError && (
        <Alert
          type="error"
          message="Analytics Error"
          description={errorMessage}
          showIcon
          action={
            <Button
              size="small"
              type="primary"
              danger
              onClick={() => {
                overviewQuery.refetch()
                countryQuery.refetch()
                departmentQuery.refetch()
              }}
            >
              Retry
            </Button>
          }
        />
      )}

      {/* Filter Row */}
      <AnalyticsFilters
        month={selectedMonth}
        onMonthChange={setSelectedMonth}
        country={selectedCountry}
        onCountryChange={setSelectedCountry}
        department={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        currency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
        months={months}
        countries={countries}
        onReset={handleResetFilters}
      />

      {/* Top Overview KPI Cards */}
      <OverviewKpis
        overview={overviewQuery.data}
        loading={overviewQuery.isLoading}
      />

      {/* Analysis Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        style={{ marginTop: 8 }}
      />
    </div>
  )
}
