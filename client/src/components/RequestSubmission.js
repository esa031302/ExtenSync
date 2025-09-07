import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RequestSubmission.css';

const RequestSubmission = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: user?.department_college || '',
    requestType: '',
    subject: '',
    description: '',
    priority: 'Medium',
    preferredContactMethod: 'Email'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const requestTypes = [
    'Community Service Request',
    'Educational Program Request',
    'Technical Assistance Request',
    'Resource Request',
    'Partnership Proposal',
    'Event Collaboration',
    'Other'
  ];

  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    
    if (!formData.requestType) {
      newErrors.requestType = 'Request type is required';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters long';
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
      const response = await axios.post('/api/community/requests', {
        ...formData,
        status: 'Pending',
        submittedAt: new Date().toISOString()
      });
      
      setSubmitStatus({
        type: 'success',
        message: 'Your request has been submitted successfully! We will contact you within 2-3 business days.'
      });
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        organization: '',
        requestType: '',
        subject: '',
        description: '',
        priority: 'Medium',
        preferredContactMethod: 'Email'
      });
      
    } catch (error) {
      setSubmitStatus({
        type: 'danger',
        message: error.response?.data?.error || 'Failed to submit request. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="request-submission-container">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h2 className="mb-0">
                <i className="bi bi-send me-2"></i>
                Community Request Submission
              </h2>
              <p className="mb-0 mt-2 opacity-75">
                Submit your community outreach requests and we'll get back to you soon
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
                      <Form.Label>Request Type *</Form.Label>
                      <Form.Select
                        name="requestType"
                        value={formData.requestType}
                        onChange={handleInputChange}
                        isInvalid={!!errors.requestType}
                      >
                        <option value="">Select request type</option>
                        {requestTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.requestType}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Priority Level</Form.Label>
                      <Form.Select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                      >
                        {priorities.map(priority => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </Form.Select>
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
                    placeholder="Brief subject of your request"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.subject}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    isInvalid={!!errors.description}
                    placeholder="Please provide detailed information about your request..."
                  />
                  <Form.Text className="text-muted">
                    Minimum 20 characters. Be as specific as possible to help us assist you better.
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-4">
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
                
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => setFormData({
                      fullName: '',
                      email: '',
                      phone: '',
                      organization: '',
                      requestType: '',
                      subject: '',
                      description: '',
                      priority: 'Medium',
                      preferredContactMethod: 'Email'
                    })}
                    disabled={isSubmitting}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Reset Form
                  </Button>
                  
                  <Button
                    variant="primary"
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
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          <Card className="mt-4 shadow-sm">
            <Card.Body>
              <h5 className="text-primary mb-3">
                <i className="bi bi-info-circle me-2"></i>
                What happens after submission?
              </h5>
              <Row>
                <Col md={4}>
                  <div className="text-center mb-3">
                    <div className="step-icon bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2">
                      <i className="bi bi-1-circle-fill"></i>
                    </div>
                    <h6>Review</h6>
                    <p className="small text-muted">We review your request within 24 hours</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center mb-3">
                    <div className="step-icon bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2">
                      <i className="bi bi-2-circle-fill"></i>
                    </div>
                    <h6>Contact</h6>
                    <p className="small text-muted">We contact you within 2-3 business days</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center mb-3">
                    <div className="step-icon bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2">
                      <i className="bi bi-3-circle-fill"></i>
                    </div>
                    <h6>Action</h6>
                    <p className="small text-muted">We work together to fulfill your request</p>
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
          <p className="mb-4">You need to be logged in to submit a community request.</p>
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

export default RequestSubmission;
