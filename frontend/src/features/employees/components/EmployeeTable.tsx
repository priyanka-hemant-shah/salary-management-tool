import React from 'react'
import { Card, Table, Tag, Typography, Avatar, Button, Space, Tooltip } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { EyeOutlined, UserOutlined } from '@ant-design/icons'
import type { EmployeeListItem, PaginationMeta } from '../types'

const { Text } = Typography

interface EmployeeTableProps {
  data: EmployeeListItem[]
  meta?: PaginationMeta
  loading: boolean
  onPageChange: (page: number, pageSize: number) => void
  onSelectEmployee: (employee: EmployeeListItem) => void
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  data,
  meta,
  loading,
  onPageChange,
  onSelectEmployee,
}) => {
  const columns: ColumnsType<EmployeeListItem> = [
    {
      title: 'Employee Code',
      dataIndex: 'employee_code',
      key: 'employee_code',
      width: 140,
      render: (code: string) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            color: '#16a34a',
            backgroundColor: '#f0fdf4',
            padding: '2px 8px',
            borderRadius: 6,
            border: '1px solid #dcfce7',
          }}
        >
          {code}
        </span>
      ),
    },
    {
      title: 'Employee',
      key: 'name',
      width: 240,
      render: (_: unknown, record: EmployeeListItem) => {
        const initials = `${record.first_name[0] || ''}${record.last_name[0] || ''}`.toUpperCase()
        return (
          <Space size={10} align="center">
            <Avatar style={{ backgroundColor: '#16a34a', fontWeight: 600 }} size="default">
              {initials}
            </Avatar>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontWeight: 600, color: '#111827' }}>{record.full_name}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.email}
              </Text>
            </div>
          </Space>
        )
      },
    },
    {
      title: 'Department & Role',
      key: 'department',
      width: 220,
      render: (_: unknown, record: EmployeeListItem) => (
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontWeight: 500, color: '#1f2937' }}>{record.job_title}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.department}
          </Text>
        </div>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 150,
      render: (country: string) => (
        <Tag color="geekblue" style={{ borderRadius: 4, fontWeight: 500 }}>
          {country}
        </Tag>
      ),
    },
    {
      title: 'Hire Date',
      dataIndex: 'hire_date',
      key: 'hire_date',
      width: 120,
      render: (dateStr: string) => {
        if (!dateStr) return '—'
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      },
    },
    {
      title: 'Salary (Month)',
      key: 'salary',
      align: 'right',
      width: 170,
      render: (_: unknown, record: EmployeeListItem) => {
        const sal = record.salary
        if (!sal) return <Text type="secondary">—</Text>
        return (
          <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600, color: '#111827' }}>
              {sal.currency} {sal.base_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {sal.month_label}
            </Text>
          </div>
        )
      },
    },
    {
      title: 'Payment Status',
      key: 'status',
      width: 130,
      align: 'center',
      render: (_: unknown, record: EmployeeListItem) => {
        const sal = record.salary
        if (!sal) return <Tag>No Record</Tag>
        return (
          <Tag
            color={sal.is_paid ? 'success' : 'warning'}
            style={{ borderRadius: 4, fontWeight: 500, padding: '2px 8px' }}
          >
            {sal.is_paid ? 'Paid' : 'Pending'}
          </Tag>
        )
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 110,
      align: 'center',
      render: (_: unknown, record: EmployeeListItem) => (
        <Tooltip title="View salary history and employee breakdown">
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: '#16a34a' }} />}
            onClick={() => onSelectEmployee(record)}
            style={{ color: '#16a34a', fontWeight: 500 }}
          >
            Details
          </Button>
        </Tooltip>
      ),
    },
  ]

  const paginationConfig: TablePaginationConfig = {
    current: meta?.page || 1,
    pageSize: meta?.page_size || 50,
    total: meta?.total || 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '25', '50', '100'],
    showTotal: (total, range) => (
      <Text type="secondary" style={{ fontSize: 13 }}>
        Showing {range[0]}–{range[1]} of {total.toLocaleString()} employees
      </Text>
    ),
    onChange: (page, pageSize) => onPageChange(page, pageSize),
  }

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
      styles={{ body: { padding: 0 } }}
    >
      <Table<EmployeeListItem>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={paginationConfig}
        size="middle"
        style={{ overflowX: 'auto' }}
        onRow={(record) => ({
          onClick: (e) => {
            // If user clicked the button, let the button handler handle it
            if ((e.target as HTMLElement).closest('button')) return
            onSelectEmployee(record)
          },
          style: { cursor: 'pointer' },
        })}
      />
    </Card>
  )
}

