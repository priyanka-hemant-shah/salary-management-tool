/**
 * Ant Design theme token configuration.
 *
 * Visual reference: ACME Salary Analytics Dashboard Suite.png
 * Primary: white background, green accent (#16a34a family), charcoal text.
 */
import type { ThemeConfig } from 'antd'

export const theme: ThemeConfig = {
  token: {
    // Primary green — matches the sidebar active state and buttons in the mockup
    colorPrimary: '#16a34a',
    colorSuccess: '#16a34a',

    // Backgrounds
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f6fa',

    // Text
    colorText: '#1a202c',
    colorTextSecondary: '#4b5563',

    // Border
    colorBorder: '#e5e7eb',
    borderRadius: 8,
    borderRadiusLG: 12,

    // Typography
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,

    // Spacing
    padding: 16,
    paddingLG: 24,
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
    },
    Menu: {
      itemSelectedBg: '#f0fdf4',
      itemSelectedColor: '#16a34a',
      itemActiveBg: '#f0fdf4',
    },
    Card: {
      headerBg: '#ffffff',
    },
    Table: {
      headerBg: '#f9fafb',
      rowHoverBg: '#f0fdf4',
    },
    Button: {
      primaryColor: '#ffffff',
    },
  },
}
