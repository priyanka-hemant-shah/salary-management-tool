import React from 'react'
import { Card, Skeleton, Empty, Typography } from 'antd'
import { Line } from '@ant-design/charts'
import type { SalaryTrendItem } from '../types'

const { Title, Text } = Typography

interface SalaryTrendChartProps {
  items?: SalaryTrendItem[]
  loading: boolean
  currency: string
}

export const SalaryTrendChart: React.FC<SalaryTrendChartProps> = ({
  items = [],
  loading,
  currency,
}) => {
  const chartData = items.map((i) => ({
    month: i.month_label,
    total_spend: i.total_spend,
    avg_salary: i.avg_salary,
    headcount: i.employee_count,
  }))

  const config = {
    data: chartData,
    xField: 'month',
    yField: 'total_spend',
    height: 320,
    style: {
      stroke: '#16a34a',
      lineWidth: 3,
    },
    point: {
      shapeField: 'circle',
      sizeField: 4,
      style: {
        fill: '#16a34a',
        stroke: '#ffffff',
        lineWidth: 2,
      },
    },
    tooltip: {
      items: [
        {
          channel: 'y',
          name: 'Monthly Payroll',
          valueFormatter: (v: number) =>
            `${currency} ${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        },
      ],
    },
    axis: {
      y: {
        labelFormatter: (v: number) => {
          if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
          if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
          return `${v}`
        },
      },
    },
  }

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        height: '100%',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <Title level={5} style={{ margin: 0, color: '#111827' }}>
          12-Month Payroll Expenditure Trend
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Historical progression of monthly consolidated salary disbursements ({currency})
        </Text>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : items.length === 0 ? (
        <Empty description="No trend history available" style={{ margin: '48px 0' }} />
      ) : (
        <div style={{ height: 320 }} data-testid="salary-trend-chart-container">
          <Line {...config} />
        </div>
      )}
    </Card>
  )
}
