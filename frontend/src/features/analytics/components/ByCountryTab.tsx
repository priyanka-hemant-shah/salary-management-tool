import React from 'react'
import { Card, Table, Typography, Skeleton, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Column } from '@ant-design/charts'
import type { CountryAnalyticsItem } from '../types'

const { Title, Text } = Typography

interface ByCountryTabProps {
  items: CountryAnalyticsItem[]
  loading: boolean
  currency: string
}

export const ByCountryTab: React.FC<ByCountryTabProps> = ({
  items,
  loading,
  currency,
}) => {
  const chartData = items.flatMap((item) => [
    { country: item.country, type: 'Average', value: item.avg_salary },
    { country: item.country, type: 'Median', value: item.median_salary },
  ])

  const chartConfig = {
    data: chartData,
    xField: 'country',
    yField: 'value',
    colorField: 'type',
    group: true,
    height: 320,
    style: {
      inset: 2,
    },
    tooltip: {
      items: [
        {
          channel: 'y',
          valueFormatter: (v: number) =>
            `${currency} ${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        },
      ],
    },
  }

  const columns: ColumnsType<CountryAnalyticsItem> = [
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      render: (c: string) => <strong style={{ color: '#111827' }}>{c}</strong>,
    },
    {
      title: 'Headcount',
      dataIndex: 'headcount',
      key: 'headcount',
      align: 'right',
      render: (cnt: number) => cnt.toLocaleString('en-US'),
    },
    {
      title: `Total Spend (${currency})`,
      dataIndex: 'total_spend',
      key: 'total_spend',
      align: 'right',
      render: (val: number) => (
        <span style={{ fontWeight: 600 }}>
          {val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: `Average (${currency})`,
      dataIndex: 'avg_salary',
      key: 'avg_salary',
      align: 'right',
      render: (val: number) =>
        val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: `Median (${currency})`,
      dataIndex: 'median_salary',
      key: 'median_salary',
      align: 'right',
      render: (val: number) =>
        val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: 'Share of Spend',
      dataIndex: 'percentage_of_total',
      key: 'percentage_of_total',
      align: 'right',
      render: (pct: number) => `${pct.toFixed(2)}%`,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Chart Card */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, color: '#111827' }}>
            Compensation Comparison by Country
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Average vs. Median base salary across operating regions ({currency})
          </Text>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : items.length === 0 ? (
          <Empty description="No regional data available" />
        ) : (
          <div style={{ height: 320 }} data-testid="country-chart-container">
            <Column {...chartConfig} />
          </div>
        )}
      </Card>

      {/* Breakdown Data Table */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
        styles={{ body: { padding: 0 } }}
        title={
          <div style={{ padding: '4px 0' }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>Regional Salary Breakdown</span>
          </div>
        }
      >
        <Table<CountryAnalyticsItem>
          columns={columns}
          dataSource={items}
          rowKey="country"
          loading={loading}
          pagination={false}
          size="middle"
          style={{ overflowX: 'auto' }}
        />
      </Card>
    </div>
  )
}
