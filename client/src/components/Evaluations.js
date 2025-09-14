import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, InputGroup, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Evaluations.css';

const Evaluations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationReports, setEvaluationReports] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);

  // Check if user has permission to view evaluations
  const canViewEvaluations = user && ['Extension Coordinator', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin'].includes(user.role);
  const canCreateEvaluationReports = user && ['Extension Coordinator', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin'].includes(user.role);
  const isExtensionCoordinator = user && user.role === 'Extension Coordinator';

  useEffect(() => {
    if (!canViewEvaluations) {
      navigate('/dashboard');
      return;
    }

    fetchAllData();
  }, [canViewEvaluations, navigate]);

  // Combine evaluations and evaluation reports
  useEffect(() => {
    const combined = [
      ...evaluations.map(evaluation => ({ ...evaluation, type: 'evaluation' })),
      ...evaluationReports.map(report => ({ ...report, type: 'report' }))
    ];
    setCombinedData(combined);
  }, [evaluations, evaluationReports]);

  // Filter combined data based on search term
  useEffect(() => {
    let filtered = combinedData;

    // Filter by search term (project title, evaluator name, or created by name)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.project_title?.toLowerCase().includes(term) ||
        item.evaluator_name?.toLowerCase().includes(term) ||
        item.created_by_name?.toLowerCase().includes(term)
      );
    }

    setFilteredData(filtered);
  }, [combinedData, searchTerm]);

  const fetchEvaluations = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/evaluations');
      setEvaluations(data);
    } catch (err) {
      console.error('Failed to load evaluations', err);
      setError('Failed to load evaluations');
    }
  };

  const fetchEvaluationReports = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/reports');
      setEvaluationReports(data);
    } catch (err) {
      console.error('Failed to load evaluation reports', err);
      setError('Failed to load evaluation reports');
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchEvaluations(),
        fetchEvaluationReports(),
        fetchStats()
      ]);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/evaluations/stats/overview');
      setStats(data);
    } catch (err) {
      console.error('Failed to load evaluation statistics', err);
    }
  };

  const getDecisionVariant = (decision) => {
    switch (decision) {
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'danger';
      case 'Needs Revision':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'Approved':
        return 'bi-check-circle-fill';
      case 'Rejected':
        return 'bi-x-circle-fill';
      case 'Needs Revision':
        return 'bi-exclamation-triangle-fill';
      default:
        return 'bi-question-circle-fill';
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const hasActiveSearch = searchTerm.trim();

  if (!canViewEvaluations) {
    return null;
  }

  return (
    <div className="evaluations-container">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="mb-1">Project Evaluations & Reports</h3>
              <p className="text-muted mb-0">
                {isExtensionCoordinator 
                  ? 'View evaluations and reports for your projects'
                  : 'Review and manage project evaluations and evaluation reports'
                }
              </p>
            </div>
            {canCreateEvaluationReports && (
              <Button as={Link} to="/evaluations/reports/new" variant="success">
                <i className="bi bi-clipboard-data me-2"></i>
                Create Evaluation Report
              </Button>
            )}
          </div>



          {/* Search Section */}
          <Card className="shadow-sm mb-3 search-filter-card">
            <Card.Body>
              <Row className="g-3">
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Search Evaluations & Reports</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-search"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search by project title, evaluator name, or report creator..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    onClick={clearSearch}
                    disabled={!hasActiveSearch}
                    className="w-100"
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Clear Search
                  </Button>
                </Col>
              </Row>
              
              {/* Results Summary */}
              {hasActiveSearch && (
                <div className="mt-3 results-summary">
                  <small className="text-muted">
                    Showing {filteredData.length} of {combinedData.length} items
                    {searchTerm.trim() && ` matching "${searchTerm}"`}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Body>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading evaluations and reports...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-4 empty-state">
                  <i className="bi bi-clipboard-x display-4 text-muted"></i>
                  <p className="mt-2 text-muted">
                    {hasActiveSearch 
                      ? 'No items match your search criteria. Try adjusting your search terms.'
                      : 'No evaluations or reports found.'
                    }
                  </p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Project</th>
                      <th>Creator/Evaluator</th>
                      <th>Status/Decision</th>
                      <th>Details</th>
                      <th>Date</th>
                      <th style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={`${item.type}-${item.eval_id || item.report_id}`}>
                        <td>
                          <Badge bg={item.type === 'evaluation' ? 'primary' : 'success'} className="type-badge">
                            <i className={`bi ${item.type === 'evaluation' ? 'bi-clipboard-check' : 'bi-clipboard-data'} me-1`}></i>
                            {item.type === 'evaluation' ? 'Evaluation' : 'Report'}
                          </Badge>
                        </td>
                        <td>
                          <div>
                            <strong>{item.project_title}</strong>
                            <br />
                            <small className="text-muted">ID: {item.project_id}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{item.type === 'evaluation' ? item.evaluator_name : item.created_by_name}</strong>
                            <br />
                            <small className="text-muted">
                              {item.type === 'evaluation' ? item.evaluator_role : item.created_by_department}
                            </small>
                          </div>
                        </td>
                        <td>
                          {item.type === 'evaluation' ? (
                            <Badge bg={getDecisionVariant(item.decision)} className="decision-badge">
                              <i className={`${getDecisionIcon(item.decision)} me-1`}></i>
                              {item.decision}
                            </Badge>
                          ) : (
                            <Badge bg="success" className="decision-badge">
                              <i className="bi bi-check-circle me-1"></i>
                              Submitted
                            </Badge>
                          )}
                        </td>
                        <td>
                          <div className="details-preview">
                            {item.type === 'evaluation' ? (
                              item.feedback && item.feedback.length > 100 
                                ? `${item.feedback.substring(0, 100)}...`
                                : item.feedback || 'No feedback'
                            ) : (
                              item.narrative_of_activity && item.narrative_of_activity.length > 100
                                ? `${item.narrative_of_activity.substring(0, 100)}...`
                                : item.narrative_of_activity || 'No narrative'
                            )}
                          </div>
                        </td>
                        <td>
                          <small>{new Date(item.created_at).toLocaleDateString()}</small>
                          <br />
                          <small className="text-muted">{new Date(item.created_at).toLocaleTimeString()}</small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {item.type === 'evaluation' ? (
                              <>
                                <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-view-${item.eval_id}`}>View</Tooltip>}>
                                  <Button
                                    as={Link}
                                    to={`/evaluations/${item.eval_id}`}
                                    variant="link"
                                    className="icon-only-btn icon-view"
                                    aria-label="View evaluation"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </Button>
                                </OverlayTrigger>

                                {!isExtensionCoordinator && (user.user_id === item.evaluator_id || user.role === 'Admin') && (
                                  <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-edit-${item.eval_id}`}>Edit</Tooltip>}>
                                    <Button
                                      as={Link}
                                      to={`/evaluations/${item.eval_id}/edit`}
                                      variant="link"
                                      className="icon-only-btn icon-edit"
                                      aria-label="Edit evaluation"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </Button>
                                  </OverlayTrigger>
                                )}

                                {!isExtensionCoordinator && user.role === 'Admin' && (
                                  <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-del-${item.eval_id}`}>Delete</Tooltip>}>
                                    <Button
                                      variant="link"
                                      className="icon-only-btn icon-delete"
                                      aria-label="Delete evaluation"
                                      onClick={async () => {
                                        if (!window.confirm('Are you sure you want to delete this evaluation?')) return;
                                        try {
                                          await axios.delete(`http://localhost:5000/api/evaluations/${item.eval_id}`);
                                          setEvaluations(prev => prev.filter(e => e.eval_id !== item.eval_id));
                                        } catch (err) {
                                          console.error('Failed to delete evaluation', err);
                                          setError('Failed to delete evaluation');
                                        }
                                      }}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </Button>
                                  </OverlayTrigger>
                                )}
                              </>
                            ) : (
                              <>
                                <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-view-report-${item.report_id}`}>View Report</Tooltip>}>
                                  <Button
                                    as={Link}
                                    to={`/reports/${item.report_id}`}
                                    variant="link"
                                    className="icon-only-btn icon-view"
                                    aria-label="View report"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </Button>
                                </OverlayTrigger>

                                {canCreateEvaluationReports && (
                                  <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-edit-report-${item.report_id}`}>Edit Report</Tooltip>}>
                                    <Button
                                      as={Link}
                                      to={`/evaluations/reports/new?project_id=${item.project_id}`}
                                      variant="link"
                                      className="icon-only-btn icon-edit"
                                      aria-label="Edit report"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </Button>
                                  </OverlayTrigger>
                                )}
                              </>
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
    </div>
  );
};

export default Evaluations;
