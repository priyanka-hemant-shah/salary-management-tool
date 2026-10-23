import React from 'react'
import { Card, Select, Button, Space, Typography, Tooltip } from 'antd'
import {
  CalendarOutlined,
  GlobalOutlined,
  ApartmentOutlined,
  DollarOutlined,
  ReloadOutlined,
} from '@ant-design/icons'

const { Text } = Typography

export const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Legal',
  'Product',
  'Design',
  'Customer Success',
]

interface AnalyticsFiltersProps {
  month?: string
  onMonthChange: (val?: string) => void
  country?: string
  onCountryChange: (val?: string) => void
  department?: string
  onDepartmentChange: (val?: string) => void
  currency: string
  onCurrencyChange: (val: string) => void
  months: string[]
  countries: string[]
  onReset: () => void
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  month,
  onMonthChange,
  country,
  onCountryChange,
  department,
  onDepartmentChange,
  currency,
  onCurrencyChange,
  months,
  countries,
  onReset,
}) => {
  const monthOptions = [
    { value: '', label: 'Latest Recorded Month' },
    ...months.map((m) => {
      const [year, mo] = m.split('-')
      const label = new Date(parseInt(year), parseInt(mo) - 1, 1).toLocaleDateString(
        'en-US',
        { month: 'short', year: 'numeric' }
      )
      return { value: `${year}-${mo}`, label }
    }),
  ]

  const countryOptions = [
    { value: '', label: 'All Countries' },
    ...countries.map((c) => ({ value: c, label: c })),
  ]

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
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

  const hasActiveFilters = Boolean(month || country || department || currency !== 'USD')

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        marginBottom: 20,
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Space size={12} wrap style={{ flex: 1 }}>
          {/* Month filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarOutlined style={{ color: '#6b7280' }} />
            <Select
              value={month || ''}
              onChange={(val) => onMonthChange(val || undefined)}
              options={monthOptions}
              style={{ width: 180 }}
              placeholder="Select Month"
              aria-label="Filter by Month"
            />
          </div>

          {/* Country filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GlobalOutlined style={{ color: '#6b7280' }} />
            <Select
              value={country || ''}
              onChange={(val) => onCountryChange(val || undefined)}
              options={countryOptions}
              style={{ width: 170 }}
              showSearch
              placeholder="Filter Country"
              aria-label="Filter by Country"
            />
          </div>

          {/* Department filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ApartmentOutlined style={{ color: '#6b7280' }} />
            <Select
              value={department || ''}
              onChange={(val) => onDepartmentChange(val || undefined)}
              options={departmentOptions}
              style={{ width: 180 }}
              showSearch
              placeholder="Filter Department"
              aria-label="Filter by Department"
            />
          </div>

          {/* Currency selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarOutlined style={{ color: '#6b7280' }} />
            <Select
              value={currency}
              onChange={onCurrencyChange}
              options={currencyOptions}
              style={{ width: 120 }}
              aria-label="Select Currency"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Tooltip title="Reset all filters to default">
              <Button icon={<ReloadOutlined />} onClick={onReset} size="middle">
                Reset
              </Button>
            </Tooltip>
          )}
        </Space>

        <Text type="secondary" style={{ fontSize: 12 }}>
          Consolidated reporting in <strong style={{ color: '#16a34a' }}>{currency}</strong>
        </Text>
      </div>
    </Card>
  )
}

