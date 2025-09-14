import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Dropdown } from 'react-bootstrap';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
    extension_agenda: '',
    sdg_goals: [],
    offices_involved: '',
    programs_involved: '',
    project_leader: null, // Single user object
    assistant_project_leaders: [], // Array of user objects
    coordinators: [], // Array of user objects
    partner_agencies: '',
    beneficiaries: '',
    total_cost: '',
    fund_source: [],
    rationale: '',
    objectives: '',
    expected_output: '',
    strategies_methods: '',
    financial_plan_details: '',
    functional_relationships: '',
    monitoring_evaluation: '',
    sustainability_plan: ''
  });

  // Monitoring and Evaluation table data
  const [meTableData, setMeTableData] = useState({
    impact: { objectives: '', performance_indicators: '', baseline_data: '', performance_target: '', data_source: '', collection_method: '', frequency: '', responsible: '' },
    outcome: { objectives: '', performance_indicators: '', baseline_data: '', performance_target: '', data_source: '', collection_method: '', frequency: '', responsible: '' },
    output: { objectives: '', performance_indicators: '', baseline_data: '', performance_target: '', data_source: '', collection_method: '', frequency: '', responsible: '' },
    activities: { objectives: '', performance_indicators: '', baseline_data: '', performance_target: '', data_source: '', collection_method: '', frequency: '', responsible: '' },
    input: { objectives: '', performance_indicators: '', baseline_data: '', performance_target: '', data_source: '', collection_method: '', frequency: '', responsible: '' }
  });
  const [participantsOptions, setParticipantsOptions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [participantSearchTerm, setParticipantSearchTerm] = useState('');
  
  // User search states for the user fields
  const [userSearchOptions, setUserSearchOptions] = useState([]);
  const [projectLeaderSearch, setProjectLeaderSearch] = useState('');
  const [assistantLeadersSearch, setAssistantLeadersSearch] = useState('');
  const [coordinatorsSearch, setCoordinatorsSearch] = useState('');
  
  // Role filters for each field
  const [projectLeaderRoleFilter, setProjectLeaderRoleFilter] = useState('All');
  const [assistantLeadersRoleFilter, setAssistantLeadersRoleFilter] = useState('All');
  const [coordinatorsRoleFilter, setCoordinatorsRoleFilter] = useState('All');
  
  // Selected users for each field
  const [selectedProjectLeader, setSelectedProjectLeader] = useState(null);
  const [selectedAssistantLeaders, setSelectedAssistantLeaders] = useState([]);
  const [selectedCoordinators, setSelectedCoordinators] = useState([]);
  

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

  const handleMeTableChange = (objectiveType, field, value) => {
    setMeTableData(prev => ({
      ...prev,
      [objectiveType]: {
        ...prev[objectiveType],
        [field]: value
      }
    }));
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  // Load eligible participants
  useEffect(() => {
    const loadEligible = async () => {
      try {
        const { data } = await axios.get('/users/eligible-participants');
        setParticipantsOptions(data);
        setUserSearchOptions(data); // Use same data for user search
      } catch (err) {
        // Non-blocking
        console.error('Failed to load participants', err);
      }
    };
    loadEligible();
  }, []);

  const toggleParticipant = (userId) => {
    setParticipants((prev) => {
      const set = new Set(prev);
      if (set.has(userId)) set.delete(userId); else set.add(userId);
      return Array.from(set);
    });
  };

  // Toggle functions for each user field
  const toggleProjectLeader = (user) => {
    const isSameAsCurrent = selectedProjectLeader?.user_id === user.user_id;
    const nextSelected = isSameAsCurrent ? null : user;
    setSelectedProjectLeader(nextSelected);
    setForm(prev => ({ ...prev, project_leader: nextSelected }));
  };

  const toggleAssistantLeader = (user) => {
    setSelectedAssistantLeaders(prev => {
      const exists = prev.find(u => u.user_id === user.user_id);
      if (exists) {
        return prev.filter(u => u.user_id !== user.user_id);
      } else {
        return [...prev, user];
      }
    });
    setForm(prev => {
      const current = selectedAssistantLeaders;
      const exists = current.find(u => u.user_id === user.user_id);
      if (exists) {
        const updated = current.filter(u => u.user_id !== user.user_id);
        return { ...prev, assistant_project_leaders: updated };
      } else {
        const updated = [...current, user];
        return { ...prev, assistant_project_leaders: updated };
      }
    });
  };

  const toggleCoordinator = (user) => {
    setSelectedCoordinators(prev => {
      const exists = prev.find(u => u.user_id === user.user_id);
      if (exists) {
        return prev.filter(u => u.user_id !== user.user_id);
      } else {
        return [...prev, user];
      }
    });
    setForm(prev => {
      const current = selectedCoordinators;
      const exists = current.find(u => u.user_id === user.user_id);
      if (exists) {
        const updated = current.filter(u => u.user_id !== user.user_id);
        return { ...prev, coordinators: updated };
      } else {
        const updated = [...current, user];
        return { ...prev, coordinators: updated };
      }
    });
  };

  // Filter users based on search term
  const getFilteredUsers = (searchTerm) => {
    // Handle null, undefined, or non-string values
    if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
      return [];
    }
    
    return userSearchOptions.filter(user => 
      user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department_college.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };






  const submit = async () => {
    setLoading(true);
    setError('');
    setShowConfirmModal(false);

    try {
      const payload = { ...form };
      if (participants.length > 0) {
        payload.participants = participants;
      }
      
      // Convert extension_agenda string to array for backend compatibility
      if (form.extension_agenda) {
        payload.extension_agenda = [form.extension_agenda];
      }
      
      if (form.fund_source.includes('Others') && fundSourceOther.trim()) {
        payload.fund_source = form.fund_source.map((fs) => fs === 'Others' ? `Others: ${fundSourceOther.trim()}` : fs);
      }
      
      // Include monitoring and evaluation table data
      payload.monitoring_evaluation_table = meTableData;
      
      // Convert user objects to IDs for backend
      if (payload.project_leader) {
        payload.project_leader_id = payload.project_leader.user_id;
        delete payload.project_leader;
      }
      
      if (payload.assistant_project_leaders && payload.assistant_project_leaders.length > 0) {
        payload.assistant_project_leader_ids = payload.assistant_project_leaders.map(u => u.user_id);
        delete payload.assistant_project_leaders;
      }
      
      if (payload.coordinators && payload.coordinators.length > 0) {
        payload.coordinator_ids = payload.coordinators.map(u => u.user_id);
        delete payload.coordinators;
      }
      
      await axios.post('/projects', payload);
      navigate('/projects', { state: { success: NotificationMessages.PROJECT_CREATED } });
    } catch (err) {
      setError(
        err.response?.data?.details ||
        err.response?.data?.error ||
        'Failed to submit proposal. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Derived role options and filtered participants
  const roleOptions = ['All', ...Array.from(new Set(participantsOptions.map((u) => u.role)))];
  
  // Build selected ID sets for cross-field exclusion
  const selectedProjectLeaderId = selectedProjectLeader?.user_id || null;
  const selectedAssistantLeaderIds = selectedAssistantLeaders.map((u) => u.user_id);
  const selectedCoordinatorIds = selectedCoordinators.map((u) => u.user_id);
  const selectedParticipantIds = participants; // already array of IDs

  // For participants dropdown, exclude users already chosen in other fields
  const participantsExcludedIds = new Set([
    ...(selectedProjectLeaderId ? [selectedProjectLeaderId] : []),
    ...selectedAssistantLeaderIds,
    ...selectedCoordinatorIds
  ]);

  // Filter participants based on role, search term, and exclusions
  const filteredParticipantsOptions = participantsOptions.filter((u) => {
    if (participantsExcludedIds.has(u.user_id)) return false;
    const roleMatch = roleFilter === 'All' || u.role === roleFilter;
    const searchMatch = !participantSearchTerm.trim() || 
      u.fullname.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
      u.department_college.toLowerCase().includes(participantSearchTerm.toLowerCase());
    return roleMatch && searchMatch;
  });

  // Filter functions for each user field
  const getFilteredUsersForField = (searchTerm, roleFilter, excludedIds = new Set()) => {
    if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
      return [];
    }
    
    return userSearchOptions.filter((u) => {
      if (excludedIds.has(u.user_id)) return false;
      const roleMatch = roleFilter === 'All' || u.role === roleFilter;
      const searchMatch = 
        u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department_college.toLowerCase().includes(searchTerm.toLowerCase());
      return roleMatch && searchMatch;
    });
  };

  // Build exclusion sets per field so selected users don't show in other fields
  const excludeForProjectLeader = new Set([
    ...selectedAssistantLeaderIds,
    ...selectedCoordinatorIds,
    ...selectedParticipantIds,
  ]);
  const excludeForAssistantLeaders = new Set([
    ...(selectedProjectLeaderId ? [selectedProjectLeaderId] : []),
    ...selectedCoordinatorIds,
    ...selectedParticipantIds,
  ]);
  const excludeForCoordinators = new Set([
    ...(selectedProjectLeaderId ? [selectedProjectLeaderId] : []),
    ...selectedAssistantLeaderIds,
    ...selectedParticipantIds,
  ]);

  const filteredProjectLeaderOptions = getFilteredUsersForField(projectLeaderSearch, projectLeaderRoleFilter, excludeForProjectLeader);
  const filteredAssistantLeadersOptions = getFilteredUsersForField(assistantLeadersSearch, assistantLeadersRoleFilter, excludeForAssistantLeaders);
  const filteredCoordinatorsOptions = getFilteredUsersForField(coordinatorsSearch, coordinatorsRoleFilter, excludeForCoordinators);

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
                <Form onSubmit={handleSubmitClick}>
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

                  {/* Participants dropdown - moved below Duration per request */}

                  {/* Location */}
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control name="location" value={form.location} onChange={handleChange} />
                  </Form.Group>

                  {/* Duration - Enhanced with better date/time inputs */}
                  <Form.Group className="mb-3">
                    <Form.Label>Duration (Date and Time) <span className="text-danger">*</span></Form.Label>
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
                        />
                      </Col>
                    </Row>

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
                    <p className="text-muted mb-3">Choose the applicable SDG to your extension project:</p>
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
                    <Form.Label>Program/s Involved (specify the programs under the college implementing the project)</Form.Label>
                    <Form.Control as="textarea" rows={2} name="programs_involved" value={form.programs_involved} onChange={handleChange} />
                  </Form.Group>
                  {/* Project Leader */}
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Project Leader <small className="text-muted ms-2">(Only 1 user is allowed)</small>
                    </Form.Label>
                    
                    {/* Search input for project leader */}
                    <div className="position-relative mb-2">
                      <Form.Control
                        type="text"
                        placeholder="Search project leader by name, role, or department..."
                        value={projectLeaderSearch}
                        onChange={(e) => setProjectLeaderSearch(e.target.value)}
                        autoComplete="off"
                      />
                      
                      {/* Search results appear below the input */}
                      {projectLeaderSearch && filteredProjectLeaderOptions.length > 0 && (
                        <div 
                          className="position-absolute w-100 bg-white border rounded shadow-sm"
                          style={{ 
                            top: '100%',
                            left: 0,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 1000
                          }}
                        >
                          {filteredProjectLeaderOptions.map((u) => {
                            const checked = selectedProjectLeader?.user_id === u.user_id;
                            return (
                              <div
                                key={u.user_id}
                                className="px-3 py-2 border-bottom"
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleProjectLeader(u)}
                              >
                                <div className="d-flex align-items-center">
                                  <Form.Check
                                    type="radio"
                                    name="project_leader_radio"
                                    className="me-2"
                                    checked={checked}
                                    onChange={() => toggleProjectLeader(u)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ transform: 'scale(1.1)', accentColor: '#0d6efd' }}
                                  />
                                  <div>
                                    <div className="fw-medium">{u.fullname}</div>
                                    <small className="text-muted">{u.role} • {u.department_college}</small>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {projectLeaderSearch && filteredProjectLeaderOptions.length === 0 && (
                        <div 
                          className="position-absolute w-100 bg-white border rounded shadow-sm px-3 py-2 text-muted"
                          style={{ 
                            top: '100%',
                            left: 0,
                            zIndex: 1000
                          }}
                        >
                          No users found matching your search
                        </div>
                      )}
                    </div>
                    
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Form.Select
                        value={projectLeaderRoleFilter}
                        onChange={(e) => setProjectLeaderRoleFilter(e.target.value)}
                        style={{ maxWidth: 260 }}
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>
                        ))}
                      </Form.Select>
                      <span className="text-muted">
                        {selectedProjectLeader ? '1 project leader selected' : 'No project leader selected'}
                      </span>
                    </div>
                    {selectedProjectLeader && (
                      <div className="d-flex flex-wrap gap-2">
                        <span className="badge bg-secondary">
                          {selectedProjectLeader.fullname}
                          <Button variant="link" className="p-0 ms-2 text-white" onClick={() => toggleProjectLeader(selectedProjectLeader)} aria-label="Remove project leader">
                            <i className="bi bi-x"></i>
                          </Button>
                        </span>
                      </div>
                    )}
                  </Form.Group>

                  {/* Assistant Project Leaders */}
                  <Form.Group className="mb-3">
                    <Form.Label>Assistant Project Leaders</Form.Label>
                    
                    {/* Search input for assistant project leaders */}
                    <div className="position-relative mb-2">
                      <Form.Control
                        type="text"
                        placeholder="Search assistant project leaders by name, role, or department..."
                        value={assistantLeadersSearch}
                        onChange={(e) => setAssistantLeadersSearch(e.target.value)}
                        autoComplete="off"
                      />
                      
                      {/* Search results appear below the input */}
                      {assistantLeadersSearch && filteredAssistantLeadersOptions.length > 0 && (
                        <div 
                          className="position-absolute w-100 bg-white border rounded shadow-sm"
                          style={{ 
                            top: '100%',
                            left: 0,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 1000
                          }}
                        >
                          {filteredAssistantLeadersOptions.map((u) => {
                            const checked = selectedAssistantLeaders.some(selected => selected.user_id === u.user_id);
                            return (
                              <div
                                key={u.user_id}
                                className="px-3 py-2 border-bottom"
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleAssistantLeader(u)}
                              >
                                <div className="d-flex align-items-center">
                                  <Form.Check
                                    type="checkbox"
                                    className="me-2"
                                    checked={checked}
                                    onChange={() => toggleAssistantLeader(u)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ transform: 'scale(1.1)', accentColor: '#0d6efd' }}
                                  />
                                  <div>
                                    <div className="fw-medium">{u.fullname}</div>
                                    <small className="text-muted">{u.role} • {u.department_college}</small>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {assistantLeadersSearch && filteredAssistantLeadersOptions.length === 0 && (
                        <div 
                          className="position-absolute w-100 bg-white border rounded shadow-sm px-3 py-2 text-muted"
                          style={{ 
                            top: '100%',
                            left: 0,
                            zIndex: 1000
                          }}
                        >
                          No users found matching your search
                        </div>
                      )}
                    </div>
                    
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Form.Select
                        value={assistantLeadersRoleFilter}
                        onChange={(e) => setAssistantLeadersRoleFilter(e.target.value)}
                        style={{ maxWidth: 260 }}
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>
                        ))}
                      </Form.Select>
                      <span className="text-muted">
                        {selectedAssistantLeaders.length} assistant leader{selectedAssistantLeaders.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    {selectedAssistantLeaders.length > 0 && (
                      <div className="d-flex flex-wrap gap-2">
                        {selectedAssistantLeaders.map((user) => (
                          <span key={user.user_id} className="badge bg-secondary">
                            {user.fullname}
                            <Button variant="link" className="p-0 ms-2 text-white" onClick={() => toggleAssistantLeader(user)} aria-label="Remove assistant leader">
                              <i className="bi bi-x"></i>
                            </Button>
                          </span>
                        ))}
                      </div>
                    )}
                  </Form.Group>

                  {/* Coordinators */}
                  <Form.Group className="mb-3">
                    <Form.Label>Coordinators</Form.Label>
                    
                    {/* Search input for coordinators */}
                    <div className="position-relative mb-2">
                      <Form.Control
                        type="text"
                        placeholder="Search coordinators by name, role, or department..."
                        value={coordinatorsSearch}
                        onChange={(e) => setCoordinatorsSearch(e.target.value)}
                        autoComplete="off"
                      />
                      
                      {/* Search results appear below the input */}
                      {coordinatorsSearch && filteredCoordinatorsOptions.length > 0 && (
                        <div 
                          className="position-absolute w-100 bg-white border rounded shadow-sm"
                          style={{ 
                            top: '100%',
                            left: 0,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 1000
                          }}
                        >
                          {filteredCoordinatorsOptions.map((u) => {
                            const checked = selectedCoordinators.some(selected => selected.user_id === u.user_id);
                            return (
                              <div
                                key={u.user_id}
                                className="px-3 py-2 border-bottom"
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleCoordinator(u)}
                              >
                                <div className="d-flex align-items-center">
                                  <Form.Check
                                    type="checkbox"
                                    className="me-2"
                                    checked={checked}
                                    onChange={() => toggleCoordinator(u)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ transform: 'scale(1.1)', accentColor: '#0d6efd' }}
                                  />
                                  <div>
                                    <div className="fw-medium">{u.fullname}</div>
                                    <small className="text-muted">{u.role} • {u.department_college}</small>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {coordinatorsSearch && filteredCoordinatorsOptions.length === 0 && (
                        <div 
                          className="position-absolute w-100 bg-white border rounded shadow-sm px-3 py-2 text-muted"
                          style={{ 
                            top: '100%',
                            left: 0,
                            zIndex: 1000
                          }}
                        >
                          No users found matching your search
                        </div>
                      )}
                    </div>
                    
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Form.Select
                        value={coordinatorsRoleFilter}
                        onChange={(e) => setCoordinatorsRoleFilter(e.target.value)}
                        style={{ maxWidth: 260 }}
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>
                        ))}
                      </Form.Select>
                      <span className="text-muted">
                        {selectedCoordinators.length} coordinator{selectedCoordinators.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    {selectedCoordinators.length > 0 && (
                      <div className="d-flex flex-wrap gap-2">
                        {selectedCoordinators.map((user) => (
                          <span key={user.user_id} className="badge bg-secondary">
                            {user.fullname}
                            <Button variant="link" className="p-0 ms-2 text-white" onClick={() => toggleCoordinator(user)} aria-label="Remove coordinator">
                              <i className="bi bi-x"></i>
                            </Button>
                          </span>
                        ))}
                      </div>
                    )}
                  </Form.Group>

                  {/* Participants */}
                  <Form.Group className="mb-3">
                    <Form.Label>Participants (Extension Coordinator and above)</Form.Label>
                    
                    {/* Search input for participants */}
                    <div className="position-relative mb-2">
                      <Form.Control
                        type="text"
                        placeholder="Search participants by name, role, or department..."
                        value={participantSearchTerm}
                        onChange={(e) => setParticipantSearchTerm(e.target.value)}
                        autoComplete="off"
                      />
                      
                      {/* Search results appear below the input */}
                      {participantSearchTerm && filteredParticipantsOptions.length > 0 && (
                        <div 
                          className="position-absolute w-100 bg-white border rounded shadow-sm"
                          style={{ 
                            top: '100%',
                            left: 0,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 1000
                          }}
                        >
                          {filteredParticipantsOptions.map((u) => {
                            const checked = participants.includes(u.user_id);
                            return (
                              <div
                                key={u.user_id}
                                className="px-3 py-2 border-bottom"
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleParticipant(u.user_id)}
                              >
                                <div className="d-flex align-items-center">
                                  <Form.Check
                                    type="checkbox"
                                    className="me-2"
                                    checked={checked}
                                    onChange={() => toggleParticipant(u.user_id)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ transform: 'scale(1.1)', accentColor: '#0d6efd' }}
                                  />
                                  <div>
                                    <div className="fw-medium">{u.fullname}</div>
                                    <small className="text-muted">{u.role} • {u.department_college}</small>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {participantSearchTerm && filteredParticipantsOptions.length === 0 && (
                        <div 
                          className="position-absolute w-100 bg-white border rounded shadow-sm px-3 py-2 text-muted"
                          style={{ 
                            top: '100%',
                            left: 0,
                            zIndex: 1000
                          }}
                        >
                          No users found matching your search
                        </div>
                      )}
                    </div>
                    
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Form.Select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        style={{ maxWidth: 260 }}
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>
                        ))}
                      </Form.Select>
                      <span className="text-muted">
                        {participants.length} participant{participants.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    {participants.length > 0 && (
                      <div className="d-flex flex-wrap gap-2">
                        {participants.map((id) => {
                          const user = participantsOptions.find((u) => u.user_id === id);
                          if (!user) return null;
                          return (
                            <span key={id} className="badge bg-secondary">
                              {user.fullname}
                              <Button variant="link" className="p-0 ms-2 text-white" onClick={() => toggleParticipant(id)} aria-label="Remove participant">
                                <i className="bi bi-x"></i>
                              </Button>
                            </span>
                          );
                        })}
                      </div>
                    )}
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
                    ['objectives','Objectives (General and Specific)'],
                    ['expected_output','Program/Project Expected Output'],
                    ['strategies_methods','Description, Strategies and Methods (Activities / Schedule)'],
                    ['financial_plan_details','Financial Plan'],
                    ['functional_relationships','Functional Relationships with the Partner Agencies (Duties / Tasks of the Partner Agencies)']
                  ].map(([name, label]) => (
                    <Form.Group className="mb-3" key={name}>
                      <Form.Label>{label}</Form.Label>
                      <Form.Control as="textarea" rows={name === 'strategies_methods' ? 4 : 3} name={name} value={form[name]} onChange={handleChange} />
                    </Form.Group>
                  ))}

                  {/* Monitoring and Evaluation Table */}
                  <Form.Group className="mb-3">
                    <Form.Label className="h5 mb-3">Monitoring and Evaluation Mechanics / Plan</Form.Label>
                    <style>
                      {`
                        .me-table {
                          table-layout: fixed !important;
                          width: 100% !important;
                          border-collapse: collapse !important;
                        }
                        .me-table textarea::-webkit-scrollbar {
                          display: none !important;
                          width: 0 !important;
                          height: 0 !important;
                        }
                        .me-table textarea::-webkit-scrollbar-track {
                          display: none !important;
                        }
                        .me-table textarea::-webkit-scrollbar-thumb {
                          display: none !important;
                        }
                        .me-table textarea::-webkit-scrollbar-corner {
                          display: none !important;
                        }
                        .me-table textarea {
                          -ms-overflow-style: none !important;
                          scrollbar-width: none !important;
                          scrollbar-color: transparent transparent !important;
                        }
                        .me-table textarea:focus {
                          border-color: #86b7fe;
                          outline: 0;
                          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                        }
                        .me-table td {
                          padding: 8px !important;
                          border: 1px solid #dee2e6 !important;
                          position: relative !important;
                        }
                        .me-table textarea {
                          width: 100% !important;
                          border: 1px solid #ced4da !important;
                          background: white !important;
                          margin: 0 !important;
                          padding: 0.375rem 0.75rem !important;
                        }
                        .me-table th:last-child,
                        .me-table td:last-child {
                          border-right: 1px solid #dee2e6 !important;
                          position: relative !important;
                        }
                        .me-table th:last-child::after,
                        .me-table td:last-child::after {
                          display: none !important;
                          content: none !important;
                          position: absolute !important;
                          top: 0 !important;
                          right: 0 !important;
                          width: 0 !important;
                          height: 0 !important;
                        }
                        .me-table th:last-child::before,
                        .me-table td:last-child::before {
                          display: none !important;
                          content: none !important;
                        }
                        .me-table *::before,
                        .me-table *::after {
                          display: none !important;
                          content: none !important;
                        }
                        .me-table input[type="text"],
                        .me-table input[type="number"],
                        .me-table input[type="email"],
                        .me-table input[type="password"],
                        .me-table input[type="search"],
                        .me-table input[type="tel"],
                        .me-table input[type="url"],
                        .me-table input[type="date"],
                        .me-table input[type="time"],
                        .me-table input[type="datetime-local"],
                        .me-table input[type="month"],
                        .me-table input[type="week"],
                        .me-table input[type="color"],
                        .me-table input[type="range"],
                        .me-table input[type="file"],
                        .me-table input[type="hidden"],
                        .me-table input[type="image"],
                        .me-table input[type="button"],
                        .me-table input[type="submit"],
                        .me-table input[type="reset"],
                        .me-table input[type="checkbox"],
                        .me-table input[type="radio"],
                        .me-table select,
                        .me-table button,
                        .me-table .form-control:not(textarea),
                        .me-table .btn,
                        .me-table .dropdown-toggle,
                        .me-table .spinner,
                        .me-table .input-group,
                        .me-table .input-group-text,
                        .me-table .input-group-append,
                        .me-table .input-group-prepend {
                          display: none !important;
                          visibility: hidden !important;
                          opacity: 0 !important;
                          width: 0 !important;
                          height: 0 !important;
                          margin: 0 !important;
                          padding: 0 !important;
                          border: none !important;
                          background: transparent !important;
                        }
                      `}
                    </style>
                    <div className="table-responsive me-table" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <table className="table table-bordered" style={{ minWidth: '1400px', marginBottom: 0, tableLayout: 'fixed' }}>
                        <thead className="table-primary sticky-top">
                          <tr>
                            <th style={{ width: '8%', minWidth: '100px', fontSize: '0.9rem', padding: '12px 8px' }}>Objectives</th>
                            <th style={{ width: '15%', minWidth: '180px', fontSize: '0.9rem', padding: '12px 8px' }}>Performance Indicators</th>
                            <th style={{ width: '12%', minWidth: '140px', fontSize: '0.9rem', padding: '12px 8px' }}>Baseline Data</th>
                            <th style={{ width: '12%', minWidth: '140px', fontSize: '0.9rem', padding: '12px 8px' }}>Performance Target</th>
                            <th style={{ width: '12%', minWidth: '140px', fontSize: '0.9rem', padding: '12px 8px' }}>Data Source</th>
                            <th style={{ width: '12%', minWidth: '140px', fontSize: '0.9rem', padding: '12px 8px' }}>Collection Method</th>
                            <th style={{ width: '12%', minWidth: '140px', fontSize: '0.9rem', padding: '12px 8px' }}>Frequency of Data Collection</th>
                            <th style={{ width: '17%', minWidth: '200px', fontSize: '0.9rem', padding: '12px 8px' }}>Office/Persons Responsible</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'impact', label: 'Impact-' },
                            { key: 'outcome', label: 'Outcome-' },
                            { key: 'output', label: 'Output-' },
                            { key: 'activities', label: 'Activities-' },
                            { key: 'input', label: 'Input-' }
                          ].map(({ key, label }) => (
                            <tr key={key} style={{ verticalAlign: 'top' }}>
                              <td className="fw-bold bg-light" style={{ padding: '12px 8px', fontSize: '0.9rem', textAlign: 'center' }}>
                                {label}
                              </td>
                              <td style={{ padding: '8px' }}>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  value={meTableData[key].objectives}
                                  onChange={(e) => handleMeTableChange(key, 'objectives', e.target.value)}
                                  style={{ 
                                    fontSize: '0.85rem', 
                                    resize: 'none', 
                                    overflow: 'hidden', 
                                    minHeight: '60px', 
                                    maxHeight: '60px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    outline: 'none',
                                    boxShadow: 'none',
                                    width: '100%',
                                    margin: '0',
                                    background: 'white',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  value={meTableData[key].performance_indicators}
                                  onChange={(e) => handleMeTableChange(key, 'performance_indicators', e.target.value)}
                                  style={{ 
                                    fontSize: '0.85rem', 
                                    resize: 'none', 
                                    overflow: 'hidden', 
                                    minHeight: '60px', 
                                    maxHeight: '60px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    outline: 'none',
                                    boxShadow: 'none',
                                    width: '100%',
                                    margin: '0',
                                    background: 'white',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  value={meTableData[key].baseline_data}
                                  onChange={(e) => handleMeTableChange(key, 'baseline_data', e.target.value)}
                                  style={{ 
                                    fontSize: '0.85rem', 
                                    resize: 'none', 
                                    overflow: 'hidden', 
                                    minHeight: '60px', 
                                    maxHeight: '60px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    outline: 'none',
                                    boxShadow: 'none',
                                    width: '100%',
                                    margin: '0',
                                    background: 'white',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  value={meTableData[key].performance_target}
                                  onChange={(e) => handleMeTableChange(key, 'performance_target', e.target.value)}
                                  style={{ 
                                    fontSize: '0.85rem', 
                                    resize: 'none', 
                                    overflow: 'hidden', 
                                    minHeight: '60px', 
                                    maxHeight: '60px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    outline: 'none',
                                    boxShadow: 'none',
                                    width: '100%',
                                    margin: '0',
                                    background: 'white',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  value={meTableData[key].data_source}
                                  onChange={(e) => handleMeTableChange(key, 'data_source', e.target.value)}
                                  style={{ 
                                    fontSize: '0.85rem', 
                                    resize: 'none', 
                                    overflow: 'hidden', 
                                    minHeight: '60px', 
                                    maxHeight: '60px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    outline: 'none',
                                    boxShadow: 'none',
                                    width: '100%',
                                    margin: '0',
                                    background: 'white',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  value={meTableData[key].collection_method}
                                  onChange={(e) => handleMeTableChange(key, 'collection_method', e.target.value)}
                                  style={{ 
                                    fontSize: '0.85rem', 
                                    resize: 'none', 
                                    overflow: 'hidden', 
                                    minHeight: '60px', 
                                    maxHeight: '60px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    outline: 'none',
                                    boxShadow: 'none',
                                    width: '100%',
                                    margin: '0',
                                    background: 'white',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  value={meTableData[key].frequency}
                                  onChange={(e) => handleMeTableChange(key, 'frequency', e.target.value)}
                                  style={{ 
                                    fontSize: '0.85rem', 
                                    resize: 'none', 
                                    overflow: 'hidden', 
                                    minHeight: '60px', 
                                    maxHeight: '60px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    outline: 'none',
                                    boxShadow: 'none',
                                    width: '100%',
                                    margin: '0',
                                    background: 'white',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  value={meTableData[key].responsible}
                                  onChange={(e) => handleMeTableChange(key, 'responsible', e.target.value)}
                                  style={{ 
                                    fontSize: '0.85rem', 
                                    resize: 'none', 
                                    overflow: 'hidden', 
                                    minHeight: '60px', 
                                    maxHeight: '60px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    outline: 'none',
                                    boxShadow: 'none',
                                    width: '100%',
                                    margin: '0',
                                    background: 'white',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Use horizontal scroll to view all columns.
                    </small>
                  </Form.Group>

                  {/* Sustainability Plan */}
                  <Form.Group className="mb-3">
                    <Form.Label>Sustainability Plan</Form.Label>
                    <Form.Control as="textarea" rows={3} name="sustainability_plan" value={form.sustainability_plan} onChange={handleChange} />
                  </Form.Group>

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

      {/* Submit Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Project Submission</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-3">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3 mb-2">Confirm Project Submission</h5>
            <p className="text-muted">Are you sure that all fields are correct?</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
          <Button variant="success" onClick={submit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Proposal'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProjectProposal;


