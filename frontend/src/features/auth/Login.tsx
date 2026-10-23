import React from 'react'
import { Card, Button, Typography, Space, Alert, Select, Divider } from 'antd'
import {
  BankOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

const { Title, Text } = Typography

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = React.useState('HR Manager')

  const handleEnterDemo = () => {
    login(selectedRole)
    navigate('/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #ecfdf5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
          border: '1px solid #e2e8f0',
        }}
      >
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          {/* Brand header */}
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 28,
                marginBottom: 12,
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
              }}
            >
              <BankOutlined />
            </div>
            <Title level={3} style={{ margin: '0 0 4px 0', color: '#111827' }}>
              ACME Corp
            </Title>
            <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>
              Global Salary Intelligence Platform
            </Text>
          </div>

          <Alert
            message="Demo Environment"
            description="This application is pre-configured for evaluation. Authentication is simulated without credentials so you can explore all features directly."
            type="info"
            showIcon
            icon={<SafetyCertificateOutlined style={{ color: '#16a34a' }} />}
            style={{
              borderRadius: 8,
              border: '1px solid #bbf7d0',
              backgroundColor: '#f0fdf4',
            }}
          />

          <div>
            <Text strong style={{ display: 'block', marginBottom: 6, color: '#374151' }}>
              Sign in as Persona:
            </Text>
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: '100%' }}
              size="large"
              options={[
                { value: 'HR Manager', label: 'Jane Doe — Senior HR Manager (Full Access)' },
                { value: 'Compensation Director', label: 'Alex Mercer — Director of Total Rewards' },
                { value: 'HR Analyst', label: 'Sam Patel — People Analytics Lead' },
              ]}
            />
          </div>

          <Button
            type="primary"
            size="large"
            block
            icon={<ArrowRightOutlined />}
            onClick={handleEnterDemo}
            style={{
              height: 48,
              fontSize: 15,
              fontWeight: 600,
              backgroundColor: '#16a34a',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
            }}
          >
            Launch Demo Workspace
          </Button>

          <Divider style={{ margin: '8px 0' }} />

          {/* Quick feature highlights */}
          <div>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Included in this Demo
            </Text>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#16a34a', fontSize: 14 }} />
                <Text style={{ fontSize: 13, color: '#4b5563' }}>10,000 synthetic employees across 10 countries</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#16a34a', fontSize: 14 }} />
                <Text style={{ fontSize: 13, color: '#4b5563' }}>Centralized multi-currency salary normalization</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#16a34a', fontSize: 14 }} />
                <Text style={{ fontSize: 13, color: '#4b5563' }}>Interactive Ant Design charts & Excel export</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#16a34a', fontSize: 14 }} />
                <Text style={{ fontSize: 13, color: '#4b5563' }}>Natural language Ask Salary Data assistant</Text>
              </div>
            </div>
          </div>
        </Space>
      </Card>
    </div>
  )
}

