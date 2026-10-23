import React from 'react'
import { Card, Col, Row, Skeleton, Typography } from 'antd'
import {
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import type { DashboardSummary } from '../types'

const { Text } = Typography

interface KpiCardsProps {
  summary?: DashboardSummary
  loading: boolean
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary, loading }) => {
  const currencySymbol =
    summary?.currency === 'EUR'
      ? '€'
      : summary?.currency === 'GBP'
      ? '£'
      : summary?.currency === 'INR'
      ? '₹'
      : summary?.currency === 'JPY'
      ? '¥'
      : '$'

  const formatCurrency = (val?: number) => {
    if (val === undefined) return '0.00'
    return `${currencySymbol}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <Row gutter={[16, 16]}>
      {/* 1. Total Headcount */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            height: '100%',
          }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  Total Headcount
                </Text>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  <TeamOutlined />
                </div>
              </div>
              <div
                data-testid="headcount-value"
                style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginTop: 4 }}
              >
                {(summary?.headcount || 0).toLocaleString('en-US')}
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <GlobalOutlined style={{ marginRight: 4, color: '#16a34a' }} />
                  {summary?.active_countries || 0} operating countries
                </Text>
              </div>
            </div>
          )}
        </Card>
      </Col>

      {/* 2. Total Monthly Payroll */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            height: '100%',
          }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  Monthly Spend
                </Text>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  <DollarOutlined />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginTop: 6, lineHeight: 1.2 }}>
                {formatCurrency(summary?.total_salary_spend)}
              </div>
              <div style={{ marginTop: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Consolidated in {summary?.currency || 'USD'}
                </Text>
              </div>
            </div>
          )}
        </Card>
      </Col>

      {/* 3. Average Monthly Salary */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            height: '100%',
          }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  Average Salary
                </Text>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  <RiseOutlined />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginTop: 6, lineHeight: 1.2 }}>
                {formatCurrency(summary?.avg_salary)}
              </div>
              <div style={{ marginTop: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Per employee / month
                </Text>
              </div>
            </div>
          )}
        </Card>
      </Col>

      {/* 4. Payroll Paid Status */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            height: '100%',
          }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  Payroll Status
                </Text>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  <CheckCircleOutlined />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginTop: 6, lineHeight: 1.2 }}>
                {summary?.paid_ratio ? `${summary.paid_ratio}%` : '0%'}
              </div>
              <div style={{ marginTop: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Disbursed for {summary?.salary_month || 'current month'}
                </Text>
              </div>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  )
}
