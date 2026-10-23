import React, { useState } from 'react'
import { Typography, Alert, Button, message } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { employeesApi } from './api'
import { EmployeeFilters } from './components/EmployeeFilters'
import { EmployeeTable } from './components/EmployeeTable'
import { EmployeeDetailDrawer } from './components/EmployeeDetailDrawer'
import type { EmployeeListItem } from './types'

const { Title, Text } = Typography

export const EmployeesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Read current filters from URL params
  const search = searchParams.get('search') || ''
  const country = searchParams.get('country') || undefined
  const month = searchParams.get('month') || undefined
  const isPaidParam = searchParams.get('is_paid')
  const isPaid = isPaidParam === 'true' ? true : isPaidParam === 'false' ? false : undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('page_size') || '50', 10)

  // Drawer state
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Helper to update URL search params
  const updateParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === '') {
        newParams.delete(key)
      } else {
        newParams.set(key, val)
      }
    })
    setSearchParams(newParams)
  }

  // 1. Fetch metadata options
  const { data: countries = [] } = useQuery({
    queryKey: ['meta-countries'],
    queryFn: employeesApi.getCountries,
  })

  const { data: months = [] } = useQuery({
    queryKey: ['meta-months'],
    queryFn: employeesApi.getMonths,
  })

  // 2. Fetch employee list with current filters
  const employeesQuery = useQuery({
    queryKey: ['employees', search, country, month, isPaid, page, pageSize],
    queryFn: () =>
      employeesApi.listEmployees({
        search: search || undefined,
        country: country || undefined,
        month: month || undefined,
        is_paid: isPaid,
        page,
        page_size: pageSize,
      }),
  })

  // Filter change handlers (resets page to 1 on filter changes)
  const handleSearchChange = (val: string) => {
    updateParams({ search: val, page: '1' })
  }

  const handleCountryChange = (val?: string) => {
    updateParams({ country: val, page: '1' })
  }

  const handleMonthChange = (val?: string) => {
    updateParams({ month: val, page: '1' })
  }

  const handlePaidChange = (val?: boolean) => {
    updateParams({
      is_paid: val === undefined ? undefined : String(val),
      page: '1',
    })
  }

  const handleReset = () => {
    setSearchParams(new URLSearchParams())
  }

  const handlePageChange = (newPage: number, newPageSize: number) => {
    updateParams({
      page: String(newPage),
      page_size: String(newPageSize),
    })
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      await employeesApi.exportToExcel({
        search: search || undefined,
        country: country || undefined,
        month: month || undefined,
        is_paid: isPaid,
      })
      message.success('Employee salary report downloaded successfully')
    } catch (err) {
      message.error((err as Error)?.message || 'Failed to export employee records')
    } finally {
      setExporting(false)
    }
  }

  const handleOpenDetail = (emp: EmployeeListItem) => {
    setSelectedEmployee(emp)
    setDrawerOpen(true)
  }

  const handleCloseDetail = () => {
    setDrawerOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page Title & Intro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#111827' }}>
            Employees Directory
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Global workforce records and compensation management for 10,000 employees
          </Text>
        </div>
      </div>

      {/* Error Banner */}
      {employeesQuery.isError && (
        <Alert
          type="error"
          message="Failed to load employee directory"
          description={employeesQuery.error?.message || 'Database error retrieving employees'}
          showIcon
          action={
            <Button size="small" type="primary" danger onClick={() => employeesQuery.refetch()}>
              Retry
            </Button>
          }
        />
      )}

      {/* Filter Row */}
      <EmployeeFilters
        search={search}
        onSearchChange={handleSearchChange}
        country={country}
        onCountryChange={handleCountryChange}
        month={month}
        onMonthChange={handleMonthChange}
        isPaid={isPaid}
        onPaidChange={handlePaidChange}
        countries={countries}
        months={months}
        onReset={handleReset}
        onExport={handleExport}
        exporting={exporting}
      />

      {/* Data Table */}
      <EmployeeTable
        data={employeesQuery.data?.data || []}
        meta={employeesQuery.data?.meta}
        loading={employeesQuery.isLoading}
        onPageChange={handlePageChange}
        onSelectEmployee={handleOpenDetail}
      />

      {/* Detail Drawer */}
      <EmployeeDetailDrawer
        employee={selectedEmployee}
        open={drawerOpen}
        onClose={handleCloseDetail}
      />
    </div>
  )
}
