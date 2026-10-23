import apiClient from '../../lib/apiClient'
import type {
  DashboardSummary,
  SalaryByCountryResponse,
  SalaryTrendResponse,
  RecentChangesResponse,
} from './types'

export const dashboardApi = {
  getSummary: async (params?: { month?: string; currency?: string }): Promise<DashboardSummary> => {
    const res = await apiClient.get<DashboardSummary>('/dashboard/summary', { params })
    return res.data
  },

  getSalaryByCountry: async (params?: {
    month?: string
    currency?: string
  }): Promise<SalaryByCountryResponse> => {
    const res = await apiClient.get<SalaryByCountryResponse>('/dashboard/salary-by-country', {
      params,
    })
    return res.data
  },

  getSalaryTrend: async (params?: {
    months?: number
    currency?: string
  }): Promise<SalaryTrendResponse> => {
    const res = await apiClient.get<SalaryTrendResponse>('/dashboard/salary-trend', { params })
    return res.data
  },

  getRecentChanges: async (params?: { limit?: number }): Promise<RecentChangesResponse> => {
    const res = await apiClient.get<RecentChangesResponse>('/dashboard/recent-changes', { params })
    return res.data
  },

  getAvailableMonths: async (): Promise<string[]> => {
    const res = await apiClient.get<{ months: string[] }>('/employees/meta/months')
    return res.data.months
  },
}

