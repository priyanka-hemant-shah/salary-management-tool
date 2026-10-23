export interface SalaryRecordOut {
  id: number
  salary_month: string
  base_salary: number
  currency: string
  is_paid: boolean
  paid_date?: string | null
  month_label: string
}

export interface EmployeeListItem {
  id: number
  employee_code: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  department: string
  job_title: string
  country: string
  hire_date: string
  salary?: SalaryRecordOut | null
}

export interface PaginationMeta {
  total: number
  page: number
  page_size: number
  pages: number
  has_next: boolean
  has_prev: boolean
}

export interface EmployeeListResponse {
  data: EmployeeListItem[]
  meta: PaginationMeta
  salary_month: string
}

export interface EmployeeDetail extends EmployeeListItem {
  salary_records: SalaryRecordOut[]
}

export interface EmployeeFilterParams {
  search?: string
  country?: string
  month?: string
  is_paid?: boolean
  page?: number
  page_size?: number
}

