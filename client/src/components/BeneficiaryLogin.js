import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './BeneficiaryLogin.css';

const BeneficiaryLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize AOS for animations
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AOS) {
      window.AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    }
  }, []);

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

    const result = await login(formData.email, formData.password, 'beneficiary');
    
    if (result.success) {
      // For beneficiaries, navigation will be handled by useEffect
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // If already authenticated, redirect away from login
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'Beneficiary') {
        const redirectPath = searchParams.get('redirect') || '/portal';
        navigate(redirectPath);
      } else {
        setError('This login is only for beneficiaries. Please use the employee login.');
        // Logout the user since they're not a beneficiary
        // You might want to add a logout function to clear the session
      }
    }
  }, [authLoading, user, navigate, searchParams]);

  return (
    <div className="beneficiary-login-page">
      <Link to="/portal" className="back-to-portal d-inline-flex align-items-center">
        <i className="bi bi-arrow-left me-2"></i>
        Back to Home
      </Link>
      <Container className="beneficiary-login-wrapper" data-aos="fade-up">
        <div className="login-card shadow" data-aos="zoom-in" data-aos-delay="50">
          <div className="beneficiary-login-split">
            <div className="split-left" data-aos="fade-right" data-aos-delay="100">
              <div className="left-top-logo">
                <img src="/extensynclogo.png" alt="ExtenSync" />
              </div>
              <div className="left-bottom-logos">
                <img src="/extension-services-logo.jpg" alt="Extension Services Office" className="circle-logo" />
                <img src="/batstate-u-logo.png" alt="BatState-U" className="circle-logo" />
              </div>
            </div>

            <div className="split-right" data-aos="fade-left" data-aos-delay="150">
              <div className="right-content" data-aos="fade-up" data-aos-delay="200">
                <div className="text-center mb-4">
                  <img src="/extensynclogo.png" alt="ExtenSync" className="brand-logo" />
                  <h3 className="mt-3 mb-2 right-title">Beneficiary Login</h3>
                  <p className="text-muted mb-0">Access your community portal account</p>
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
                    className="beneficiary-login-button d-inline-flex align-items-center justify-content-center w-100"
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
                        Sign In as Beneficiary
                      </>
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/beneficiary/register" className="text-decoration-none fw-semibold split-link">
                      Register here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default BeneficiaryLogin;
