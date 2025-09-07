import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Notifications.css';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/notifications');
        setNotifications(data);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => 
          n.notif_id === notificationId 
            ? { ...n, status: 'Read' }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => n.status === 'Unread').length;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading notifications...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col md={8} className="mx-auto">
          {/* Header */}
          <div className="mb-4">
            <h2 className="mb-1">
              <i className="bi bi-bell-fill me-2"></i>
              All Notifications
            </h2>
            <p className="text-muted mb-0">
              {unreadCount > 0 
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up! No unread notifications.'
              }
            </p>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <i className="bi bi-bell h1 text-muted"></i>
                <h4 className="text-muted mt-3">No notifications yet</h4>
                <p className="text-muted">
                  When you receive notifications, they'll appear here.
                </p>
              </Card.Body>
            </Card>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <Card 
                  key={notification.notif_id} 
                  className={`mb-3 notification-card ${
                    notification.status === 'Unread' ? 'border-primary' : ''
                  }`}
                  style={{ 
                    transition: 'all 0.2s ease',
                    cursor: notification.link ? 'pointer' : 'default',
                    borderLeftWidth: notification.status === 'Unread' ? '4px' : '1px',
                    borderLeftColor: notification.status === 'Unread' ? '#0d6efd' : '#dee2e6'
                  }}
                  onClick={() => {
                    if (notification.link) {
                      markAsRead(notification.notif_id);
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        {/* Notification Content */}
                        <div className="d-flex align-items-start mb-2">
                          <div className="flex-grow-1">
                            <p 
                              className={`mb-1 ${
                                notification.status === 'Unread' 
                                  ? 'fw-semibold text-primary' 
                                  : 'text-dark'
                              }`}
                              style={{ lineHeight: '1.4' }}
                            >
                              {notification.message}
                            </p>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {formatDate(notification.created_at)}
                            </small>
                          </div>
                          
                          {/* Unread Badge */}
                          {notification.status === 'Unread' && (
                            <Badge bg="primary" className="ms-2">
                              New
                            </Badge>
                          )}
                        </div>
                        
                        {/* Action Buttons - Only show Mark as Read for notifications without links */}
                        {!notification.link && notification.status === 'Unread' && (
                          <div className="d-flex gap-2 mt-2">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.notif_id);
                              }}
                            >
                              <i className="bi bi-check2 me-1"></i>
                              Mark as Read
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Notifications;
