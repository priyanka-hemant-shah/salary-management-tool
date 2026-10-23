import React from 'react'
import { Card, Typography, Tag } from 'antd'
import { CommentOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

export const AskSalaryPage: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#111827' }}>
            Ask Salary Data (AI)
          </Title>
          <Text type="secondary">
            Natural language salary queries with instant database-backed charts and verified figures.
          </Text>
        </div>
        <Tag color="purple" style={{ padding: '4px 12px', fontSize: 13, borderRadius: 6 }}>
          PR 7 AI Foundation Ready · PR 12 UI next
        </Tag>
      </div>

      <Card style={{ borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'center', padding: '48px 24px' }}>
        <CommentOutlined style={{ fontSize: 48, color: '#16a34a', marginBottom: 16 }} />
        <Title level={4} style={{ margin: '0 0 8px 0' }}>
          AI Query Interface Ready for Integration
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 540, margin: '0 auto' }}>
          The backend API (`POST /api/v1/ai/ask`) is tested and active in Demo Mode. PR 12 will assemble the interactive chat window, quick question pills, and dynamically generated metric and chart cards.
        </Paragraph>
      </Card>
    </div>
  )
}

