import React from 'react'
import {
  Drawer,
  Typography,
  Descriptions,
  Table,
  Tag,
  Avatar,
  Skeleton,
  Divider,
  Alert,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { employeesApi } from '../api'
import type { EmployeeListItem, SalaryRecordOut } from '../types'

const { Title, Text } = Typography

interface EmployeeDetailDrawerProps {
  employee: EmployeeListItem | null
  open: boolean
  onClose: () => void
}

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
  employee,
  open,
  onClose,
}) => {
  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ['employee-detail', employee?.id],
    queryFn: () => employeesApi.getEmployeeDetail(employee!.id),
    enabled: Boolean(employee?.id && open),
  })

  const initials = employee
    ? `${employee.first_name[0] || ''}${employee.last_name[0] || ''}`.toUpperCase()
    : 'EMP'

  const salaryColumns: ColumnsType<SalaryRecordOut> = [
    {
      title: 'Month',
      dataIndex: 'month_label',
      key: 'month_label',
      render: (m: string) => <span style={{ fontWeight: 600 }}>{m}</span>,
    },
    {
      title: 'Base Salary',
      key: 'base_salary',
      align: 'right',
      render: (_: unknown, record: SalaryRecordOut) => (
        <span style={{ fontWeight: 600, color: '#111827' }}>
          {record.currency} {record.base_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'is_paid',
      align: 'center',
      render: (_: unknown, record: SalaryRecordOut) => (
        <Tag
          color={record.is_paid ? 'success' : 'warning'}
          style={{ borderRadius: 4, fontWeight: 500 }}
        >
          {record.is_paid ? 'Paid' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Disbursement Date',
      dataIndex: 'paid_date',
      key: 'paid_date',
      render: (d: string | null) => (d ? d : <Text type="secondary">—</Text>),
    },
  ]

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size="large"
            style={{ backgroundColor: '#16a34a', fontWeight: 600 }}
          >
            {initials}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
              {employee?.full_name || 'Employee Profile'}
            </div>
            <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
              {employee?.employee_code}
            </Text>
          </div>
        </div>
      }
      placement="right"
      width={640}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : isError ? (
        <Alert
          type="error"
          message="Failed to load employee records"
          description={(error as Error)?.message || 'Unable to retrieve employee salary history'}
          showIcon
        />
      ) : detail ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Employee Meta Summary */}
          <Descriptions
            bordered
            size="small"
            column={2}
            style={{ borderRadius: 8, overflow: 'hidden' }}
          >
            <Descriptions.Item label="Job Title" span={2}>
              <Text strong>{detail.job_title}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              <Tag color="green">{detail.department}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Country">
              <Tag color="geekblue">{detail.country}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={2}>
              <Text copyable style={{ fontSize: 13 }}>{detail.email}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Hire Date">
              {detail.hire_date}
            </Descriptions.Item>
            <Descriptions.Item label="Historical Records">
              {detail.salary_records?.length || 0} Months
            </Descriptions.Item>
          </Descriptions>

          <Divider style={{ margin: '8px 0' }} />

          {/* Salary History Table */}
          <div>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={5} style={{ margin: 0, color: '#111827' }}>
                  Salary Disbursement History
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Monthly compensation records recorded in {detail.salary_records?.[0]?.currency || 'native currency'}
                </Text>
              </div>
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Verified Payroll
              </Tag>
            </div>

            <Table<SalaryRecordOut>
              columns={salaryColumns}
              dataSource={detail.salary_records}
              rowKey="id"
              pagination={{ pageSize: 6 }}
              size="small"
              bordered
            />
          </div>
        </div>
      ) : null}
    </Drawer>
  )
}

