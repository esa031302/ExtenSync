import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './BeneficiaryProfile.css';

const ProfileManagementModal = ({ show, onHide }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    organization: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user && show) {
      setFormData({
        fullname: user.fullname || '',
        email: user.email || '',
        phone: user.phone || '',
        organization: user.department_college || '',
        address: user.address || ''
      });
      // Clear any previous messages when modal opens
      setError('');
      setSuccess('');
    }
  }, [user, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put('/api/users/profile', formData);
      
      // Update the user context with new data
      updateUser({
        ...user,
        ...formData
      });
      
      setSuccess('Profile updated successfully!');
      
      // Auto-hide modal after successful update
      setTimeout(() => {
        onHide();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (user) {
      setFormData({
        fullname: user.fullname || '',
        email: user.email || '',
        phone: user.phone || '',
        organization: user.department_college || '',
        address: user.address || ''
      });
      setError('');
      setSuccess('');
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    onHide();
  };

  if (!user) {
    return null;
  }

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg" 
      centered
      className="profile-management-modal"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="bi bi-person-gear me-2"></i>
          Profile Management
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-4">
        <div className="mb-3">
          <p className="text-muted mb-0">
            Manage your beneficiary account information
          </p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mb-4">
            <i className="bi bi-check-circle me-2"></i>
            {success}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email Address *</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Organization/Institution</Form.Label>
                <Form.Control
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  placeholder="Enter your organization"
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-4">
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter your address"
            />
          </Form.Group>
          
          <div className="d-grid gap-2 d-md-flex justify-content-md-end">
            <Button
              variant="outline-secondary"
              type="button"
              onClick={handleReset}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Reset
            </Button>
            
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Updating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Update Profile
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <Card className="w-100">
          <Card.Body className="py-3">
            <h6 className="text-primary mb-3">
              <i className="bi bi-info-circle me-2"></i>
              Account Information
            </h6>
            <Row>
              <Col md={6}>
                <div className="info-item mb-2">
                  <strong>Role:</strong>
                  <span className="ms-2 badge bg-primary">{user.role}</span>
                </div>
                <div className="info-item mb-2">
                  <strong>Account Status:</strong>
                  <span className="ms-2 badge bg-success">{user.account_status || 'Active'}</span>
                </div>
              </Col>
              <Col md={6}>
                <div className="info-item mb-2">
                  <strong>Member Since:</strong>
                  <span className="ms-2 text-muted">
                    {user.date_registered ? new Date(user.date_registered).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="info-item mb-2">
                  <strong>Last Login:</strong>
                  <span className="ms-2 text-muted">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Modal.Footer>
    </Modal>
  );
};

export default ProfileManagementModal;
