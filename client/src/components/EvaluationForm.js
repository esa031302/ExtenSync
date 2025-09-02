import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Table } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './EvaluationForm.css';

const EvaluationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing evaluations
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [evaluationData, setEvaluationData] = useState({
    project_id: '',
    feedback: '',
    decision: 'Needs Revision',
    rubric_scores: {
      relevance: { score: 0, maxPoints: 15, comments: '' },
      baseline_data_availability: { score: 0, maxPoints: 5, comments: '' },
      baseline_data_discussion: { score: 0, maxPoints: 5, comments: '' },
      baseline_measures_objectives: { score: 0, maxPoints: 10, comments: '' },
      gender_disaggregated_data: { score: 0, maxPoints: 8, comments: '' },
      problem_solution_discussion: { score: 0, maxPoints: 10, comments: '' },
      implementation_strategies: { score: 0, maxPoints: 8, comments: '' },
      innovation_efforts: { score: 0, maxPoints: 8, comments: '' },
      partnerships_linkages: { score: 0, maxPoints: 8, comments: '' },
      monitoring_evaluation_plan: { score: 0, maxPoints: 8, comments: '' },
      adopters_demonstration: { score: 0, maxPoints: 10, comments: '' },
      sustainability_plan: { score: 0, maxPoints: 5, comments: '' }
    }
  });

  // Check permissions
  const canEvaluate = user && ['Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin'].includes(user.role);

  useEffect(() => {
    if (!canEvaluate) {
      navigate('/dashboard');
      return;
    }

    fetchProjects();
    
    // If editing, fetch existing evaluation
    if (id) {
      fetchEvaluation();
    }
  }, [canEvaluate, navigate, id]);

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/projects');
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
      setError('Failed to load projects');
    }
  };

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/evaluations/${id}`);
      
      // Set form data
      setEvaluationData({
        project_id: data.project_id,
        feedback: data.feedback,
        decision: data.decision,
        rubric_scores: data.rubric_scores || evaluationData.rubric_scores
      });
      
      // Set selected project
      const project = projects.find(p => p.project_id === data.project_id);
      if (project) {
        setSelectedProject(project);
      }
    } catch (err) {
      console.error('Failed to load evaluation', err);
      setError('Failed to load evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (projectId) => {
    const project = projects.find(p => p.project_id === parseInt(projectId));
    setSelectedProject(project);
    setEvaluationData(prev => ({ ...prev, project_id: parseInt(projectId) }));
  };

     const handleRubricScoreChange = (criterion, field, value) => {
     setEvaluationData(prev => ({
       ...prev,
       rubric_scores: {
         ...prev.rubric_scores,
         [criterion]: {
           ...prev.rubric_scores[criterion],
           [field]: field === 'score' ? 
             Math.min(Math.max(parseInt(value) || 0, 0), prev.rubric_scores[criterion].maxPoints) : 
             value
         }
       }
     }));
   };

  const calculateTotalScore = () => {
    return Object.values(evaluationData.rubric_scores).reduce((total, criterion) => {
      return total + (criterion.score || 0);
    }, 0);
  };

  const calculateMaxScore = () => {
    return Object.values(evaluationData.rubric_scores).reduce((total, criterion) => {
      return total + criterion.maxPoints;
    }, 0);
  };

  const getScorePercentage = () => {
    const total = calculateTotalScore();
    const max = calculateMaxScore();
    return max > 0 ? Math.round((total / max) * 100) : 0;
  };

  const getDecisionFromScore = () => {
    const percentage = getScorePercentage();
    if (percentage >= 80) return 'Approved';
    if (percentage >= 60) return 'Needs Revision';
    return 'Rejected';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!evaluationData.project_id) {
      setError('Please select a project to evaluate');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const totalScore = calculateTotalScore();
      const maxScore = calculateMaxScore();
      const percentage = getScorePercentage();
      const autoDecision = getDecisionFromScore();

             // Combine rubric scores into feedback
       const rubricFeedback = Object.entries(evaluationData.rubric_scores)
         .map(([criterion, data]) => {
           const criterionName = getCriterionName(criterion);
           return `**${criterionName}**: ${data.score}/${data.maxPoints} points\n${data.comments ? `Comments: ${data.comments}\n` : ''}`;
         })
         .join('\n');

       const fullFeedback = `**Evaluation Summary**\nTotal Score: ${totalScore}/${maxScore} (${percentage}%)\n\n**Detailed Rubric Scores:**\n${rubricFeedback}`;

             const submitData = {
         project_id: evaluationData.project_id,
         feedback: fullFeedback,
         decision: autoDecision,
         rubric_scores: evaluationData.rubric_scores,
         total_score: totalScore,
         max_score: maxScore,
         score_percentage: percentage
       };

      if (id) {
        // Update existing evaluation
        await axios.put(`http://localhost:5000/api/evaluations/${id}`, submitData);
        setSuccess('Evaluation updated successfully!');
      } else {
        // Create new evaluation
        await axios.post('http://localhost:5000/api/evaluations', submitData);
        setSuccess('Evaluation submitted successfully!');
      }

      setTimeout(() => {
        navigate('/evaluations');
      }, 2000);

    } catch (err) {
      console.error('Failed to submit evaluation', err);
      setError(err.response?.data?.error || 'Failed to submit evaluation');
    } finally {
      setLoading(false);
    }
  };

  const getCriterionName = (key) => {
    const names = {
      relevance: '1. Relevance of the project',
      baseline_data_availability: '2.1 Data about the target community/institution and audience is available',
      baseline_data_discussion: '2.2 Baseline data about the problem addressed is included and discussed',
      baseline_measures_objectives: '3. The baseline measures were used in setting the general and specific objectives',
      gender_disaggregated_data: '4. The gender disaggregated data is available',
      problem_solution_discussion: '5. There is a clear and direct discussion of the problem to be addressed',
      implementation_strategies: '6. The strategies of implementation sounds appropriate to the context',
      innovation_efforts: '7. The program/project harness innovation efforts to address the problems',
      partnerships_linkages: '8. The proposed program/project establishes partnership or linkage',
      monitoring_evaluation_plan: '9. The monitoring and evaluation plan and indicators are available',
      adopters_demonstration: '10. The program/project proposal can produce adopters or viable demonstration',
      sustainability_plan: '11. Sustainability plan of the project is clearly discussed'
    };
    return names[key] || key;
  };

  const getCriterionDescription = (key) => {
    const descriptions = {
      relevance: 'The proposal should describe the project\'s relevance and how its outcomes align with various governing plans, including Philippine Development Goals, Sustainable Development Goals, BatStateU Strategic Plan, and Program Outcomes.',
      baseline_data_availability: 'Results of needs assessment should be stated and used for planning programs, projects, and activities (PPAs).',
      baseline_data_discussion: 'Baseline data about the problem addressed by the project/program is included and discussed in the proposal.',
      baseline_measures_objectives: 'Specific objectives should be aligned with baseline data and be SMART (Specific, Measurable, Achievable, Realistic, Time-bound).',
      gender_disaggregated_data: 'Sex-disaggregated data and gender analysis to identify gender issues that the proposed project must address should be stated in the rationale.',
      problem_solution_discussion: 'Clear discussion of the problem to be addressed and its intended solution.',
      implementation_strategies: 'Strategies are appropriate to the context of the problem and the community.',
      innovation_efforts: 'New ways and approaches for addressing problems/issues should be present in the proposal.',
      partnerships_linkages: 'Partnerships with LGUs, NGOs, government agencies, CSOs, etc. with clear identified roles and responsibilities.',
      monitoring_evaluation_plan: 'The schedule of monitoring activities should be present, and identified monitoring indicators and targets should be aligned with the general and specific objectives.',
      adopters_demonstration: 'There should be a plan for replicating the project in other communities, leading to viable demonstration projects and adopters engaged in profitable enterprises.',
      sustainability_plan: 'There should be a narration of the plan on how the program/project will be sustained by the target community or audience.'
    };
    return descriptions[key] || '';
  };

  if (!canEvaluate) {
    return null;
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="mb-1">{id ? 'Edit Evaluation' : 'Create New Evaluation'}</h3>
                             <p className="text-muted mb-0">Evaluate completed projects using the standardized rubric</p>
            </div>
            <Button as={Link} to="/evaluations" variant="outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>
              Back to Evaluations
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

          <Form onSubmit={handleSubmit}>
            {/* Project Selection */}
            <Card className="shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-folder2-open me-2"></i>
                  Project Selection
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                                             <Form.Label>Select Completed Project to Evaluate</Form.Label>
                      <Form.Select
                        value={evaluationData.project_id || ''}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        required
                        disabled={loading}
                      >
                                                 <option value="">Choose a completed project...</option>
                                                 {projects
                           .filter(project => project.status === 'Completed')
                           .map(project => (
                            <option key={project.project_id} value={project.project_id}>
                              {project.title}
                            </option>
                          ))
                        }
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Project Information Display */}
                {selectedProject && (
                  <Card className="bg-light">
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <h6>Project Details</h6>
                          <p><strong>Title:</strong> {selectedProject.title}</p>
                          <p><strong>Location:</strong> {selectedProject.location || 'Not specified'}</p>
                          <p><strong>Duration:</strong> {selectedProject.duration || 'Not specified'}</p>
                        </Col>
                                                 <Col md={6}>
                           <h6>Proponent Information</h6>
                           <p><strong>Proponent Name:</strong> {selectedProject.coordinator_fullname || 'Not assigned'}</p>
                           <p><strong>Status:</strong> 
                             <Badge bg="info" className="ms-2">{selectedProject.status}</Badge>
                           </p>
                           <p><strong>Submitted:</strong> {new Date(selectedProject.date_submitted).toLocaleDateString()}</p>
                         </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}
              </Card.Body>
            </Card>

            {/* Evaluation Rubric */}
            <Card className="shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-clipboard-check me-2"></i>
                  Evaluation Rubric
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="rubric-container">
                  {Object.entries(evaluationData.rubric_scores).map(([criterion, data]) => (
                    <Card key={criterion} className="mb-3 rubric-item">
                      <Card.Body>
                        <Row>
                          <Col md={8}>
                            <h6 className="criterion-title">{getCriterionName(criterion)}</h6>
                            <p className="text-muted small mb-2">{getCriterionDescription(criterion)}</p>
                            <Form.Group>
                              <Form.Label>Comments (Optional)</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                value={data.comments}
                                onChange={(e) => handleRubricScoreChange(criterion, 'comments', e.target.value)}
                                placeholder="Add specific comments about this criterion..."
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <div className="score-section">
                              <Form.Group>
                                <Form.Label>Score</Form.Label>
                                <div className="d-flex align-items-center">
                                                                     <Form.Control
                                     type="number"
                                     min="0"
                                     max={data.maxPoints}
                                     value={data.score || ''}
                                     onChange={(e) => handleRubricScoreChange(criterion, 'score', e.target.value)}
                                     onBlur={(e) => {
                                       const value = parseInt(e.target.value) || 0;
                                       const clampedValue = Math.min(Math.max(value, 0), data.maxPoints);
                                       if (value !== clampedValue) {
                                         handleRubricScoreChange(criterion, 'score', clampedValue.toString());
                                       }
                                     }}
                                     className="score-input"
                                     placeholder=""
                                   />
                                  <span className="ms-2 text-muted">/ {data.maxPoints}</span>
                                </div>
                              </Form.Group>
                              <div className="score-percentage mt-2">
                                <small className="text-muted">
                                  {data.maxPoints > 0 ? Math.round((data.score / data.maxPoints) * 100) : 0}%
                                </small>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>

                                 {/* Total Score Summary */}
                 <Card className="bg-primary text-white">
                   <Card.Body>
                     <Row className="text-center">
                       <Col md={3}>
                         <h4>{calculateTotalScore()}</h4>
                         <small>Total Points Earned</small>
                       </Col>
                       <Col md={3}>
                         <h4>{calculateMaxScore()}</h4>
                         <small>Maximum Points</small>
                       </Col>
                       <Col md={3}>
                         <h4>{getScorePercentage()}%</h4>
                         <small>Percentage</small>
                       </Col>
                       <Col md={3}>
                         <h4>{getDecisionFromScore()}</h4>
                         <small>Suggested Decision</small>
                       </Col>
                     </Row>
                   </Card.Body>
                 </Card>
              </Card.Body>
            </Card>

            

            {/* Submit Button */}
            <div className="d-flex justify-content-end gap-2">
              <Button
                as={Link}
                to="/evaluations"
                variant="outline-secondary"
                disabled={loading}
              >
                Cancel
              </Button>
                             <Button
                 type="submit"
                 variant="primary"
                 disabled={loading || !evaluationData.project_id}
               >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {id ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {id ? 'Update Evaluation' : 'Submit Evaluation'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default EvaluationForm;
