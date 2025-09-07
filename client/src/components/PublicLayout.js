import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav, Modal, Button, Dropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PublicLayout.css';

const PublicLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutWithRedirect } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalContext, setLoginModalContext] = useState('');

  // If redirected from protected portal routes, show the login modal and clean URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const message = params.get('message');
    const redirect = params.get('redirect');
    if (message && !user) {
      if (redirect?.includes('/portal/request')) setLoginModalContext('request');
      else if (redirect?.includes('/portal/feedback')) setLoginModalContext('feedback');
      else setLoginModalContext('');
      setShowLoginModal(true);
      // Clean the URL back to /portal after opening modal
      navigate('/portal', { replace: true });
    }
  }, [location.search, navigate, user]);

  const handleLoginType = (type) => {
    setShowLoginModal(false);
    const redirectPath = loginModalContext ? `/portal/${loginModalContext}` : '/portal';
    
    if (type === 'beneficiary') {
      navigate(`/beneficiary/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  };

  const handleNavbarAction = (action) => {
    if (user) {
      navigate(`/portal/${action}`);
    } else {
      setLoginModalContext(action);
      setShowLoginModal(true);
    }
  };

  const handleLogout = async () => {
    await logoutWithRedirect(navigate);
  };

  return (
    <div className="public-layout">
      {/* Public Navigation */}
      <Navbar bg="light" variant="light" expand="lg" className="public-navbar shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/portal" className="d-flex align-items-center logo-section">
            <img 
              src="/extensynclogo.png" 
              alt="ExtenSync Logo" 
              height="75" 
              className="me-2 logo-image"
            />
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link 
                as={Link} 
                to="/portal" 
                className={location.pathname === '/portal' ? 'active' : ''}
              >
                <i className="bi bi-house me-1"></i>
                Home
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/portal/announcements" 
                className={location.pathname === '/portal/announcements' ? 'active' : ''}
              >
                <i className="bi bi-bullhorn me-1"></i>
                Announcements
              </Nav.Link>
              <Nav.Link 
                onClick={() => handleNavbarAction('request')}
                className={location.pathname === '/portal/request' ? 'active' : ''}
                style={{ cursor: 'pointer' }}
              >
                <i className="bi bi-send me-1"></i>
                Submit Request
              </Nav.Link>
              <Nav.Link 
                onClick={() => handleNavbarAction('feedback')}
                className={location.pathname === '/portal/feedback' ? 'active' : ''}
                style={{ cursor: 'pointer' }}
              >
                <i className="bi bi-chat-heart me-1"></i>
                Feedback
              </Nav.Link>
              {user ? (
                <Dropdown align="end">
                  <Dropdown.Toggle as={Button} variant="outline-primary" className="profile-dropdown">
                    <i className="bi bi-person-circle me-1"></i>
                    {user.fullname}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Header>
                      <div className="text-center">
                        <div className="fw-bold">{user.fullname}</div>
                        <small className="text-muted">{user.role}</small>
                      </div>
                    </Dropdown.Header>
                    <Dropdown.Divider />
                    <Dropdown.Item as={Link} to="/portal/profile">
                      <i className="bi bi-person me-2"></i>
                      Profile Management
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/portal/my-requests">
                      <i className="bi bi-list-ul me-2"></i>
                      My Requests
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/portal/my-feedback">
                      <i className="bi bi-chat-heart me-2"></i>
                      My Feedback
                    </Dropdown.Item>
                    {user.role !== 'Beneficiary' && (
                      <>
                        <Dropdown.Divider />
                        <Dropdown.Item as={Link} to="/dashboard" className="epms-dropdown-item">
                          <i className="bi bi-speedometer2 me-2"></i>
                          Access EPMS
                        </Dropdown.Item>
                      </>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <Nav.Link 
                  as={Link}
                  to="/beneficiary/login"
                  className="login-link"
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Login
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main className="public-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="public-footer bg-dark text-light py-4 mt-5">
        <Container>
          <Row>
            <Col md={6}>
              <h5 className="mb-3">
                <i className="bi bi-building me-2"></i>
                ExtenSync Community Portal
              </h5>
              <p className="text-muted">
                Connecting communities through extension programs and outreach services.
              </p>
            </Col>
            <Col md={3}>
              <h6 className="mb-3">Quick Links</h6>
              <ul className="list-unstyled">
                <li><Link to="/portal" className="text-muted text-decoration-none">Home</Link></li>
                <li><Link to="/portal/announcements" className="text-muted text-decoration-none">Announcements</Link></li>
                <li><Link to="/portal/request" className="text-muted text-decoration-none">Submit Request</Link></li>
                <li><Link to="/portal/feedback" className="text-muted text-decoration-none">Feedback</Link></li>
              </ul>
            </Col>
            <Col md={3}>
              <h6 className="mb-3">Contact Info</h6>
              <ul className="list-unstyled text-muted">
                <li><i className="bi bi-envelope me-2"></i>community@extensync.edu</li>
                <li><i className="bi bi-telephone me-2"></i>(555) 123-4567</li>
                <li><i className="bi bi-geo-alt me-2"></i>University Campus</li>
              </ul>
            </Col>
          </Row>
          <hr className="my-4" />
          <Row>
            <Col>
              <p className="text-muted text-center mb-0">
                &copy; 2024 ExtenSync. All rights reserved. | 
                <Link to="/privacy" className="text-muted text-decoration-none ms-2">Privacy Policy</Link> | 
                <Link to="/terms" className="text-muted text-decoration-none ms-2">Terms of Service</Link>
              </p>
            </Col>
          </Row>
        </Container>
      </footer>

      {/* Login Type Selection Modal */}
      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-lock me-2"></i>
            Login Required
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="mb-4">
            {loginModalContext === 'request' 
              ? 'You need to be logged in to submit a community request.'
              : loginModalContext === 'feedback'
              ? 'You need to be logged in to submit feedback.'
              : 'Please log in to access your account and community features.'
            }
          </p>
          <p className="mb-4 text-muted">Please log in to continue:</p>
          <div className="d-grid gap-3">
            <Button 
              variant="outline-primary" 
              size="lg"
              onClick={() => handleLoginType('beneficiary')}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-people me-3"></i>
              <div className="text-start">
                <div className="fw-bold">Log in as Beneficiary</div>
                <small className="text-muted">Community members and organizations</small>
              </div>
            </Button>
          </div>
          <div className="mt-4">
            <p className="mb-2">Don't have an account?</p>
            <Button 
              variant="link" 
              onClick={() => {
                setShowLoginModal(false);
                navigate('/beneficiary/register');
              }}
              className="text-decoration-none"
            >
              <i className="bi bi-person-plus me-1"></i>
              Register as Beneficiary
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default PublicLayout;
