import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState(null);
  const { user, logoutWithRedirect } = useAuth();
  const navigate = useNavigate();

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
      icon: 'bi-file-earmark-text',
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

  const handleLogout = () => {
    logoutWithRedirect(navigate);
  };

  const visibleItems = navItems.filter(item => {
    if (item.id === 'users') {
      return user?.role === 'Admin';
    }
    return true;
  });

  return (
    <div className="sidebar-container">
      {/* Brand + Search like the mockup */}
      <div className="sidebar-brand d-flex align-items-center gap-2 px-2 mb-2">
        <span className="brand-text fw-bold">Extension Services, Lipa</span>
      </div>
      <div className="sidebar-search px-2 mb-3">
        <div className="position-relative">
          <i className="bi bi-search sidebar-search-icon"></i>
          <input className="form-control form-control-sm sidebar-search-input" placeholder="Search..." />
        </div>
      </div>

      <div className="sidebar-nav-title text-uppercase px-2 mb-2">Navigation</div>

      <Nav className="sidebar-nav flex-column">
        {visibleItems.map((item) => (
          <Nav.Item key={item.id} className="sidebar-nav-item">
            <Link
              to={item.path}
              className={`sidebar-link ${activeItem === item.id ? 'active' : ''}`}
              onClick={() => handleItemClick(item.id)}
              title={item.label}
            >
              <i className={`${item.icon} sidebar-icon`}></i>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          </Nav.Item>
        ))}
        {/* Account button integrated with other navigation items */}
        <Nav.Item className="sidebar-nav-item">
          <Link
            to="/profile"
            className={`sidebar-link ${activeItem === 'profile' ? 'active' : ''}`}
            onClick={() => handleItemClick('profile')}
            title="Account"
          >
            <i className="bi bi-person sidebar-icon"></i>
            <span className="sidebar-label">Account</span>
          </Link>
        </Nav.Item>
      </Nav>

      {/* Logout Section */}
      <div className="sidebar-logout-section">
        <Nav className="sidebar-nav flex-column">
          <Nav.Item className="sidebar-nav-item">
            <button
              className="sidebar-link sidebar-logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              <i className="bi bi-box-arrow-right sidebar-icon"></i>
              <span className="sidebar-label">Logout</span>
            </button>
          </Nav.Item>
        </Nav>
      </div>
    </div>
  );
};

export default Sidebar;
