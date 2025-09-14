import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="bg-light min-vh-100">
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                Welcome to ExtenSync
              </h1>
              <p className="lead mb-4">
                A modern full-stack application built with React, Node.js, Express, and MySQL. 
                Experience seamless user authentication and management.
              </p>
              {!user ? (
                <div className="d-flex gap-3">
                  <Button as={Link} to="/register" variant="light" size="lg">
                    Get Started
                  </Button>
                  <Button as={Link} to="/login" variant="outline-light" size="lg">
                    Sign In
                  </Button>
                </div>
              ) : (
                <Button as={Link} to="/dashboard" variant="light" size="lg">
                  Go to Dashboard
                </Button>
              )}
            </Col>
            <Col lg={6} className="text-center">
              <div className="bg-white bg-opacity-10 rounded p-4">
                <i className="bi bi-lightning-charge display-1"></i>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <Row className="text-center mb-5">
          <Col>
            <h2 className="display-5 fw-bold mb-3">Features</h2>
            <p className="lead text-muted">
              Discover what makes ExtenSync powerful and user-friendly
            </p>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-shield-check text-primary fs-3"></i>
                </div>
                <Card.Title>Secure Authentication</Card.Title>
                <Card.Text>
                  JWT-based authentication with password hashing and secure session management.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-database text-success fs-3"></i>
                </div>
                <Card.Title>MySQL Database</Card.Title>
                <Card.Text>
                  Robust MySQL database with optimized queries and proper indexing for performance.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-bootstrap text-info fs-3"></i>
                </div>
                <Card.Title>Modern UI</Card.Title>
                <Card.Text>
                  Beautiful and responsive interface built with Bootstrap 5 for the best user experience.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Tech Stack Section */}
      <div className="bg-white py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold mb-3">Tech Stack</h2>
              <p className="lead text-muted">
                Built with modern technologies for optimal performance
              </p>
            </Col>
          </Row>

          <Row className="g-4 justify-content-center">
            <Col xs={6} md={2} className="text-center">
              <div className="p-3">
                <i className="bi bi-filetype-js text-warning display-4"></i>
                <p className="mt-2 fw-bold">Node.js</p>
              </div>
            </Col>
            <Col xs={6} md={2} className="text-center">
              <div className="p-3">
                <i className="bi bi-lightning text-primary display-4"></i>
                <p className="mt-2 fw-bold">Express</p>
              </div>
            </Col>
            <Col xs={6} md={2} className="text-center">
              <div className="p-3">
                <i className="bi bi-database text-success display-4"></i>
                <p className="mt-2 fw-bold">MySQL</p>
              </div>
            </Col>
            <Col xs={6} md={2} className="text-center">
              <div className="p-3">
                <i className="bi bi-filetype-jsx text-info display-4"></i>
                <p className="mt-2 fw-bold">React</p>
              </div>
            </Col>
            <Col xs={6} md={2} className="text-center">
              <div className="p-3">
                <i className="bi bi-bootstrap text-purple display-4"></i>
                <p className="mt-2 fw-bold">Bootstrap</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Home;
