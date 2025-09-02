import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Evaluations.css';

const Evaluations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('All');
  const [stats, setStats] = useState(null);

  // Check if user has permission to view evaluations
  const canViewEvaluations = user && ['Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin'].includes(user.role);
  const canCreateEvaluations = user && ['Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin'].includes(user.role);

  useEffect(() => {
    if (!canViewEvaluations) {
      navigate('/dashboard');
      return;
    }

    fetchEvaluations();
    fetchStats();
  }, [canViewEvaluations, navigate]);

  // Filter evaluations based on search term and decision
  useEffect(() => {
    let filtered = evaluations;

    // Filter by search term (project title or evaluator name)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(evaluation => 
        evaluation.project_title.toLowerCase().includes(term) ||
        evaluation.evaluator_name.toLowerCase().includes(term)
      );
    }

    // Filter by decision
    if (decisionFilter !== 'All') {
      filtered = filtered.filter(evaluation => evaluation.decision === decisionFilter);
    }

    setFilteredEvaluations(filtered);
  }, [evaluations, searchTerm, decisionFilter]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:5000/api/evaluations');
      setEvaluations(data);
    } catch (err) {
      console.error('Failed to load evaluations', err);
      setError('Failed to load evaluations');
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

  const clearFilters = () => {
    setSearchTerm('');
    setDecisionFilter('All');
  };

  const hasActiveFilters = searchTerm.trim() || decisionFilter !== 'All';

  if (!canViewEvaluations) {
    return null;
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="mb-1">Project Evaluations</h3>
              <p className="text-muted mb-0">Review and manage project evaluations</p>
            </div>
            {canCreateEvaluations && (
              <Button as={Link} to="/evaluations/new" variant="primary">
                <i className="bi bi-plus-lg me-2"></i>
                Create Evaluation
              </Button>
            )}
          </div>

          {/* Statistics Cards */}
          {stats && (
            <Row className="mb-4">
              <Col md={3}>
                <Card className="text-center stat-card">
                  <Card.Body>
                    <div className="stat-icon total">
                      <i className="bi bi-clipboard-data"></i>
                    </div>
                    <h4 className="stat-number">{stats.total}</h4>
                    <p className="stat-label">Total Evaluations</p>
                  </Card.Body>
                </Card>
              </Col>
              {stats.byDecision.map((item) => (
                <Col key={item.decision} md={3}>
                  <Card className="text-center stat-card">
                    <Card.Body>
                      <div className={`stat-icon ${item.decision.toLowerCase().replace(' ', '-')}`}>
                        <i className={getDecisionIcon(item.decision)}></i>
                      </div>
                      <h4 className="stat-number">{item.count}</h4>
                      <p className="stat-label">{item.decision}</p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* Search and Filter Section */}
          <Card className="shadow-sm mb-3 search-filter-card">
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Search Evaluations</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-search"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search by project title or evaluator name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Filter by Decision</Form.Label>
                    <Form.Select
                      value={decisionFilter}
                      onChange={(e) => setDecisionFilter(e.target.value)}
                    >
                      <option value="All">All Decisions</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Needs Revision">Needs Revision</option>
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
                    Showing {filteredEvaluations.length} of {evaluations.length} evaluations
                    {searchTerm.trim() && ` matching "${searchTerm}"`}
                    {decisionFilter !== 'All' && ` with decision "${decisionFilter}"`}
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
                  <p className="mt-2">Loading evaluations...</p>
                </div>
              ) : filteredEvaluations.length === 0 ? (
                <div className="text-center py-4 empty-state">
                  <i className="bi bi-clipboard-x display-4 text-muted"></i>
                  <p className="mt-2 text-muted">
                    {hasActiveFilters 
                      ? 'No evaluations match your current filters. Try adjusting your search criteria.'
                      : 'No evaluations found.'
                    }
                  </p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Evaluator</th>
                      <th>Decision</th>
                      <th>Feedback</th>
                      <th>Date</th>
                      <th style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvaluations.map((evaluation) => (
                      <tr key={evaluation.eval_id}>
                        <td>
                          <div>
                            <strong>{evaluation.project_title}</strong>
                            <br />
                            <small className="text-muted">ID: {evaluation.project_id}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{evaluation.evaluator_name}</strong>
                            <br />
                            <small className="text-muted">{evaluation.evaluator_role}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg={getDecisionVariant(evaluation.decision)} className="decision-badge">
                            <i className={`${getDecisionIcon(evaluation.decision)} me-1`}></i>
                            {evaluation.decision}
                          </Badge>
                        </td>
                        <td>
                          <div className="feedback-preview">
                            {evaluation.feedback.length > 100 
                              ? `${evaluation.feedback.substring(0, 100)}...`
                              : evaluation.feedback
                            }
                          </div>
                        </td>
                        <td>
                          <small>{new Date(evaluation.created_at).toLocaleDateString()}</small>
                          <br />
                          <small className="text-muted">{new Date(evaluation.created_at).toLocaleTimeString()}</small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              as={Link}
                              to={`/evaluations/${evaluation.eval_id}`}
                              variant="outline-primary"
                              size="sm"
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i>
                            </Button>
                            {(user.user_id === evaluation.evaluator_id || user.role === 'Admin') && (
                              <Button
                                as={Link}
                                to={`/evaluations/${evaluation.eval_id}/edit`}
                                variant="outline-secondary"
                                size="sm"
                                title="Edit"
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                            )}
                            {user.role === 'Admin' && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                title="Delete"
                                onClick={async () => {
                                  if (!window.confirm('Are you sure you want to delete this evaluation?')) return;
                                  try {
                                    await axios.delete(`http://localhost:5000/api/evaluations/${evaluation.eval_id}`);
                                    setEvaluations(prev => prev.filter(e => e.eval_id !== evaluation.eval_id));
                                  } catch (err) {
                                    console.error('Failed to delete evaluation', err);
                                    setError('Failed to delete evaluation');
                                  }
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
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
    </Container>
  );
};

export default Evaluations;
