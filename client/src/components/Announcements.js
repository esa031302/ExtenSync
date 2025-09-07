import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, InputGroup, Form } from 'react-bootstrap';
import axios from 'axios';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  const categories = [
    'All',
    'General',
    'Program Updates',
    'Event Announcements',
    'Service Changes',
    'Community News',
    'Important Notices',
    'Training Opportunities',
    'Partnership Updates'
  ];

  const priorities = ['All', 'High', 'Medium', 'Low'];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/community/announcements');
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      setError('Failed to load announcements. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || announcement.category === filterCategory;
    const matchesPriority = filterPriority === 'All' || announcement.priority === filterPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'General': return 'bi-info-circle';
      case 'Program Updates': return 'bi-arrow-up-circle';
      case 'Event Announcements': return 'bi-calendar-event';
      case 'Service Changes': return 'bi-gear';
      case 'Community News': return 'bi-newspaper';
      case 'Important Notices': return 'bi-exclamation-triangle';
      case 'Training Opportunities': return 'bi-book';
      case 'Partnership Updates': return 'bi-people';
      default: return 'bi-bullhorn';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRecent = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  if (loading) {
    return (
      <Container className="announcements-container">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading announcements...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="announcements-container">
      <Row>
        <Col>
          <div className="announcements-header mb-4">
            <h1 className="text-primary mb-2">
              <i className="bi bi-bullhorn me-3"></i>
              Community Announcements
            </h1>
            <p className="text-muted">
              Stay updated with the latest news, updates, and important information from our community outreach programs.
            </p>
          </div>
        </Col>
      </Row>

      {error && (
        <Row>
          <Col>
            <Alert variant="danger" className="mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <Button variant="outline-danger" size="sm" className="ms-3" onClick={fetchAnnouncements}>
                <i className="bi bi-arrow-clockwise me-1"></i>
                Retry
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Row className="mb-4">
        <Col lg={4} md={6} className="mb-3">
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        
        <Col lg={4} md={6} className="mb-3">
          <Form.Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Form.Select>
        </Col>
        
        <Col lg={4} md={6} className="mb-3">
          <Form.Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            {priorities.map(priority => (
              <option key={priority} value={priority}>{priority} Priority</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* Announcements List */}
      <Row>
        {filteredAnnouncements.length === 0 ? (
          <Col>
            <Card className="text-center py-5">
              <Card.Body>
                <i className="bi bi-inbox display-1 text-muted mb-3"></i>
                <h4 className="text-muted">No announcements found</h4>
                <p className="text-muted">
                  {searchTerm || filterCategory !== 'All' || filterPriority !== 'All'
                    ? 'Try adjusting your search criteria'
                    : 'No announcements have been posted yet'
                  }
                </p>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Col lg={6} xl={4} key={announcement.id} className="mb-4">
              <Card className={`announcement-card h-100 ${isRecent(announcement.created_at) ? 'recent' : ''}`}>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i className={`bi ${getCategoryIcon(announcement.category)} me-2 text-primary`}></i>
                    <Badge bg={getPriorityBadgeVariant(announcement.priority)} className="me-2">
                      {announcement.priority}
                    </Badge>
                    <Badge bg="secondary">
                      {announcement.category}
                    </Badge>
                  </div>
                  {isRecent(announcement.created_at) && (
                    <Badge bg="success" className="pulse">
                      New
                    </Badge>
                  )}
                </Card.Header>
                
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="h5 mb-3">
                    {announcement.title}
                  </Card.Title>
                  
                  <Card.Text className="flex-grow-1">
                    {announcement.content.length > 150 
                      ? `${announcement.content.substring(0, 150)}...`
                      : announcement.content
                    }
                  </Card.Text>
                  
                  <div className="mt-auto">
                    <div className="announcement-meta text-muted small mb-3">
                      <i className="bi bi-calendar me-1"></i>
                      {formatDate(announcement.created_at)}
                    </div>
                    
                    {announcement.content.length > 150 && (
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => {
                          // In a real app, this would open a modal or navigate to a detailed view
                          alert('Full announcement content:\n\n' + announcement.content);
                        }}
                      >
                        <i className="bi bi-eye me-1"></i>
                        Read More
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Statistics */}
      <Row className="mt-5">
        <Col>
          <Card className="bg-light">
            <Card.Body>
              <Row className="text-center">
                <Col md={3}>
                  <div className="stat-item">
                    <h3 className="text-primary mb-1">{announcements.length}</h3>
                    <p className="text-muted mb-0">Total Announcements</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="stat-item">
                    <h3 className="text-success mb-1">
                      {announcements.filter(a => isRecent(a.created_at)).length}
                    </h3>
                    <p className="text-muted mb-0">Recent (7 days)</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="stat-item">
                    <h3 className="text-warning mb-1">
                      {announcements.filter(a => a.priority === 'High').length}
                    </h3>
                    <p className="text-muted mb-0">High Priority</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="stat-item">
                    <h3 className="text-info mb-1">
                      {new Set(announcements.map(a => a.category)).size}
                    </h3>
                    <p className="text-muted mb-0">Categories</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Announcements;
