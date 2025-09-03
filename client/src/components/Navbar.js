import React, { useState, useEffect } from 'react';
import { Navbar, Container, Button, OverlayTrigger, Tooltip, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import axios from 'axios';
import './Navbar.css';

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    logout();
    navigate('/');
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

  const getDayOfWeek = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <Navbar bg="light" variant="light" expand="lg" className="custom-navbar shadow-sm">
      <Container fluid>
        {/* Logo on the left */}
        <Navbar.Brand as={Link} to="/dashboard" className="logo-section">
          <img 
            src="/extensynclogo.png" 
            alt="ExtenSync Logo" 
            height="75" 
            className="logo-image"
          />
        </Navbar.Brand>

        {/* Right side content */}
        <div className="navbar-right-content">
          {/* Icons and logout button */}
          <div className="navbar-icons">
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="conversations-tooltip">Conversations</Tooltip>}
            >
              <Button variant="link" className="icon-button" as={Link} to="/conversations">
                <i className="bi bi-chat-dots-fill"></i>
              </Button>
            </OverlayTrigger>

            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="calendar-tooltip">Project Calendar</Tooltip>}
            >
              <Button variant="link" className="icon-button" as={Link} to="/calendar">
                <i className="bi bi-calendar-event"></i>
              </Button>
            </OverlayTrigger>



            <Dropdown align="end">
              <OverlayTrigger placement="bottom" overlay={<Tooltip id="notification-tooltip">Notifications</Tooltip>}>
                <Dropdown.Toggle as={Button} variant="link" className="icon-button position-relative">
                  <i className="bi bi-bell-fill"></i>
                  {notifications.some(n => n.status === 'Unread') && (
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                      <span className="visually-hidden">New alerts</span>
                    </span>
                  )}
                </Dropdown.Toggle>
              </OverlayTrigger>
              <Dropdown.Menu style={{ minWidth: 360 }}>
                <Dropdown.Header>Notifications</Dropdown.Header>
                {notifications.length === 0 && (
                  <Dropdown.ItemText className="text-muted">No notifications</Dropdown.ItemText>
                )}
                {notifications.map((n) => (
                  <Dropdown.Item key={n.notif_id} as={Link} to={n.link || '/projects'} onClick={async (e) => {
                    try { await axios.post(`/notifications/${n.notif_id}/read`); } catch {}
                  }}>
                    <div className="d-flex flex-column">
                      <span className={n.status === 'Unread' ? 'fw-semibold' : ''}>{n.message}</span>
                      <small className="text-muted">{new Date(n.created_at).toLocaleString()}</small>
                    </div>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
            
            {user && (
              <OverlayTrigger
                placement="bottom"
                overlay={<Tooltip id="logout-tooltip">Logout</Tooltip>}
              >
                <Button 
                  variant="link" 
                  className="icon-button logout-icon-button"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right"></i>
                </Button>
              </OverlayTrigger>
            )}
          </div>

          {/* Date and time */}
          <div className="datetime-section">
            <div className="day-text">{getDayOfWeek(currentTime)}</div>
            <div className="date-text">{formatDate(currentTime)}</div>
            <div className="time-text">{formatTime(currentTime)}</div>
          </div>
        </div>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
