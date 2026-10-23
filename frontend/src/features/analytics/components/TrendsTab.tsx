import React, { useState } from 'react'
import { Card, Table, Typography, Skeleton, Empty, Segmented, Space, Radio } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Line } from '@ant-design/charts'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'
import type { AnalyticsTrendItem } from '../types'

const { Title, Text } = Typography

interface TrendsTabProps {
  currency: string
}

export const TrendsTab: React.FC<TrendsTabProps> = ({ currency }) => {
  const [groupBy, setGroupBy] = useState<'department' | 'country' | 'total'>('department')
  const [monthsCount, setMonthsCount] = useState<number>(12)

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-trends', groupBy, monthsCount, currency],
    queryFn: () =>
      analyticsApi.getTrends({
        group_by: groupBy,
        months: monthsCount,
        currency,
      }),
  })

  const items = data?.items || []

  const chartData = items.map((i) => ({
    month: i.month_label,
    category: i.category || 'Company Total',
    total_spend: i.total_spend,
    avg_salary: i.avg_salary,
    headcount: i.headcount,
  }))

  const chartConfig = {
    data: chartData,
    xField: 'month',
    yField: 'total_spend',
    colorField: 'category',
    height: 340,
    point: {
      shapeField: 'circle',
      sizeField: 3,
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
    legend: {
      color: {
        position: 'bottom',
        layout: { justifyContent: 'center' },
      },
    },
  }

  const columns: ColumnsType<AnalyticsTrendItem> = [
    {
      title: 'Month',
      dataIndex: 'month_label',
      key: 'month_label',
      render: (m: string) => <strong style={{ color: '#111827' }}>{m}</strong>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (c: string) => c || 'Company Total',
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
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Control row */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Space size={16} align="center">
            <Text strong style={{ color: '#374151' }}>Trend Breakdown:</Text>
            <Segmented
              value={groupBy}
              onChange={(val) => setGroupBy(val as 'department' | 'country' | 'total')}
              options={[
                { label: 'By Department', value: 'department' },
                { label: 'By Country', value: 'country' },
                { label: 'Total Company', value: 'total' },
              ]}
            />
          </Space>

          <Space size={12} align="center">
            <Text type="secondary" style={{ fontSize: 13 }}>Time Horizon:</Text>
            <Radio.Group
              value={monthsCount}
              onChange={(e) => setMonthsCount(e.target.value)}
              size="small"
              buttonStyle="solid"
            >
              <Radio.Button value={6}>6 Months</Radio.Button>
              <Radio.Button value={12}>12 Months</Radio.Button>
            </Radio.Group>
          </Space>
        </div>
      </Card>

      {/* Multi-Line Trend Chart */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, color: '#111827' }}>
            Historical Compensation Trends
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Progression of monthly expenditure grouped by {groupBy} ({currency})
          </Text>
        </div>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : items.length === 0 ? (
          <Empty description="No trend data available" />
        ) : (
          <div style={{ height: 340 }} data-testid="trends-chart-container">
            <Line {...chartConfig} />
          </div>
        )}
      </Card>

      {/* Trend Data Table */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
        styles={{ body: { padding: 0 } }}
        title={
          <div style={{ padding: '4px 0' }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>Monthly Trend Observations</span>
          </div>
        }
      >
        <Table<AnalyticsTrendItem>
          columns={columns}
          dataSource={items}
          rowKey={(r, idx) => `${r.month}_${r.category}_${idx}`}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="middle"
          style={{ overflowX: 'auto' }}
        />
      </Card>
    </div>
  )
}

