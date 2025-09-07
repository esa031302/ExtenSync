import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './CommunityHome.css';

const CommunityHome = () => {
  const features = [
    {
      icon: 'bi-bullhorn',
      title: 'Announcements',
      description: 'Stay updated with the latest news and important information from our community outreach programs.',
      link: '/portal/announcements',
      color: 'primary'
    },
    {
      icon: 'bi-send',
      title: 'Submit Request',
      description: 'Request community services, educational programs, or technical assistance for your organization.',
      link: '/portal/request',
      color: 'info'
    },
    {
      icon: 'bi-chat-heart',
      title: 'Share Feedback',
      description: 'Help us improve our services by sharing your experience and suggestions.',
      link: '/portal/feedback',
      color: 'success'
    }
  ];

  const stats = [
    { number: '500+', label: 'Community Requests Served' },
    { number: '50+', label: 'Active Programs' },
    { number: '25+', label: 'Partner Organizations' },
    { number: '95%', label: 'Satisfaction Rate' }
  ];

  return (
    <Container className="community-home-container">
      {/* Hero Section */}
      <Row className="hero-section">
        <Col lg={8} className="mx-auto text-center">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to ExtenSync
              <span className="text-danger"> Community Portal</span>
            </h1>
            <p className="hero-subtitle">
              Connecting communities through extension programs, educational services, and outreach initiatives. 
              We're here to serve and support your community needs.
            </p>
            <div className="hero-buttons">
              <Button 
                as={Link} 
                to="/portal/request" 
                variant="link" 
                size="lg" 
                className="me-3 mb-2 navbar-style-btn"
              >
                <i className="bi bi-send me-2"></i>
                Submit a Request
              </Button>
              <Button 
                as={Link} 
                to="/portal/announcements" 
                variant="link" 
                size="lg" 
                className="mb-2 navbar-style-btn"
              >
                <i className="bi bi-bullhorn me-2"></i>
                View Announcements
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Features Section */}
      <Row className="features-section">
        <Col>
          <h2 className="section-title text-center mb-5">
            How We Can Help
          </h2>
        </Col>
      </Row>
      
      <Row className="mb-5">
        {features.map((feature, index) => (
          <Col lg={4} md={6} key={index} className="mb-4">
            <Card className={`feature-card h-100 border-0 shadow-sm feature-${feature.color}`}>
              <Card.Body className="text-center p-4">
                <div className={`feature-icon bg-${feature.color} text-white rounded-circle mx-auto mb-3`}>
                  <i className={`bi ${feature.icon}`}></i>
                </div>
                <Card.Title className="h5 mb-3">{feature.title}</Card.Title>
                <Card.Text className="text-muted mb-4">
                  {feature.description}
                </Card.Text>
                <Button 
                  as={Link} 
                  to={feature.link} 
                  variant={feature.color} 
                  className="w-100"
                >
                  Get Started
                  <i className="bi bi-arrow-right ms-2"></i>
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>


    </Container>
  );
};

export default CommunityHome;
