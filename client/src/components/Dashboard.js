import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import UserProfile from './UserProfile';
import Sidebar from './Sidebar';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myProjects: 0
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Ask API for only my projects to avoid double filtering and role differences
      const projectsResponse = await axios.get('/projects', { params: { mine: 1 } });
      const projects = projectsResponse.data || [];
      const myId = user?.user_id;
      const myProjects = Array.isArray(projects) ? projects.length : 0;
      setStats({ myProjects });
    } catch (error) {
      console.error('Error fetching project stats:', error);
    }
  };

  return (
    <Container className="mt-4">
      {/* User Profile Section */}
      <Row>
        <Col>
          <UserProfile />
        </Col>
      </Row>

      {/* Sidebar Navigation */}
      <Row>
        <Col>
          <Sidebar />
        </Col>
      </Row>

      <Row>
        <Col>
          <h1 className="h3 mb-2">Welcome back, {user?.fullname}! 👋</h1>
          <p className="text-muted mb-4">Here's what's happening with your account today.</p>
        </Col>
      </Row>

      {/* User-focused Stat */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <div className="text-info mb-2">
                <i className="bi bi-folder-fill fs-1"></i>
              </div>
              <h3 className="mb-1">{stats.myProjects}</h3>
              <p className="text-muted mb-0">Your Projects</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Future: add more user-centric insights */}
    </Container>
  );
};

export default Dashboard;
