import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EXTENSION_AGENDAS = [
  'BatStateU Inclusive Social Innovation for Regional Growth (BISIG) Program',
  'Livelihood and other Entrepreneurship related on Agri-Fisheries (LEAF)',
  'Environment and Natural Resources Conservation, Protection and Rehabilitation Program',
  'Smart Analytics and Engineering Innovation',
  'Adopt-a Municipality/Barangay/School/Social Development Thru BIDANI Implementation',
  'Community Outreach',
  'Technical- Vocational Education and Training (TVET) Program',
  'Technology Transfer and Adoption/Utilization Program',
  'Technical Assistance and Advisory Services Program',
  "Parents' Empowerment through Social Development (PESODEV)",
  'Gender and Development',
  'Disaster Risk Reduction and Management and Disaster Preparedness and Response/Climate Change Adaptation (DRRM and DPR/CCA)'
];

const SDG_GOALS = [
  'No Poverty',
  'Zero Hunger',
  'Good Health and Well-Being',
  'Quality Education',
  'Gender Equality',
  'Clean Water and Sanitation',
  'Affordable and Clean Energy',
  'Decent Work and Economic Growth',
  'Industry, Innovation and Infrastructure',
  'Reduced Inequalities',
  'Sustainable Cities and Communities',
  'Climate Action',
  'Life Below Water',
  'Life on Land',
  'Peace, Justice and Strong Institutions',
  'Partnerships for the Goals'
];

const ProjectProposal = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState('');
  useEffect(() => {
    if (!authLoading && user && !['Extension Coordinator','Extension Head','GAD','Admin'].includes(user.role)) {
      navigate('/projects');
    }
  }, [authLoading, user, navigate]);
  const [loading, setLoading] = useState(false);
  const [fundSourceOther, setFundSourceOther] = useState('');
  const [form, setForm] = useState({
    request_type: '',
    initiative_type: '',
    title: '',
    location: '',
    duration: '',
    extension_agenda: [],
    sdg_goals: [],
    offices_involved: '',
    programs_involved: '',
    project_leaders: '',
    partner_agencies: '',
    beneficiaries: '',
    total_cost: '',
    fund_source: [],
    rationale: '',
    objectives_general: '',
    objectives_specific: '',
    expected_output: '',
    strategies_methods: '',
    financial_plan_details: '',
    functional_relationships: '',
    monitoring_evaluation: '',
    sustainability_plan: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxGroup = (name, value) => {
    setForm((prev) => {
      const current = new Set(prev[name]);
      if (current.has(value)) current.delete(value); else current.add(value);
      return { ...prev, [name]: Array.from(current) };
    });
  };

  const handleFundSourceOther = (e) => {
    setFundSourceOther(e.target.value);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { ...form };
      if (form.fund_source.includes('Others') && fundSourceOther.trim()) {
        payload.fund_source = form.fund_source.map((fs) => fs === 'Others' ? `Others: ${fundSourceOther.trim()}` : fs);
      }
      await axios.post('/projects', payload);
      navigate('/projects', { state: { success: 'Project proposed successfully' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex align-items-start pt-4">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={9}>
            <Card className="shadow border-0">
              <Card.Body className="p-4">
                <h4 className="mb-3">Propose New Project</h4>
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>
                )}
                <Form onSubmit={submit}>
                  {/* Request Type */}
                  <Form.Group className="mb-3">
                    <Form.Label>Request Type</Form.Label>
                    <div>
                      <Form.Check inline type="radio" name="request_type" id="client_requested" label="Extension Service Program/Project/Activity is requested by clients." value="Client Requested" onChange={handleChange} checked={form.request_type === 'Client Requested'} />
                      <Form.Check inline type="radio" name="request_type" id="department_initiative" label="Extension Service Program/Project/Activity is Department's initiative." value="Department Initiative" onChange={handleChange} checked={form.request_type === 'Department Initiative'} />
                    </div>
                  </Form.Group>

                  {/* Initiative Type */}
                  <Form.Group className="mb-3">
                    <Form.Label>Initiative Type</Form.Label>
                    <div>
                      <Form.Check inline type="radio" name="initiative_type" id="program" label="Program" value="Program" onChange={handleChange} checked={form.initiative_type === 'Program'} />
                      <Form.Check inline type="radio" name="initiative_type" id="project" label="Project" value="Project" onChange={handleChange} checked={form.initiative_type === 'Project'} />
                      <Form.Check inline type="radio" name="initiative_type" id="activity" label="Activity" value="Activity" onChange={handleChange} checked={form.initiative_type === 'Activity'} />
                    </div>
                  </Form.Group>

                  {/* Title */}
                  <Form.Group className="mb-3">
                    <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                    <Form.Control name="title" value={form.title} onChange={handleChange} required />
                  </Form.Group>

                  {/* Location */}
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control name="location" value={form.location} onChange={handleChange} />
                  </Form.Group>

                  {/* Duration */}
                  <Form.Group className="mb-3">
                    <Form.Label>Duration (Date and Time)</Form.Label>
                    <Form.Control name="duration" value={form.duration} onChange={handleChange} />
                  </Form.Group>

                  {/* Extension Agenda */}
                  <Form.Group className="mb-3">
                    <Form.Label>Type of Extension Service Agenda (Choose the MOST - only one)</Form.Label>
                    {EXTENSION_AGENDAS.map((agenda) => (
                      <Form.Check key={agenda} type="checkbox" label={agenda} checked={form.extension_agenda.includes(agenda)} onChange={() => handleCheckboxGroup('extension_agenda', agenda)} />
                    ))}
                  </Form.Group>

                  {/* SDG Goals */}
                  <Form.Group className="mb-3">
                    <Form.Label>Sustainable Development Goals (SDG)</Form.Label>
                    <Row>
                      {SDG_GOALS.map((goal) => (
                        <Col key={goal} md={6}>
                          <Form.Check type="checkbox" label={goal} checked={form.sdg_goals.includes(goal)} onChange={() => handleCheckboxGroup('sdg_goals', goal)} />
                        </Col>
                      ))}
                    </Row>
                  </Form.Group>

                  {/* Textareas */}
                  <Form.Group className="mb-3">
                    <Form.Label>Office/s / College/s / Organization/s Involved</Form.Label>
                    <Form.Control as="textarea" rows={2} name="offices_involved" value={form.offices_involved} onChange={handleChange} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Program/s Involved</Form.Label>
                    <Form.Control as="textarea" rows={2} name="programs_involved" value={form.programs_involved} onChange={handleChange} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Project Leader, Assistant Project Leader and Coordinators</Form.Label>
                    <Form.Control as="textarea" rows={2} name="project_leaders" value={form.project_leaders} onChange={handleChange} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Partner Agencies</Form.Label>
                    <Form.Control as="textarea" rows={2} name="partner_agencies" value={form.partner_agencies} onChange={handleChange} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Beneficiaries (Type and Number of Male and Female)</Form.Label>
                    <Form.Control as="textarea" rows={2} name="beneficiaries" value={form.beneficiaries} onChange={handleChange} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Cost</Form.Label>
                    <Form.Control name="total_cost" value={form.total_cost} onChange={handleChange} />
                  </Form.Group>

                  {/* Fund Source */}
                  <Form.Group className="mb-3">
                    <Form.Label>Source of fund</Form.Label>
                    <div className="mb-2">
                      {['STF','MDS','Others'].map((fs) => (
                        <Form.Check
                          inline
                          key={fs}
                          type="checkbox"
                          label={fs === 'Others' ? 'Others, (Please specify)' : fs}
                          checked={form.fund_source.includes(fs)}
                          onChange={() => handleCheckboxGroup('fund_source', fs)}
                        />
                      ))}
                    </div>
                    <Form.Control placeholder="Specify other source" value={fundSourceOther} onChange={handleFundSourceOther} />
                  </Form.Group>

                  {/* Long text sections */}
                  {[
                    ['rationale','Rationale (brief description of the situation)'],
                    ['objectives_general','Objectives (General)'],
                    ['objectives_specific','Objectives (Specific)'],
                    ['expected_output','Program/Project Expected Output'],
                    ['strategies_methods','Description, Strategies and Methods (Activities / Schedule)'],
                    ['financial_plan_details','Financial Plan'],
                    ['functional_relationships','Functional Relationships with the Partner Agencies (Duties / Tasks of the Partner Agencies)'],
                    ['monitoring_evaluation','Monitoring and Evaluation Mechanics / Plan'],
                    ['sustainability_plan','Sustainability Plan']
                  ].map(([name, label]) => (
                    <Form.Group className="mb-3" key={name}>
                      <Form.Label>{label}</Form.Label>
                      <Form.Control as="textarea" rows={name === 'strategies_methods' || name === 'monitoring_evaluation' ? 4 : 3} name={name} value={form[name]} onChange={handleChange} />
                    </Form.Group>
                  ))}

                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" as={Link} to="/projects">Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Proposal'}</Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ProjectProposal;


