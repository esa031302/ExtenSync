import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Row, Col, Card, Table, Badge, Button, OverlayTrigger, Tooltip, Form, InputGroup, Modal, Alert } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification, NotificationMessages } from '../hooks/useNotification';
import './Projects.css';

const statusVariant = (status) => {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'danger';
    case 'On-Going':
      return 'warning';
    case 'Completed':
      return 'info';
    default:
      return 'secondary';
  }
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [completionReason, setCompletionReason] = useState('');
  const [isEarlyCompletion, setIsEarlyCompletion] = useState(false);
  const [error, setError] = useState('');
  const { notification, showSuccess, showError, dismiss } = useNotification();
  const { user } = useAuth();

  const canPropose = user && ['Extension Coordinator','Extension Head','GAD','Admin'].includes(user.role);
  const location = useLocation();
  const successMessage = location.state?.success;

  // Helper function to check if current date allows starting a project
  const canStartProject = (project) => {
    if (!project.start_date) return true; // If no start date, can start anytime
    const today = new Date();
    const startDate = new Date(project.start_date);
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    return today >= startDate;
  };

  // Helper function to check if user can complete a project
  const canCompleteProject = (project) => {
    // Anyone can complete anytime - no date restrictions
    return true;
  };

  // Handle starting a project
  const handleStartProject = async (projectId) => {
    if (!window.confirm('Start this project? This will change its status to On-Going.')) return;
    try {
      const { data } = await axios.put(`http://localhost:5000/api/projects/${projectId}/start`);
      setProjects(prev => prev.map(row => 
        row.project_id === projectId ? data : row
      ));
      showSuccess(NotificationMessages.PROJECT_STARTED);
    } catch (error) {
      console.error('Start project failed:', error);
      const errorMsg = error.response?.data?.error || 'Failed to start project. Please try again.';
      showError(errorMsg);
    }
  };

  // Handle opening the complete project modal
  const handleCompleteProject = (projectId) => {
    const project = projects.find(p => p.project_id === projectId);
    if (!project) {
      setError('Project not found');
      return;
    }

    // Check if completing early (before end date)
    const today = new Date();
    const endDate = new Date(project.end_date);
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const isEarly = project.end_date && today < endDate;
    setSelectedProject(project);
    setIsEarlyCompletion(isEarly);
    setCompletionReason('');
    setError('');
    setShowCompleteModal(true);
  };

  // Handle submitting the completion
  const submitCompletion = async () => {
    try {
      setError('');
      
      // Validate early completion reason if needed
      if (isEarlyCompletion && !completionReason.trim()) {
        setError('A reason is required for early completion.');
        return;
      }
      
      const requestBody = {};
      if (isEarlyCompletion && completionReason.trim()) {
        requestBody.early_completion_reason = completionReason.trim();
      }
      
      const { data } = await axios.put(`http://localhost:5000/api/projects/${selectedProject.project_id}/complete`, requestBody);
      setProjects(prev => prev.map(row => 
        row.project_id === selectedProject.project_id ? data : row
      ));
      setShowCompleteModal(false);
      setSelectedProject(null);
      
      // Show success message
      if (isEarlyCompletion) {
        showSuccess(NotificationMessages.PROJECT_COMPLETED_EARLY);
      } else {
        showSuccess(NotificationMessages.PROJECT_COMPLETED);
      }
    } catch (error) {
      console.error('Complete project failed:', error);
      const errorMsg = error.response?.data?.error || 'Failed to complete project. Please try again.';
      showError(errorMsg);
      setError(errorMsg);
    }
  };

  // Get unique statuses for filter dropdown
  const getUniqueStatuses = () => {
    const statuses = [...new Set(projects.map(p => p.status))];
    return ['All', ...statuses];
  };

  // Filter projects based on search term and status
  useEffect(() => {
    let filtered = projects;

    // Filter by search term (title or coordinator name)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(term) ||
        (project.coordinator_fullname && project.coordinator_fullname.toLowerCase().includes(term))
      );
    }

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/projects');
        console.log('Fetched projects:', data);
        console.log('Current user:', user);
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects', err);
        showError('Failed to load projects. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user, showError]);

  // Show success message from navigation if exists
  useEffect(() => {
    if (successMessage) {
      showSuccess(successMessage);
    }
  }, [successMessage, showSuccess]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
  };

  const hasActiveFilters = searchTerm.trim() || statusFilter !== 'All';

  return (
    <div className="projects-container">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0">Projects</h3>
            {canPropose && (
              <Button as={Link} to="/projects/new" variant="success">
                <i className="bi bi-plus-lg me-2"></i>
                Propose Project
              </Button>
            )}
          </div>

          {/* Search and Filter Section */}
          <Card className="shadow-sm mb-3 search-filter-card">
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Search Projects</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-search"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search by title or coordinator name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Filter by Status</Form.Label>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      {getUniqueStatuses().map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="w-100"
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Clear
                  </Button>
                </Col>
              </Row>
              
              {/* Results Summary */}
              {hasActiveFilters && (
                <div className="mt-3 results-summary">
                  <small className="text-muted">
                    Showing {filteredProjects.length} of {projects.length} projects
                    {searchTerm.trim() && ` matching "${searchTerm}"`}
                    {statusFilter !== 'All' && ` with status "${statusFilter}"`}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Body>
              {notification.show && (
                <Alert variant={notification.variant} dismissible onClose={dismiss}>
                  {notification.message}
                </Alert>
              )}
              {loading ? (
                <div>Loading...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-4 empty-state">
                  <i className="bi bi-inbox display-4 text-muted"></i>
                  <p className="mt-2 text-muted">
                    {hasActiveFilters 
                      ? 'No projects match your current filters. Try adjusting your search criteria.'
                      : 'No projects found.'
                    }
                  </p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Tracking Number</th>
                      <th>Title</th>
                      <th>Coordinator</th>
                      <th>Status</th>
                      <th>Date Submitted</th>
                      <th style={{ width: 200 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((p) => (
                      <tr key={p.project_id}>
                        <td>{p.project_id}</td>
                        <td>{p.title}</td>
                        <td>{p.coordinator_fullname || '—'}</td>
                        <td>
                          <Badge bg={statusVariant(p.status)}>{p.status}</Badge>
                        </td>
                        <td>{new Date(p.date_submitted).toLocaleString()}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-view-${p.project_id}`}>View</Tooltip>}>
                              <Button as={Link} to={`/projects/${p.project_id}`} variant="link" className="icon-only-btn icon-view" aria-label="View project">
                                <i className="bi bi-eye"></i>
                              </Button>
                            </OverlayTrigger>
                            
                            {/* Start Project Button - For approved projects */}
                            {(user && 
                              p.status === 'Approved' && 
                              (p.coordinator_id === user.user_id || ['Extension Head','GAD','Vice Chancellor','Chancellor','Admin'].includes(user.role))
                            ) && (
                              <OverlayTrigger 
                                placement="bottom" 
                                overlay={
                                  <Tooltip id={`tt-start-${p.project_id}`}>
                                    {canStartProject(p) ? 'Start Project' : `Can start on ${new Date(p.start_date).toLocaleDateString()}`}
                                  </Tooltip>
                                }
                              >
                                <Button 
                                  onClick={() => handleStartProject(p.project_id)}
                                  variant="link" 
                                  className="icon-only-btn icon-start" 
                                  aria-label="Start project"
                                  disabled={!canStartProject(p)}
                                >
                                  <i className="bi bi-play-circle-fill text-success"></i>
                                </Button>
                              </OverlayTrigger>
                            )}

                            {/* End Project Button - For on-going projects */}
                            {(user && 
                              p.status === 'On-Going' && 
                              (p.coordinator_id === user.user_id || ['Extension Head','GAD','Vice Chancellor','Chancellor','Admin'].includes(user.role))
                            ) && (
                              <OverlayTrigger 
                                placement="bottom" 
                                overlay={
                                  <Tooltip id={`tt-complete-${p.project_id}`}>
                                    End Project
                                  </Tooltip>
                                }
                              >
                                <Button 
                                  onClick={() => handleCompleteProject(p.project_id)}
                                  variant="link" 
                                  className="icon-only-btn icon-complete" 
                                  aria-label="End project"
                                  disabled={!canCompleteProject(p)}
                                >
                                  <i className="bi bi-check-circle-fill text-info"></i>
                                </Button>
                              </OverlayTrigger>
                            )}

                            {/* Edit Button - For elevated roles OR project coordinator on rejected projects */}
                            {(user && (
                              ['Extension Head','GAD','Vice Chancellor','Chancellor','Admin'].includes(user.role) ||
                              (p.coordinator_id === user.user_id && p.status === 'Rejected')
                            )) && (
                              <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-edit-${p.project_id}`}>Edit</Tooltip>}>
                                <Button as={Link} to={`/projects/${p.project_id}/edit`} variant="link" className="icon-only-btn icon-edit" aria-label="Edit project">
                                  <i className="bi bi-pencil"></i>
                                </Button>
                              </OverlayTrigger>
                            )}

                            {/* Delete Button - For elevated roles */}
                            {(user && ['Extension Head','GAD','Vice Chancellor','Chancellor','Admin'].includes(user.role)) && (
                              <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-del-${p.project_id}`}>Delete</Tooltip>}>
                                <Button onClick={async () => {
                                  if (!window.confirm('Delete this project?')) return;
                                  try {
                                    await axios.delete(`http://localhost:5000/api/projects/${p.project_id}`);
                                    setProjects(prev => prev.filter(row => row.project_id !== p.project_id));
                                    showSuccess(NotificationMessages.PROJECT_DELETED);
                                  } catch (e) {
                                    console.error('Delete failed', e);
                                    const errorMsg = e.response?.data?.error || 'Failed to delete project. Please try again.';
                                    showError(errorMsg);
                                  }
                                }} variant="link" className="icon-only-btn icon-delete" aria-label="Delete project">
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </OverlayTrigger>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Complete Project Modal */}
      <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-check-circle-fill text-info me-2"></i>
            Complete Project
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h6 className="text-muted mb-2">Project Details</h6>
            <div className="bg-light p-3 rounded">
              <strong>{selectedProject?.title}</strong>
              <div className="text-muted mt-1">
                <small>
                  <i className="bi bi-person-fill me-1"></i>
                  Coordinator: {selectedProject?.coordinator_fullname}
                </small>
              </div>
              {selectedProject?.end_date && (
                <div className="text-muted mt-1">
                  <small>
                    <i className="bi bi-calendar-event me-1"></i>
                    Scheduled End Date: {new Date(selectedProject.end_date).toLocaleDateString()}
                  </small>
                </div>
              )}
            </div>
          </div>

          {isEarlyCompletion ? (
            <Alert variant="warning" className="d-flex align-items-start">
              <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
              <div>
                <strong>Early Completion Detected</strong>
                <div className="mt-1">
                  You are completing this project before its scheduled end date 
                  ({new Date(selectedProject?.end_date).toLocaleDateString()}). 
                  Please provide a reason for early completion.
                </div>
              </div>
            </Alert>
          ) : (
            <Alert variant="info" className="d-flex align-items-start">
              <i className="bi bi-info-circle-fill me-2 mt-1"></i>
              <div>
                <strong>Confirm Project Completion</strong>
                <div className="mt-1">
                  Are you sure you want to mark this project as completed? 
                  This action will change the project status and cannot be easily undone.
                </div>
              </div>
            </Alert>
          )}

          {isEarlyCompletion && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                <i className="bi bi-chat-quote me-1"></i>
                Reason for Early Completion *
              </Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4}
                value={completionReason}
                onChange={(e) => setCompletionReason(e.target.value)}
                placeholder="Please explain why this project is being completed before its scheduled end date..."
                className="form-control"
              />
              <Form.Text className="text-muted">
                This information will be logged and may be reviewed by administrators.
              </Form.Text>
            </Form.Group>
          )}

          {error && (
            <Alert variant="danger" className="mt-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={() => setShowCompleteModal(false)}>
            <i className="bi bi-x-lg me-1"></i>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={submitCompletion}
            disabled={isEarlyCompletion && !completionReason.trim()}
          >
            <i className="bi bi-check-circle-fill me-1"></i>
            {isEarlyCompletion ? 'Complete Early' : 'Complete Project'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Projects;


