import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Table, Badge, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Reports.css';

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    content: ''
  });
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch reports and projects on component mount
  useEffect(() => {
    fetchReports();
    fetchProjects();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError('Failed to load reports: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      title: '',
      content: ''
    });
    setPhotos([]);
    setEditingReport(null);
    setExistingPhotos([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('project_id', formData.project_id);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      // type/status removed from UI; server applies defaults

      // Add photos
      photos.forEach(photo => {
        formDataToSend.append('photos', photo);
      });

      const url = editingReport 
        ? `/api/reports/${editingReport.report_id}`
        : '/api/reports';
      
      const method = editingReport ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save report');
      }

      setSuccess(editingReport ? 'Report updated successfully!' : 'Report created successfully!');
      setShowModal(false);
      resetForm();
      fetchReports();
    } catch (err) {
      setError('Failed to save report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      project_id: report.project_id,
      title: report.title,
      content: report.content
    });
    setPhotos([]);
    setExistingPhotos(report.photos || []);
    setShowModal(true);
  };

  const handleRemoveExistingPhoto = async (photo) => {
    if (!editingReport) return;
    if (!window.confirm('Remove this photo from the report?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/reports/${editingReport.report_id}/photos/${photo.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete photo');
      }
      setExistingPhotos(prev => prev.filter(p => p.id !== photo.id));
      setSuccess('Photo removed');
    } catch (err) {
      setError('Failed to remove photo: ' + err.message);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      setSuccess('Report deleted successfully!');
      fetchReports();
    } catch (err) {
      setError('Failed to delete report: ' + err.message);
    }
  };

  // Removed Type and Status badges in list view per spec

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Project Reports</h2>
            <Button 
              variant="primary" 
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create Report
            </Button>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Card>
            <Card.Body>
              {reports.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-file-text display-4 text-muted"></i>
                  <p className="text-muted mt-3">No reports found. Create your first report to get started.</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Project</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.report_id}>
                        <td>
                          <div>
                            <strong>{report.title}</strong>
                            {report.photos && report.photos.length > 0 && (
                              <small className="text-muted d-block">
                                <i className="bi bi-image me-1"></i>
                                {report.photos.length} photo(s)
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>{report.project_title}</div>
                            <small className="text-muted">{report.project_status}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>{new Date(report.created_at).toLocaleDateString()}</div>
                            <small className="text-muted">{report.reporter_name}</small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-view-${report.report_id}`}>View</Tooltip>}>
                              <Button
                                variant="link"
                                className="icon-only-btn icon-view"
                                aria-label="View report"
                                onClick={() => navigate(`/reports/${report.report_id}`)}
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                            </OverlayTrigger>

                            <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-edit-${report.report_id}`}>Edit</Tooltip>}>
                              <Button
                                variant="link"
                                className="icon-only-btn icon-edit"
                                aria-label="Edit report"
                                onClick={() => handleEdit(report)}
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                            </OverlayTrigger>

                            <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-del-${report.report_id}`}>Delete</Tooltip>}>
                              <Button
                                variant="link"
                                className="icon-only-btn icon-delete"
                                aria-label="Delete report"
                                onClick={() => handleDelete(report.report_id)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </OverlayTrigger>
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

      {/* Create/Edit Report Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingReport ? 'Edit Report' : 'Create New Report'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Project *</Form.Label>
                  <Form.Select
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.title} ({project.status})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter report title"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content *</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Enter your report content here..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Photos</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
              />
              <Form.Text className="text-muted">
                You can upload multiple photos. Supported formats: JPG, PNG, GIF
              </Form.Text>
            </Form.Group>

            {editingReport && existingPhotos.length > 0 && (
              <div className="mb-3">
                <Form.Label>Existing Photos:</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {existingPhotos.map((photo) => (
                    <div key={photo.id} className="position-relative border rounded p-2">
                      <img
                        src={photo.url}
                        alt={photo.original_filename}
                        style={{ maxWidth: 160, maxHeight: 120 }}
                      />
                      <div className="mt-1 d-flex align-items-center justify-content-between">
                        <small className="text-muted me-2" title={photo.original_filename}>
                          {photo.original_filename.length > 18
                            ? photo.original_filename.slice(0, 18) + '...'
                            : photo.original_filename}
                        </small>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => handleRemoveExistingPhoto(photo)}
                          aria-label="Remove photo"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {photos.length > 0 && (
              <div className="mb-3">
                <Form.Label>Selected Photos:</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="position-relative">
                      <Badge bg="primary" className="d-flex align-items-center">
                        {photo.name}
                        <Button
                          variant="link"
                          size="sm"
                          className="text-white p-0 ms-2"
                          onClick={() => removePhoto(index)}
                        >
                          <i className="bi bi-x"></i>
                        </Button>
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                editingReport ? 'Update Report' : 'Create Report'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Reports;
