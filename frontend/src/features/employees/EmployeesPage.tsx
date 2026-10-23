import React from 'react'
import { Card, Typography, Tag } from 'antd'
import { TeamOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

export const EmployeesPage: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#111827' }}>
            Employees Directory
          </Title>
          <Text type="secondary">
            Centralized salary management and historical compensation records for 10,000 employees.
          </Text>
        </div>
        <Tag color="blue" style={{ padding: '4px 12px', fontSize: 13, borderRadius: 6 }}>
          Backend API Ready · PR 10 UI next
        </Tag>
      </div>

      <Card style={{ borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'center', padding: '48px 24px' }}>
        <TeamOutlined style={{ fontSize: 48, color: '#16a34a', marginBottom: 16 }} />
        <Title level={4} style={{ margin: '0 0 8px 0' }}>
          Employee Directory Ready for Integration
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 540, margin: '0 auto' }}>
          The backend API (`GET /api/v1/employees` and `/export`) is active and tested. PR 10 will render the interactive Ant Design table, filters (Month, Country, Paid status), search, pagination, and Excel export.
        </Paragraph>
      </Card>
    </div>
  )
}

