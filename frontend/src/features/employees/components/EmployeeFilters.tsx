import React from 'react'
import { Card, Input, Select, Button, Space, Typography, Tooltip } from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownloadOutlined,
  GlobalOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const { Text } = Typography

interface EmployeeFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  country?: string
  onCountryChange: (value?: string) => void
  month?: string
  onMonthChange: (value?: string) => void
  isPaid?: boolean
  onPaidChange: (value?: boolean) => void
  countries: string[]
  months: string[]
  onReset: () => void
  onExport: () => void
  exporting: boolean
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  search,
  onSearchChange,
  country,
  onCountryChange,
  month,
  onMonthChange,
  isPaid,
  onPaidChange,
  countries,
  months,
  onReset,
  onExport,
  exporting,
}) => {
  const monthOptions = [
    { value: '', label: 'Latest Month (Default)' },
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

  const paidOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'true', label: 'Paid' },
    { value: 'false', label: 'Pending (Unpaid)' },
  ]

  const hasActiveFilters = Boolean(search || country || month || isPaid !== undefined)

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        marginBottom: 16,
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
        {/* Left Filter Controls */}
        <Space size={12} wrap style={{ flex: 1 }}>
          {/* Search Bar */}
          <Input
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            placeholder="Search by name, email, code..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
            style={{ width: 260, borderRadius: 8 }}
            aria-label="Search employees"
          />

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

          {/* Month filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarOutlined style={{ color: '#6b7280' }} />
            <Select
              value={month || ''}
              onChange={(val) => onMonthChange(val || undefined)}
              options={monthOptions}
              style={{ width: 180 }}
              placeholder="Filter Month"
              aria-label="Filter by Month"
            />
          </div>

          {/* Paid status filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleOutlined style={{ color: '#6b7280' }} />
            <Select
              value={isPaid === undefined ? 'all' : String(isPaid)}
              onChange={(val) => {
                if (val === 'all') onPaidChange(undefined)
                else onPaidChange(val === 'true')
              }}
              options={paidOptions}
              style={{ width: 150 }}
              aria-label="Filter by Paid Status"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Tooltip title="Reset all search and filter criteria">
              <Button icon={<ReloadOutlined />} onClick={onReset} size="middle">
                Reset
              </Button>
            </Tooltip>
          )}
        </Space>

        {/* Right Action: Export */}
        <Space size={10}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={onExport}
            loading={exporting}
            style={{
              backgroundColor: '#16a34a',
              borderRadius: 8,
              fontWeight: 500,
            }}
          >
            Export to Excel
          </Button>
        </Space>
      </div>
    </Card>
  )
}

