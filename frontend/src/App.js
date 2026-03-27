import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DashboardLayout from './components/DashboardLayout';
import TransactionsPage from './pages/TransactionsPage';
import EntitiesPage from './pages/EntitiesPage';
import CasesPage from './pages/CasesPage';
import LTKMPage from './pages/LTKMPage';
import AlertsPage from './pages/AlertsPage';
import IntelligencePage from './pages/IntelligencePage';
import AuditPage from './pages/AuditPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm font-mono">Loading...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TransactionsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/entities"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EntitiesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CasesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ltkm"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <LTKMPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AlertsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/intelligence"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <IntelligencePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AuditPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
