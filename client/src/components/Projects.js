import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Table, Badge, Button, OverlayTrigger, Tooltip, Form, InputGroup } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Projects.css';

const statusVariant = (status) => {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'danger';
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
  const { user } = useAuth();
  const canPropose = user && ['Extension Coordinator','Extension Head','GAD','Admin'].includes(user.role);
  const location = useLocation();
  const successMessage = location.state?.success;

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
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
  };

  const hasActiveFilters = searchTerm.trim() || statusFilter !== 'All';

  return (
    <div className="py-4">
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
              {successMessage && (
                <div className="alert alert-success" role="alert">
                  {successMessage}
                </div>
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
                      <th>Title</th>
                      <th>Coordinator</th>
                      <th>Status</th>
                      <th>Date Submitted</th>
                      <th style={{ width: 150 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((p) => (
                      <tr key={p.project_id}>
                        <td>{p.title}</td>
                        <td>{p.coordinator_fullname || '—'}</td>
                        <td>
                          <Badge bg={statusVariant(p.status)}>{p.status}</Badge>
                        </td>
                        <td>{new Date(p.date_submitted).toLocaleString()}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-view-${p.project_id}`}>View</Tooltip>}>
                              <Button as={Link} to={`/projects/${p.project_id}`} variant="link" className="icon-only-btn icon-view" aria-label="View project">
                                <i className="bi bi-eye"></i>
                              </Button>
                            </OverlayTrigger>
                            {(user && ['Extension Head','GAD','Vice Chancellor','Chancellor','Admin'].includes(user.role)) && (
                              <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-edit-${p.project_id}`}>Edit</Tooltip>}>
                                <Button as={Link} to={`/projects/${p.project_id}/edit`} variant="link" className="icon-only-btn icon-edit" aria-label="Edit project">
                                  <i className="bi bi-pencil"></i>
                                </Button>
                              </OverlayTrigger>
                            )}
                                                         {(user && ['Extension Head','GAD','Vice Chancellor','Chancellor','Admin'].includes(user.role)) && (
                               <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-del-${p.project_id}`}>Delete</Tooltip>}>
                                 <Button onClick={async () => {
                                   if (!window.confirm('Delete this project?')) return;
                                   try {
                                     await axios.delete(`http://localhost:5000/api/projects/${p.project_id}`);
                                     setProjects(prev => prev.filter(row => row.project_id !== p.project_id));
                                   } catch (e) {
                                     // eslint-disable-next-line no-console
                                     console.error('Delete failed', e);
                                   }
                                 }} variant="link" className="icon-only-btn icon-delete" aria-label="Delete project">
                                   <i className="bi bi-trash"></i>
                                 </Button>
                               </OverlayTrigger>
                             )}
                             {(user && ['Extension Head','GAD','Vice Chancellor','Chancellor','Admin'].includes(user.role) && p.status === 'Approved') && (
                               <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-complete-${p.project_id}`}>Mark as Completed</Tooltip>}>
                                 <Button onClick={async () => {
                                   if (!window.confirm('Mark this project as completed?')) return;
                                   try {
                                     await axios.put(`http://localhost:5000/api/projects/${p.project_id}/complete`);
                                     setProjects(prev => prev.map(row => 
                                       row.project_id === p.project_id 
                                         ? { ...row, status: 'Completed' }
                                         : row
                                     ));
                                   } catch (e) {
                                     console.error('Mark as completed failed', e);
                                   }
                                 }} variant="link" className="icon-only-btn icon-complete" aria-label="Mark as completed">
                                   <i className="bi bi-check-circle-fill text-info"></i>
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
    </div>
  );
};

export default Projects;


