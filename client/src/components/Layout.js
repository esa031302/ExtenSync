import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import UserProfile from './UserProfile';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return children; // Don't show layout for login page
  }

  return (
    <Container className="mt-4">
      {/* User Profile Section - Always shown */}
      <Row>
        <Col>
          <UserProfile />
        </Col>
      </Row>

      {/* Sidebar Navigation - Always shown */}
      <Row>
        <Col>
          <Sidebar />
        </Col>
      </Row>

      {/* Main Content Area */}
      <Row>
        <Col>
          {children}
        </Col>
      </Row>
    </Container>
  );
};

export default Layout;
