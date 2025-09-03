import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Container, Card, Row, Col, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';

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

  const submitDecision = async () => {
    try {
      setError('');
      await axios.post(`/projects/${id}/decision`, { decision, remarks });
      const { data } = await axios.get(`/projects/${id}`);
      setProject(data);
      setShowDecision(false);
      setRemarks('');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit decision');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!project) return <div className="p-4">Not found</div>;

  const asList = (value) => {
    if (!value) return [];
    try { const arr = JSON.parse(value); return Array.isArray(arr) ? arr : []; } catch { return []; }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">{project.title}</h3>
        <div className="d-flex gap-2">
          {elevated && (
            <Button size="sm" variant="success" onClick={() => { setDecision('Approved'); setShowDecision(true); }}>
              Approve
            </Button>
          )}
          {elevated && (
            <Button size="sm" variant="danger" onClick={() => { setDecision('Rejected'); setShowDecision(true); }}>
              Reject
            </Button>
          )}
          <Button as={Link} to="/projects" variant="secondary" size="sm">Back</Button>
        </div>
      </div>
      <Card className="shadow-sm">
        <Card.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          <Row className="mb-3">
            <Col md={6}><strong>Coordinator:</strong> {project.coordinator_fullname || '—'}</Col>
            <Col md={3}><strong>Status:</strong> <Badge bg="secondary">{project.status}</Badge></Col>
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
          <hr />
          <Row>
            <Col md={6}><strong>Extension Agenda:</strong><div>{asList(project.extension_agenda).join(', ') || '—'}</div></Col>
            <Col md={6}><strong>SDG Goals:</strong><div>{asList(project.sdg_goals).join(', ') || '—'}</div></Col>
          </Row>
          <hr />
          {[
            ['offices_involved','Office/s / College/s / Organization/s Involved'],
            ['programs_involved','Program/s Involved'],
            ['project_leaders','Project Leaders'],
            ['partner_agencies','Partner Agencies'],
            ['beneficiaries','Beneficiaries'],
            ['total_cost','Total Cost'],
            ['rationale','Rationale'],
            ['objectives_general','Objectives (General)'],
            ['objectives_specific','Objectives (Specific)'],
            ['expected_output','Expected Output'],
            ['strategies_methods','Description, Strategies and Methods'],
            ['financial_plan_details','Financial Plan'],
            ['functional_relationships','Functional Relationships'],
            ['monitoring_evaluation','Monitoring and Evaluation Plan'],
            ['sustainability_plan','Sustainability Plan']
          ].map(([key, label]) => (
            <div className="mb-3" key={key}>
              <strong>{label}:</strong>
              <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{project[key] || '—'}</div>
            </div>
          ))}
          <div className="mb-3">
            <strong>Fund Source:</strong>
            <div className="mt-1">{asList(project.fund_source).join(', ') || '—'}</div>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showDecision} onHide={() => setShowDecision(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{decision === 'Approved' ? 'Approve Project' : 'Reject Project'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {decision === 'Rejected' && (
            <Form.Group>
              <Form.Label>Remarks (required for rejection)</Form.Label>
              <Form.Control as="textarea" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDecision(false)}>Cancel</Button>
          <Button variant={decision === 'Approved' ? 'success' : 'danger'} onClick={submitDecision}>
            {decision === 'Approved' ? 'Approve' : 'Reject'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProjectView;


