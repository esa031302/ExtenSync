import React, { useState, useEffect } from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if sidebar is collapsed based on width
  useEffect(() => {
    const checkSidebarState = () => {
      const sidebar = document.querySelector('.sidebar-column');
      if (sidebar) {
        const width = sidebar.offsetWidth;
        // Consider collapsed if width is less than 200px
        setIsCollapsed(width < 200);
      }
    };

    // Check on mount
    checkSidebarState();

    // Listen for resize events
    const resizeObserver = new ResizeObserver(checkSidebarState);
    const sidebar = document.querySelector('.sidebar-column');
    if (sidebar) {
      resizeObserver.observe(sidebar);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const getStatusColor = (status) => {
    if (!status) return 'success'; // Default to green for active
    
    const statusLower = status.toLowerCase().trim();
    
    switch (statusLower) {
      case 'active':
        return 'success'; // Use green for active status
      case 'inactive':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'success'; // Default to green for unknown statuses
    }
  };

  const handleEditProfile = () => {
    navigate('/profile');
  };

  return (
    <div className={`user-profile-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Profile Photo */}
      <div className="profile-photo-section">
        {user?.profile_photo ? (
          <div className="profile-photo">
            <img 
              src={`http://localhost:5000${user.profile_photo}`}
              alt="Profile" 
              className="profile-photo-image"
              onError={(e) => {
                console.error('Image failed to load:', e.target.src);
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="profile-photo-fallback" style={{ display: 'none' }}>
              <i className="bi bi-person"></i>
            </div>
          </div>
        ) : (
          <div className="profile-photo">
            <i className="bi bi-person"></i>
          </div>
        )}
      </div>

      {/* User Details - Only show when expanded */}
      {!isCollapsed && (
        <div className="profile-details-section">
          <div className="user-name">
            {user?.fullname || 'System Administrator'}
          </div>
          
          <div className="user-info-list">
            <div className="info-item">
              <div className="status-dot status-danger"></div>
              <span>{user?.department_college || 'Administration'}</span>
            </div>
            
            <div className="info-item">
              <span>{user?.role || 'Admin'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed State - Show only role and status */}
      {isCollapsed && (
        <OverlayTrigger
          placement="right"
          overlay={
            <Tooltip id="profile-details-tooltip">
              <div style={{ textAlign: 'left' }}>
                <div><strong>{user?.fullname || 'System Administrator'}</strong></div>
                <div>{user?.department_college || 'Administration'}</div>
                <div>{user?.role || 'Admin'}</div>
              </div>
            </Tooltip>
          }
        >
          <div className="profile-details-section collapsed" role="button" aria-label="Profile details">
            <div className="info-item">
              <span>{user?.role || 'Admin'}</span>
            </div>
          </div>
        </OverlayTrigger>
      )}

      {/* Status Button - Always show */}
      <div className="status-button">
        <div className="status-dot-white"></div>
        <span>ACTIVE</span>
      </div>
    </div>
  );
};

export default UserProfile;
