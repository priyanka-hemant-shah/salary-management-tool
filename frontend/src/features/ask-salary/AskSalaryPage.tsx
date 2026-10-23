import React, { useState, useEffect, useRef } from 'react'
import { Typography, Tag, Space, Alert } from 'antd'
import {
  RobotOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'

import { askSalaryApi } from './api'
import type { ChatMessage } from './types'
import { ChatMessageBubble } from './components/ChatMessageBubble'
import { SuggestedQuestions } from './components/SuggestedQuestions'
import { ChatInput } from './components/ChatInput'

const { Title, Text } = Typography

export const AskSalaryPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currency, setCurrency] = useState<string>('USD')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Fetch starter questions
  const {
    data: suggestedQuestions = [
      'What is our total salary spend this month?',
      'Which country has the highest average salary?',
      'What is the median salary in the United States?',
      'Compare Engineering vs Marketing salary costs',
      'How has our salary spend trended over the last 6 months?',
      'What is the breakdown of salaries by department?',
    ],
    isError: isSuggestedError,
  } = useQuery({
    queryKey: ['ai-suggested-questions'],
    queryFn: askSalaryApi.getSuggestedQuestions,
  })

  // Auto-scroll to latest message
  useEffect(() => {
    if (typeof chatBottomRef.current?.scrollIntoView === 'function') {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isSubmitting])

  const formatTimestamp = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSendMessage = async (questionText: string) => {
    if (!questionText.trim() || isSubmitting) return

    const userMessageId = `user-${Date.now()}`
    const assistantMessageId = `assistant-${Date.now()}`
    const currentTime = formatTimestamp()

    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: questionText,
      timestamp: currentTime,
    }

    const placeholderAssistantMsg: ChatMessage = {
      id: assistantMessageId,
      sender: 'assistant',
      text: '',
      timestamp: currentTime,
      loading: true,
    }

    setMessages((prev) => [...prev, userMsg, placeholderAssistantMsg])
    setIsSubmitting(true)

    try {
      const response = await askSalaryApi.askQuestion(questionText, { currency })

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                loading: false,
                text: response.answer_text,
                response,
              }
            : msg
        )
      )
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                loading: false,
                error: err?.message || 'Failed to analyze question. Please try again.',
                text: 'An error occurred while answering your question.',
              }
            : msg
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearChat = () => {
    setMessages([])
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        minHeight: 650,
      }}
    >
      {/* Header section */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#111827' }}>
            Ask Salary Data (AI)
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Natural language salary insights powered by rule-based execution & database verification.
          </Text>
        </div>

        <Space size={8} wrap>
          <Tag
            icon={<SafetyCertificateOutlined />}
            color="success"
            style={{ padding: '3px 10px', fontSize: 12, borderRadius: 6 }}
          >
            Allowlist Matcher Active
          </Tag>
          <Tag
            icon={<RobotOutlined />}
            color="purple"
            style={{ padding: '3px 10px', fontSize: 12, borderRadius: 6 }}
          >
            Deterministic Demo Mode
          </Tag>
        </Space>
      </div>

      {isSuggestedError && (
        <Alert
          type="warning"
          showIcon
          message="Default sample questions loaded"
          style={{ marginBottom: 12, borderRadius: 8 }}
        />
      )}

      {/* Main chat window */}
      <div
        data-testid="chat-messages-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          background: '#f9fafb',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          marginBottom: 16,
        }}
      >
        {/* Welcome state when chat is empty */}
        {messages.length === 0 ? (
          <div>
            <SuggestedQuestions
              questions={suggestedQuestions}
              onSelectQuestion={handleSendMessage}
            />

            <div
              style={{
                textAlign: 'center',
                padding: '16px 0',
                color: '#6b7280',
                fontSize: 13,
              }}
            >
              <ThunderboltOutlined style={{ marginRight: 6, color: '#16a34a' }} />
              Type your question below or click any of the prompts above to see live database analytics.
            </div>
          </div>
        ) : (
          <div>
            {/* Quick prompt strip at the top of ongoing conversation */}
            <SuggestedQuestions
              questions={suggestedQuestions.slice(0, 4)}
              onSelectQuestion={handleSendMessage}
              compact
            />

            {/* Conversation message list */}
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                onSelectFollowup={handleSendMessage}
                onRetry={handleSendMessage}
              />
            ))}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* Bottom Fixed Chat Input */}
      <div>
        <ChatInput
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          loading={isSubmitting}
          currency={currency}
          onCurrencyChange={setCurrency}
        />
      </div>
    </div>
  )
}
export default AskSalaryPage
