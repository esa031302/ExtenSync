import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Container, Card, Row, Col, Badge, Button, Alert, Table } from 'react-bootstrap';
import './ReportModule.css';

const EvaluationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState(null);
  const [project, setProject] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check permissions
  const canViewEvaluations = user && ['Extension Coordinator', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin'].includes(user.role);

  useEffect(() => {
    if (!canViewEvaluations) {
      navigate('/evaluations');
      return;
    }

    fetchEvaluationData();
  }, [canViewEvaluations, navigate, id]);

  const fetchEvaluationData = async () => {
    try {
      setLoading(true);
      
      // Fetch evaluation data
      const evaluationResponse = await axios.get(`http://localhost:5000/api/evaluations/${id}`);
      const evaluationData = evaluationResponse.data;
      setEvaluation(evaluationData);

      // Fetch project data
      const projectResponse = await axios.get(`http://localhost:5000/api/projects/${evaluationData.project_id}`);
      setProject(projectResponse.data);

      // Fetch evaluation report for this project
      try {
        const reportResponse = await axios.get(`http://localhost:5000/api/reports?project_id=${evaluationData.project_id}`);
        if (reportResponse.data && reportResponse.data.length > 0) {
          setReport(reportResponse.data[0]);
        }
      } catch (reportErr) {
        console.log('No evaluation report found for this project');
        setReport(null);
      }

    } catch (err) {
      console.error('Error fetching evaluation data:', err);
      setError('Failed to load evaluation data');
    } finally {
      setLoading(false);
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

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Ongoing':
        return 'primary';
      case 'Not Started':
        return 'secondary';
      case 'Cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const asList = (str) => {
    try {
      return str ? str.split(',').map(s => s.trim()).filter(s => s) : [];
    } catch { 
      return []; 
    }
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
        <table className="table table-bordered me-view-table" style={{ fontSize: '0.85rem' }}>
          <thead className="table-light">
            <tr>
              <th style={{ width: '12%', padding: '8px', textAlign: 'center' }}>Type</th>
              <th style={{ width: '11%', padding: '8px' }}>Objectives</th>
              <th style={{ width: '11%', padding: '8px' }}>Performance Indicators</th>
              <th style={{ width: '11%', padding: '8px' }}>Baseline Data</th>
              <th style={{ width: '11%', padding: '8px' }}>Performance Target</th>
              <th style={{ width: '11%', padding: '8px' }}>Data Source</th>
              <th style={{ width: '11%', padding: '8px' }}>Collection Method</th>
              <th style={{ width: '11%', padding: '8px' }}>Frequency</th>
              <th style={{ width: '11%', padding: '8px' }}>Responsible</th>
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

  if (!canViewEvaluations) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-light min-vh-100">
        <Container className="py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading evaluation details...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-light min-vh-100">
        <Container className="py-4">
          <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button variant="outline-danger" onClick={() => navigate('/evaluations')}>
                Back to Evaluations
              </Button>
            </div>
          </Alert>
        </Container>
      </div>
    );
  }

  if (!evaluation || !project) {
    return (
      <div className="bg-light min-vh-100">
        <Container className="py-4">
          <Alert variant="warning">
            <Alert.Heading>Evaluation Not Found</Alert.Heading>
            <p>The requested evaluation could not be found.</p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button variant="outline-warning" onClick={() => navigate('/evaluations')}>
                Back to Evaluations
              </Button>
            </div>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Evaluation Details</h2>
            <p className="text-muted mb-0">Project: {project.title}</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => navigate('/evaluations')}>
              <i className="bi bi-arrow-left me-2"></i>
              Back to Evaluations
            </Button>
          </div>
        </div>

        {/* Evaluation Information */}
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-clipboard-check me-2"></i>
              Evaluation Information
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Evaluator:</strong>
                  <div>{evaluation.evaluator_name}</div>
                  <small className="text-muted">{evaluation.evaluator_role}</small>
                </div>
                <div className="mb-3">
                  <strong>Decision:</strong>
                  <div>
                    <Badge bg={getDecisionVariant(evaluation.decision)} className="decision-badge">
                      <i className={`${getDecisionIcon(evaluation.decision)} me-1`}></i>
                      {evaluation.decision}
                    </Badge>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Total Score:</strong>
                  <div>{evaluation.total_score} / 100</div>
                </div>
                <div className="mb-3">
                  <strong>Score Percentage:</strong>
                  <div>{evaluation.score_percentage}%</div>
                </div>
                <div className="mb-3">
                  <strong>Evaluation Date:</strong>
                  <div>{new Date(evaluation.created_at).toLocaleDateString()}</div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col>
                <div className="mb-3">
                  <strong>Feedback:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    {evaluation.feedback || 'No feedback provided'}
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Project Information */}
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-folder me-2"></i>
              Project Information
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Project Title:</strong>
                  <div>{project.title}</div>
                </div>
                <div className="mb-3">
                  <strong>Status:</strong>
                  <div>
                    <Badge bg={getStatusVariant(project.status)} className="status-badge">
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <div className="mb-3">
                  <strong>Coordinator:</strong>
                  <div>{project.coordinator_name}</div>
                </div>
                <div className="mb-3">
                  <strong>Request/Initiative Type:</strong>
                  <div>{project.request_initiative_type || '—'}</div>
                </div>
                <div className="mb-3">
                  <strong>Location:</strong>
                  <div>{project.location || '—'}</div>
                </div>
                <div className="mb-3">
                  <strong>Duration:</strong>
                  <div>{project.duration || '—'}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Start Date:</strong>
                  <div>{project.start_date ? new Date(project.start_date).toLocaleDateString() : '—'}</div>
                </div>
                <div className="mb-3">
                  <strong>End Date:</strong>
                  <div>{project.end_date ? new Date(project.end_date).toLocaleDateString() : '—'}</div>
                </div>
                <div className="mb-3">
                  <strong>Extension Agenda:</strong>
                  <div>{asList(project.extension_agenda).join(', ') || '—'}</div>
                </div>
                <div className="mb-3">
                  <strong>SDG Goals:</strong>
                  <div>{asList(project.sdg_goals).join(', ') || '—'}</div>
                </div>
                <div className="mb-3">
                  <strong>Total Cost:</strong>
                  <div>{project.total_cost ? `₱${parseFloat(project.total_cost).toLocaleString()}` : '—'}</div>
                </div>
                <div className="mb-3">
                  <strong>Fund Source:</strong>
                  <div>{project.fund_source || '—'}</div>
                </div>
              </Col>
            </Row>
            
            {project.remarks && (
              <Row>
                <Col>
                  <div className="mb-3">
                    <strong>Remarks:</strong>
                    <div className="mt-2 p-3 bg-light rounded">
                      {project.remarks}
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            {project.narrative_of_activity && (
              <Row>
                <Col>
                  <div className="mb-3">
                    <strong>Narrative of Activity:</strong>
                    <div className="mt-2 p-3 bg-light rounded">
                      {project.narrative_of_activity}
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            {project.monitoring_evaluation_plan && (
              <Row>
                <Col>
                  <div className="mb-3">
                    <strong>Monitoring & Evaluation Plan:</strong>
                    <div className="mt-2">
                      {renderMonitoringEvaluationTable(project.monitoring_evaluation_plan)}
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            {project.sustainability_plan && (
              <Row>
                <Col>
                  <div className="mb-3">
                    <strong>Sustainability Plan:</strong>
                    <div className="mt-2 p-3 bg-light rounded">
                      {project.sustainability_plan}
                    </div>
                  </div>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* Evaluation Report Information */}
        {report ? (
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-clipboard-data me-2"></i>
                Evaluation Report
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Report Created By:</strong>
                    <div>{report.created_by_name}</div>
                    <small className="text-muted">{report.created_by_department}</small>
                  </div>
                  <div className="mb-3">
                    <strong>Report Date:</strong>
                    <div>{new Date(report.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="mb-3">
                    <strong>Participant Type:</strong>
                    <div>{report.participant_type || '—'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Male BatStateU Participants:</strong>
                    <div>{report.male_batstateu_participants || 0}</div>
                  </div>
                  <div className="mb-3">
                    <strong>Female BatStateU Participants:</strong>
                    <div>{report.female_batstateu_participants || 0}</div>
                  </div>
                  <div className="mb-3">
                    <strong>Male Other Participants:</strong>
                    <div>{report.male_other_participants || 0}</div>
                  </div>
                  <div className="mb-3">
                    <strong>Female Other Participants:</strong>
                    <div>{report.female_other_participants || 0}</div>
                  </div>
                </Col>
              </Row>

              {report.narrative_of_activity && (
                <Row>
                  <Col>
                    <div className="mb-3">
                      <strong>Narrative of Activity:</strong>
                      <div className="mt-2 p-3 bg-light rounded">
                        {report.narrative_of_activity}
                      </div>
                    </div>
                  </Col>
                </Row>
              )}

              {/* Activity Rating Table */}
              <Row>
                <Col>
                  <div className="mb-3">
                    <strong>Activity Rating:</strong>
                    <div className="mt-2">
                      <Table responsive bordered size="sm">
                        <thead className="table-light">
                          <tr>
                            <th>Rating</th>
                            <th>BatStateU</th>
                            <th>Other Institution</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Excellent</strong></td>
                            <td>{report.activity_excellent_batstateu || 0}</td>
                            <td>{report.activity_excellent_other || 0}</td>
                            <td>{(report.activity_excellent_batstateu || 0) + (report.activity_excellent_other || 0)}</td>
                          </tr>
                          <tr>
                            <td><strong>Very Satisfactory</strong></td>
                            <td>{report.activity_very_satisfactory_batstateu || 0}</td>
                            <td>{report.activity_very_satisfactory_other || 0}</td>
                            <td>{(report.activity_very_satisfactory_batstateu || 0) + (report.activity_very_satisfactory_other || 0)}</td>
                          </tr>
                          <tr>
                            <td><strong>Satisfactory</strong></td>
                            <td>{report.activity_satisfactory_batstateu || 0}</td>
                            <td>{report.activity_satisfactory_other || 0}</td>
                            <td>{(report.activity_satisfactory_batstateu || 0) + (report.activity_satisfactory_other || 0)}</td>
                          </tr>
                          <tr>
                            <td><strong>Fair</strong></td>
                            <td>{report.activity_fair_batstateu || 0}</td>
                            <td>{report.activity_fair_other || 0}</td>
                            <td>{(report.activity_fair_batstateu || 0) + (report.activity_fair_other || 0)}</td>
                          </tr>
                          <tr>
                            <td><strong>Poor</strong></td>
                            <td>{report.activity_poor_batstateu || 0}</td>
                            <td>{report.activity_poor_other || 0}</td>
                            <td>{(report.activity_poor_batstateu || 0) + (report.activity_poor_other || 0)}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Timeliness Rating Table */}
              <Row>
                <Col>
                  <div className="mb-3">
                    <strong>Timeliness Rating:</strong>
                    <div className="mt-2">
                      <Table responsive bordered size="sm">
                        <thead className="table-light">
                          <tr>
                            <th>Rating</th>
                            <th>BatStateU</th>
                            <th>Other Institution</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Excellent</strong></td>
                            <td>{report.timeliness_excellent_batstateu || 0}</td>
                            <td>{report.timeliness_excellent_other || 0}</td>
                            <td>{(report.timeliness_excellent_batstateu || 0) + (report.timeliness_excellent_other || 0)}</td>
                          </tr>
                          <tr>
                            <td><strong>Very Satisfactory</strong></td>
                            <td>{report.timeliness_very_satisfactory_batstateu || 0}</td>
                            <td>{report.timeliness_very_satisfactory_other || 0}</td>
                            <td>{(report.timeliness_very_satisfactory_batstateu || 0) + (report.timeliness_very_satisfactory_other || 0)}</td>
                          </tr>
                          <tr>
                            <td><strong>Satisfactory</strong></td>
                            <td>{report.timeliness_satisfactory_batstateu || 0}</td>
                            <td>{report.timeliness_satisfactory_other || 0}</td>
                            <td>{(report.timeliness_satisfactory_batstateu || 0) + (report.timeliness_satisfactory_other || 0)}</td>
                          </tr>
                          <tr>
                            <td><strong>Fair</strong></td>
                            <td>{report.timeliness_fair_batstateu || 0}</td>
                            <td>{report.timeliness_fair_other || 0}</td>
                            <td>{(report.timeliness_fair_batstateu || 0) + (report.timeliness_fair_other || 0)}</td>
                          </tr>
                          <tr>
                            <td><strong>Poor</strong></td>
                            <td>{report.timeliness_poor_batstateu || 0}</td>
                            <td>{report.timeliness_poor_other || 0}</td>
                            <td>{(report.timeliness_poor_batstateu || 0) + (report.timeliness_poor_other || 0)}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Photos */}
              {report.photos && report.photos.length > 0 && (
                <Row>
                  <Col>
                    <div className="mb-3">
                      <strong>Activity Photos:</strong>
                      <div className="mt-2">
                        <Row>
                          {report.photos.map((photo, index) => (
                            <Col md={4} key={index} className="mb-3">
                              <div className="position-relative">
                                <img
                                  src={`http://localhost:5000${photo.url}`}
                                  alt={`Activity photo ${index + 1}`}
                                  className="img-fluid rounded shadow-sm"
                                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                />
                                {photo.caption && (
                                  <div className="mt-2">
                                    <small className="text-muted">{photo.caption}</small>
                                  </div>
                                )}
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        ) : (
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                No Evaluation Report Found
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-0">No evaluation report has been submitted for this project yet.</p>
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default EvaluationView;
