export interface AIAskContext {
  month?: string
  currency?: string
  country?: string
  department?: string
}

export interface AIAskRequest {
  question: string
  context?: AIAskContext
}

export interface AIAskResponse {
  question: string
  answer_text: string
  metric_type: string
  data: Record<string, any>[]
  chart_type: 'metric' | 'bar' | 'donut' | 'line' | 'table' | 'none' | string
  period?: string
  currency: string
  source: 'llm' | 'rule_based' | 'fallback' | string
  is_demo_mode: boolean
  suggested_followups: string[]
}

export interface SuggestedQuestionsResponse {
  questions: string[]
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  response?: AIAskResponse
  loading?: boolean
  error?: string
}

