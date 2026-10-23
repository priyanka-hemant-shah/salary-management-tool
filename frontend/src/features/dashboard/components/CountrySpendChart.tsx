import React from 'react'
import { Card, Skeleton, Empty, Typography, Progress } from 'antd'
import { Pie } from '@ant-design/charts'
import type { CountrySpendItem } from '../types'

const { Title, Text } = Typography

interface CountrySpendChartProps {
  items?: CountrySpendItem[]
  loading: boolean
  currency: string
}

export const CountrySpendChart: React.FC<CountrySpendChartProps> = ({
  items = [],
  loading,
  currency,
}) => {
  const chartData = items.map((item) => ({
    country: item.country,
    value: item.total_spend,
  }))

  const config = {
    data: chartData,
    angleField: 'value',
    colorField: 'country',
    innerRadius: 0.64,
    height: 240,
    legend: false as const,
    tooltip: {
      title: 'country',
      items: [
        {
          channel: 'y',
          name: 'Spend',
          valueFormatter: (v: number) =>
            `${currency} ${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        },
      ],
    },
    annotations: [
      {
        type: 'text',
        style: {
          text: `${items.length}\nCountries`,
          x: '50%',
          y: '50%',
          textAlign: 'center',
          fontSize: 14,
          fontStyle: 'bold',
          fill: '#374151',
        },
      },
    ],
  }

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0, color: '#111827' }}>
          Salary Distribution by Country
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Spend allocation across global operations ({currency})
        </Text>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : items.length === 0 ? (
        <Empty description="No country salary data available" style={{ margin: 'auto' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 240 }} data-testid="country-donut-chart-container">
            <Pie {...config} />
          </div>

          {/* Top 4 breakdown list */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
              Top Regions
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {items.slice(0, 4).map((c) => (
                <div key={c.country}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                    <Text strong style={{ color: '#374151' }}>{c.country}</Text>
                    <Text type="secondary">
                      {currency} {c.total_spend.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({c.percentage}%)
                    </Text>
                  </div>
                  <Progress
                    percent={c.percentage}
                    showInfo={false}
                    strokeColor="#16a34a"
                    trailColor="#f3f4f6"
                    size="small"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
