import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Feedback.css';

const Feedback = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: user?.department_college || '',
    feedbackType: '',
    subject: '',
    rating: '',
    message: '',
    allowPublicDisplay: false,
    preferredContactMethod: 'Email'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const feedbackTypes = [
    'Service Quality',
    'Program Effectiveness',
    'Staff Performance',
    'Communication',
    'Accessibility',
    'Timeliness',
    'Overall Experience',
    'Suggestion for Improvement',
    'Complaint',
    'Compliment',
    'Other'
  ];

  const ratings = [
    { value: '5', label: 'Excellent', color: 'success' },
    { value: '4', label: 'Very Good', color: 'info' },
    { value: '3', label: 'Good', color: 'warning' },
    { value: '2', label: 'Fair', color: 'warning' },
    { value: '1', label: 'Poor', color: 'danger' }
  ];

  const contactMethods = ['Email', 'Phone', 'SMS'];

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullname || '',
        email: user.email || '',
        phone: user.phone || '',
        organization: user.department_college || ''
      }));
    }
  }, [user]);

  const handleLoginType = (type) => {
    setShowLoginModal(false);
    if (type === 'beneficiary') {
      navigate('/beneficiary/login');
    } else if (type === 'employee') {
      navigate('/login');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.feedbackType) {
      newErrors.feedbackType = 'Feedback type is required';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.rating) {
      newErrors.rating = 'Please provide a rating';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const response = await axios.post('/api/community/feedback', {
        ...formData,
        status: 'New',
        submittedAt: new Date().toISOString()
      });
      
      setSubmitStatus({
        type: 'success',
        message: 'Thank you for your feedback! Your input helps us improve our services.'
      });
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        organization: '',
        feedbackType: '',
        subject: '',
        rating: '',
        message: '',
        allowPublicDisplay: false,
        preferredContactMethod: 'Email'
      });
      
    } catch (error) {
      setSubmitStatus({
        type: 'danger',
        message: error.response?.data?.error || 'Failed to submit feedback. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="feedback-container">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h2 className="mb-0">
                <i className="bi bi-chat-heart me-2"></i>
                Community Feedback
              </h2>
              <p className="mb-0 mt-2 opacity-75">
                Share your experience and help us improve our community outreach services
              </p>
            </Card.Header>
            
            <Card.Body className="p-4">
              {submitStatus && (
                <Alert variant={submitStatus.type} className="mb-4">
                  <i className={`bi bi-${submitStatus.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                  {submitStatus.message}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        isInvalid={!!errors.fullName}
                        placeholder="Enter your full name"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.fullName}
                      </Form.Control.Feedback>
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
                        isInvalid={!!errors.email}
                        placeholder="Enter your email address"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number *</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        isInvalid={!!errors.phone}
                        placeholder="Enter your phone number"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone}
                      </Form.Control.Feedback>
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
                        placeholder="Enter your organization (optional)"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Feedback Type *</Form.Label>
                      <Form.Select
                        name="feedbackType"
                        value={formData.feedbackType}
                        onChange={handleInputChange}
                        isInvalid={!!errors.feedbackType}
                      >
                        <option value="">Select feedback type</option>
                        {feedbackTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.feedbackType}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Overall Rating *</Form.Label>
                      <div className="rating-buttons">
                        {ratings.map(rating => (
                          <Button
                            key={rating.value}
                            variant={formData.rating === rating.value ? rating.color : 'outline-secondary'}
                            size="sm"
                            className="me-2 mb-2"
                            onClick={() => setFormData(prev => ({ ...prev, rating: rating.value }))}
                            type="button"
                          >
                            <i className="bi bi-star-fill me-1"></i>
                            {rating.value} - {rating.label}
                          </Button>
                        ))}
                      </div>
                      {errors.rating && (
                        <div className="text-danger small mt-1">{errors.rating}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Subject *</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    isInvalid={!!errors.subject}
                    placeholder="Brief subject of your feedback"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.subject}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Your Feedback *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    isInvalid={!!errors.message}
                    placeholder="Please share your detailed feedback, suggestions, or experiences..."
                  />
                  <Form.Text className="text-muted">
                    Minimum 10 characters. Be specific about your experience to help us improve.
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.message}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Preferred Contact Method</Form.Label>
                      <Form.Select
                        name="preferredContactMethod"
                        value={formData.preferredContactMethod}
                        onChange={handleInputChange}
                      >
                        {contactMethods.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="allowPublicDisplay"
                        checked={formData.allowPublicDisplay}
                        onChange={handleInputChange}
                        label="Allow this feedback to be displayed publicly (anonymized)"
                        className="mt-4"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => setFormData({
                      fullName: '',
                      email: '',
                      phone: '',
                      organization: '',
                      feedbackType: '',
                      subject: '',
                      rating: '',
                      message: '',
                      allowPublicDisplay: false,
                      preferredContactMethod: 'Email'
                    })}
                    disabled={isSubmitting}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Reset Form
                  </Button>
                  
                  <Button
                    variant="success"
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          <Card className="mt-4 shadow-sm">
            <Card.Body>
              <h5 className="text-success mb-3">
                <i className="bi bi-heart me-2"></i>
                Why your feedback matters
              </h5>
              <Row>
                <Col md={4}>
                  <div className="text-center mb-3">
                    <div className="benefit-icon bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2">
                      <i className="bi bi-graph-up"></i>
                    </div>
                    <h6>Improve Services</h6>
                    <p className="small text-muted">Help us enhance our community outreach programs</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center mb-3">
                    <div className="benefit-icon bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2">
                      <i className="bi bi-people"></i>
                    </div>
                    <h6>Better Experience</h6>
                    <p className="small text-muted">Your input helps us serve the community better</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center mb-3">
                    <div className="benefit-icon bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2">
                      <i className="bi bi-lightbulb"></i>
                    </div>
                    <h6>Innovation</h6>
                    <p className="small text-muted">Suggest new ideas and improvements</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Login Required Modal */}
      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-lock me-2"></i>
            Login Required
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="mb-4">You need to be logged in to submit feedback.</p>
          <div className="d-grid gap-3">
            <Button 
              variant="outline-primary" 
              size="lg"
              onClick={() => handleLoginType('beneficiary')}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-people me-3"></i>
              <div className="text-start">
                <div className="fw-bold">Login as Beneficiary</div>
                <small className="text-muted">Community members and organizations</small>
              </div>
            </Button>
            <Button 
              variant="outline-success" 
              size="lg"
              onClick={() => handleLoginType('employee')}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-briefcase me-3"></i>
              <div className="text-start">
                <div className="fw-bold">Login as Employee</div>
                <small className="text-muted">Staff, coordinators, and administrators</small>
              </div>
            </Button>
          </div>
          <div className="mt-4">
            <p className="mb-2">Don't have an account?</p>
            <Button 
              variant="link" 
              onClick={() => {
                setShowLoginModal(false);
                navigate('/beneficiary/register');
              }}
              className="text-decoration-none"
            >
              <i className="bi bi-person-plus me-1"></i>
              Register as Beneficiary
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Feedback;
