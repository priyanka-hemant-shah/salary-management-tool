import { Routes, Route, Navigate } from 'react-router-dom'

/**
 * Root application router.
 *
 * Routes defined here will be expanded in subsequent PRs:
 * - PR 8: AppShell, Login screen
 * - PR 9: Dashboard
 * - PR 10: Employee Directory
 * - PR 11: Salary Analytics
 * - PR 12: Ask Salary Data
 */
function App() {
  return (
    <Routes>
      {/* Placeholder routes — replaced in PR 8 */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              flexDirection: 'column',
              gap: 16,
              fontFamily: 'sans-serif',
            }}
          >
            <h1 style={{ color: '#16a34a', margin: 0 }}>ACME Salary Intelligence</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Frontend scaffold ready · PR 1 complete
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
              Full UI shell arrives in PR 8
            </p>
          </div>
        }
      />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
