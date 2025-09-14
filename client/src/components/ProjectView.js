import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Container, Card, Row, Col, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { useNotification, NotificationMessages } from '../hooks/useNotification';

const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDecision, setShowDecision] = useState(false);
  const [decision, setDecision] = useState('Approved');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionReason, setCompletionReason] = useState('');
  const [isEarlyCompletion, setIsEarlyCompletion] = useState(false);
  const { notification, showSuccess, showError, dismiss } = useNotification();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`/projects/${id}`);
        setProject(data);
      } catch (e) {
        // If API denies access, send back to projects list
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const elevated = user && ['Extension Head','GAD','Vice Chancellor','Chancellor','Admin'].includes(user.role);

  // Helper functions for project actions
  const canStartProject = (project) => {
    if (!project.start_date) return true; // If no start date, can start anytime
    const today = new Date();
    const startDate = new Date(project.start_date);
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    return today >= startDate;
  };

  const canCompleteProject = (project) => {
    // Anyone can complete anytime - no date restrictions
    return true;
  };

  const submitDecision = async () => {
    try {
      setError('');
      
      // Client-side validation for rejection remarks
      if (decision === 'Rejected' && (!remarks || !remarks.trim())) {
        showError('Remarks are required when rejecting a project');
        return;
      }
      
      await axios.post(`/projects/${id}/decision`, { decision, remarks });
      const { data } = await axios.get(`/projects/${id}`);
      setProject(data);
      setShowDecision(false);
      setRemarks('');
      
      // Show success message
      if (decision === 'Approved') {
        showSuccess(NotificationMessages.PROJECT_APPROVED);
      } else if (decision === 'Rejected') {
        showSuccess(NotificationMessages.PROJECT_REJECTED);
      }
    } catch (e) {
      showError(e.response?.data?.error || 'Failed to submit decision. Please try again.');
    }
  };

  // Handle starting a project
  const handleStartProject = async () => {
    try {
      setError('');
      const { data } = await axios.put(`/projects/${id}/start`);
      setProject(data);
      showSuccess(NotificationMessages.PROJECT_STARTED);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to start project. Please try again.';
      showError(errorMsg);
      setError(errorMsg);
    }
  };

  // Handle opening the complete project modal
  const handleCompleteProject = () => {
    // Check if completing early (before end date)
    const today = new Date();
    const endDate = new Date(project.end_date);
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const isEarly = project.end_date && today < endDate;
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
      
      const { data } = await axios.put(`/projects/${id}/complete`, requestBody);
      setProject(data);
      setShowCompleteModal(false);
      
      // Show success message
      setError('');
      if (isEarlyCompletion) {
        showSuccess(NotificationMessages.PROJECT_COMPLETED_EARLY);
      } else {
        showSuccess(NotificationMessages.PROJECT_COMPLETED);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to complete project. Please try again.';
      showError(errorMsg);
      setError(errorMsg);
    }
  };

  // Handle reproposing a rejected project
  const handleRepropose = async () => {
    try {
      setError('');
      const { data } = await axios.put(`/projects/${id}/repropose`);
      setProject(data);
      showSuccess(NotificationMessages.PROJECT_REPROPOSED);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to repropose project. Please try again.';
      showError(errorMsg);
      setError(errorMsg);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!project) return <div className="p-4">Not found</div>;

  const asList = (value) => {
    if (!value) return [];
    try { const arr = JSON.parse(value); return Array.isArray(arr) ? arr : []; } catch { return []; }
  };

  const renderMonitoringEvaluationTable = (monitoringData) => {
    if (!monitoringData) return <div>—</div>;
    
    let tableData;
    try {
      tableData = typeof monitoringData === 'string' ? JSON.parse(monitoringData) : monitoringData;
    } catch {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{monitoringData}</div>;
    }

    if (!tableData || typeof tableData !== 'object') {
      return <div>—</div>;
    }

    const objectiveTypes = [
      { key: 'impact', label: 'Impact-' },
      { key: 'outcome', label: 'Outcome-' },
      { key: 'output', label: 'Output-' },
      { key: 'activities', label: 'Activities-' },
      { key: 'input', label: 'Input-' }
    ];

    return (
      <div className="table-responsive">
        <style>
          {`
            .me-view-table {
              table-layout: fixed !important;
              width: 100% !important;
              border-collapse: collapse !important;
            }
            .me-view-table th:last-child,
            .me-view-table td:last-child {
              border-right: 1px solid #dee2e6 !important;
            }
            .me-view-table th:last-child::after,
            .me-view-table td:last-child::after {
              display: none !important;
              content: none !important;
            }
            .me-view-table th:last-child::before,
            .me-view-table td:last-child::before {
              display: none !important;
              content: none !important;
            }
            .me-view-table *::after {
              display: none !important;
              content: none !important;
            }
            .me-view-table *::before {
              display: none !important;
              content: none !important;
            }
            .me-view-table th,
            .me-view-table td {
              position: relative !important;
            }
            .me-view-table th:last-child,
            .me-view-table td:last-child {
              position: relative !important;
            }
            .me-view-table th:last-child::after,
            .me-view-table td:last-child::after {
              position: absolute !important;
              top: 0 !important;
              right: 0 !important;
              width: 0 !important;
              height: 0 !important;
              display: none !important;
              content: none !important;
            }
          `}
        </style>
        <table className="table table-bordered table-sm me-view-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead className="table-primary">
            <tr>
              <th style={{ width: '8%', fontSize: '0.9rem', padding: '12px 8px' }}>Objectives</th>
              <th style={{ width: '15%', fontSize: '0.9rem', padding: '12px 8px' }}>Performance Indicators</th>
              <th style={{ width: '12%', fontSize: '0.9rem', padding: '12px 8px' }}>Baseline Data</th>
              <th style={{ width: '12%', fontSize: '0.9rem', padding: '12px 8px' }}>Performance Target</th>
              <th style={{ width: '12%', fontSize: '0.9rem', padding: '12px 8px' }}>Data Source</th>
              <th style={{ width: '12%', fontSize: '0.9rem', padding: '12px 8px' }}>Collection Method</th>
              <th style={{ width: '12%', fontSize: '0.9rem', padding: '12px 8px' }}>Frequency of Data Collection</th>
              <th style={{ width: '17%', fontSize: '0.9rem', padding: '12px 8px' }}>Office/Persons Responsible</th>
            </tr>
          </thead>
          <tbody>
            {objectiveTypes.map(({ key, label }) => {
              const rowData = tableData[key] || {};
              return (
                <tr key={key} style={{ verticalAlign: 'top' }}>
                  <td className="fw-bold bg-light" style={{ padding: '12px 8px', fontSize: '0.9rem', textAlign: 'center' }}>
                    {label}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                    {rowData.objectives || '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                    {rowData.performance_indicators || '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                    {rowData.baseline_data || '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                    {rowData.performance_target || '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                    {rowData.data_source || '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                    {rowData.collection_method || '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                    {rowData.frequency || '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                    {rowData.responsible || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

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

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">{project.title}</h3>
        <div className="d-flex gap-2">
          {/* Approve/Reject buttons - only for Pending projects */}
          {elevated && project.status === 'Pending' && (
            <>
              <Button size="sm" variant="success" onClick={() => { setDecision('Approved'); setShowDecision(true); }}>
                <i className="bi bi-check-lg me-1"></i>Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => { setDecision('Rejected'); setShowDecision(true); }}>
                <i className="bi bi-x-lg me-1"></i>Reject
              </Button>
            </>
          )}

          {/* Start Project button - for project coordinator or elevated roles on approved projects */}
          {user && project.status === 'Approved' && (
            project.coordinator_id === user.id || 
            ['Extension Head','GAD','Vice Chancellor','Chancellor','Admin'].includes(user.role)
          ) && (
            <Button 
              size="sm" 
              variant="success" 
              onClick={handleStartProject}
              disabled={!canStartProject(project)}
              title={canStartProject(project) ? 'Start Project' : `Can start on ${new Date(project.start_date).toLocaleDateString()}`}
            >
              <i className="bi bi-play-circle-fill me-1"></i>
              Start Project
            </Button>
          )}

          {/* End Project button - for project coordinator or elevated roles on ongoing projects */}
          {user && 
            project.status === 'On-Going' && 
            (project.coordinator_id === user.id || elevated) && (
            <Button 
              size="sm" 
              variant="info" 
              onClick={handleCompleteProject}
              disabled={!canCompleteProject(project)}
              title="End Project"
            >
              <i className="bi bi-check-circle-fill me-1"></i>
              End Project
            </Button>
          )}

          {/* Edit button - for elevated roles OR project coordinator on rejected projects */}
          {(elevated || (user && project.coordinator_id === user.user_id && project.status === 'Rejected')) && (
            <Button as={Link} to={`/projects/${project.project_id}/edit`} variant="outline-primary" size="sm">
              <i className="bi bi-pencil me-1"></i>Edit
            </Button>
          )}

          {/* Repropose button - for project coordinator on rejected projects */}
          {user && project.status === 'Rejected' && project.coordinator_id === user.user_id && (
            <Button 
              size="sm" 
              variant="warning" 
              onClick={handleRepropose}
              title="Resubmit this project for approval"
            >
              <i className="bi bi-arrow-clockwise me-1"></i>Repropose
            </Button>
          )}

          <Button as={Link} to="/projects" variant="secondary" size="sm">
            <i className="bi bi-arrow-left me-1"></i>Back
          </Button>
        </div>
      </div>
      <Card className="shadow-sm">
        <Card.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {notification.show && (
            <Alert variant={notification.variant} dismissible onClose={dismiss}>
              {notification.message}
            </Alert>
          )}
          <Row className="mb-3">
            <Col md={6}><strong>Coordinator:</strong> {project.coordinator_fullname || '—'}</Col>
            <Col md={3}><strong>Status:</strong> <Badge bg={statusVariant(project.status)}>{project.status}</Badge></Col>
            <Col md={3}><strong>Submitted:</strong> {new Date(project.date_submitted).toLocaleString()}</Col>
          </Row>
          <Row>
            <Col md={6}><strong>Request Type:</strong> {project.request_type || '—'}</Col>
            <Col md={6}><strong>Initiative Type:</strong> {project.initiative_type || '—'}</Col>
          </Row>
          <Row className="mt-2">
            <Col md={6}><strong>Location:</strong> {project.location || '—'}</Col>
            <Col md={6}>
              <strong>Duration:</strong> 
              {project.start_date ? (
                <div>
                  <div>
                    <strong>Start:</strong> {new Date(project.start_date).toLocaleDateString()}
                    {project.start_time && ` at ${project.start_time}`}
                  </div>
                  {project.end_date && (
                    <div>
                      <strong>End:</strong> {new Date(project.end_date).toLocaleDateString()}
                      {project.end_time && ` at ${project.end_time}`}
                    </div>
                  )}
                </div>
              ) : (
                '—'
              )}
            </Col>
          </Row>
          
          {/* Remarks section - only show for approved or rejected projects */}
          {(project.status === 'Approved' || project.status === 'Rejected') && project.remarks && (
            <Row className="mt-3">
              <Col md={12}>
                <div className="alert alert-info border-0" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #dc3545' }}>
                  <div className="d-flex align-items-start">
                    <i className="bi bi-exclamation-triangle-fill text-danger me-2 mt-1" style={{ fontSize: '1.2rem' }}></i>
                    <div>
                      <strong className="text-danger">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>Remarks:
                      </strong>
                      <div className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>{project.remarks}</div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          )}
          
          <hr />
          <Row>
            <Col md={6}><strong>Extension Agenda:</strong><div>{asList(project.extension_agenda).join(', ') || '—'}</div></Col>
            <Col md={6}><strong>SDG Goals:</strong><div>{asList(project.sdg_goals).join(', ') || '—'}</div></Col>
          </Row>
          <hr />
          {/* Project leadership section */}
          <div className="mb-3">
            <strong>Project Leader:</strong>
            <div className="mt-1">{project.project_leader_name || '—'}</div>
          </div>
          <div className="mb-3">
            <strong>Assistant Project Leaders:</strong>
            <div className="mt-1">{project.assistant_project_leader_names || '—'}</div>
          </div>
          <div className="mb-3">
            <strong>Coordinators:</strong>
            <div className="mt-1">{project.coordinator_names || '—'}</div>
          </div>
          <hr />
          {/* Offices and Programs */}
          {[
            ['offices_involved','Office/s / College/s / Organization/s Involved'],
            ['programs_involved','Program/s Involved'],
            ['partner_agencies','Partner Agencies'],
            ['beneficiaries','Beneficiaries'],
            ['total_cost','Total Cost']
          ].map(([key, label]) => (
            <div className="mb-3" key={key}>
              <strong>{label}:</strong>
              <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{project[key] || '—'}</div>
            </div>
          ))}

          {/* Fund Source placed after Total Cost (as in proposal) */}
          <div className="mb-3">
            <strong>Fund Source:</strong>
            <div className="mt-1">{asList(project.fund_source).join(', ') || '—'}</div>
          </div>

          {/* Narrative Sections */}
          {[
            ['rationale','Rationale'],
            ['objectives','Objectives (General and Specific)'],
            ['expected_output','Expected Output'],
            ['strategies_methods','Description, Strategies and Methods'],
            ['financial_plan_details','Financial Plan'],
            ['functional_relationships','Functional Relationships']
          ].map(([key, label]) => (
            <div className="mb-3" key={key}>
              <strong>{label}:</strong>
              <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{project[key] || '—'}</div>
            </div>
          ))}

          {/* Monitoring & Evaluation after narrative sections */}
          <div className="mb-3">
            <strong>Monitoring and Evaluation Plan:</strong>
            <div className="mt-2">
              {renderMonitoringEvaluationTable(project.monitoring_evaluation)}
            </div>
          </div>

          {/* Sustainability Plan last */}
          <div className="mb-3">
            <strong>Sustainability Plan:</strong>
            <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{project.sustainability_plan || '—'}</div>
          </div>
        </Card.Body>
      </Card>

      {/* Approve/Reject Modal */}
      <Modal show={showDecision} onHide={() => setShowDecision(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{decision === 'Approved' ? 'Approve Project' : 'Reject Project'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {decision === 'Approved' && (
            <div className="text-center py-3">
              <i className="bi bi-question-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3 mb-2">Confirm Project Approval</h5>
              <p className="text-muted">Are you sure you want to approve this project?</p>
            </div>
          )}
          {decision === 'Rejected' && (
            <>
              <div className="text-center py-3">
                <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '3rem' }}></i>
                <h5 className="mt-3 mb-2">Confirm Project Rejection</h5>
                <p className="text-muted">Are you sure you want to reject this project?</p>
              </div>
              <Form.Group>
                <Form.Label>Remarks (required for rejection) <span className="text-danger">*</span></Form.Label>
                <Form.Control as="textarea" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} required />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDecision(false)}>Cancel</Button>
          <Button 
            variant={decision === 'Approved' ? 'success' : 'danger'} 
            onClick={submitDecision}
            disabled={decision === 'Rejected' && (!remarks || !remarks.trim())}
          >
            {decision === 'Approved' ? 'Approve' : 'Reject'}
          </Button>
        </Modal.Footer>
      </Modal>

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
              <strong>{project?.title}</strong>
              <div className="text-muted mt-1">
                <small>
                  <i className="bi bi-person-fill me-1"></i>
                  Coordinator: {project?.coordinator_fullname}
                </small>
              </div>
              {project?.end_date && (
                <div className="text-muted mt-1">
                  <small>
                    <i className="bi bi-calendar-event me-1"></i>
                    Scheduled End Date: {new Date(project.end_date).toLocaleDateString()}
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
                  ({new Date(project?.end_date).toLocaleDateString()}). 
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
    </Container>
  );
};

export default ProjectView;


