import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button, Spinner, Alert, Image } from 'react-bootstrap';

const ReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>
        <Button variant="secondary" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </Container>
    );
  }

  if (!report) return null;

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">{report.title}</h2>
        <div>
          <Badge bg={statusVariant(report.status)} className="me-2">{report.status}</Badge>
          <Link to="/reports" className="btn btn-outline-secondary btn-sm">Back</Link>
        </div>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <Row className="mb-2">
            <Col md={6}><strong>Project:</strong> {report.project_title}</Col>
            <Col md={6}><strong>Report Type:</strong> {report.type}</Col>
          </Row>
          <Row className="mb-2">
            <Col md={6}><strong>Reporter:</strong> {report.reporter_name} ({report.reporter_department})</Col>
            <Col md={6}><strong>Created:</strong> {new Date(report.created_at).toLocaleString()}</Col>
          </Row>
          {report.updated_at && (
            <Row className="mb-2">
              <Col md={6}><strong>Last Updated:</strong> {new Date(report.updated_at).toLocaleString()}</Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header><strong>Report Content</strong></Card.Header>
        <Card.Body>
          <div style={{ whiteSpace: 'pre-wrap' }}>{report.content}</div>
        </Card.Body>
      </Card>

      {report.photos && report.photos.length > 0 && (
        <Card className="mb-3">
          <Card.Header><strong>Photos</strong></Card.Header>
          <Card.Body>
            <Row className="g-3">
              {report.photos.map((photo) => (
                <Col key={photo.id} xs={12} sm={6} md={4} lg={3}>
                  <div className="border rounded p-2 text-center">
                    <Image src={photo.url} alt={photo.original_filename} fluid />
                    <div className="mt-2">
                      <small className="text-muted">{photo.original_filename}</small>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ReportView;


