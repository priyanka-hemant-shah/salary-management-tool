import apiClient from '../../lib/apiClient'
import type {
  AIAskContext,
  AIAskRequest,
  AIAskResponse,
  SuggestedQuestionsResponse,
} from './types'

export const askSalaryApi = {
  /**
   * Submit natural language salary question to the AI orchestrator.
   */
  askQuestion: async (
    question: string,
    context?: AIAskContext,
  ): Promise<AIAskResponse> => {
    const payload: AIAskRequest = {
      question,
      context,
    }
    const res = await apiClient.post<AIAskResponse>('/ai/ask', payload)
    return res.data
  },

  /**
   * Fetch sample suggested salary questions for starter prompts.
   */
  getSuggestedQuestions: async (): Promise<string[]> => {
    const res = await apiClient.get<SuggestedQuestionsResponse>('/ai/suggested-questions')
    return res.data.questions
  },
}

