import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { NotificationMessages } from '../hooks/useNotification';

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

const ProjectEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // State declarations
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  
  // Check if user can edit dates and status (elevated roles only, OR coordinators for rejected projects)
  const isElevatedRole = user && ['Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin'].includes(user.role);
  const canEditStatus = isElevatedRole; // Status editing still restricted to elevated roles only
  
  // Calculate canEditDates after project is loaded
  const canEditDates = isElevatedRole || (
    user && user.role === 'Extension Coordinator' && 
    project && project.coordinator_id === user.user_id && 
    project.status === 'Rejected'
  );

  const [fundSourceOther, setFundSourceOther] = useState('');
  const [form, setForm] = useState({
    request_type: '',
    initiative_type: '',
    title: '',
    location: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    status: '', // Add status field for elevated roles
    extension_agenda: '',
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

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`/projects/${id}`);
        setProject(data);
        const parseList = (value) => { try { const v = JSON.parse(value); return Array.isArray(v) ? v : []; } catch { return []; } };
        const extAgenda = parseList(data.extension_agenda);
        const singleExtAgenda = extAgenda.length > 0 ? extAgenda[0] : '';
        const sdgs = parseList(data.sdg_goals);
        const fundList = parseList(data.fund_source);
        const fundOpts = [];
        let otherText = '';
        fundList.forEach((entry) => {
          if (typeof entry === 'string' && entry.toLowerCase().startsWith('others')) {
            fundOpts.push('Others');
            const parts = entry.split(':');
            if (parts.length > 1) otherText = parts.slice(1).join(':').trim();
          } else if (entry === 'STF' || entry === 'MDS') {
            fundOpts.push(entry);
          }
        });
        setFundSourceOther(otherText);
        setForm({
          request_type: data.request_type || '',
          initiative_type: data.initiative_type || '',
          title: data.title || '',
          location: data.location || '',
          duration: data.duration || '',
          start_date: data.start_date ? data.start_date.split('T')[0] : '',
          end_date: data.end_date ? data.end_date.split('T')[0] : '',
          start_time: data.start_time || '',
          end_time: data.end_time || '',
          status: data.status || '',
          extension_agenda: singleExtAgenda,
          sdg_goals: sdgs,
          offices_involved: data.offices_involved || '',
          programs_involved: data.programs_involved || '',
          project_leaders: data.project_leaders || '',
          partner_agencies: data.partner_agencies || '',
          beneficiaries: data.beneficiaries || '',
          total_cost: data.total_cost || '',
          fund_source: fundOpts,
          rationale: data.rationale || '',
          objectives_general: data.objectives_general || '',
          objectives_specific: data.objectives_specific || '',
          expected_output: data.expected_output || '',
          strategies_methods: data.strategies_methods || '',
          financial_plan_details: data.financial_plan_details || '',
          functional_relationships: data.functional_relationships || '',
          monitoring_evaluation: data.monitoring_evaluation || '',
          sustainability_plan: data.sustainability_plan || ''
        });
      } catch (e) {
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!authLoading && user && project) {
      const canEdit = user.role === 'Admin' || user.user_id === project.coordinator_id;
      if (!canEdit) navigate(`/projects/${id}`);
    }
  }, [authLoading, user, project, id, navigate]);

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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      
      // Remove status field for coordinators (only elevated roles can change status)
      if (!canEditStatus) {
        delete payload.status;
      }
      
      // Convert extension_agenda string to array for backend compatibility
      if (form.extension_agenda) {
        payload.extension_agenda = [form.extension_agenda];
      }
      
      if (form.fund_source.includes('Others')) {
        payload.fund_source = form.fund_source.map((fs) => fs === 'Others' ? (fundSourceOther.trim() ? `Others: ${fundSourceOther.trim()}` : 'Others') : fs);
      }
      await axios.put(`/projects/${id}`, payload);
      navigate('/projects', { state: { success: NotificationMessages.PROJECT_UPDATED } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!project) return <div className="p-4">Not found</div>;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Edit Project</h3>
        <Button as={Link} to={`/projects/${id}`} variant="secondary" size="sm">Cancel</Button>
      </div>
      <Card className="shadow-sm">
        <Card.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          <Form onSubmit={handleSave}>
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

            {/* Status - For elevated roles only */}
            {canEditStatus && (
              <Form.Group className="mb-3">
                <Form.Label>
                  Project Status 
                  <small className="text-muted ms-2">
                    <i className="bi bi-shield-check"></i> Elevated roles only
                  </small>
                </Form.Label>
                <Form.Select 
                  name="status" 
                  value={form.status} 
                  onChange={handleChange}
                  className="border-warning"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="On-Going">On-Going</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </Form.Select>
                <Form.Text className="text-warning">
                  <i className="bi bi-exclamation-triangle"></i> 
                  Changing status will notify relevant users and may affect project workflow.
                </Form.Text>
              </Form.Group>
            )}

            {/* Duration - Enhanced with better date/time inputs */}
            <Form.Group className="mb-3">
              <Form.Label>
                Duration (Date and Time) <span className="text-danger">*</span>
                {!canEditDates && (
                  <small className="text-muted ms-2">
                    <i className="bi bi-info-circle"></i> Only elevated roles can modify dates, or coordinators can modify dates for rejected projects
                  </small>
                )}
              </Form.Label>
              <Row>
                <Col md={6}>
                  <Form.Label className="small text-muted">Start Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="date" 
                    name="start_date" 
                    value={form.start_date || ''} 
                    onChange={handleChange}
                    placeholder="Start Date"
                    required
                    disabled={!canEditDates}
                    className={!canEditDates ? 'bg-light' : ''}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="small text-muted">End Date (Optional)</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="end_date" 
                    value={form.end_date || ''} 
                    onChange={handleChange}
                    placeholder="End Date"
                    disabled={!canEditDates}
                    className={!canEditDates ? 'bg-light' : ''}
                  />
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={6}>
                  <Form.Label className="small text-muted">Start Time (Optional)</Form.Label>
                  <Form.Control 
                    type="time" 
                    name="start_time" 
                    value={form.start_time || ''} 
                    onChange={handleChange}
                    placeholder="Start Time"
                    disabled={!canEditDates}
                    className={!canEditDates ? 'bg-light' : ''}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="small text-muted">End Time (Optional)</Form.Label>
                  <Form.Control 
                    type="time" 
                    name="end_time" 
                    value={form.end_time || ''} 
                    onChange={handleChange}
                    placeholder="End Time"
                    disabled={!canEditDates}
                    className={!canEditDates ? 'bg-light' : ''}
                  />
                </Col>
              </Row>
              {!canEditDates && (
                <div className="mt-2">
                  <small className="text-muted">
                    <i className="bi bi-lock"></i> Date and time fields can only be modified by Extension Head, GAD, Vice Chancellor, Chancellor, or Admin roles.
                  </small>
                </div>
              )}
            </Form.Group>

            {/* Extension Agenda */}
            <Form.Group className="mb-3">
              <Form.Label>Type of Extension Service Agenda (Choose the MOST - only one)</Form.Label>
              {EXTENSION_AGENDAS.map((agenda) => (
                <Form.Check 
                  key={agenda} 
                  type="radio" 
                  name="extension_agenda"
                  label={agenda} 
                  value={agenda}
                  checked={form.extension_agenda === agenda} 
                  onChange={handleChange} 
                />
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
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProjectEdit;


