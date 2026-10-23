import React from 'react'
import { Card, Table, Typography, Skeleton, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Column } from '@ant-design/charts'
import type { DepartmentAnalyticsItem } from '../types'

const { Title, Text } = Typography

interface ByDepartmentTabProps {
  items: DepartmentAnalyticsItem[]
  loading: boolean
  currency: string
}

export const ByDepartmentTab: React.FC<ByDepartmentTabProps> = ({
  items,
  loading,
  currency,
}) => {
  const chartData = items.map((item) => ({
    department: item.department,
    spend: item.total_spend,
    avg: item.avg_salary,
  }))

  const chartConfig = {
    data: chartData,
    xField: 'department',
    yField: 'spend',
    height: 320,
    style: {
      fill: '#16a34a',
      radiusTopLeft: 4,
      radiusTopRight: 4,
    },
    tooltip: {
      items: [
        {
          channel: 'y',
          name: 'Total Spend',
          valueFormatter: (v: number) =>
            `${currency} ${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        },
      ],
    },
  }

  const columns: ColumnsType<DepartmentAnalyticsItem> = [
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (d: string) => <strong style={{ color: '#111827' }}>{d}</strong>,
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
      {/* Department Spend Column Chart */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, color: '#111827' }}>
            Department Payroll Expenditure
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Total compensation distribution by organizational function ({currency})
          </Text>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : items.length === 0 ? (
          <Empty description="No department data available" />
        ) : (
          <div style={{ height: 320 }} data-testid="department-chart-container">
            <Column {...chartConfig} />
          </div>
        )}
      </Card>

      {/* Department Breakdown Table */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
        styles={{ body: { padding: 0 } }}
        title={
          <div style={{ padding: '4px 0' }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>Department Salary Breakdown</span>
          </div>
        }
      >
        <Table<DepartmentAnalyticsItem>
          columns={columns}
          dataSource={items}
          rowKey="department"
          loading={loading}
          pagination={false}
          size="middle"
          style={{ overflowX: 'auto' }}
        />
      </Card>
    </div>
  )
}

