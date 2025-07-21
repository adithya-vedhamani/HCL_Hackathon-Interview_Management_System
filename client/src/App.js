import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import QRScanner from './pages/QRScanner';
import Squads from './pages/Squads';
import Reports from './pages/Reports';
import Attendance from './pages/Attendance';
import AdminDetails from './pages/AdminDetails';
import QRDownloader from './pages/QRDownloader';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              color: '#fff',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3)',
            },
            success: {
              style: {
                background: 'linear-gradient(135deg, #059669, #10b981)',
              },
            },
            error: {
              style: {
                background: 'linear-gradient(135deg, #dc2626, #ef4444)',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/scanner" element={<QRScanner />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/candidates" element={
            <ProtectedRoute>
              <Layout>
                <Candidates />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/squads" element={
            <ProtectedRoute>
              <Layout>
                <Squads />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/attendance" element={
            <ProtectedRoute>
              <Layout>
                <Attendance />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin-details" element={
            <ProtectedRoute>
              <Layout>
                <AdminDetails />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/qr-downloader" element={
            <ProtectedRoute>
              <Layout>
                <QRDownloader />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Redirect to dashboard if no route matches */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 