import React from 'react'
import { Layout, Menu, Typography, Tag, Space } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  BarChartOutlined,
  CommentOutlined,
  FileTextOutlined,
  SettingOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'

const { Sider } = Layout
const { Text } = Typography

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const location = useLocation()
  const navigate = useNavigate()

  // Determine active menu key from path
  const currentPath = location.pathname
  const selectedKey = currentPath.startsWith('/employees')
    ? '/employees'
    : currentPath.startsWith('/analytics')
    ? '/analytics'
    : currentPath.startsWith('/ask')
    ? '/ask'
    : '/dashboard'

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ fontSize: 18 }} />,
      label: 'Dashboard',
    },
    {
      key: '/employees',
      icon: <TeamOutlined style={{ fontSize: 18 }} />,
      label: 'Employees',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined style={{ fontSize: 18 }} />,
      label: 'Salary Analytics',
    },
    {
      key: '/ask',
      icon: <CommentOutlined style={{ fontSize: 18 }} />,
      label: 'Ask Salary Data (AI)',
    },
    {
      type: 'divider' as const,
    },
    {
      key: '/reports',
      icon: <FileTextOutlined style={{ fontSize: 18 }} />,
      label: (
        <Space direction="horizontal" size={8}>
          <span>Reports</span>
          {!collapsed && <Tag color="default" style={{ fontSize: 10, margin: 0 }}>Soon</Tag>}
        </Space>
      ),
      disabled: true,
    },
    {
      key: '/settings',
      icon: <SettingOutlined style={{ fontSize: 18 }} />,
      label: (
        <Space direction="horizontal" size={8}>
          <span>Settings</span>
          {!collapsed && <Tag color="default" style={{ fontSize: 10, margin: 0 }}>Soon</Tag>}
        </Space>
      ),
      disabled: true,
    },
  ]

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={250}
      theme="light"
      style={{
        borderRight: '1px solid #f0f0f0',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? '20px 8px' : '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => navigate('/dashboard')}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
          }}
        >
          <BankOutlined />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', lineHeight: 1.2 }}>
              ACME Corp
            </div>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 500 }}>
              Salary Intelligence
            </Text>
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => {
            if (!key.startsWith('/reports') && !key.startsWith('/settings')) {
              navigate(key)
            }
          }}
          style={{ borderRight: 0, fontWeight: 500 }}
        />
      </div>

      {/* Footer info badge */}
      {!collapsed && (
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#f9fafb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>ACME v1.0</Text>
            <Tag color="success" style={{ margin: 0, fontSize: 10 }}>Demo Active</Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            10,000 Employees · Global
          </Text>
        </div>
      )}
    </Sider>
  )
}

