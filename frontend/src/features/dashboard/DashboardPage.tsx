import React from 'react'
import { Card, Typography, Space, Tag, Button } from 'antd'
import { DashboardOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#111827' }}>
            Executive Dashboard
          </Title>
          <Text type="secondary">
            Consolidated overview of organizational headcount, payroll expenditure, and salary distribution.
          </Text>
        </div>
        <Tag color="success" style={{ padding: '4px 12px', fontSize: 13, borderRadius: 6 }}>
          PR 8 Shell Ready · Full PR 9 Dashboard next
        </Tag>
      </div>

      <Card
        style={{
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          textAlign: 'center',
          padding: '48px 24px',
        }}
      >
        <DashboardOutlined style={{ fontSize: 48, color: '#16a34a', marginBottom: 16 }} />
        <Title level={4} style={{ margin: '0 0 8px 0' }}>
          Dashboard UI Scaffolding Active
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 540, margin: '0 auto 24px auto' }}>
          The enterprise application shell, sidebar, and header are fully mounted. PR 9 will connect the 4 KPI cards, country donut chart, and 12-month salary trend lines from the backend.
        </Paragraph>
        <Space size={12}>
          <Button type="primary" onClick={() => navigate('/employees')} icon={<ArrowRightOutlined />}>
            View Employees Directory
          </Button>
          <Button onClick={() => navigate('/ask')}>Try Ask Salary AI</Button>
        </Space>
      </Card>
    </div>
  )
}

