import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password, 'employee');
    
    if (result.success) {
      // For employees, navigation will be handled by useEffect
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // If already authenticated, redirect away from login
  useEffect(() => {
    if (!authLoading && user && user.role) {
      if (user.role === 'Beneficiary') {
        // Beneficiaries should be on the public portal
        navigate('/portal');
      } else {
        // Employees (all non-beneficiary roles) always go to the dashboard
        // Ignore any redirect param for employee login to avoid sending them to the portal
        navigate('/dashboard');
      }
    }
  }, [authLoading, user, navigate, searchParams]);

  // Show error if beneficiary tries to access employee login
  useEffect(() => {
    if (!authLoading && user && user.role === 'Beneficiary') {
      setError('This login is for employees only. Please use the beneficiary login.');
    }
  }, [authLoading, user]);

  return (
    <div className="employee-login-page">
      <Link to="/portal" className="back-to-portal d-inline-flex align-items-center">
        <i className="bi bi-arrow-left me-2"></i>
        Back to Home
      </Link>
      <Container className="employee-login-wrapper">
        <div className="login-card shadow">
          <div className="employee-login-split">
            <div className="split-left">
              <div className="left-top-logo">
                <img src="/extensynclogo.png" alt="ExtenSync" />
              </div>
              <div className="left-bottom-logos">
                <img src="/extension-services-logo.jpg" alt="Extension Services Office" className="circle-logo" />
                <img src="/batstate-u-logo.png" alt="BatState-U" className="circle-logo" />
              </div>
            </div>

            <div className="split-right">
              <div className="right-content">
                <div className="text-center mb-4">
                  <img src="/extensynclogo.png" alt="ExtenSync" className="brand-logo" />
                  <h3 className="mt-3 mb-2 right-title">Employee Login</h3>
                  <p className="text-muted mb-0">Access your EPMS dashboard</p>
                </div>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="employee-login-button d-inline-flex align-items-center justify-content-center w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-lock-fill me-2"></i>
                        Sign In as Employee
                      </>
                    )}
                  </Button>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Login;
