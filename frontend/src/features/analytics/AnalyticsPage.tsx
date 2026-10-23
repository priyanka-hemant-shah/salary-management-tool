import React from 'react'
import { Card, Typography, Tag } from 'antd'
import { BarChartOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

export const AnalyticsPage: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#111827' }}>
            Salary Analytics
          </Title>
          <Text type="secondary">
            Deep-dive compensation insights: overview KPIs, country breakdowns, department distributions, and historical trends.
          </Text>
        </div>
        <Tag color="cyan" style={{ padding: '4px 12px', fontSize: 13, borderRadius: 6 }}>
          Backend API Ready · PR 11 UI next
        </Tag>
      </div>

      <Card style={{ borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'center', padding: '48px 24px' }}>
        <BarChartOutlined style={{ fontSize: 48, color: '#16a34a', marginBottom: 16 }} />
        <Title level={4} style={{ margin: '0 0 8px 0' }}>
          Salary Analytics Ready for Integration
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 540, margin: '0 auto' }}>
          The backend API (`GET /api/v1/analytics/overview`, `/by-country`, `/by-department`, `/trends`) is active. PR 11 will render the interactive tabs, column charts, horizontal bars, and multi-line time-series trends.
        </Paragraph>
      </Card>
    </div>
  )
}

