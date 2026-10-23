export interface DashboardSummary {
  headcount: number
  total_salary_spend: number
  avg_salary: number
  active_countries: number
  paid_ratio: number
  salary_month: string
  currency: string
}

export interface CountrySpendItem {
  country: string
  total_spend: number
  employee_count: number
  percentage: number
}

export interface SalaryByCountryResponse {
  items: CountrySpendItem[]
  salary_month: string
  currency: string
}

export interface SalaryTrendItem {
  month: string
  month_label: string
  total_spend: number
  employee_count: number
  avg_salary: number
}

export interface SalaryTrendResponse {
  items: SalaryTrendItem[]
  currency: string
}

export interface RecentChangeItem {
  id: number
  employee_code: string
  name: string
  department: string
  country: string
  salary: number
  currency: string
  effective_date: string
  status: string
}

export interface RecentChangesResponse {
  items: RecentChangeItem[]
}

