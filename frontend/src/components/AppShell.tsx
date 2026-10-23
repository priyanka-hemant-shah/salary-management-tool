import React, { useState } from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const { Content } = Layout

export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout style={{ background: '#f8fafc' }}>
        <Header />
        <Content
          style={{
            margin: '24px 24px 32px 24px',
            minHeight: 'calc(100vh - 120px)',
            maxWidth: 1600,
            width: 'calc(100% - 48px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

