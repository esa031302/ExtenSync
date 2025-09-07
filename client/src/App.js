import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import PortalProtectedRoute from './components/PortalProtectedRoute';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import UserManagement from './components/UserManagement';
import Projects from './components/Projects';
import ProjectProposal from './components/ProjectProposal';
import ProjectView from './components/ProjectView';
import ProjectEdit from './components/ProjectEdit';
import Documents from './components/Documents';
import SystemLogs from './components/SystemLogs';
import Conversations from './components/Conversations';
import Calendar from './components/Calendar';
import Notifications from './components/Notifications';

import Evaluations from './components/Evaluations';
import EvaluationForm from './components/EvaluationForm';
import Reports from './components/Reports';
import ReportView from './components/ReportView';

// Community Portal Components
import CommunityHome from './components/CommunityHome';
import RequestSubmission from './components/RequestSubmission';
import Feedback from './components/Feedback';
import Announcements from './components/Announcements';

// Beneficiary Components
import BeneficiaryLogin from './components/BeneficiaryLogin';
import BeneficiaryRegister from './components/BeneficiaryRegister';
import BeneficiaryProfile from './components/BeneficiaryProfile';

// Import Bootstrap CSS and JS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  // Show navbar only for authenticated users on admin routes (not portal) and not for beneficiaries
  // Also exclude beneficiary login/register pages
  const shouldShowNavbar = user && 
    !location.pathname.startsWith('/portal') && 
    !location.pathname.startsWith('/beneficiary') &&
    user.role !== 'Beneficiary';


  return (
    <div className="App">
      {shouldShowNavbar && <Navbar />}
      <main className="bg-light min-vh-100">
        <Routes>
          {/* Public Portal Routes */}
          <Route path="/portal" element={
            <PublicLayout>
              <CommunityHome />
            </PublicLayout>
          } />
          <Route path="/portal/announcements" element={
            <PublicLayout>
              <Announcements />
            </PublicLayout>
          } />
          <Route path="/portal/request" element={
            <PublicLayout>
              <PortalProtectedRoute>
                <RequestSubmission />
              </PortalProtectedRoute>
            </PublicLayout>
          } />
          <Route path="/portal/feedback" element={
            <PublicLayout>
              <PortalProtectedRoute>
                <Feedback />
              </PortalProtectedRoute>
            </PublicLayout>
          } />
          <Route path="/portal/profile" element={
            <PublicLayout>
              <BeneficiaryProfile />
            </PublicLayout>
          } />
          
          {/* Beneficiary Routes */}
          <Route path="/beneficiary/login" element={
            <PublicLayout>
              <BeneficiaryLogin />
            </PublicLayout>
          } />
          <Route path="/beneficiary/register" element={
            <PublicLayout>
              <BeneficiaryRegister />
            </PublicLayout>
          } />
          
          {/* Root redirect - authenticated users go to dashboard, others to portal */}
          <Route path="/" element={
            user && user.role !== 'Beneficiary' ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/portal" replace />
          } />
          
          {/* Employee Login Route */}
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/user-management" element={
            <ProtectedRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <Layout>
                <Projects />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <Layout>
                <ProjectView />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/projects/new" element={
            <ProtectedRoute>
              <Layout>
                <ProjectProposal />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/projects/:id/edit" element={
            <ProtectedRoute>
              <Layout>
                <ProjectEdit />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <Layout>
                <Documents />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute>
              <Layout>
                <SystemLogs />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/conversations" element={
            <ProtectedRoute>
              <Layout>
                <Conversations />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <Layout>
                <Calendar />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/evaluations" element={
            <ProtectedRoute>
              <Layout>
                <Evaluations />
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
          <Route path="/reports/:id" element={
            <ProtectedRoute>
              <Layout>
                <ReportView />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/evaluations/new" element={
            <ProtectedRoute>
              <Layout>
                <EvaluationForm />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/evaluations/:id" element={
            <ProtectedRoute>
              <Layout>
                <EvaluationForm />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/evaluations/:id/edit" element={
            <ProtectedRoute>
              <Layout>
                <EvaluationForm />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
