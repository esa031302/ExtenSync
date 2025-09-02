import React from 'react';
import { Card, Button, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    <Card className="user-profile-card">
      <Card.Body className="p-4">
        <div className="profile-container">
          {/* Left side - Profile Photo */}
          <div className="profile-photo-section">
            <div className="profile-photo-container">
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
                    <i className="bi bi-person-fill"></i>
                  </div>
                </div>
              ) : (
                <div className="profile-photo">
                  <i className="bi bi-person-fill"></i>
                </div>
              )}
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="edit-profile-tooltip">Edit Profile</Tooltip>}
              >
                <Button 
                  variant="success" 
                  size="sm" 
                  className="edit-profile-btn"
                  onClick={handleEditProfile}
                >
                  <i className="bi bi-pencil-fill"></i>
                </Button>
              </OverlayTrigger>
            </div>
          </div>

          {/* Right side - User Details */}
          <div className="profile-details-section">
            <div className="user-name">
              <i className="bi bi-person-fill me-2"></i>
              {user?.fullname || 'User Name'}
            </div>
            
            <hr className="profile-divider" />
            
            <div className="user-info-list">
              <div className="info-item">
                <i className="bi bi-building me-2"></i>
                <span>{user?.department_college || 'Department'}</span>
              </div>
              
              <div className="info-item">
                <i className="bi bi-person-badge me-2"></i>
                <span>{user?.role || 'Role'}</span>
              </div>
              
                             <div className="info-item">
                 <div className={`status-dot status-${getStatusColor(user?.account_status)}`}></div>
                 <span className={`text-${getStatusColor(user?.account_status)} fw-bold`}>
                   {user?.account_status ? user.account_status.toUpperCase() : 'ACTIVE'}
                 </span>
               </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default UserProfile;
