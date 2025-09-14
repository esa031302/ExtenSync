import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Badge, 
  Alert,
  Spinner
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const UserManagement = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    role: '',
    department_college: '',
    account_status: 'Active'
  });

  const roles = ['Extension Coordinator', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin', 'Beneficiary'];
  const statuses = ['Active', 'Inactive'];

  // Set up axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAlert({
        show: true,
        message: 'Failed to load users',
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      fullname: '',
      email: '',
      password: '',
      role: '',
      department_college: '',
      account_status: 'Active'
    });
    setFormErrors({});
    setEditingUser(null);
  };

  // Open modal for adding/editing user
  const handleShowModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullname: user.fullname,
        email: user.email,
        password: '',
        role: user.role,
        department_college: user.department_college,
        account_status: user.account_status
      });
    } else {
      resetForm();
    }
    setFormErrors({});
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        }
        
        await axios.put(`/users/${editingUser.user_id}`, updateData);
        setAlert({
          show: true,
          message: 'User updated successfully!',
          variant: 'success'
        });
      } else {
        // Create new user
        await axios.post('/users', formData);
        setAlert({
          show: true,
          message: 'User created successfully!',
          variant: 'success'
        });
      }
      
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      
      // Handle validation errors with more detail
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Map validation errors to form fields
        const errors = {};
        error.response.data.errors.forEach(err => {
          if (err.path) {
            errors[err.path] = err.msg;
          } else if (err.param) {
            errors[err.param] = err.msg;
          }
        });
        setFormErrors(errors);
      } else if (error.response?.data?.error) {
        // Single error message
        setAlert({
          show: true,
          message: error.response.data.error,
          variant: 'danger'
        });
      } else {
        setAlert({
          show: true,
          message: 'Failed to save user',
          variant: 'danger'
        });
      }
    }
  };

  // Handle user deletion
  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      try {
        await axios.delete(`/users/${userId}`);
        setAlert({
          show: true,
          message: 'User deleted successfully!',
          variant: 'success'
        });
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        setAlert({
          show: true,
          message: error.response?.data?.error || 'Failed to delete user',
          variant: 'danger'
        });
      }
    }
  };

  // Close alert
  const handleCloseAlert = () => {
    setAlert({ show: false, message: '', variant: 'success' });
  };

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
    <Container className="user-management-container">
      <Row>
        <Col>
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="mb-1">User Management</h3>
              <p className="text-muted mb-0">Manage system users and their roles</p>
            </div>
            <Button 
              variant="success" 
              onClick={() => handleShowModal()}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Add New User
            </Button>
          </div>

          <Card className="shadow-sm">
            <Card.Body>
              {alert.show && (
                <Alert variant={alert.variant} dismissible onClose={handleCloseAlert}>
                  {alert.message}
                </Alert>
              )}

              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department/College</th>
                    <th>Status</th>
                    <th>Date Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id}>
                      <td>{user.fullname}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg="info">{user.role}</Badge>
                      </td>
                      <td>{user.department_college}</td>
                      <td>
                        <span className={user.account_status === 'Active' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                          {user.account_status}
                        </span>
                      </td>
                      <td>
                        {new Date(user.date_registered).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleShowModal(user)}
                            title="Edit User"
                            className="d-flex align-items-center"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(user.user_id, user.fullname)}
                            title="Delete User"
                            className="d-flex align-items-center"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? 'Edit User' : 'Add New User'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
                             <Col md={6}>
                 <Form.Group className="mb-3">
                   <Form.Label>Full Name *</Form.Label>
                   <Form.Control
                     type="text"
                     name="fullname"
                     value={formData.fullname}
                     onChange={handleChange}
                     placeholder="Enter full name"
                     required
                     isInvalid={!!formErrors.fullname}
                   />
                   <Form.Control.Feedback type="invalid">
                     {formErrors.fullname}
                   </Form.Control.Feedback>
                 </Form.Group>
               </Col>
                             <Col md={6}>
                 <Form.Group className="mb-3">
                   <Form.Label>Email Address *</Form.Label>
                   <Form.Control
                     type="email"
                     name="email"
                     value={formData.email}
                     onChange={handleChange}
                     placeholder="Enter email address"
                     required
                     isInvalid={!!formErrors.email}
                   />
                   <Form.Control.Feedback type="invalid">
                     {formErrors.email}
                   </Form.Control.Feedback>
                 </Form.Group>
               </Col>
            </Row>
            
            <Row>
                             <Col md={6}>
                 <Form.Group className="mb-3">
                   <Form.Label>Password {!editingUser && '*'}</Form.Label>
                   <Form.Control
                     type="password"
                     name="password"
                     value={formData.password}
                     onChange={handleChange}
                     placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                     required={!editingUser}
                     isInvalid={!!formErrors.password}
                   />
                   <Form.Control.Feedback type="invalid">
                     {formErrors.password}
                   </Form.Control.Feedback>
                   {editingUser && (
                     <Form.Text className="text-muted">
                       Leave blank to keep the current password
                     </Form.Text>
                   )}
                 </Form.Group>
               </Col>
                             <Col md={6}>
                 <Form.Group className="mb-3">
                   <Form.Label>Role *</Form.Label>
                   <Form.Select
                     name="role"
                     value={formData.role}
                     onChange={handleChange}
                     required
                     isInvalid={!!formErrors.role}
                   >
                     <option value="">Select role</option>
                     {roles.map((role) => (
                       <option key={role} value={role}>{role}</option>
                     ))}
                   </Form.Select>
                   <Form.Control.Feedback type="invalid">
                     {formErrors.role}
                   </Form.Control.Feedback>
                 </Form.Group>
               </Col>
            </Row>

            <Row>
                             <Col md={6}>
                 <Form.Group className="mb-3">
                   <Form.Label>Department/College *</Form.Label>
                   <Form.Control
                     type="text"
                     name="department_college"
                     value={formData.department_college}
                     onChange={handleChange}
                     placeholder="Enter department or college"
                     required
                     isInvalid={!!formErrors.department_college}
                   />
                   <Form.Control.Feedback type="invalid">
                     {formErrors.department_college}
                   </Form.Control.Feedback>
                 </Form.Group>
               </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Account Status</Form.Label>
                  <Form.Select
                    name="account_status"
                    value={formData.account_status}
                    onChange={handleChange}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UserManagement;
