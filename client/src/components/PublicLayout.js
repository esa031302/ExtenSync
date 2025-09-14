import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Navbar, Nav, Modal, Button, Dropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileManagementModal from './ProfileManagementModal';
import './PublicLayout.css';

const PublicLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutWithRedirect } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalContext, setLoginModalContext] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [contactData, setContactData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [activeNavItem, setActiveNavItem] = useState('home');
  const heroRef = useRef(null);
  const helpRef = useRef(null);
  const heroImages = [
    '/carousel-bg1.jpg',
    '/carousel-bg2.jpg',
    '/carousel-bg3.jpg',
    '/carousel-bg4.jpg'
  ];
  const [heroIndex, setHeroIndex] = useState(0);

  // If redirected from protected portal routes, show the login modal and clean URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const message = params.get('message');
    const redirect = params.get('redirect');
    if (message && !user) {
      setLoginModalContext('');
      setShowLoginModal(true);
      // Clean the URL back to /portal after opening modal
      navigate('/portal', { replace: true });
    }
  }, [location.search, navigate, user]);

  // Initialize AOS (Animate On Scroll)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AOS) {
      window.AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    }
  }, []);

  const handleLoginType = (type) => {
    setShowLoginModal(false);
    const redirectPath = loginModalContext ? `/portal/${loginModalContext}` : '/portal';
    
    if (type === 'beneficiary') {
      navigate(`/beneficiary/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  };


  const handleLogout = async () => {
    await logoutWithRedirect(navigate);
  };

  // Cycle hero background images
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const intervalId = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Smooth scroll helpers
  const scrollToHero = () => {
    setActiveNavItem('home');
    if (heroRef.current) {
      heroRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToHelp = () => {
    setActiveNavItem('about');
    if (helpRef.current) {
      helpRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleContactClick = () => {
    setActiveNavItem('contact');
    setShowContactModal(true);
  };

  return (
    <div className="public-layout">
      {/* Public Navigation */}
      <Navbar bg="light" variant="light" expand="lg" className="public-navbar shadow-sm sticky-top">
        <Container>
          <Navbar.Brand as={Link} to="/portal" className="d-flex align-items-center logo-section">
            <img 
              src="/extension-services-logo.jpg" 
              alt="Extension Services Logo" 
              height="40" 
              className="me-3 logo-image"
            />
            <div className="brand-text">
              <div className="brand-title">Extension Services</div>
              <div className="brand-subtitle">Community Portal</div>
            </div>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link 
                onClick={(e) => { e.preventDefault(); scrollToHero(); }} 
                className={activeNavItem === 'home' ? 'active' : ''}
              >
                <i className="bi bi-house me-1"></i>
                Home
              </Nav.Link>
              <Nav.Link 
                onClick={(e) => { e.preventDefault(); scrollToHelp(); }}
                className={activeNavItem === 'about' ? 'active' : ''}
              >
                <i className="bi bi-person me-1"></i>
                About Us
              </Nav.Link>
              <Nav.Link 
                onClick={(e) => { e.preventDefault(); handleContactClick(); }}
                className={activeNavItem === 'contact' ? 'active' : ''}
              >
                <i className="bi bi-telephone me-1"></i>
                Contact Us
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
                    <Dropdown.Item onClick={() => setShowProfileModal(true)}>
                      <i className="bi bi-person me-2"></i>
                      Profile Management
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
                  <i className="bi bi-arrow-right me-1"></i>
                  Sign In
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section 
        className="hero-section"
        ref={heroRef}
      >
        {/* Background carousel */}
        <div className="hero-bg">
          {heroImages.map((src, idx) => (
            <div
              key={src}
              className={`hero-bg-slide${idx === heroIndex ? ' active' : ''}`}
              style={{ backgroundImage: `url(${process.env.PUBLIC_URL}${src})` }}
            />
          ))}
        </div>
        <div className="hero-content">
          <div className="hero-text" data-aos="fade-up">
            <h1 className="hero-title">Welcome to the Lipa</h1>
            <h2 className="hero-service">Extension Services Office</h2>
            <h3 className="hero-location"></h3>
            <p className="hero-description">
              Inspiring innovations, transforming lives, and building the nation through comprehensive extension programs, educational services, and community outreach initiatives.
            </p>
            <button className="hero-button" onClick={scrollToHelp}>
              <i className="bi bi-book me-2"></i>
              Learn More About Our Programs
            </button>
          </div>
          <div className="hero-indicators">
            {heroImages.map((_, idx) => (
              <div key={idx} className={`indicator${idx === heroIndex ? ' active' : ''}`}></div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="public-main">
        <section className="content-section" ref={helpRef}>
          <div className="container">
            <div className="services-header">
              <h2 className="content-title">How We Can Help</h2>
              <p className="services-subtitle">
                Discover the comprehensive services we offer to strengthen and support your community
              </p>
            </div>
            
            <div className="services-grid">
              <div className="service-card" data-aos="fade-right">
                <div className="service-icon">
                  <i className="bi bi-people"></i>
                </div>
                <h3 className="service-title">Community Programs</h3>
                <p className="service-description">
                  Engaging programs that bring communities together and foster collaboration.
                </p>
              </div>
              
              <div className="service-card" data-aos="fade-left">
                <div className="service-icon">
                  <i className="bi bi-book"></i>
                </div>
                <h3 className="service-title">Educational Services</h3>
                <p className="service-description">
                  Comprehensive learning opportunities for all ages and skill levels.
                </p>
              </div>
              
              <div className="service-card" data-aos="fade-right">
                <div className="service-icon">
                  <i className="bi bi-heart"></i>
                </div>
                <h3 className="service-title">Outreach Initiatives</h3>
                <p className="service-description">
                  Connecting with underserved communities to provide essential support.
                </p>
              </div>
              
              <div className="service-card" data-aos="fade-left">
                <div className="service-icon">
                  <i className="bi bi-lightbulb"></i>
                </div>
                <h3 className="service-title">Innovation Support</h3>
                <p className="service-description">
                  Helping communities develop innovative solutions to local challenges.
                </p>
              </div>
              
              <div className="service-card" data-aos="fade-right">
                <div className="service-icon">
                  <i className="bi bi-telephone"></i>
                </div>
                <h3 className="service-title">Consultation Services</h3>
                <p className="service-description">
                  Expert guidance and consultation for community development projects.
                </p>
              </div>
              
              <div className="service-card" data-aos="fade-left">
                <div className="service-icon">
                  <i className="bi bi-calendar-event"></i>
                </div>
                <h3 className="service-title">Event Planning</h3>
                <p className="service-description">
                  Professional event planning and coordination for community gatherings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {children}
      </main>

      {/* Footer */}
      <footer className="public-footer" style={{ backgroundColor: '#212529', color: '#ffffff' }}>
        <Container className="py-5">
          <Row className="mb-4">
            <Col md={4}>
              <div className="d-flex align-items-start">
                <img 
                  src="/batstate-u-logo.png" 
                  alt="BatState-U Logo" 
                  height="60" 
                  className="me-3"
                  style={{ borderRadius: '50%' }}
                />
                <div>
                  <h4 className="mb-1" style={{ color: '#ffffff', fontWeight: 'bold' }}>
                    Extension Services Office
                  </h4>
                  <h6 className="mb-2" style={{ color: '#ffffff' }}>
                    BatState-U Lipa
                  </h6>
                  <p className="mb-0" style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                    Connecting communities through extension programs and outreach services.
                  </p>
                </div>
              </div>
            </Col>
            <Col md={4}>
              <h5 className="mb-3" style={{ color: '#007bff' }}>
                Quick Links
              </h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link to="/portal" className="text-decoration-none" style={{ color: '#ffffff' }}>
                    Home
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/portal/announcements" className="text-decoration-none" style={{ color: '#ffffff' }}>
                    Announcements
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/portal/submit-request" className="text-decoration-none" style={{ color: '#ffffff' }}>
                    Submit Request
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/portal/feedback" className="text-decoration-none" style={{ color: '#ffffff' }}>
                    Feedback
                  </Link>
                </li>
              </ul>
            </Col>
            <Col md={4}>
              <h5 className="mb-3" style={{ color: '#007bff' }}>
                Contact Info
              </h5>
              <ul className="list-unstyled">
                <li className="mb-2" style={{ color: '#ffffff' }}>
                  <i className="bi bi-envelope me-2"></i>
                  extension.lipa@g.batstate-u.edu.ph
                </li>
                <li className="mb-2" style={{ color: '#ffffff' }}>
                  <i className="bi bi-telephone me-2"></i>
                  (043) 980-0385
                </li>
                <li className="mb-2" style={{ color: '#ffffff' }}>
                  <i className="bi bi-geo-alt me-2"></i>
                  BatState-U Lipa Campus
                </li>
              </ul>
            </Col>
          </Row>
          <hr style={{ borderColor: '#6c757d' }} />
          <Row>
            <Col>
              <p className="text-center mb-0" style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                © 2024 Extension Services Office BatState-U Lipa. All rights reserved. | 
                <Link to="/privacy" className="text-decoration-none ms-2" style={{ color: '#ffffff' }}>
                  Privacy Policy
                </Link> | 
                <Link to="/terms" className="text-decoration-none ms-2" style={{ color: '#ffffff' }}>
                  Terms of Service
                </Link>
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
            Please log in to access your account and community features.
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

      {/* Contact Us Modal */}
      <Modal show={showContactModal} onHide={() => setShowContactModal(false)} centered size="lg" className="contact-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-envelope me-2"></i>
            Contact Us
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <p className="mb-0">Get in touch with our Extension Services team. We're here to help your community grow.</p>
          </div>

          <Row className="g-3 mb-4">
            <Col md={4}>
              <div className="contact-info-card h-100">
                <div className="d-flex align-items-center">
                  <i className="bi bi-telephone text-danger fs-4 me-3"></i>
                  <div>
                    <div className="fw-semibold">Phone</div>
                    <div className="text-muted small">+1 (555) 123-4567</div>
                  </div>
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="contact-info-card h-100">
                <div className="d-flex align-items-center">
                  <i className="bi bi-envelope-at text-danger fs-4 me-3"></i>
                  <div>
                    <div className="fw-semibold">Email</div>
                    <div className="text-muted small">extension.lipa@g.batstate-u.edu.ph</div>
                  </div>
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="contact-info-card h-100">
                <div className="d-flex align-items-center">
                  <i className="bi bi-geo-alt text-danger fs-4 me-3"></i>
                  <div>
                    <div className="fw-semibold">Office</div>
                    <div className="text-muted small">BatState-U Lipa</div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={6}>
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-control" placeholder="Your full name"
                value={contactData.fullName}
                onChange={(e) => setContactData({ ...contactData, fullName: e.target.value })}
              />
            </Col>
            <Col md={6}>
              <label className="form-label">Email Address *</label>
              <input type="email" className="form-control" placeholder="your.email@example.com"
                value={contactData.email}
                onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
              />
            </Col>
            <Col md={6}>
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-control" placeholder="(555) 123-4567"
                value={contactData.phone}
                onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
              />
            </Col>
            <Col md={6}>
              <label className="form-label">Subject *</label>
              <input type="text" className="form-control" placeholder="How can we help?"
                value={contactData.subject}
                onChange={(e) => setContactData({ ...contactData, subject: e.target.value })}
              />
            </Col>
            <Col md={12}>
              <label className="form-label">Message *</label>
              <textarea rows="6" className="form-control" placeholder="Tell us more about your needs or questions..."
                value={contactData.message}
                onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowContactModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => setShowContactModal(false)}>
            <i className="bi bi-send-fill me-2"></i>
            Send Message
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Profile Management Modal */}
      <ProfileManagementModal 
        show={showProfileModal} 
        onHide={() => setShowProfileModal(false)} 
      />
    </div>
  );
};

export default PublicLayout;
