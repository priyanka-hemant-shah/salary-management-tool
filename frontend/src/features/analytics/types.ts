export interface AnalyticsOverview {
  total_spend: number
  avg_salary: number
  median_salary: number
  headcount: number
  highest_salary: number
  lowest_salary: number
  currency: string
  salary_month: string
}

export interface CountryAnalyticsItem {
  country: string
  headcount: number
  total_spend: number
  avg_salary: number
  median_salary: number
  percentage_of_total: number
}

export interface CountryAnalyticsResponse {
  items: CountryAnalyticsItem[]
  salary_month: string
  currency: string
}

export interface DepartmentAnalyticsItem {
  department: string
  headcount: number
  total_spend: number
  avg_salary: number
  median_salary: number
  percentage_of_total: number
}

export interface DepartmentAnalyticsResponse {
  items: DepartmentAnalyticsItem[]
  salary_month: string
  currency: string
}

export interface AnalyticsTrendItem {
  month: string
  month_label: string
  category: string
  total_spend: number
  avg_salary: number
  headcount: number
}

export interface AnalyticsTrendsResponse {
  items: AnalyticsTrendItem[]
  group_by: string
  currency: string
}

export interface AnalyticsFilterParams {
  month?: string
  country?: string
  department?: string
  currency?: string
  group_by?: 'department' | 'country' | 'total'
  months?: number
}

