import React from 'react'
import { Card, Col, Row, Skeleton, Typography, Tooltip, Space } from 'antd'
import {
  DollarOutlined,
  RiseOutlined,
  CalculatorOutlined,
  TeamOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import type { AnalyticsOverview } from '../types'

const { Text } = Typography

interface OverviewKpisProps {
  overview?: AnalyticsOverview
  loading: boolean
}

export const OverviewKpis: React.FC<OverviewKpisProps> = ({ overview, loading }) => {
  const currencySymbol =
    overview?.currency === 'EUR'
      ? '€'
      : overview?.currency === 'GBP'
      ? '£'
      : overview?.currency === 'INR'
      ? '₹'
      : overview?.currency === 'JPY'
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
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {/* 1. Total Spend */}
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
                  Total Expenditure
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
                {formatCurrency(overview?.total_spend)}
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Consolidated in {overview?.currency || 'USD'}
                </Text>
              </div>
            </div>
          )}
        </Card>
      </Col>

      {/* 2. Average Salary */}
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
                {formatCurrency(overview?.avg_salary)}
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Monthly mean compensation
                </Text>
              </div>
            </div>
          )}
        </Card>
      </Col>

      {/* 3. Median Salary */}
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
                <Space size={4}>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                    Median Salary
                  </Text>
                  <Tooltip title="Median represents the 50th percentile, eliminating distortion from executive outliers.">
                    <InfoCircleOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
                  </Tooltip>
                </Space>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    backgroundColor: '#f5f3ff',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  <CalculatorOutlined />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginTop: 6, lineHeight: 1.2 }}>
                {formatCurrency(overview?.median_salary)}
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  50th percentile baseline
                </Text>
              </div>
            </div>
          )}
        </Card>
      </Col>

      {/* 4. Headcount & Range */}
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
                  Active Headcount
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
              <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginTop: 6, lineHeight: 1.2 }}>
                {(overview?.headcount || 0).toLocaleString('en-US')}
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Range: {formatCurrency(overview?.lowest_salary)} – {formatCurrency(overview?.highest_salary)}
                </Text>
              </div>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  )
}
