import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Badge, 
  Form, 
  Button, 
  Pagination,
  Alert,
  Spinner,
  Modal,
  ButtonGroup
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './SystemLogs.css';

const SystemLogs = () => {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  
  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_logs: 0,
    logs_per_page: 50
  });

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    start_date: '',
    end_date: '',
    user_id: ''
  });

  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    actions: [],
    entityTypes: [],
    users: []
  });

  // Set up axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current_page,
        limit: pagination.logs_per_page,
        ...filters
      });

      const response = await axios.get(`/logs?${params}`);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setAlert({
        show: true,
        message: 'Failed to load logs',
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const [actionsRes, entityTypesRes] = await Promise.all([
        axios.get('/logs/actions'),
        axios.get('/logs/entity-types')
      ]);

      setFilterOptions({
        actions: actionsRes.data,
        entityTypes: entityTypesRes.data,
        users: [] // Will be populated if admin
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Fetch statistics (admin only)
  const fetchStats = async () => {
    if (user?.role !== 'Admin') return;
    
    try {
      const response = await axios.get('/logs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchFilterOptions();
    fetchLogs();
    if (user?.role === 'Admin') {
      fetchStats();
    }
  }, []);

  // Refetch logs when filters or pagination changes
  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.current_page]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      action: '',
      entity_type: '',
      start_date: '',
      end_date: '',
      user_id: ''
    });
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  // View log details
  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  // Delete log entry (admin only)
  const deleteLog = async (logId) => {
    if (user?.role !== 'Admin') return;
    
    if (!window.confirm('Are you sure you want to delete this log entry?')) return;

    try {
      await axios.delete(`/logs/${logId}`);
      setAlert({
        show: true,
        message: 'Log entry deleted successfully',
        variant: 'success'
      });
      fetchLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
      setAlert({
        show: true,
        message: 'Failed to delete log entry',
        variant: 'danger'
      });
    }
  };

  // Get action badge color
  const getActionBadgeColor = (action) => {
    const colors = {
      'LOGIN': 'success',
      'LOGOUT': 'secondary',
      'CREATE': 'primary',
      'UPDATE': 'warning',
      'DELETE': 'danger',
      'UPLOAD': 'info',
      'EVALUATE': 'dark',
      'DOWNLOAD': 'success',
      'START': 'info',
      'COMPLETE': 'success',
      'APPROVE': 'success',
      'REJECT': 'danger'
    };
    return colors[action] || 'light';
  };

  // Get status badge color
  const getStatusBadgeColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500) return 'danger';
    return 'secondary';
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Format response time
  const formatResponseTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Container fluid className="system-logs-container">
      <Row>
        <Col>
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="mb-1">System Logs</h3>
              <p className="text-muted mb-0">
                {user?.role !== 'Admin' ? 'View your activity logs' : 'Monitor system activity and user actions'}
              </p>
            </div>
            <div className="d-flex gap-2">
              {user?.role === 'Admin' && (
                <Button 
                  variant="outline-info" 
                  onClick={() => setShowStats(true)}
                >
                  <i className="bi bi-bar-chart me-2"></i>
                  Statistics
                </Button>
              )}
              <Button 
                variant="outline-secondary" 
                onClick={clearFilters}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Clear Filters
              </Button>
            </div>
          </div>


          <Card className="shadow-sm mb-4">
            <Card.Body>
              {/* Filters */}
              <Row className="mb-3">
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Action</Form.Label>
                    <Form.Select
                      value={filters.action}
                      onChange={(e) => handleFilterChange('action', e.target.value)}
                    >
                      <option value="">All Actions</option>
                      {filterOptions.actions.map(action => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Entity Type</Form.Label>
                    <Form.Select
                      value={filters.entity_type}
                      onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                    >
                      <option value="">All Types</option>
                      {filterOptions.entityTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={filters.start_date}
                      onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={filters.end_date}
                      onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Logs per Page</Form.Label>
                    <Form.Select
                      value={pagination.logs_per_page}
                      onChange={(e) => setPagination(prev => ({ 
                        ...prev, 
                        logs_per_page: parseInt(e.target.value),
                        current_page: 1 
                      }))}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button 
                    variant="primary" 
                    onClick={fetchLogs}
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <i className="bi bi-search"></i>
                    )}
                    {' '}Search
                  </Button>
                </Col>
              </Row>

              {/* Alert */}
              {alert.show && (
                <Alert 
                  variant={alert.variant} 
                  dismissible 
                  onClose={() => setAlert({ ...alert, show: false })}
                >
                  {alert.message}
                </Alert>
              )}

              {/* Logs Table */}
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading logs...</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table striped hover className="logs-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>User</th>
                          <th>Action</th>
                          <th>Entity</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Response Time</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.log_id}>
                            <td>{formatDate(log.created_at)}</td>
                            <td>
                              {log.user_fullname ? (
                                <>
                                  {log.user_fullname}
                                  {log.user_role && (
                                    <Badge bg="secondary" className="ms-1">
                                      {log.user_role}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted">System</span>
                              )}
                            </td>
                            <td>
                              <Badge bg={getActionBadgeColor(log.action)}>
                                {log.action}
                              </Badge>
                            </td>
                            <td>
                              {log.entity_type}
                              {log.entity_id && ` #${log.entity_id}`}
                            </td>
                            <td className="description-cell">
                              {log.description}
                            </td>
                            <td>
                              <Badge bg={getStatusBadgeColor(log.status_code)}>
                                {log.status_code}
                              </Badge>
                            </td>
                            <td>{formatResponseTime(log.response_time)}</td>
                            <td>
                              <ButtonGroup size="sm">
                                <Button 
                                  variant="outline-info" 
                                  onClick={() => viewLogDetails(log)}
                                >
                                  <i className="bi bi-eye"></i>
                                </Button>
                                {user?.role === 'Admin' && (
                                  <Button 
                                    variant="outline-danger" 
                                    onClick={() => deleteLog(log.log_id)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                )}
                              </ButtonGroup>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination.total_pages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        Showing {((pagination.current_page - 1) * pagination.logs_per_page) + 1} to{' '}
                        {Math.min(pagination.current_page * pagination.logs_per_page, pagination.total_logs)} of{' '}
                        {pagination.total_logs} logs
                      </div>
                      <Pagination>
                        <Pagination.First 
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.current_page === 1}
                        />
                        <Pagination.Prev 
                          onClick={() => handlePageChange(pagination.current_page - 1)}
                          disabled={pagination.current_page === 1}
                        />
                        
                        {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                          const page = Math.max(1, Math.min(
                            pagination.total_pages - 4,
                            pagination.current_page - 2
                          )) + i;
                          return (
                            <Pagination.Item
                              key={page}
                              active={page === pagination.current_page}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Pagination.Item>
                          );
                        })}
                        
                        <Pagination.Next 
                          onClick={() => handlePageChange(pagination.current_page + 1)}
                          disabled={pagination.current_page === pagination.total_pages}
                        />
                        <Pagination.Last 
                          onClick={() => handlePageChange(pagination.total_pages)}
                          disabled={pagination.current_page === pagination.total_pages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Log Details Modal */}
      <Modal show={showLogDetails} onHide={() => setShowLogDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Log Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <div>
              <Row>
                <Col md={6}>
                  <h6>Basic Information</h6>
                  <p><strong>Action:</strong> <Badge bg={getActionBadgeColor(selectedLog.action)}>{selectedLog.action}</Badge></p>
                  <p><strong>Entity Type:</strong> {selectedLog.entity_type}</p>
                  <p><strong>Entity ID:</strong> {selectedLog.entity_id || 'N/A'}</p>
                  <p><strong>Description:</strong> {selectedLog.description}</p>
                  <p><strong>Timestamp:</strong> {formatDate(selectedLog.created_at)}</p>
                </Col>
                <Col md={6}>
                  <h6>Request Information</h6>
                  <p><strong>Method:</strong> {selectedLog.request_method}</p>
                  <p><strong>URL:</strong> {selectedLog.request_url}</p>
                  <p><strong>Status Code:</strong> <Badge bg={getStatusBadgeColor(selectedLog.status_code)}>{selectedLog.status_code}</Badge></p>
                  <p><strong>Response Time:</strong> {formatResponseTime(selectedLog.response_time)}</p>
                  <p><strong>IP Address:</strong> {selectedLog.ip_address}</p>
                </Col>
              </Row>
              
              {selectedLog.user_fullname && (
                <Row className="mt-3">
                  <Col>
                    <h6>User Information</h6>
                    <p><strong>Name:</strong> {selectedLog.user_fullname}</p>
                    <p><strong>Email:</strong> {selectedLog.user_email}</p>
                    <p><strong>Role:</strong> {selectedLog.user_role}</p>
                  </Col>
                </Row>
              )}

              {selectedLog.error_message && (
                <Row className="mt-3">
                  <Col>
                    <h6>Error Information</h6>
                    <Alert variant="danger">{selectedLog.error_message}</Alert>
                  </Col>
                </Row>
              )}

              {selectedLog.additional_data && (
                <Row className="mt-3">
                  <Col>
                    <h6>Additional Data</h6>
                    <pre className="bg-light p-3 rounded">
                      {JSON.stringify(selectedLog.additional_data, null, 2)}
                    </pre>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Statistics Modal */}
      <Modal show={showStats} onHide={() => setShowStats(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>System Logs Statistics</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {stats && (
            <Row>
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>Overview</Card.Header>
                  <Card.Body>
                    <h3>{stats.total_logs}</h3>
                    <p className="text-muted">Total Log Entries</p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>Top Actions</Card.Header>
                  <Card.Body>
                    {stats.actions.slice(0, 5).map((action, index) => (
                      <div key={action.action} className="d-flex justify-content-between mb-2">
                        <span>{action.action}</span>
                        <Badge bg="primary">{action.count}</Badge>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>Top Entity Types</Card.Header>
                  <Card.Body>
                    {stats.entity_types.slice(0, 5).map((entity, index) => (
                      <div key={entity.entity_type} className="d-flex justify-content-between mb-2">
                        <span>{entity.entity_type}</span>
                        <Badge bg="info">{entity.count}</Badge>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>Top Users</Card.Header>
                  <Card.Body>
                    {stats.top_users.slice(0, 5).map((user, index) => (
                      <div key={user.email} className="d-flex justify-content-between mb-2">
                        <span>{user.fullname}</span>
                        <Badge bg="success">{user.count}</Badge>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SystemLogs;
