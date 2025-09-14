import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myProjects: 0,
    projectsByStatus: null,
    totalProjects: 0,
    totalPrograms: 0,
    totalActivities: 0,
    initiativesByType: null
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects/stats/dashboard');
      const data = response.data;
      setStats({
        myProjects: data.totalProjects || 0,
        projectsByStatus: data.projectsByStatus || null,
        totalProjects: data.totalProjects || 0,
        totalPrograms: data.totalPrograms || 0,
        totalActivities: data.totalActivities || 0,
        initiativesByType: data.initiativesByType || null
      });
    } catch (error) {
      console.error('Error fetching project stats:', error);
    }
  };

  const firstName = (user?.fullname || '').split(' ')[0] || 'Administrator';

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* Welcome header */}
      <div className="mb-3">
        <h1 className="h3 mb-1">Welcome back, {user?.fullname || 'Administrator'}</h1>
        <p className="text-muted mb-0">A quick glance at your extension initiatives.</p>
      </div>

      {/* Summary stat cards only (mockup layout) */}
      <div className="row g-3 row-cols-1 row-cols-md-3">
        <div className="col">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small">Total Programs</div>
                <div className="fs-2 fw-semibold">{stats.totalPrograms}</div>
              </div>
              <i className="bi bi-diagram-3-fill fs-1 text-primary"></i>
            </Card.Body>
          </Card>
        </div>
        <div className="col">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small">Total Projects</div>
                <div className="fs-2 fw-semibold">{stats.initiativesByType?.Project || stats.totalProjects || 0}</div>
              </div>
              <i className="bi bi-folder-fill fs-1 text-danger"></i>
            </Card.Body>
          </Card>
        </div>
        <div className="col">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small">Total Activities</div>
                <div className="fs-2 fw-semibold">{stats.totalActivities}</div>
              </div>
              <i className="bi bi-star-fill fs-1 text-warning"></i>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
