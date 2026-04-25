const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');

// @route   POST /api/jobs/add
// @desc    Company adds a new job role
router.post('/add', verifyToken, async (req, res) => {
    // Permission check
    if (req.user.role !== 'company') {
        return res.status(403).json({ msg: "Only companies can post jobs" });
    }

    const { 
        job_role, 
        ctc_package, 
        min_cgpa_required, 
        deadline, 
        location,
        opportunity_type,
        company_category,
        interview_material_url
    } = req.body;
    const company_id = req.user.id; 

    try {
        const newDrive = await pool.query(
            `INSERT INTO placement_drives 
             (company_id, job_role, min_cgpa_required, ctc_package, deadline, status, location, opportunity_type, company_category, interview_material_url) 
             VALUES ($1::uuid, $2, $3, $4, $5, 'active', $6, $7, $8, $9) 
             RETURNING *`, 
            [company_id, job_role, min_cgpa_required, ctc_package, deadline, location, opportunity_type, company_category, interview_material_url]
        );
        res.status(201).json({ msg: "Drive posted successfully", drive: newDrive.rows[0] });
    } catch (err) {
        console.error("POST /add job Error:", err);
        res.status(500).json({ error: "Database Error" });
    }
});

// @route   GET /api/jobs/my-jobs
// @desc    Fetch jobs posted by the logged-in company
router.get('/my-jobs', verifyToken, async (req, res) => {
    if (req.user.role !== 'company') {
      return res.status(403).json({ msg: "Only companies can view drives" });
    }

    try {
        const drives = await pool.query(
            `SELECT *
             FROM placement_drives
             WHERE company_id = $1::uuid
             ORDER BY created_at DESC NULLS LAST, deadline DESC`,
            [req.user.id]
        );
        res.json(drives.rows);
    } catch (err) {
        console.error("GET /my-jobs Error:", err);
        res.status(500).send("Server Error");
    }
});

// Get stats for the company dashboard
router.get('/company-stats', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.id; // Ensure this is the UUID from your JWT

    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM placement_drives WHERE company_id = $1::uuid) as total_jobs,
        (SELECT COUNT(*) FROM applications a 
         JOIN placement_drives d ON a.drive_id = d.drive_id 
         WHERE d.company_id = $1::uuid) as total_applications,
        (SELECT COUNT(*) FROM applications a 
         JOIN placement_drives d ON a.drive_id = d.drive_id 
         WHERE d.company_id = $1::uuid AND a.status = 'shortlisted') as total_shortlisted
    `;

    const stats = await pool.query(statsQuery, [companyId]);
    
    // Explicitly convert to Numbers
    res.json({
      total_jobs: Number(stats.rows[0].total_jobs),
      total_applications: Number(stats.rows[0].total_applications),
      total_shortlisted: Number(stats.rows[0].total_shortlisted)
    });
  } catch (err) { // Existing console.error is good here
    console.error("Analytics Error:", err.message);
    res.status(500).send("Server Error");
  }
});
// Get all students who applied for a specific job
router.get('/applicants/:driveId', verifyToken, async (req, res) => {
  try {
    const { driveId } = req.params;

    if (!driveId || driveId === 'undefined') {
      return res.status(400).json({ msg: "Invalid drive id" });
    }

    const query = `
      SELECT 
        s.full_name, 
        u.email, 
        a.status, 
        a.applied_at,
        a.application_id as id,
        s.cgpa,
        s.resume_url
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN users u ON s.student_id = u.user_id
      WHERE a.drive_id = $1
      ORDER BY a.applied_at DESC
    `;

    const result = await pool.query(query, [driveId]);
    res.json(result.rows);
  } catch (err) { // Existing console.error is good here
    console.error("Applicants fetch error:", err.message);
    res.status(500).json({ error: "Server error fetching applicants" });
  }
});


router.get('/all-applications', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.id;
    const query = `
      SELECT 
        a.application_id as id,
        s.full_name, 
        u.email, 
        d.job_role, 
        a.status as shortlist_status,
        s.cgpa
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN users u ON s.student_id = u.user_id
      JOIN placement_drives d ON a.drive_id = d.drive_id
      WHERE d.company_id = $1::uuid
      ORDER BY a.applied_at DESC
    `;
    const result = await pool.query(query, [companyId]);
    res.json(result.rows);
  } catch (err) { // Existing console.error is good here
    console.error(err.message);
    res.status(500).json({ error: "Server error fetching all applications" });
  }
});

// 2. The Shortlist logic (moved here to avoid 404s)
router.put('/applications/:id/shortlist', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Force lowercase to satisfy the 'shortlisted' check constraint
        const status = req.body.status.toLowerCase(); 

        const result = await pool.query(
            "UPDATE applications SET status = $1 WHERE application_id = $2 RETURNING *",
            [status, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: "Application not found" });
        }

        // Req 8: Automatically notify student of status update
        if (status === 'shortlisted' || status === 'selected') {
            await pool.query(
                'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
                [result.rows[0].student_id, `Update: You have been ${status} for the ${req.body.job_role || 'requested'} drive.`]
            );
        }

        res.json({ msg: "Status updated", data: result.rows[0] });
    } catch (err) {
        console.error("PUT /applications/:id/shortlist Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// backend/routes/jobs.js (or similar)

// Check: Are you using 'drive_id' or 'id' in the database?
// The parameter name here (:driveId) must match req.params.driveId
router.delete('/delete/:driveId', verifyToken, async (req, res) => {
  const { driveId } = req.params;

  try {
    // Ensure you are targeting the correct table and column name
    const result = await pool.query(
      'DELETE FROM placement_drives WHERE drive_id = $1', 
      [driveId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "Drive not found in database" });
    }
    res.json({ msg: "Drive and associated applications deleted" });
  } catch (err) { // Existing console.error is good here
    console.error("DB Delete Error:", err.message);
    res.status(500).json({ msg: "Database error occurred" });
  }
});

module.exports = router;