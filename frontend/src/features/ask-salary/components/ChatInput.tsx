import React, { useState, useRef, useEffect } from 'react'
import { Card, Input, Button, Select, Space, Tooltip, Popconfirm } from 'antd'
import type { InputRef } from 'antd'
import {
  SendOutlined,
  ClearOutlined,
  DollarOutlined,
} from '@ant-design/icons'

interface ChatInputProps {
  onSendMessage: (text: string) => void
  onClearChat: () => void
  loading: boolean
  currency: string
  onCurrencyChange: (val: string) => void
  disabled?: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onClearChat,
  loading,
  currency,
  onCurrencyChange,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('')
  const inputRef = useRef<InputRef>(null)

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [loading])

  const handleSend = () => {
    const trimmed = inputText.trim()
    if (!trimmed || loading || disabled) return
    onSendMessage(trimmed)
    setInputText('')
  }

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD ($)' },
    { value: 'AUD', label: 'AUD ($)' },
    { value: 'INR', label: 'INR (₹)' },
    { value: 'SGD', label: 'SGD ($)' },
    { value: 'JPY', label: 'JPY (¥)' },
  ]

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
        border: '1px solid #e5e7eb',
        background: '#ffffff',
      }}
      styles={{ body: { padding: '12px 18px' } }}
    >
      {/* Top action row: Currency selector + Clear Chat */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Space size={8} align="center">
          <DollarOutlined style={{ color: '#16a34a', fontSize: 13 }} />
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
            Reporting Currency:
          </span>
          <Select
            value={currency}
            onChange={onCurrencyChange}
            options={currencyOptions}
            size="small"
            style={{ width: 100 }}
            aria-label="AI Reporting Currency"
          />
        </Space>

        <Popconfirm
          title="Clear Conversation"
          description="Are you sure you want to clear this conversation history?"
          onConfirm={onClearChat}
          okText="Clear"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Clear chat history">
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              style={{ color: '#9ca3af' }}
            >
              Clear
            </Button>
          </Tooltip>
        </Popconfirm>
      </div>

      {/* Main text input & send action */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Input
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPressEnter={handleSend}
          placeholder="Ask a question about ACME's salaries (e.g., 'What is our total spend this month?')"
          disabled={disabled || loading}
          style={{
            borderRadius: 8,
            fontSize: 14,
            padding: '8px 12px',
          }}
          aria-label="Natural language query input"
        />

        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          disabled={!inputText.trim() || disabled}
          style={{
            height: 38,
            borderRadius: 8,
            backgroundColor: '#16a34a',
            borderColor: '#16a34a',
            fontWeight: 500,
          }}
          aria-label="Send Query"
        >
          Send
        </Button>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
        Press <kbd style={{ padding: '1px 4px', background: '#f3f4f6', borderRadius: 3 }}>Enter ↵</kbd> to submit query
      </div>
    </Card>
  )
}

