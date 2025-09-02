import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
import Evaluations from './components/Evaluations';
import EvaluationForm from './components/EvaluationForm';

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

  return (
    <div className="App">
      {user && <Navbar />}
      <main className="bg-light min-vh-100">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <ProjectProposal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/edit"
            element={
              <ProtectedRoute>
                <ProjectEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <SystemLogs />
              </ProtectedRoute>
            }
          />
                        <Route
                path="/conversations"
                element={
                  <ProtectedRoute>
                    <Conversations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evaluations"
                element={
                  <ProtectedRoute>
                    <Evaluations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evaluations/new"
                element={
                  <ProtectedRoute>
                    <EvaluationForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evaluations/:id"
                element={
                  <ProtectedRoute>
                    <EvaluationForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evaluations/:id/edit"
                element={
                  <ProtectedRoute>
                    <EvaluationForm />
                  </ProtectedRoute>
                }
              />
        </Routes>
      </main>
    </div>
  );
}

export default App;
