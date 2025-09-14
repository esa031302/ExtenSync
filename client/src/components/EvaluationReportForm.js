import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ReportModule.css';

const EvaluationReportForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [participantData, setParticipantData] = useState({
    participant_type: '',
    male_batstateu_participants: '',
    female_batstateu_participants: '',
    male_other_participants: '',
    female_other_participants: '',
    narrative_of_activity: '',
    // Activity rating fields
    activity_excellent_batstateu: '',
    activity_excellent_other: '',
    activity_very_satisfactory_batstateu: '',
    activity_very_satisfactory_other: '',
    activity_satisfactory_batstateu: '',
    activity_satisfactory_other: '',
    activity_fair_batstateu: '',
    activity_fair_other: '',
    activity_poor_batstateu: '',
    activity_poor_other: '',
    // Timeliness rating fields
    timeliness_excellent_batstateu: '',
    timeliness_excellent_other: '',
    timeliness_very_satisfactory_batstateu: '',
    timeliness_very_satisfactory_other: '',
    timeliness_satisfactory_batstateu: '',
    timeliness_satisfactory_other: '',
    timeliness_fair_batstateu: '',
    timeliness_fair_other: '',
    timeliness_poor_batstateu: '',
    timeliness_poor_other: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [existingReport, setExistingReport] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [photoCaptions, setPhotoCaptions] = useState([]);

  // Check permissions
  const canViewReports = user && ['Extension Coordinator', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin'].includes(user.role);

  useEffect(() => {
    if (!canViewReports) {
      navigate('/evaluations');
      return;
    }

    // Reset all form data when component mounts
    setSelectedProject(null);
    setExistingReport(null);
    setPhotos([]);
    setSelectedFiles([]);
    setPhotoCaptions([]);
    setError('');
    setSuccess('');
    setParticipantData({
      participant_type: '',
      male_batstateu_participants: '',
      female_batstateu_participants: '',
      male_other_participants: '',
      female_other_participants: '',
      narrative_of_activity: '',
      // Activity rating fields
      activity_excellent_batstateu: '',
      activity_excellent_other: '',
      activity_very_satisfactory_batstateu: '',
      activity_very_satisfactory_other: '',
      activity_satisfactory_batstateu: '',
      activity_satisfactory_other: '',
      activity_fair_batstateu: '',
      activity_fair_other: '',
      activity_poor_batstateu: '',
      activity_poor_other: '',
      // Timeliness rating fields
      timeliness_excellent_batstateu: '',
      timeliness_excellent_other: '',
      timeliness_very_satisfactory_batstateu: '',
      timeliness_very_satisfactory_other: '',
      timeliness_satisfactory_batstateu: '',
      timeliness_satisfactory_other: '',
      timeliness_fair_batstateu: '',
      timeliness_fair_other: '',
      timeliness_poor_batstateu: '',
      timeliness_poor_other: ''
    });

    fetchProjects();
  }, [canViewReports, navigate]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:5000/api/projects');
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = async (projectId) => {
    // Always reset form data first when project changes
    setSelectedProject(null);
    setExistingReport(null);
    setPhotos([]);
    setSelectedFiles([]);
    setPhotoCaptions([]);
    setError('');
    setSuccess('');
    
    // Reset participant data to empty state
    setParticipantData({
      participant_type: '',
      male_batstateu_participants: '',
      female_batstateu_participants: '',
      male_other_participants: '',
      female_other_participants: '',
      narrative_of_activity: '',
      // Activity rating fields
      activity_excellent_batstateu: '',
      activity_excellent_other: '',
      activity_very_satisfactory_batstateu: '',
      activity_very_satisfactory_other: '',
      activity_satisfactory_batstateu: '',
      activity_satisfactory_other: '',
      activity_fair_batstateu: '',
      activity_fair_other: '',
      activity_poor_batstateu: '',
      activity_poor_other: '',
      // Timeliness rating fields
      timeliness_excellent_batstateu: '',
      timeliness_excellent_other: '',
      timeliness_very_satisfactory_batstateu: '',
      timeliness_very_satisfactory_other: '',
      timeliness_satisfactory_batstateu: '',
      timeliness_satisfactory_other: '',
      timeliness_fair_batstateu: '',
      timeliness_fair_other: '',
      timeliness_poor_batstateu: '',
      timeliness_poor_other: ''
    });
    
    // If no project selected, return early
    if (!projectId) {
      return;
    }
    
    // Find and set the selected project
    const project = projects.find(p => p.project_id == projectId);
    setSelectedProject(project);
    
    // Check if report already exists for this specific project
    try {
      const { data } = await axios.get(`http://localhost:5000/api/reports?project_id=${projectId}`);
      if (data && data.length > 0) {
        const report = data[0];
        setExistingReport(report);
        
        // Only load data if this is the same project
        if (report.project_id == projectId) {
          setParticipantData({
            participant_type: report.participant_type || '',
            male_batstateu_participants: report.male_batstateu_participants || '',
            female_batstateu_participants: report.female_batstateu_participants || '',
            male_other_participants: report.male_other_participants || '',
            female_other_participants: report.female_other_participants || '',
            narrative_of_activity: report.narrative_of_activity || '',
            // Activity rating fields
            activity_excellent_batstateu: report.activity_excellent_batstateu || '',
            activity_excellent_other: report.activity_excellent_other || '',
            activity_very_satisfactory_batstateu: report.activity_very_satisfactory_batstateu || '',
            activity_very_satisfactory_other: report.activity_very_satisfactory_other || '',
            activity_satisfactory_batstateu: report.activity_satisfactory_batstateu || '',
            activity_satisfactory_other: report.activity_satisfactory_other || '',
            activity_fair_batstateu: report.activity_fair_batstateu || '',
            activity_fair_other: report.activity_fair_other || '',
            activity_poor_batstateu: report.activity_poor_batstateu || '',
            activity_poor_other: report.activity_poor_other || '',
            // Timeliness rating fields
            timeliness_excellent_batstateu: report.timeliness_excellent_batstateu || '',
            timeliness_excellent_other: report.timeliness_excellent_other || '',
            timeliness_very_satisfactory_batstateu: report.timeliness_very_satisfactory_batstateu || '',
            timeliness_very_satisfactory_other: report.timeliness_very_satisfactory_other || '',
            timeliness_satisfactory_batstateu: report.timeliness_satisfactory_batstateu || '',
            timeliness_satisfactory_other: report.timeliness_satisfactory_other || '',
            timeliness_fair_batstateu: report.timeliness_fair_batstateu || '',
            timeliness_fair_other: report.timeliness_fair_other || '',
            timeliness_poor_batstateu: report.timeliness_poor_batstateu || '',
            timeliness_poor_other: report.timeliness_poor_other || ''
          });
          
          // Load photos for this specific report
          setPhotos(report.photos || []);
        }
      } else {
        // No existing report for this project
        setExistingReport(null);
        setPhotos([]);
      }
    } catch (err) {
      console.error('Error checking existing report:', err);
      setExistingReport(null);
      setPhotos([]);
    }
  };

  const handleParticipantDataChange = (field, value) => {
    setParticipantData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setPhotoCaptions(new Array(files.length).fill(''));
  };

  const handleCaptionChange = (index, caption) => {
    const newCaptions = [...photoCaptions];
    newCaptions[index] = caption;
    setPhotoCaptions(newCaptions);
  };

  const handlePhotoUpload = async () => {
    if (!existingReport || selectedFiles.length === 0) {
      setError('Please select photos to upload');
      return;
    }

    setUploadingPhotos(true);
    setError('');

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });
      formData.append('captions', JSON.stringify(photoCaptions));

      const response = await axios.post(
        `http://localhost:5000/api/reports/${existingReport.report_id}/photos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSuccess(`${response.data.photos.length} photo(s) uploaded successfully!`);
      setSelectedFiles([]);
      setPhotoCaptions([]);
      
      // Update photos state immediately with uploaded photos
      setPhotos(prev => [...prev, ...response.data.photos]);
    } catch (err) {
      console.error('Error uploading photos:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to upload photos. Please try again.'
      );
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!existingReport) return;

    try {
      await axios.delete(`http://localhost:5000/api/reports/${existingReport.report_id}/photos/${photoId}`);
      setSuccess('Photo deleted successfully!');
      
      // Remove photo from state immediately
      setPhotos(prev => prev.filter(photo => photo.photo_id != photoId));
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo. Please try again.');
    }
  };

  const handleUpdateCaption = async (photoId, newCaption) => {
    if (!existingReport) return;

    try {
      await axios.put(`http://localhost:5000/api/reports/${existingReport.report_id}/photos/${photoId}`, {
        caption: newCaption
      });
      
      // Update local photos state immediately
      setPhotos(prev => prev.map(photo => 
        photo.photo_id == photoId ? { ...photo, caption: newCaption } : photo
      ));
    } catch (err) {
      console.error('Error updating caption:', err);
      setError('Failed to update caption. Please try again.');
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedProject) {
      setError('Please select a project first');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        project_id: selectedProject.project_id,
        participant_type: participantData.participant_type,
        male_batstateu_participants: parseInt(participantData.male_batstateu_participants) || 0,
        female_batstateu_participants: parseInt(participantData.female_batstateu_participants) || 0,
        male_other_participants: parseInt(participantData.male_other_participants) || 0,
        female_other_participants: parseInt(participantData.female_other_participants) || 0,
        narrative_of_activity: participantData.narrative_of_activity,
        // Activity rating fields
        activity_excellent_batstateu: parseInt(participantData.activity_excellent_batstateu) || 0,
        activity_excellent_other: parseInt(participantData.activity_excellent_other) || 0,
        activity_very_satisfactory_batstateu: parseInt(participantData.activity_very_satisfactory_batstateu) || 0,
        activity_very_satisfactory_other: parseInt(participantData.activity_very_satisfactory_other) || 0,
        activity_satisfactory_batstateu: parseInt(participantData.activity_satisfactory_batstateu) || 0,
        activity_satisfactory_other: parseInt(participantData.activity_satisfactory_other) || 0,
        activity_fair_batstateu: parseInt(participantData.activity_fair_batstateu) || 0,
        activity_fair_other: parseInt(participantData.activity_fair_other) || 0,
        activity_poor_batstateu: parseInt(participantData.activity_poor_batstateu) || 0,
        activity_poor_other: parseInt(participantData.activity_poor_other) || 0,
        // Timeliness rating fields
        timeliness_excellent_batstateu: parseInt(participantData.timeliness_excellent_batstateu) || 0,
        timeliness_excellent_other: parseInt(participantData.timeliness_excellent_other) || 0,
        timeliness_very_satisfactory_batstateu: parseInt(participantData.timeliness_very_satisfactory_batstateu) || 0,
        timeliness_very_satisfactory_other: parseInt(participantData.timeliness_very_satisfactory_other) || 0,
        timeliness_satisfactory_batstateu: parseInt(participantData.timeliness_satisfactory_batstateu) || 0,
        timeliness_satisfactory_other: parseInt(participantData.timeliness_satisfactory_other) || 0,
        timeliness_fair_batstateu: parseInt(participantData.timeliness_fair_batstateu) || 0,
        timeliness_fair_other: parseInt(participantData.timeliness_fair_other) || 0,
        timeliness_poor_batstateu: parseInt(participantData.timeliness_poor_batstateu) || 0,
        timeliness_poor_other: parseInt(participantData.timeliness_poor_other) || 0
      };

      let response;
      if (existingReport) {
        // Update existing report
        response = await axios.put(`http://localhost:5000/api/reports/${existingReport.report_id}`, payload);
        setSuccess('Evaluation report updated successfully!');
      } else {
        // Create new report
        response = await axios.post('http://localhost:5000/api/reports', payload);
        setSuccess('Evaluation report submitted successfully!');
      }

      setExistingReport(response.data);
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to submit evaluation report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'On-Going':
        return 'primary';
      case 'Pending':
        return 'warning';
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Helper function to parse arrays from JSON strings
  const asList = (value) => {
    if (!value) return [];
    try { 
      const arr = JSON.parse(value); 
      return Array.isArray(arr) ? arr : []; 
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

  if (!canViewReports) {
    return null;
  }

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1">
                  <i className="bi bi-clipboard-data me-2"></i>
                  Create Evaluation Report
                </h2>
                <p className="text-muted mb-0">Generate evaluation reports for completed projects</p>
              </div>
              <Button variant="outline-secondary" as={Link} to="/evaluations">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Evaluations
              </Button>
            </div>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                <i className="bi bi-check-circle me-2"></i>
                {success}
              </Alert>
            )}

            {/* Evaluation Report */}
            <Card className="shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-clipboard-data me-2"></i>
                  Evaluation Report
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Completed Project for Report</Form.Label>
                      <Form.Select
                        value={selectedProject?.project_id || ''}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        required
                        disabled={loading}
                      >
                        <option value="">
                          {loading ? 'Loading projects...' : 'Choose a completed project...'}
                        </option>
                        {projects
                          .filter(project => project.status === 'Completed')
                          .map(project => (
                            <option key={project.project_id} value={project.project_id}>
                              {project.title}
                            </option>
                          ))
                        }
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Only completed projects are available for reporting
                        {projects.length > 0 && (
                          <span className="ms-2">
                            ({projects.filter(p => p.status === 'Completed').length} completed projects available)
                          </span>
                        )}
                      </Form.Text>
                      {!loading && projects.length > 0 && projects.filter(p => p.status === 'Completed').length === 0 && (
                        <Alert variant="warning" className="mt-2">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          No completed projects found. Projects must be marked as "Completed" to appear in this list.
                        </Alert>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                {/* Project Information Display */}
                {selectedProject && (
                  <Card className="shadow-sm">
                    <Card.Body>
                      <Row className="mb-3">
                        <Col md={6}><strong>Coordinator:</strong> {selectedProject.coordinator_fullname || '—'}</Col>
                        <Col md={3}><strong>Status:</strong> <Badge bg={getStatusVariant(selectedProject.status)}>{selectedProject.status}</Badge></Col>
                        <Col md={3}><strong>Submitted:</strong> {new Date(selectedProject.date_submitted).toLocaleString()}</Col>
                      </Row>
                      <Row>
                        <Col md={6}><strong>Request Type:</strong> {selectedProject.request_type || '—'}</Col>
                        <Col md={6}><strong>Initiative Type:</strong> {selectedProject.initiative_type || '—'}</Col>
                      </Row>
                      <Row className="mt-2">
                        <Col md={6}><strong>Location:</strong> {selectedProject.location || '—'}</Col>
                        <Col md={6}>
                          <strong>Duration:</strong> 
                          {selectedProject.start_date ? (
                            <div>
                              <div>
                                <strong>Start:</strong> {new Date(selectedProject.start_date).toLocaleDateString()}
                                {selectedProject.start_time && ` at ${selectedProject.start_time}`}
                              </div>
                              {selectedProject.end_date && (
                                <div>
                                  <strong>End:</strong> {new Date(selectedProject.end_date).toLocaleDateString()}
                                  {selectedProject.end_time && ` at ${selectedProject.end_time}`}
                                </div>
                              )}
                            </div>
                          ) : (
                            '—'
                          )}
                        </Col>
                      </Row>

                      {/* Remarks section - only show for approved or rejected projects */}
                      {(selectedProject.status === 'Approved' || selectedProject.status === 'Rejected') && selectedProject.remarks && (
                        <Row className="mt-3">
                          <Col md={12}>
                            <div className="alert alert-info border-0" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #dc3545' }}>
                              <div className="d-flex align-items-start">
                                <i className="bi bi-exclamation-triangle-fill text-danger me-2 mt-1" style={{ fontSize: '1.2rem' }}></i>
                                <div>
                                  <strong className="text-danger">
                                    <i className="bi bi-exclamation-circle-fill me-1"></i>Remarks:
                                  </strong>
                                  <div className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>{selectedProject.remarks}</div>
                                </div>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      )}
                      
                      <hr />
                      <Row>
                        <Col md={6}><strong>Extension Agenda:</strong><div>{asList(selectedProject.extension_agenda).join(', ') || '—'}</div></Col>
                        <Col md={6}><strong>SDG Goals:</strong><div>{asList(selectedProject.sdg_goals).join(', ') || '—'}</div></Col>
                      </Row>
                      <hr />
                      
                      {/* Participant Demographics Section - Editable */}
                      <div className="mb-3 p-3 border border-warning rounded" style={{ backgroundColor: '#fff3cd' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-pencil-square text-warning me-2"></i>
                            <strong className="text-warning">Section to be filled out for: <span className="text-primary">{selectedProject.title}</span></strong>
                          </div>
                          {existingReport && (
                            <Badge bg="success" className="d-flex align-items-center">
                              <i className="bi bi-check-circle me-1"></i>
                              Report Submitted
                            </Badge>
                          )}
                        </div>
                        <strong>Number of Male and Female and Type of Beneficiaries (Type such as OSY, Children, Women, etc.):</strong>
                        <div className="mt-3">
                          <div className="d-flex align-items-center mb-2">
                            <strong>Type of participants:</strong>
                            <Form.Control
                              type="text"
                              className="ms-2"
                              style={{ maxWidth: '300px' }}
                              placeholder="e.g., OSY, Children, Women, etc."
                              value={participantData.participant_type}
                              onChange={(e) => handleParticipantDataChange('participant_type', e.target.value)}
                            />
                          </div>
                          <div className="table-responsive">
                            <table className="table table-bordered table-sm">
                              <thead className="table-light">
                                <tr>
                                  <th style={{ width: '20%' }}></th>
                                  <th style={{ width: '25%' }}>BatStateU Participants</th>
                                  <th style={{ width: '25%' }}>Participants from other Institutions</th>
                                  <th style={{ width: '15%' }}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="fw-bold">Male</td>
                                  <td>
                                    <Form.Control
                                      type="number"
                                      min="0"
                                      size="sm"
                                      placeholder="0"
                                      value={participantData.male_batstateu_participants}
                                      onChange={(e) => handleParticipantDataChange('male_batstateu_participants', e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="number"
                                      min="0"
                                      size="sm"
                                      placeholder="0"
                                      value={participantData.male_other_participants}
                                      onChange={(e) => handleParticipantDataChange('male_other_participants', e.target.value)}
                                    />
                                  </td>
                                  <td className="fw-bold text-center">
                                    {(parseInt(participantData.male_batstateu_participants) || 0) + (parseInt(participantData.male_other_participants) || 0)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Female</td>
                                  <td>
                                    <Form.Control
                                      type="number"
                                      min="0"
                                      size="sm"
                                      placeholder="0"
                                      value={participantData.female_batstateu_participants}
                                      onChange={(e) => handleParticipantDataChange('female_batstateu_participants', e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="number"
                                      min="0"
                                      size="sm"
                                      placeholder="0"
                                      value={participantData.female_other_participants}
                                      onChange={(e) => handleParticipantDataChange('female_other_participants', e.target.value)}
                                    />
                                  </td>
                                  <td className="fw-bold text-center">
                                    {(parseInt(participantData.female_batstateu_participants) || 0) + (parseInt(participantData.female_other_participants) || 0)}
                                  </td>
                                </tr>
                                <tr className="table-secondary">
                                  <td className="fw-bold">Grand Total</td>
                                  <td className="fw-bold text-center">
                                    {(parseInt(participantData.male_batstateu_participants) || 0) + (parseInt(participantData.female_batstateu_participants) || 0)}
                                  </td>
                                  <td className="fw-bold text-center">
                                    {(parseInt(participantData.male_other_participants) || 0) + (parseInt(participantData.female_other_participants) || 0)}
                                  </td>
                                  <td className="fw-bold text-center">
                                    {(parseInt(participantData.male_batstateu_participants) || 0) + (parseInt(participantData.female_batstateu_participants) || 0) + 
                                     (parseInt(participantData.male_other_participants) || 0) + (parseInt(participantData.female_other_participants) || 0)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Narrative of Activity Section */}
                          <div className="mt-4">
                            <strong>Narrative of the Activity:</strong>
                            <Form.Control
                              as="textarea"
                              rows={6}
                              className="mt-2"
                              placeholder="Please provide a detailed narrative of the activity, including what happened, key outcomes, and any notable observations..."
                              value={participantData.narrative_of_activity}
                              onChange={(e) => handleParticipantDataChange('narrative_of_activity', e.target.value)}
                              style={{ resize: 'vertical' }}
                            />
                          </div>
                          
                          {/* Evaluation Result Section */}
                          <div className="mt-4">
                            <strong>Evaluation Result (if activity is training, technical advice or seminar):</strong>
                            
                            {/* Activity Rating Table */}
                            <div className="mt-3">
                              <strong>Number of beneficiaries/participants who rated the activity as:</strong>
                              <div className="table-responsive mt-2">
                                <table className="table table-bordered table-sm">
                                  <thead className="table-light">
                                    <tr>
                                      <th style={{ width: '30%' }}>Scale</th>
                                      <th style={{ width: '25%' }}>BatStateU Participants</th>
                                      <th style={{ width: '25%' }}>Participants from other Institutions</th>
                                      <th style={{ width: '20%' }}>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="fw-bold">1.1. Excellent</td>
                                      <td>
                                        <Form.Control
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.activity_excellent_batstateu}
                                          onChange={(e) => handleParticipantDataChange('activity_excellent_batstateu', e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.activity_excellent_other}
                                          onChange={(e) => handleParticipantDataChange('activity_excellent_other', e.target.value)}
                                        />
                                      </td>
                                      <td className="fw-bold text-center">
                                        {(parseInt(participantData.activity_excellent_batstateu) || 0) + (parseInt(participantData.activity_excellent_other) || 0)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold">1.2. Very Satisfactory</td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.activity_very_satisfactory_batstateu}
                                          onChange={(e) => handleParticipantDataChange('activity_very_satisfactory_batstateu', e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.activity_very_satisfactory_other}
                                          onChange={(e) => handleParticipantDataChange('activity_very_satisfactory_other', e.target.value)}
                                        />
                                      </td>
                                      <td className="fw-bold text-center">
                                        {(parseInt(participantData.activity_very_satisfactory_batstateu) || 0) + (parseInt(participantData.activity_very_satisfactory_other) || 0)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold">1.3. Satisfactory</td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.activity_satisfactory_batstateu}
                                          onChange={(e) => handleParticipantDataChange('activity_satisfactory_batstateu', e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.activity_satisfactory_other}
                                          onChange={(e) => handleParticipantDataChange('activity_satisfactory_other', e.target.value)}
                                        />
                                      </td>
                                      <td className="fw-bold text-center">
                                        {(parseInt(participantData.activity_satisfactory_batstateu) || 0) + (parseInt(participantData.activity_satisfactory_other) || 0)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold">1.4. Fair</td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.activity_fair_batstateu}
                                          onChange={(e) => handleParticipantDataChange('activity_fair_batstateu', e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.activity_fair_other}
                                          onChange={(e) => handleParticipantDataChange('activity_fair_other', e.target.value)}
                                        />
                                      </td>
                                      <td className="fw-bold text-center">
                                        {(parseInt(participantData.activity_fair_batstateu) || 0) + (parseInt(participantData.activity_fair_other) || 0)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold">1.5. Poor</td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.activity_poor_batstateu}
                                          onChange={(e) => handleParticipantDataChange('activity_poor_batstateu', e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.activity_poor_other}
                                          onChange={(e) => handleParticipantDataChange('activity_poor_other', e.target.value)}
                                        />
                                      </td>
                                      <td className="fw-bold text-center">
                                        {(parseInt(participantData.activity_poor_batstateu) || 0) + (parseInt(participantData.activity_poor_other) || 0)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            
                            {/* Timeliness Rating Table */}
                            <div className="mt-4">
                              <strong>Number of beneficiaries/participants who rated the timeliness of the activity as:</strong>
                              <div className="table-responsive mt-2">
                                <table className="table table-bordered table-sm">
                                  <thead className="table-light">
                                    <tr>
                                      <th style={{ width: '30%' }}>Scale</th>
                                      <th style={{ width: '25%' }}>BatStateU Participants</th>
                                      <th style={{ width: '25%' }}>Participants from other Institutions</th>
                                      <th style={{ width: '20%' }}>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="fw-bold">2.1. Excellent</td>
                                      <td>
                                        <Form.Control
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.timeliness_excellent_batstateu}
                                          onChange={(e) => handleParticipantDataChange('timeliness_excellent_batstateu', e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.timeliness_excellent_other}
                                          onChange={(e) => handleParticipantDataChange('timeliness_excellent_other', e.target.value)}
                                        />
                                      </td>
                                      <td className="fw-bold text-center">
                                        {(parseInt(participantData.timeliness_excellent_batstateu) || 0) + (parseInt(participantData.timeliness_excellent_other) || 0)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold">2.2. Very Satisfactory</td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.timeliness_very_satisfactory_batstateu}
                                          onChange={(e) => handleParticipantDataChange('timeliness_very_satisfactory_batstateu', e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.timeliness_very_satisfactory_other}
                                          onChange={(e) => handleParticipantDataChange('timeliness_very_satisfactory_other', e.target.value)}
                                        />
                                      </td>
                                      <td className="fw-bold text-center">
                                        {(parseInt(participantData.timeliness_very_satisfactory_batstateu) || 0) + (parseInt(participantData.timeliness_very_satisfactory_other) || 0)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold">2.3. Satisfactory</td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.timeliness_satisfactory_batstateu}
                                          onChange={(e) => handleParticipantDataChange('timeliness_satisfactory_batstateu', e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.timeliness_satisfactory_other}
                                          onChange={(e) => handleParticipantDataChange('timeliness_satisfactory_other', e.target.value)}
                                        />
                                      </td>
                                      <td className="fw-bold text-center">
                                        {(parseInt(participantData.timeliness_satisfactory_batstateu) || 0) + (parseInt(participantData.timeliness_satisfactory_other) || 0)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold">2.4. Fair</td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.timeliness_fair_batstateu}
                                          onChange={(e) => handleParticipantDataChange('timeliness_fair_batstateu', e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.timeliness_fair_other}
                                          onChange={(e) => handleParticipantDataChange('timeliness_fair_other', e.target.value)}
                                        />
                                      </td>
                                      <td className="fw-bold text-center">
                                        {(parseInt(participantData.timeliness_fair_batstateu) || 0) + (parseInt(participantData.timeliness_fair_other) || 0)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold">2.5. Poor</td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.timeliness_poor_batstateu}
                                          onChange={(e) => handleParticipantDataChange('timeliness_poor_batstateu', e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <Form.Control 
                                          type="number" 
                                          min="0" 
                                          size="sm" 
                                          placeholder="0" 
                                          value={participantData.timeliness_poor_other}
                                          onChange={(e) => handleParticipantDataChange('timeliness_poor_other', e.target.value)}
                                        />
                                      </td>
                                      <td className="fw-bold text-center">
                                        {(parseInt(participantData.timeliness_poor_batstateu) || 0) + (parseInt(participantData.timeliness_poor_other) || 0)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                          
                          {/* Photos Section */}
                          <div className="mt-4">
                            <strong>Photos:</strong>
                            
                            {/* Photo Upload Section */}
                            {existingReport && (
                              <div className="mt-3 p-3 border border-info rounded" style={{ backgroundColor: '#e7f3ff' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-camera text-info me-2"></i>
                                  <strong className="text-info">Upload Photos:</strong>
                                </div>
                                
                                <div className="mb-3">
                                  <Form.Control
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="mb-2"
                                  />
                                  <small className="text-muted">Select multiple images (JPG, PNG, GIF, WebP) - Max 10MB each</small>
                                </div>
                                
                                {selectedFiles.length > 0 && (
                                  <div className="mb-3">
                                    <strong>Add captions for your photos:</strong>
                                    {selectedFiles.map((file, index) => (
                                      <div key={index} className="mt-2">
                                        <div className="d-flex align-items-center mb-1">
                                          <small className="text-muted me-2">{file.name}</small>
                                        </div>
                                        <Form.Control
                                          type="text"
                                          placeholder="Enter caption for this photo..."
                                          value={photoCaptions[index] || ''}
                                          onChange={(e) => handleCaptionChange(index, e.target.value)}
                                          size="sm"
                                        />
                                      </div>
                                    ))}
                                    <div className="mt-3">
                                      <Button
                                        variant="info"
                                        size="sm"
                                        onClick={handlePhotoUpload}
                                        disabled={uploadingPhotos}
                                      >
                                        {uploadingPhotos ? (
                                          <>
                                            <i className="bi bi-hourglass-split me-2"></i>
                                            Uploading...
                                          </>
                                        ) : (
                                          <>
                                            <i className="bi bi-upload me-2"></i>
                                            Upload Photos
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Display Existing Photos */}
                            {photos.length > 0 && (
                              <div className="mt-3">
                                <strong>Uploaded Photos:</strong>
                                <div className="row mt-2">
                                  {photos.map((photo, index) => (
                                    <div key={photo.photo_id} className="col-md-4 col-sm-6 mb-3">
                                      <div className="card">
                                        <img
                                          src={`http://localhost:5000/uploads/report-photos/${photo.filename}`}
                                          className="card-img-top"
                                          alt={photo.caption || 'Report photo'}
                                          style={{ height: '200px', objectFit: 'cover' }}
                                        />
                                        <div className="card-body p-2">
                                          <div className="d-flex justify-content-between align-items-start mb-2">
                                            <small className="text-muted">
                                              {new Date(photo.uploaded_at).toLocaleDateString()}
                                            </small>
                                            {existingReport && (
                                              <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeletePhoto(photo.photo_id)}
                                                className="p-1"
                                                style={{ fontSize: '0.75rem' }}
                                              >
                                                <i className="bi bi-trash"></i>
                                              </Button>
                                            )}
                                          </div>
                                          {existingReport ? (
                                            <Form.Control
                                              type="text"
                                              placeholder="Add caption..."
                                              value={photo.caption || ''}
                                              onChange={(e) => handleUpdateCaption(photo.photo_id, e.target.value)}
                                              size="sm"
                                              onBlur={() => {
                                                // Caption is saved on blur
                                              }}
                                            />
                                          ) : (
                                            <small className="text-muted">
                                              {photo.caption || 'No caption'}
                                            </small>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {photos.length === 0 && existingReport && (
                              <div className="mt-3 text-center text-muted">
                                <i className="bi bi-image" style={{ fontSize: '2rem' }}></i>
                                <p>No photos uploaded yet. Use the upload section above to add photos.</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 d-flex justify-content-end">
                            <Button 
                              variant={existingReport ? "outline-primary" : "primary"}
                              onClick={handleSubmitReport}
                              disabled={submitting}
                            >
                              {submitting ? (
                                <>
                                  <i className="bi bi-hourglass-split me-2"></i>
                                  {existingReport ? 'Updating...' : 'Submitting...'}
                                </>
                              ) : (
                                <>
                                  <i className={`bi ${existingReport ? 'bi-arrow-clockwise' : 'bi-check-circle'} me-2`}></i>
                                  {existingReport ? 'Update Report' : 'Submit Report'}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <hr />
                      
                      {/* Project leadership section */}
                      <div className="mb-3">
                        <strong>Project Leader:</strong>
                        <div className="mt-1">{selectedProject.project_leader_name || '—'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Assistant Project Leaders:</strong>
                        <div className="mt-1">{selectedProject.assistant_project_leader_names || '—'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Coordinators:</strong>
                        <div className="mt-1">{selectedProject.coordinator_names || '—'}</div>
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
                          <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{selectedProject[key] || '—'}</div>
                        </div>
                      ))}

                      {/* Fund Source placed after Total Cost (as in proposal) */}
                      <div className="mb-3">
                        <strong>Fund Source:</strong>
                        <div className="mt-1">{asList(selectedProject.fund_source).join(', ') || '—'}</div>
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
                          <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{selectedProject[key] || '—'}</div>
                        </div>
                      ))}

                      {/* Monitoring & Evaluation after narrative sections */}
                      <div className="mb-3">
                        <strong>Monitoring and Evaluation Plan:</strong>
                        <div className="mt-2">
                          {renderMonitoringEvaluationTable(selectedProject.monitoring_evaluation)}
                        </div>
                      </div>

                      {/* Sustainability Plan last */}
                      <div className="mb-3">
                        <strong>Sustainability Plan:</strong>
                        <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{selectedProject.sustainability_plan || '—'}</div>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EvaluationReportForm;
