import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Login } from './features/auth/Login'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { EmployeesPage } from './features/employees/EmployeesPage'
import { AnalyticsPage } from './features/analytics/AnalyticsPage'
import { AskSalaryPage } from './features/ask-salary/AskSalaryPage'
import { AuthProvider } from './lib/auth'

/**
 * Root application router.
 *
 * PR 8: Assembles AppShell, Sidebar, Header, Demo Login, and routes
 * for Dashboard, Employees Directory, Salary Analytics, and Ask Salary Data.
 */
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected App Shell */}
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="ask" element={<AskSalaryPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
