import React from 'react'
import { Card, Table, Tag, Typography, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { RecentChangeItem } from '../types'

const { Title, Text } = Typography

interface RecentChangesTableProps {
  items?: RecentChangeItem[]
  loading: boolean
}

export const RecentChangesTable: React.FC<RecentChangesTableProps> = ({
  items = [],
  loading,
}) => {
  const navigate = useNavigate()

  const columns: ColumnsType<RecentChangeItem> = [
    {
      title: 'Employee Code',
      dataIndex: 'employee_code',
      key: 'employee_code',
      render: (code: string) => (
        <Text strong style={{ color: '#16a34a', fontFamily: 'monospace' }}>
          {code}
        </Text>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
    },
    {
      title: 'Monthly Base Salary',
      key: 'salary',
      align: 'right',
      render: (_: unknown, record: RecentChangeItem) => (
        <span style={{ fontWeight: 600 }}>
          {record.currency} {record.salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: 'Salary Month',
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (d: string) => {
        if (!d) return '—'
        const [year, month] = d.split('-')
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1)
        return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const isPaid = status === 'Paid'
        return (
          <Tag color={isPaid ? 'success' : 'warning'} style={{ borderRadius: 4, fontWeight: 500 }}>
            {status}
          </Tag>
        )
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: RecentChangeItem) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/employees?search=${encodeURIComponent(record.employee_code)}`)}
          style={{ color: '#16a34a', padding: 0 }}
        >
          View in Directory
        </Button>
      ),
    },
  ]

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
          <div>
            <Title level={5} style={{ margin: 0, color: '#111827' }}>
              Recent Payroll Activity
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Latest employee salary records and disbursement statuses
            </Text>
          </div>
          <Button
            type="text"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/employees')}
            style={{ color: '#16a34a', fontWeight: 500 }}
          >
            All Employees
          </Button>
        </div>
      }
    >
      <Table<RecentChangeItem>
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
        style={{ overflowX: 'auto' }}
      />
    </Card>
  )
}
