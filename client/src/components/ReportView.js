import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button, Spinner, Alert, Image, Table, Collapse } from 'react-bootstrap';
import './ReportModule.css';

const ReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSections, setOpenSections] = useState({
    reportInfo: true,
    projectInfo: false
  });

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/reports/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) {
          if (res.status === 404) {
            navigate('/reports');
            return;
          }
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load report');
        }
        const data = await res.json();
        setReport(data);
        
        // Fetch project data if available
        if (data.project_id) {
          try {
            const projectRes = await fetch(`/api/projects/${data.project_id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            if (projectRes.ok) {
              const projectData = await projectRes.json();
              setProject(projectData);
            }
          } catch (projectErr) {
            console.log('Could not load project data:', projectErr);
          }
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const statusVariant = (status) => {
    switch (status) {
      case 'Draft': return 'secondary';
      case 'Submitted': return 'primary';
      case 'Reviewed': return 'warning';
      case 'Approved': return 'success';
      default: return 'secondary';
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

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  if (loading) {
    return (
      <div className="bg-light min-vh-100">
        <Container className="py-4">
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-3">Loading report details...</p>
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
              <Button variant="outline-danger" onClick={() => navigate('/reports')}>
                Back to Reports
              </Button>
            </div>
          </Alert>
        </Container>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Evaluation Report Details</h2>
            <p className="text-muted mb-0">Project: {report.project_title}</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => navigate('/reports')}>
              <i className="bi bi-arrow-left me-2"></i>
              Back to Reports
            </Button>
          </div>
        </div>

        {/* Report Information */}
        <Card className="shadow-sm mb-4">
          <Card.Header 
            className="bg-success text-white" 
            style={{ cursor: 'pointer' }}
            onClick={() => toggleSection('reportInfo')}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-clipboard-data me-2"></i>
                Report Information
              </h5>
              <i className={`bi bi-chevron-${openSections.reportInfo ? 'up' : 'down'}`}></i>
            </div>
          </Card.Header>
          <Collapse in={openSections.reportInfo}>
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
                                <Image
                                  src={`http://localhost:5000${photo.url}`}
                                  alt={`Activity photo ${index + 1}`}
                                  fluid
                                  className="rounded shadow-sm"
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
          </Collapse>
        </Card>

        {/* Project Information */}
        {project && (
          <Card className="shadow-sm mb-4">
            <Card.Header 
              className="bg-info text-white" 
              style={{ cursor: 'pointer' }}
              onClick={() => toggleSection('projectInfo')}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-folder me-2"></i>
                  Project Information
                </h5>
                <i className={`bi bi-chevron-${openSections.projectInfo ? 'up' : 'down'}`}></i>
              </div>
            </Card.Header>
            <Collapse in={openSections.projectInfo}>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}><strong>Coordinator:</strong> {project.coordinator_fullname || project.coordinator_name || '—'}</Col>
                  <Col md={3}><strong>Status:</strong> <Badge bg={getStatusVariant(project.status)}>{project.status}</Badge></Col>
                  <Col md={3}><strong>Submitted:</strong> {project.date_submitted ? new Date(project.date_submitted).toLocaleString() : '—'}</Col>
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
                  <div className="mt-1">{project.project_leader_name || project.project_leader || '—'}</div>
                </div>
                <div className="mb-3">
                  <strong>Assistant Project Leaders:</strong>
                  <div className="mt-1">{project.assistant_project_leader_names || project.assistant_project_leaders || '—'}</div>
                </div>
                <div className="mb-3">
                  <strong>Coordinators:</strong>
                  <div className="mt-1">{project.coordinator_names || project.coordinators || '—'}</div>
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
                    <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                      {key === 'total_cost' && project[key] ? `₱${parseFloat(project[key]).toLocaleString()}` : (project[key] || '—')}
                    </div>
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
                    {renderMonitoringEvaluationTable(project.monitoring_evaluation || project.monitoring_evaluation_plan)}
                  </div>
                </div>

                {/* Sustainability Plan last */}
                <div className="mb-3">
                  <strong>Sustainability Plan:</strong>
                  <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{project.sustainability_plan || '—'}</div>
                </div>
              </Card.Body>
            </Collapse>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default ReportView;


