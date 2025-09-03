import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState(null);
  const { user } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'bi-house-fill',
      path: '/dashboard'
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: 'bi-diagram-3-fill',
      path: '/projects'
    },
    {
      id: 'evaluations',
      label: 'Evaluations',
      icon: 'bi-star-fill',
      path: '/evaluations'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'bi-bar-chart-fill',
      path: '/reports'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: 'bi-file-text-fill',
      path: '/documents'
    },
    {
      id: 'users',
      label: 'Users',
      icon: 'bi-people-fill',
      path: '/user-management'
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: 'bi-list-check',
      path: '/logs'
    }
  ];

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
  };

  const visibleItems = navItems.filter(item => {
    if (item.id === 'users') {
      return user?.role === 'Admin';
    }
    return true;
  });

  return (
    <div className="sidebar-container">
      <Nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <Nav.Item key={item.id} className="sidebar-nav-item">
            <Link
              to={item.path}
              className={`sidebar-link ${activeItem === item.id ? 'active' : ''}`}
              onClick={() => handleItemClick(item.id)}
            >
              <div className="sidebar-icon-container">
                <i className={`${item.icon} sidebar-icon`}></i>
              </div>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          </Nav.Item>
        ))}
      </Nav>
    </div>
  );
};

export default Sidebar;
