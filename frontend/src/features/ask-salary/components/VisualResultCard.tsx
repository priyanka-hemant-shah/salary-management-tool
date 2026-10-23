import React from 'react'
import { Card, Row, Col, Typography, Table } from 'antd'
import { Column, Line, Pie } from '@ant-design/charts'
import {
  DollarOutlined,
  TeamOutlined,
  RiseOutlined,
  CalculatorOutlined,
} from '@ant-design/icons'
import type { AIAskResponse } from '../types'

const { Text } = Typography

interface VisualResultCardProps {
  response: AIAskResponse
}

export const VisualResultCard: React.FC<VisualResultCardProps> = ({ response }) => {
  const { chart_type, data = [], currency = 'USD' } = response

  const currencySymbol =
    currency === 'EUR'
      ? '€'
      : currency === 'GBP'
      ? '£'
      : currency === 'CAD' || currency === 'AUD' || currency === 'USD'
      ? '$'
      : currency === 'INR'
      ? '₹'
      : currency === 'JPY'
      ? '¥'
      : `${currency} `

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || val === null || isNaN(val)) return '—'
    return `${currencySymbol}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // 1. Metric KPI cards (e.g. Total Spend, Avg Salary, Median Salary, Headcount)
  if (chart_type === 'metric' && data.length > 0) {
    const item = data[0]
    const hasTotalSpend = item.total_spend !== undefined
    const hasHeadcount = item.headcount !== undefined
    const hasAvgSalary = item.avg_salary !== undefined
    const hasMedianSalary = item.median_salary !== undefined

    return (
      <div
        data-testid="ai-metric-results"
        style={{ marginTop: 14, marginBottom: 8 }}
      >
        <Row gutter={[12, 12]}>
          {hasTotalSpend && (
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{
                  background: '#f0fdf4',
                  borderColor: '#bbf7d0',
                  borderRadius: 8,
                }}
                styles={{ body: { padding: '12px 14px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <DollarOutlined style={{ color: '#16a34a', fontSize: 13 }} />
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                    Total Spend
                  </Text>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#15803d' }}>
                  {formatCurrency(item.total_spend)}
                </div>
              </Card>
            </Col>
          )}

          {hasHeadcount && (
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{
                  background: '#eff6ff',
                  borderColor: '#bfdbfe',
                  borderRadius: 8,
                }}
                styles={{ body: { padding: '12px 14px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <TeamOutlined style={{ color: '#2563eb', fontSize: 13 }} />
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                    Headcount
                  </Text>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1d4ed8' }}>
                  {item.headcount.toLocaleString()}
                </div>
              </Card>
            </Col>
          )}

          {hasAvgSalary && (
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{
                  background: '#faf5ff',
                  borderColor: '#e9d5ff',
                  borderRadius: 8,
                }}
                styles={{ body: { padding: '12px 14px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <RiseOutlined style={{ color: '#7c3aed', fontSize: 13 }} />
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                    Average Salary
                  </Text>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#6d28d9' }}>
                  {formatCurrency(item.avg_salary)}
                </div>
              </Card>
            </Col>
          )}

          {hasMedianSalary && (
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{
                  background: '#fffbeb',
                  borderColor: '#fde68a',
                  borderRadius: 8,
                }}
                styles={{ body: { padding: '12px 14px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <CalculatorOutlined style={{ color: '#d97706', fontSize: 13 }} />
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                    Median Salary
                  </Text>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#b45309' }}>
                  {formatCurrency(item.median_salary)}
                </div>
              </Card>
            </Col>
          )}
        </Row>
      </div>
    )
  }

  // 2. Bar / Column chart (e.g. Top Countries, Top Departments, Department/Country Comparison)
  if (chart_type === 'bar' && data.length > 0) {
    const isCountry = 'country' in data[0]
    const categoryKey = isCountry ? 'country' : 'department' in data[0] ? 'department' : 'category'
    const hasSpend = 'total_spend' in data[0]

    const chartConfig = {
      data,
      xField: categoryKey,
      yField: hasSpend ? 'total_spend' : 'avg_salary',
      color: '#16a34a',
      height: 220,
      autoFit: true,
      meta: {
        total_spend: {
          alias: `Spend (${currency})`,
          formatter: (v: number) => formatCurrency(v),
        },
        avg_salary: {
          alias: `Avg Salary (${currency})`,
          formatter: (v: number) => formatCurrency(v),
        },
      },
    }

    const tableColumns = [
      {
        title: isCountry ? 'Country' : 'Department',
        dataIndex: categoryKey,
        key: 'entity',
        render: (val: string) => <Text strong>{val}</Text>,
      },
      hasSpend && {
        title: `Total Spend (${currency})`,
        dataIndex: 'total_spend',
        key: 'total_spend',
        align: 'right' as const,
        render: (val: number) => formatCurrency(val),
      },
      'avg_salary' in data[0] && {
        title: `Avg Salary (${currency})`,
        dataIndex: 'avg_salary',
        key: 'avg_salary',
        align: 'right' as const,
        render: (val: number) => formatCurrency(val),
      },
      'headcount' in data[0] && {
        title: 'Employees',
        dataIndex: 'headcount',
        key: 'headcount',
        align: 'right' as const,
        render: (val: number) => val?.toLocaleString() ?? '—',
      },
    ].filter(Boolean) as any[]

    return (
      <div
        data-testid="ai-bar-chart-container"
        style={{
          marginTop: 14,
          padding: 14,
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Column {...chartConfig} />
        </div>
        <Table
          dataSource={data}
          columns={tableColumns}
          pagination={false}
          size="small"
          rowKey={(r: any) => r[categoryKey] ?? String(Math.random())}
          style={{ marginTop: 10 }}
        />
      </div>
    )
  }

  // 3. Line chart for salary trend
  if (chart_type === 'line' && data.length > 0) {
    const lineConfig = {
      data,
      xField: 'month_label',
      yField: 'total_spend',
      color: '#2563eb',
      height: 220,
      autoFit: true,
      point: {
        size: 4,
        shape: 'diamond',
      },
      meta: {
        total_spend: {
          alias: `Spend (${currency})`,
          formatter: (v: number) => formatCurrency(v),
        },
      },
    }

    return (
      <div
        data-testid="ai-line-chart-container"
        style={{
          marginTop: 14,
          padding: 14,
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
        }}
      >
        <Line {...lineConfig} />
      </div>
    )
  }

  // 4. Donut chart
  if (chart_type === 'donut' && data.length > 0) {
    const angleKey = 'total_spend' in data[0] ? 'total_spend' : 'value'
    const colorKey = 'country' in data[0] ? 'country' : 'department' in data[0] ? 'department' : 'type'

    const pieConfig = {
      data,
      angleField: angleKey,
      colorField: colorKey,
      radius: 0.8,
      innerRadius: 0.6,
      height: 220,
      autoFit: true,
      legend: {
        position: 'right' as const,
      },
    }

    return (
      <div
        data-testid="ai-donut-chart-container"
        style={{
          marginTop: 14,
          padding: 14,
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
        }}
      >
        <Pie {...pieConfig} />
      </div>
    )
  }

  // Fallback: None or empty
  return null
}

