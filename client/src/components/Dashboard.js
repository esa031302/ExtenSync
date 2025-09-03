import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ProjectStatusChart from './ProjectStatusChart';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myProjects: 0,
    projectsByStatus: null,
    totalProjects: 0
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Use the new dashboard stats endpoint
      const response = await axios.get('http://localhost:5000/api/projects/stats/dashboard');
      const data = response.data;
      
      if (data.role === 'Extension Coordinator') {
        setStats({
          myProjects: data.totalProjects,
          projectsByStatus: data.projectsByStatus,
          totalProjects: data.totalProjects
        });
      } else {
        // For other roles, fall back to the old method
        const projectsResponse = await axios.get('http://localhost:5000/api/projects', { params: { mine: 1 } });
        const projects = projectsResponse.data || [];
        const myProjects = Array.isArray(projects) ? projects.length : 0;
        setStats({ 
          myProjects,
          projectsByStatus: null,
          totalProjects: myProjects
        });
      }
    } catch (error) {
      console.error('Error fetching project stats:', error);
    }
  };

  return (
    <>
      <Row>
        <Col>
          <h1 className="h3 mb-2">Welcome back, {user?.fullname}! 👋</h1>
          <p className="text-muted mb-4">Here's what's happening with your account today.</p>
        </Col>
      </Row>

      {/* User-focused Stats */}
      <Row className="mb-4">
        {user?.role === 'Extension Coordinator' && stats.projectsByStatus ? (
          // Extension Coordinator gets a bar chart
          <Col lg={8} md={10}>
            <ProjectStatusChart projectsByStatus={stats.projectsByStatus} />
          </Col>
        ) : (
          // Other roles get the simple card
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
        )}
      </Row>

      {/* Future: add more user-centric insights */}
    </>
  );
};

export default Dashboard;
