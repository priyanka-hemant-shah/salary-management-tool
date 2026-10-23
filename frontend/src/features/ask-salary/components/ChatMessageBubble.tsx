import React from 'react'
import { Typography, Tag, Avatar, Alert, Button, Space, Skeleton } from 'antd'
import {
  UserOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { ChatMessage } from '../types'
import { VisualResultCard } from './VisualResultCard'

const { Text, Paragraph } = Typography

interface ChatMessageBubbleProps {
  message: ChatMessage
  onSelectFollowup?: (question: string) => void
  onRetry?: (question: string) => void
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onSelectFollowup,
  onRetry,
}) => {
  const isUser = message.sender === 'user'

  if (isUser) {
    return (
      <div
        data-testid="user-message-bubble"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 20,
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div
          style={{
            maxWidth: '75%',
            background: '#15803d',
            color: '#ffffff',
            borderRadius: '16px 16px 4px 16px',
            padding: '12px 18px',
            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.15)',
          }}
        >
          <div style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
            {message.text}
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#dcfce7',
              textAlign: 'right',
              marginTop: 4,
            }}
          >
            {message.timestamp}
          </div>
        </div>

        <Avatar
          style={{
            backgroundColor: '#16a34a',
            flexShrink: 0,
            marginTop: 2,
          }}
          icon={<UserOutlined />}
        />
      </div>
    )
  }

  // Assistant bubble
  return (
    <div
      data-testid="assistant-message-bubble"
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: 24,
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <Avatar
        style={{
          backgroundColor: '#4338ca',
          flexShrink: 0,
          marginTop: 2,
          boxShadow: '0 2px 6px rgba(67, 56, 202, 0.25)',
        }}
        icon={<RobotOutlined />}
      />

      <div
        style={{
          maxWidth: '85%',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px 16px 16px 4px',
          padding: '16px 20px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Header with Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <Space size={6} align="center">
            <Text strong style={{ fontSize: 13, color: '#111827' }}>
              ACME Salary Intelligence AI
            </Text>
            {message.response?.is_demo_mode && (
              <Tag color="purple" style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                Demo Mode
              </Tag>
            )}
            <Tag
              icon={<SafetyCertificateOutlined />}
              color="success"
              style={{ fontSize: 11, borderRadius: 4, margin: 0 }}
            >
              Verified DB Figure
            </Tag>
          </Space>

          <Text type="secondary" style={{ fontSize: 11 }}>
            {message.timestamp}
          </Text>
        </div>

        {/* Loading state */}
        {message.loading && (
          <div data-testid="assistant-loading-state" style={{ padding: '8px 0' }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        )}

        {/* Error state */}
        {message.error && (
          <Alert
            type="error"
            showIcon
            message="Query Execution Failed"
            description={message.error}
            action={
              onRetry && (
                <Button
                  size="small"
                  danger
                  type="primary"
                  onClick={() => onRetry(message.text)}
                >
                  Retry
                </Button>
              )
            }
            style={{ marginTop: 8, borderRadius: 8 }}
          />
        )}

        {/* Successful narrative answer text */}
        {!message.loading && !message.error && (
          <div>
            <Paragraph
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: '#1f2937',
                marginBottom: 8,
              }}
            >
              {message.text}
            </Paragraph>

            {/* Visual Result Card (Charts, Tables, KPIs) */}
            {message.response && <VisualResultCard response={message.response} />}

            {/* Suggested Follow-ups */}
            {message.response?.suggested_followups &&
              message.response.suggested_followups.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #f3f4f6' }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ThunderboltOutlined style={{ color: '#eab308' }} />
                    Suggested follow-up questions:
                  </div>
                  <Space wrap size={[6, 8]}>
                    {message.response.suggested_followups.map((q, idx) => (
                      <Tag.CheckableTag
                        key={idx}
                        checked={false}
                        onChange={() => onSelectFollowup && onSelectFollowup(q)}
                        style={{
                          background: '#f9fafb',
                          border: '1px solid #d1d5db',
                          borderRadius: 16,
                          padding: '4px 12px',
                          fontSize: 12,
                          color: '#374151',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <CheckCircleOutlined style={{ marginRight: 4, color: '#16a34a' }} />
                        {q}
                      </Tag.CheckableTag>
                    ))}
                  </Space>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  )
}

