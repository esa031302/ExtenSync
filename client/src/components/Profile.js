import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Image } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    fullname: user?.fullname || '',
    email: user?.email || '',
    role: user?.role || '',
    department_college: user?.department_college || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');
  const fileInputRef = useRef(null);
  
  // Signature upload states
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [signatureError, setSignatureError] = useState('');
  const [signatureSuccess, setSignatureSuccess] = useState('');
  const signatureInputRef = useRef(null);

  // Debug: Log user data to see what's available
  useEffect(() => {
    console.log('Profile - User data:', user);
    console.log('Profile - Account status:', user?.account_status);
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(`/users/${user.user_id}`, formData);
      
      // Fetch the complete user data to ensure all fields are included
      const userResponse = await axios.get('/auth/me');
      updateUser(userResponse.data);
      
      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File size must be less than 5MB');
      return;
    }

    setPhotoLoading(true);
    setPhotoError('');
    setPhotoSuccess('');

    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      const response = await axios.post(`/users/${user.user_id}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Fetch updated user data
      const userResponse = await axios.get('/auth/me');
      updateUser(userResponse.data);
      
      setPhotoSuccess('Profile photo updated successfully!');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setPhotoError(error.response?.data?.error || 'Failed to upload profile photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!user?.profile_photo) {
      setPhotoError('No profile photo to delete');
      return;
    }

    setPhotoLoading(true);
    setPhotoError('');
    setPhotoSuccess('');

    try {
      await axios.delete(`/users/${user.user_id}/photo`);
      
      // Fetch updated user data
      const userResponse = await axios.get('/auth/me');
      updateUser(userResponse.data);
      
      setPhotoSuccess('Profile photo deleted successfully!');
    } catch (error) {
      setPhotoError(error.response?.data?.error || 'Failed to delete profile photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSignatureError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSignatureError('File size must be less than 5MB');
      return;
    }

    setSignatureLoading(true);
    setSignatureError('');
    setSignatureSuccess('');

    const formData = new FormData();
    formData.append('signature', file);

    try {
      const response = await axios.post(`/users/${user.user_id}/signature`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Fetch updated user data
      const userResponse = await axios.get('/auth/me');
      updateUser(userResponse.data);
      
      setSignatureSuccess('Digital signature updated successfully!');
      if (signatureInputRef.current) {
        signatureInputRef.current.value = '';
      }
    } catch (error) {
      setSignatureError(error.response?.data?.error || 'Failed to upload digital signature');
    } finally {
      setSignatureLoading(false);
    }
  };

  const handleSignatureDelete = async () => {
    if (!user?.signature_path) {
      setSignatureError('No digital signature to delete');
      return;
    }

    setSignatureLoading(true);
    setSignatureError('');
    setSignatureSuccess('');

    try {
      await axios.delete(`/users/${user.user_id}/signature`);
      
      // Fetch updated user data
      const userResponse = await axios.get('/auth/me');
      updateUser(userResponse.data);
      
      setSignatureSuccess('Digital signature deleted successfully!');
    } catch (error) {
      setSignatureError(error.response?.data?.error || 'Failed to delete digital signature');
    } finally {
      setSignatureLoading(false);
    }
  };

  const roles = [
    'Extension Coordinator',
    'Extension Head', 
    'GAD',
    'Vice Chancellor',
    'Chancellor',
    'Admin'
  ];

  const getStatusBadgeColor = (status) => {
    if (!status) return 'success'; // Default to green for missing status
    
    const statusLower = status.toLowerCase().trim();
    
    switch (statusLower) {
      case 'active':
        return 'success'; // Green text for active status
      case 'inactive':
        return 'danger';  // Red text
      case 'pending':
        return 'warning'; // Yellow text
      default:
        return 'success'; // Default to green text for unknown statuses
    }
  };

  return (
    <div className="bg-light min-vh-100 py-4">
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            {/* Profile Photo Section */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">
                  <i className="bi bi-camera me-2"></i>
                  Profile Photo
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                {photoError && (
                  <Alert variant="danger" dismissible onClose={() => setPhotoError('')}>
                    {photoError}
                  </Alert>
                )}

                {photoSuccess && (
                  <Alert variant="success" dismissible onClose={() => setPhotoSuccess('')}>
                    {photoSuccess}
                  </Alert>
                )}

                <Row className="align-items-center">
                  <Col md={4} className="text-center mb-3 mb-md-0">
                    <div className="profile-photo-display">
                      {user?.profile_photo ? (
                        <div>
                          <Image 
                            src={`http://localhost:5000${user.profile_photo}`}
                            alt="Profile" 
                            roundedCircle 
                            width={120} 
                            height={120}
                            className="border"
                            onError={(e) => {
                              console.error('Image failed to load:', e.target.src);
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                          <div className="profile-photo-placeholder" style={{ display: 'none' }}>
                            <i className="bi bi-person-fill"></i>
                            <small className="d-block text-muted mt-2">Photo failed to load</small>
                          </div>
                        </div>
                      ) : (
                        <div className="profile-photo-placeholder">
                          <i className="bi bi-person-fill"></i>
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col md={8}>
                    <div className="mb-3">
                      <Form.Label>Upload New Photo</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        ref={fileInputRef}
                        disabled={photoLoading}
                      />
                      <Form.Text className="text-muted">
                        Supported formats: JPG, PNG, GIF. Max size: 5MB
                      </Form.Text>
                    </div>
                    
                    {user?.profile_photo && (
                      <div>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={handlePhotoDelete}
                          disabled={photoLoading}
                        >
                          {photoLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-trash me-2"></i>
                              Delete Photo
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <h4 className="mb-0">
                  <i className="bi bi-person-circle me-2"></i>
                  Profile Settings
                </h4>
              </Card.Header>
              <Card.Body className="p-4">
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    {success}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="fullname"
                          value={formData.fullname}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your email"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Digital Signature Section */}
                  <Row>
                    <Col md={12}>
                      <div className="signature-section border-top pt-4 mt-4">
                        <h6 className="mb-3">
                          <i className="bi bi-pen me-2"></i>
                          Digital Signature
                        </h6>
                        
                        {signatureError && (
                          <Alert variant="danger" dismissible onClose={() => setSignatureError('')} className="mb-3">
                            {signatureError}
                          </Alert>
                        )}

                        {signatureSuccess && (
                          <Alert variant="success" dismissible onClose={() => setSignatureSuccess('')} className="mb-3">
                            {signatureSuccess}
                          </Alert>
                        )}

                        <Row className="align-items-center">
                          <Col md={4} className="text-center mb-3 mb-md-0">
                            <div className="signature-display">
                              {user?.signature_path ? (
                                <div>
                                  <Image 
                                    src={`http://localhost:5000${user.signature_path}`}
                                    alt="Digital Signature" 
                                    width={200} 
                                    height={80}
                                    className="border rounded"
                                    style={{ objectFit: 'contain', backgroundColor: '#f8f9fa' }}
                                    onError={(e) => {
                                      console.error('Signature image failed to load:', e.target.src);
                                      e.target.style.display = 'none';
                                      e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="signature-placeholder" style={{ display: 'none' }}>
                                    <i className="bi bi-pen"></i>
                                    <small className="d-block text-muted mt-2">Signature failed to load</small>
                                  </div>
                                </div>
                              ) : (
                                <div className="signature-placeholder">
                                  <i className="bi bi-pen"></i>
                                  <small className="d-block text-muted mt-2">No signature uploaded</small>
                                </div>
                              )}
                            </div>
                          </Col>
                          <Col md={8}>
                            <div className="mb-3">
                              <Form.Label>Upload Digital Signature</Form.Label>
                              <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleSignatureUpload}
                                ref={signatureInputRef}
                                disabled={signatureLoading}
                              />
                              <Form.Text className="text-muted">
                                Supported formats: JPG, PNG, GIF. Max size: 5MB. Recommended: 400x160px
                              </Form.Text>
                            </div>
                            
                            {user?.signature_path && (
                              <div>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={handleSignatureDelete}
                                  disabled={signatureLoading}
                                >
                                  {signatureLoading ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-trash me-2"></i>
                                      Delete Signature
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Role</Form.Label>
                        <Form.Select
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select your role</option>
                          {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Department/College</Form.Label>
                        <Form.Control
                          type="text"
                          name="department_college"
                          value={formData.department_college}
                          onChange={handleChange}
                          placeholder="Enter department/college"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        'Update Profile'
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Account Information */}
            <Card className="border-0 shadow-sm mt-4">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Account Information
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label text-muted small">User ID</label>
                      <p className="mb-0 fw-bold">{user?.user_id}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label text-muted small">Account Created</label>
                      <p className="mb-0 fw-bold">
                        {user?.date_registered ? new Date(user.date_registered).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label text-muted small">Last Updated</label>
                      <p className="mb-0 fw-bold">
                        {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label text-muted small">Account Status</label>
                                             <p className="mb-0">
                         <span className={`text-${getStatusBadgeColor(user?.account_status)} fw-bold`}>
                           {user?.account_status || 'Active'}
                         </span>
                       </p>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Security Section */}
            <Card className="border-0 shadow-sm mt-4">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">
                  <i className="bi bi-shield-check me-2"></i>
                  Security
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="mb-1">Password</h6>
                    <p className="text-muted small mb-0">Last changed: Never</p>
                  </div>
                  <Button variant="outline-secondary" size="sm">
                    Change Password
                  </Button>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Two-Factor Authentication</h6>
                    <p className="text-muted small mb-0">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline-primary" size="sm">
                    Enable 2FA
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Profile;
