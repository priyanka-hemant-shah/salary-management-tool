import React from 'react'
import { Layout, Input, Avatar, Dropdown, Space, Typography, Tag, Button } from 'antd'
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuth } from '../lib/auth'
import { useNavigate } from 'react-router-dom'

const { Header: AntHeader } = Layout
const { Text } = Typography

interface HeaderProps {
  onSearch?: (query: string) => void
}

export const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    } else if (key === 'employees') {
      navigate('/employees')
    }
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600, color: '#111827' }}>{user?.name || 'Jane Doe'}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{user?.email || 'jane.doe@acme-corp.example.com'}</div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'employees',
      icon: <UserOutlined />,
      label: 'Employee Directory',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Exit Demo (Logout)',
    },
  ]

  return (
    <AntHeader
      style={{
        background: '#ffffff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 90,
      }}
    >
      {/* Global Search Bar */}
      <div style={{ width: 340, maxWidth: '40%' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          placeholder="Quick search employee, country, dept..."
          allowClear
          onPressEnter={(e) => {
            const val = (e.target as HTMLInputElement).value
            if (onSearch) onSearch(val)
            navigate(`/employees?search=${encodeURIComponent(val)}`)
          }}
          style={{
            borderRadius: 8,
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
          }}
        />
      </div>

      {/* Right side widgets & profile */}
      <Space size={16} align="center">
        {/* Environment badge */}
        <Tag
          icon={<SafetyCertificateOutlined />}
          color="green"
          style={{
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Demo Mode · 10k Records
        </Tag>

        {/* Currency badge */}
        <Tag
          icon={<GlobalOutlined />}
          style={{
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 12,
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #e5e7eb',
          }}
        >
          USD ($) Consolidated
        </Tag>

        {/* Notifications button */}
        <Button
          type="text"
          shape="circle"
          icon={<BellOutlined style={{ fontSize: 18, color: '#4b5563' }} />}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="No unread alerts"
        />

        {/* User profile dropdown */}
        <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight" arrow>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
          >
            <Avatar
              style={{
                backgroundColor: '#16a34a',
                verticalAlign: 'middle',
                fontWeight: 600,
              }}
              size="default"
            >
              JD
            </Avatar>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
                {user?.name || 'Jane Doe'}
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {user?.role || 'HR Manager'}
              </Text>
            </div>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}

