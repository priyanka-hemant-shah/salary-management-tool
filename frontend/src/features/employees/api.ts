import apiClient from '../../lib/apiClient'
import type {
  EmployeeListResponse,
  EmployeeDetail,
  EmployeeFilterParams,
} from './types'

export const employeesApi = {
  listEmployees: async (params?: EmployeeFilterParams): Promise<EmployeeListResponse> => {
    const res = await apiClient.get<EmployeeListResponse>('/employees', { params })
    return res.data
  },

  getEmployeeDetail: async (id: number): Promise<EmployeeDetail> => {
    const res = await apiClient.get<EmployeeDetail>(`/employees/${id}`)
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

  exportToExcel: async (params?: Omit<EmployeeFilterParams, 'page' | 'page_size'>): Promise<void> => {
    const res = await apiClient.get('/employees/export', {
      params,
      responseType: 'blob',
    })

    // Create a blob URL and trigger file download
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const monthTag = params?.month ? `_${params.month}` : ''
    link.setAttribute('download', `acme_employees${monthTag}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}

