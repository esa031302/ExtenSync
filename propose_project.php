<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$pageTitle = 'Propose Project - ExtenSync';
$currentPage = 'projects';

// Check if user is logged in and has permission to propose projects
if (!isset($_SESSION['user']) || !in_array($_SESSION['user']['role'], ['Extension Coordinator', 'Extension Head', 'GAD', 'Admin'])) {
    header('Location: dashboard.php');
    exit;
}

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../models/users.php';

$user = $_SESSION['user'];
$message = '';
$error = '';

// Handle project submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $fundSources = $_POST['fund_source'] ?? [];
    // Include the 'Others' text if the checkbox is selected and text is provided
    if (in_array('Others', $fundSources) && !empty($_POST['fund_source_other_text'])) {
        $otherText = 'Others: ' . $_POST['fund_source_other_text'];
        // Find the key for 'Others' and replace it with the more detailed text
        $othersKey = array_search('Others', $fundSources);
        if ($othersKey !== false) {
            $fundSources[$othersKey] = $otherText;
        }
    }

    $projectData = [
        'request_type' => $_POST['request_type'] ?? '',
        'initiative_type' => $_POST['initiative_type'] ?? '',
        'title' => $_POST['title'] ?? '',
        'location' => $_POST['location'] ?? '',
        'duration' => $_POST['duration'] ?? '',
        'extension_agenda' => json_encode($_POST['extension_agenda'] ?? []), // Store as JSON
        'sdg_goals' => json_encode($_POST['sdg_goals'] ?? []), // Store as JSON
        'offices_involved' => $_POST['offices_involved'] ?? '',
        'programs_involved' => $_POST['programs_involved'] ?? '',
        'project_leaders' => $_POST['project_leaders'] ?? '',
        'partner_agencies' => $_POST['partner_agencies'] ?? '',
        'beneficiaries' => $_POST['beneficiaries'] ?? '',
        'total_cost' => $_POST['total_cost'] ?? '',
        'fund_source' => json_encode($fundSources), // Store as JSON, with 'Others' detail if provided
        'rationale' => $_POST['rationale'] ?? '',
        'objectives_general' => $_POST['objectives_general'] ?? '',
        'objectives_specific' => $_POST['objectives_specific'] ?? '',
        'expected_output' => $_POST['expected_output'] ?? '',
        'strategies_methods' => $_POST['strategies_methods'] ?? '',
        'financial_plan_details' => $_POST['financial_plan_details'] ?? '',
        'functional_relationships' => $_POST['functional_relationships'] ?? '',
        'monitoring_evaluation' => $_POST['monitoring_evaluation'] ?? '',
        'sustainability_plan' => $_POST['sustainability_plan'] ?? '',
        'coordinator_id' => $user['user_id'],
        'status' => 'Pending',
        'date_submitted' => date('Y-m-d H:i:s'),
        'last_updated' => date('Y-m-d H:i:s')
    ];

    // Basic validation for required fields (Title is required based on the form screenshot)
    if (empty($projectData['title'])) {
        $error = 'Project Title is required.';
    } else {
        try {
            $stmt = $conn->prepare("INSERT INTO projects (
                request_type, initiative_type, title, location, duration,
                extension_agenda, sdg_goals, offices_involved, programs_involved,
                project_leaders, partner_agencies, beneficiaries, total_cost,
                fund_source, rationale, objectives_general, objectives_specific,
                expected_output, strategies_methods, financial_plan_details,
                functional_relationships, monitoring_evaluation, sustainability_plan,
                coordinator_id, status, date_submitted, last_updated
            ) VALUES (
                :request_type, :initiative_type, :title, :location, :duration,
                :extension_agenda, :sdg_goals, :offices_involved, :programs_involved,
                :project_leaders, :partner_agencies, :beneficiaries, :total_cost,
                :fund_source, :rationale, :objectives_general, :objectives_specific,
                :expected_output, :strategies_methods, :financial_plan_details,
                :functional_relationships, :monitoring_evaluation, :sustainability_plan,
                :coordinator_id, :status, :date_submitted, :last_updated
            )");

            if ($stmt->execute($projectData)) {
                $message = 'Project proposal submitted successfully';
                // Redirect to projects page after 2 seconds
                header('refresh:2;url=projects.php');
            } else {
                $error = 'Failed to submit project proposal';
            }
        } catch (PDOException $e) {
            $error = 'Database error: ' . $e->getMessage();
        }
    }
}

require_once __DIR__ . '/includes/header.php';
?>

<div class="container mt-4">
    <?php if ($message): ?>
        <div class="alert alert-success"><?php echo htmlspecialchars($message); ?></div>
    <?php endif; ?>

    <?php if ($error): ?>
        <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
    <?php endif; ?>

    <div class="row">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Propose New Project</h5>
                </div>
                <div class="card-body">
                    <form method="POST" action="propose_project.php">

                        <!-- Section I: Request Type -->
                        <div class="mb-3">
                            <label class="form-label">Request Type:</label><br>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="request_type" id="client_requested" value="Client Requested">
                                <label class="form-check-label" for="client_requested">Extension Service Program/Project/Activity is requested by clients.</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="request_type" id="department_initiative" value="Department Initiative">
                                <label class="form-check-label" for="department_initiative">Extension Service Program/Project/Activity is Department's initiative.</label>
                            </div>
                        </div>

                        <!-- Section I (cont.): Initiative Type -->
                        <div class="mb-3">
                            <label class="form-label">Initiative Type:</label><br>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="initiative_type" id="program" value="Program">
                                <label class="form-check-label" for="program">Program</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="initiative_type" id="project" value="Project">
                                <label class="form-check-label" for="project">Project</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="initiative_type" id="activity" value="Activity">
                                <label class="form-check-label" for="activity">Activity</label>
                            </div>
                        </div>

                        <!-- Section I: Title -->
                        <div class="mb-3">
                            <label for="title" class="form-label">Title <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="title" name="title" required>
                        </div>

                        <!-- Section II: Location -->
                        <div class="mb-3">
                            <label for="location" class="form-label">Location:</label>
                            <input type="text" class="form-control" id="location" name="location">
                        </div>

                        <!-- Section III: Duration -->
                        <div class="mb-3">
                            <label for="duration" class="form-label">Duration (Date and Time):</label>
                            <input type="text" class="form-control" id="duration" name="duration">
                        </div>

                        <!-- Section IV: Type of Extension Service Agenda -->
                        <div class="mb-3">
                            <label class="form-label">Type of Extension Service Agenda (Choose the MOST - only one):</label><br>
                            <?php
                            $extensionAgendas = [
                                'BatStateU Inclusive Social Innovation for Regional Growth (BISIG) Program',
                                'Livelihood and other Entrepreneurship related on Agri-Fisheries (LEAF)',
                                'Environment and Natural Resources Conservation, Protection and Rehabilitation Program',
                                'Smart Analytics and Engineering Innovation',
                                'Adopt-a Municipality/Barangay/School/Social Development Thru BIDANI Implementation',
                                'Community Outreach',
                                'Technical- Vocational Education and Training (TVET) Program',
                                'Technology Transfer and Adoption/Utilization Program',
                                'Technical Assistance and Advisory Services Program',
                                'Parents\' Empowerment through Social Development (PESODEV)',
                                'Gender and Development',
                                'Disaster Risk Reduction and Management and Disaster Preparedness and Response/Climate Change Adaptation (DRRM and DPR/CCA)'
                            ];
                            foreach ($extensionAgendas as $agenda): ?>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="extension_agenda[]" value="<?php echo htmlspecialchars($agenda); ?>" id="agenda_<?php echo str_replace([' ', '/', '(', ')', '-', ',', '.'], '_', $agenda); ?>">
                                    <label class="form-check-label" for="agenda_<?php echo str_replace([' ', '/', '(', ')', '-', ',', '.'], '_', $agenda); ?>">
                                        <?php echo htmlspecialchars($agenda); ?>
                                    </label>
                                </div>
                            <?php endforeach; ?>
                        </div>

                        <!-- Section V: Sustainable Development Goals (SDG) -->
                        <div class="mb-3">
                            <label class="form-label">Sustainable Development Goals (SDG): (Choose the applicable SDG to your extension project:)</label><br>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="No Poverty" id="sdg_no_poverty">
                                        <label class="form-check-label" for="sdg_no_poverty">No Poverty</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Zero Hunger" id="sdg_zero_hunger">
                                        <label class="form-check-label" for="sdg_zero_hunger">Zero Hunger</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Good Health and Well-Being" id="sdg_health">
                                        <label class="form-check-label" for="sdg_health">Good Health and Well-Being</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Quality Education" id="sdg_education">
                                        <label class="form-check-label" for="sdg_education">Quality Education</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Gender Equality" id="sdg_gender">
                                        <label class="form-check-label" for="sdg_gender">Gender Equality</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Clean Water and Sanitation" id="sdg_water">
                                        <label class="form-check-label" for="sdg_water">Clean Water and Sanitation</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Affordable and Clean Energy" id="sdg_energy">
                                        <label class="form-check-label" for="sdg_energy">Affordable and Clean Energy</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Decent Work and Economic Growth" id="sdg_work">
                                        <label class="form-check-label" for="sdg_work">Decent Work and Economic Growth</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Industry, Innovation and Infrastructure" id="sdg_industry">
                                        <label class="form-check-label" for="sdg_industry">Industry, Innovation and Infrastructure</label>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Reduced Inequalities" id="sdg_inequalities">
                                        <label class="form-check-label" for="sdg_inequalities">Reduced Inequalities</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Sustainable Cities and Communities" id="sdg_cities">
                                        <label class="form-check-label" for="sdg_cities">Sustainable Cities and Communities</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Climate Action" id="sdg_climate">
                                        <label class="form-check-label" for="sdg_climate">Climate Action</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Life Below Water" id="sdg_water_life">
                                        <label class="form-check-label" for="sdg_water_life">Life Below Water</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Life on Land" id="sdg_land_life">
                                        <label class="form-check-label" for="sdg_land_life">Life on Land</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Peace, Justice and Strong Institutions" id="sdg_peace">
                                        <label class="form-check-label" for="sdg_peace">Peace, Justice and Strong Institutions</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="sdg_goals[]" value="Partnerships for the Goals" id="sdg_partnerships">
                                        <label class="form-check-label" for="sdg_partnerships">Partnerships for the Goals</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Section VI: Office/s / College/s / Organization/s Involved -->
                        <div class="mb-3">
                            <label for="offices_involved" class="form-label">Office/s / College/s / Organization/s Involved:</label>
                            <textarea class="form-control" id="offices_involved" name="offices_involved" rows="2"></textarea>
                        </div>

                        <!-- Section VII: Program/s Involved -->
                        <div class="mb-3">
                            <label for="programs_involved" class="form-label">Program/s Involved (specify the programs under the college implementing the project):</label>
                            <textarea class="form-control" id="programs_involved" name="programs_involved" rows="2"></textarea>
                        </div>

                        <!-- Section VIII: Project Leader, Assistant Project Leader and Coordinators -->
                        <div class="mb-3">
                            <label for="project_leaders" class="form-label">Project Leader, Assistant Project Leader and Coordinators:</label>
                            <textarea class="form-control" id="project_leaders" name="project_leaders" rows="2"></textarea>
                        </div>

                        <!-- Section IX: Partner Agencies -->
                        <div class="mb-3">
                            <label for="partner_agencies" class="form-label">Partner Agencies:</label>
                            <textarea class="form-control" id="partner_agencies" name="partner_agencies" rows="2"></textarea>
                        </div>

                        <!-- Section X: Beneficiaries -->
                        <div class="mb-3">
                            <label for="beneficiaries" class="form-label">Beneficiaries (Type and Number of Male and Female):</label>
                            <textarea class="form-control" id="beneficiaries" name="beneficiaries" rows="2"></textarea>
                        </div>

                        <!-- Section XI: Total Cost -->
                        <div class="mb-3">
                            <label for="total_cost" class="form-label">Total Cost:</label>
                            <input type="text" class="form-control" id="total_cost" name="total_cost">
                        </div>

                        <!-- Section XII: Source of fund -->
                        <div class="mb-3">
                            <label class="form-label">Source of fund:</label><br>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" name="fund_source[]" value="STF" id="fund_stf">
                                <label class="form-check-label" for="fund_stf">STF</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" name="fund_source[]" value="MDS" id="fund_mds">
                                <label class="form-check-label" for="fund_mds">MDS</label>
                            </div>
                             <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" name="fund_source[]" value="Others" id="fund_others">
                                <label class="form-check-label" for="fund_others">Others, (Please specify) :</label>
                             </div>
                             <input type="text" class="form-control mt-2" name="fund_source_other_text" id="fund_source_other_text" placeholder="Specify other source">
                        </div>

                        <!-- Section XIII: Rationale -->
                        <div class="mb-3">
                            <label for="rationale" class="form-label">Rationale (brief description of the situation):</label>
                            <textarea class="form-control" id="rationale" name="rationale" rows="3"></textarea>
                        </div>

                        <!-- Section XIV: Objectives (General and Specific) -->
                        <div class="mb-3">
                            <label for="objectives_general" class="form-label">Objectives (General):</label>
                            <textarea class="form-control" id="objectives_general" name="objectives_general" rows="3"></textarea>
                        </div>
                         <div class="mb-3">
                            <label for="objectives_specific" class="form-label">Objectives (Specific):</label>
                            <textarea class="form-control" id="objectives_specific" name="objectives_specific" rows="3"></textarea>
                        </div>

                        <!-- Section XV: Program/Project Expected Output -->
                        <div class="mb-3">
                            <label for="expected_output" class="form-label">Program/Project Expected Output:</label>
                            <textarea class="form-control" id="expected_output" name="expected_output" rows="3"></textarea>
                        </div>

                        <!-- Section XVI: Description, Strategies and Methods -->
                        <div class="mb-3">
                            <label for="strategies_methods" class="form-label">Description, Strategies and Methods (Activities / Schedule):</label>
                            <textarea class="form-control" id="strategies_methods" name="strategies_methods" rows="4"></textarea>
                        </div>

                        <!-- Section XVII: Financial Plan -->
                        <div class="mb-3">
                            <label for="financial_plan_details" class="form-label">Financial Plan:</label>
                            <textarea class="form-control" id="financial_plan_details" name="financial_plan_details" rows="3"></textarea>
                        </div>

                        <!-- Section XVIII: Functional Relationships with the Partner Agencies -->
                        <div class="mb-3">
                            <label for="functional_relationships" class="form-label">Functional Relationships with the Partner Agencies (Duties / Tasks of the Partner Agencies):</label>
                            <textarea class="form-control" id="functional_relationships" name="functional_relationships" rows="3"></textarea>
                        </div>

                        <!-- Section XIX: Monitoring and Evaluation Mechanics / Plan -->
                         <div class="mb-3">
                            <label for="monitoring_evaluation" class="form-label">Monitoring and Evaluation Mechanics / Plan:</label>
                            <textarea class="form-control" id="monitoring_evaluation" name="monitoring_evaluation" rows="4"></textarea>
                            <div class="form-text">Include details from the table if applicable.</div>
                        </div>

                         <!-- Section XX: Sustainability Plan -->
                         <div class="mb-3">
                            <label for="sustainability_plan" class="form-label">Sustainability Plan:</label>
                            <textarea class="form-control" id="sustainability_plan" name="sustainability_plan" rows="3"></textarea>
                        </div>


                        <div class="d-flex justify-content-between">
                            <a href="projects.php" class="btn btn-secondary">Cancel</a>
                            <button type="submit" class="btn btn-primary">Submit Proposal</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>