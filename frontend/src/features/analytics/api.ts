import apiClient from '../../lib/apiClient'
import type {
  AnalyticsOverview,
  CountryAnalyticsResponse,
  DepartmentAnalyticsResponse,
  AnalyticsTrendsResponse,
  AnalyticsFilterParams,
} from './types'

export const analyticsApi = {
  getOverview: async (params?: AnalyticsFilterParams): Promise<AnalyticsOverview> => {
    const res = await apiClient.get<AnalyticsOverview>('/analytics/overview', { params })
    return res.data
  },

  getByCountry: async (params?: {
    month?: string
    department?: string
    currency?: string
  }): Promise<CountryAnalyticsResponse> => {
    const res = await apiClient.get<CountryAnalyticsResponse>('/analytics/by-country', { params })
    return res.data
  },

  getByDepartment: async (params?: {
    month?: string
    country?: string
    currency?: string
  }): Promise<DepartmentAnalyticsResponse> => {
    const res = await apiClient.get<DepartmentAnalyticsResponse>('/analytics/by-department', {
      params,
    })
    return res.data
  },

  getTrends: async (params?: {
    group_by?: string
    months?: number
    currency?: string
  }): Promise<AnalyticsTrendsResponse> => {
    const res = await apiClient.get<AnalyticsTrendsResponse>('/analytics/trends', { params })
    return res.data
  },

  getCountries: async (): Promise<string[]> => {
    const res = await apiClient.get<{ countries: string[] }>('/employees/meta/countries')
    return res.data.countries
  },

  getMonths: async (): Promise<string[]> => {
    const res = await apiClient.get<{ months: string[] }>('/employees/meta/months')
    return res.data.months
  },
}

