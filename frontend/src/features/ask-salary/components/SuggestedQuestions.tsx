import React from 'react'
import { Card, Typography, Row, Col } from 'antd'
import {
  QuestionCircleOutlined,
  CompassOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface SuggestedQuestionsProps {
  questions: string[]
  onSelectQuestion: (question: string) => void
  compact?: boolean
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  questions,
  onSelectQuestion,
  compact = false,
}) => {
  if (compact) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
          }}
        >
          <CompassOutlined style={{ color: '#16a34a' }} />
          <Text strong style={{ fontSize: 13, color: '#4b5563' }}>
            Quick Prompts
          </Text>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {questions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              data-testid="compact-prompt-button"
              onClick={() => onSelectQuestion(q)}
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12,
                color: '#374151',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#16a34a'
                e.currentTarget.style.color = '#15803d'
                e.currentTarget.style.background = '#f0fdf4'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.color = '#374151'
                e.currentTarget.style.background = '#ffffff'
              }}
            >
              <QuestionCircleOutlined style={{ color: '#16a34a', fontSize: 12 }} />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card
      data-testid="starter-suggested-questions"
      style={{
        borderRadius: 12,
        background: 'linear-gradient(135deg, #f0fdf4 0%, #f9fafb 100%)',
        border: '1px solid #bbf7d0',
        marginBottom: 24,
      }}
      styles={{ body: { padding: '24px 28px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <CompassOutlined style={{ fontSize: 22, color: '#16a34a' }} />
        <Title level={4} style={{ margin: 0, color: '#111827' }}>
          Explore ACME Compensation Intelligence
        </Title>
      </div>
      <Paragraph type="secondary" style={{ marginBottom: 20, fontSize: 13 }}>
        Ask any compensation, headcount, or payroll question across our 10,000 employees and multi-country operations. All figures are verified directly against the live database without SQL injection risks.
      </Paragraph>

      <Row gutter={[12, 12]}>
        {questions.map((q, idx) => (
          <Col xs={24} sm={12} key={idx}>
            <button
              type="button"
              data-testid="starter-prompt-button"
              onClick={() => onSelectQuestion(q)}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#16a34a'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              <Text style={{ fontSize: 13, color: '#1f2937', fontWeight: 500 }}>
                {q}
              </Text>
              <ArrowRightOutlined style={{ color: '#16a34a', fontSize: 12, flexShrink: 0 }} />
            </button>
          </Col>
        ))}
      </Row>
    </Card>
  )
}

