import React, { useState, useEffect } from 'react';
import { Navbar, Container, Button, OverlayTrigger, Tooltip, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import axios from 'axios';
import './Navbar.css';

const NavigationBar = () => {
  const { user, logoutWithRedirect } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => document.body.classList.contains('sidebar-collapsed'));
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch (_) {
      return 'light';
    }
  });


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Apply theme to body
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    try {
      localStorage.setItem('theme', theme);
    } catch (_) {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const { data } = await axios.get('/notifications');
        setNotifications(data);
      } catch (e) {
        // ignore
      }
    };
    if (user) {
      loadNotifs();
      const interval = setInterval(loadNotifs, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logoutWithRedirect(navigate);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSectionTitle = (pathname) => {
    if (!pathname) return '';
    const map = [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/projects', label: 'Projects' },
      { path: '/evaluations', label: 'Evaluations' },
      { path: '/reports', label: 'Reports' },
      { path: '/documents', label: 'Documents' },
      { path: '/user-management', label: 'Users' },
      { path: '/logs', label: 'Logs' },
      { path: '/conversations', label: 'Messages' },
      { path: '/calendar', label: 'Calendar' },
      { path: '/notifications', label: 'Notifications' },
      { path: '/profile', label: 'Account' }
    ];
    const found = map.find(m => pathname === m.path || pathname.startsWith(m.path + '/'));
    return found ? found.label : '';
  };
  const sectionTitle = getSectionTitle(location.pathname);

  return (
    <Navbar bg="white" variant="light" expand="lg" className="custom-navbar">
      <Container fluid>
        {/* Left controls: burger + brand text */}
        <div className="d-flex align-items-center me-2">
          <Button
            variant="link"
            className="icon-button me-2"
            aria-label="Toggle sidebar"
            onClick={() => {
              document.body.classList.toggle('sidebar-collapsed');
              setSidebarCollapsed(document.body.classList.contains('sidebar-collapsed'));
              // Notify layout to recompute widths
              window.dispatchEvent(new Event('sidebar-toggle'));
            }}
          >
            <i className="bi bi-list"></i>
          </Button>
          <div className="d-flex align-items-center">
            {sectionTitle && (
              <span className="ms-2 fw-semibold">{sectionTitle}</span>
            )}
          </div>
        </div>

        {/* Right side content */}
        <div className="navbar-right-content">
          {/* Quick-access icons to the LEFT of date/time */}
          <div className="navbar-icons">
            <Button as={Link} to="/portal" variant="link" className="icon-button" aria-label="Community Portal">
              <i className="bi bi-globe"></i>
            </Button>
            <Button as={Link} to="/conversations" variant="link" className="icon-button" aria-label="Messages">
              <i className="bi bi-chat-dots"></i>
            </Button>
            <Button as={Link} to="/calendar" variant="link" className="icon-button" aria-label="Calendar">
              <i className="bi bi-calendar3"></i>
            </Button>
            <Dropdown align="end">
              <Dropdown.Toggle as={Button} variant="link" className="icon-button position-relative no-caret" aria-label="Notifications">
                <i className="bi bi-bell"></i>
                {notifications.some(n => n.status === 'Unread') && (
                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                    <span className="visually-hidden">New alerts</span>
                  </span>
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ minWidth: 360 }}>
                <div className="d-flex justify-content-between align-items-center px-3 py-2">
                  <div className="fw-semibold">Notifications</div>
                </div>
                {notifications.length === 0 && (
                  <Dropdown.ItemText className="text-muted">No notifications</Dropdown.ItemText>
                )}
                {notifications.slice(0, 5).map((n) => (
                  <Dropdown.Item key={n.notif_id} as={Link} to={n.link || '/projects'}>
                    <div className="d-flex flex-column">
                      <span className={n.status === 'Unread' ? 'fw-semibold' : ''}>{n.message}</span>
                      <small className="text-muted">{new Date(n.created_at).toLocaleString()}</small>
                    </div>
                  </Dropdown.Item>
                ))}
                {notifications.length > 5 && (
                  <Dropdown.ItemText className="text-muted text-center small">
                    ... and {notifications.length - 5} more
                  </Dropdown.ItemText>
                )}
                {notifications.length > 0 && <Dropdown.Divider />}
                {notifications.length > 0 && (
                  <Dropdown.Item as={Link} to="/notifications" className="text-center fw-semibold text-primary">
                    <i className="bi bi-eye me-2"></i>
                    View All Notifications
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* Date and time */}
          <div className="datetime-section">
            <div className="date-text">{formatDate(currentTime)}</div>
            <div className="time-text">{formatTime(currentTime)}</div>
          </div>

          {/* User dropdown placed next to date/time */}
          {user && (
            <Dropdown align="end">
              <Dropdown.Toggle as={Button} variant="link" className="icon-button d-flex align-items-center">
                {user?.profile_photo ? (
                  <img
                    src={`http://localhost:5000${user.profile_photo}`}
                    alt="Profile"
                    className="me-2"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #fff'
                    }}
                    onError={(e) => {
                      console.error('Navbar profile image failed to load:', e.target.src);
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'inline-block';
                    }}
                  />
                ) : null}
                <span
                  className="me-2"
                  style={{
                    display: user?.profile_photo ? 'none' : 'inline-block',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #334155, #0ea5e9)'
                  }}
                ></span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Header>
                  <div className="text-center">
                    <div className="fw-bold">{user.fullname}</div>
                    <small className="text-muted">{user.role}</small>
                  </div>
                </Dropdown.Header>
                <Dropdown.Item onClick={toggleTheme} className="d-flex align-items-center">
                  <i className={`me-2 ${theme === 'dark' ? 'bi bi-moon-stars' : 'bi bi-brightness-high'}`}></i>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  <span className="ms-auto form-check form-switch">
                    <input className="form-check-input" type="checkbox" readOnly checked={theme === 'dark'} />
                  </span>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item as={Link} to="/profile">
                  <i className="bi bi-person me-2"></i>
                  Account
                </Dropdown.Item>
                <Dropdown.Item onClick={() => logoutWithRedirect(navigate)} className="text-danger">
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
