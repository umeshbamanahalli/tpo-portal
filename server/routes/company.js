const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');

// @route   GET /api/company/profile
// @desc    Get company profile details
router.get('/profile', verifyToken, async (req, res) => {
  if (req.user.role !== 'company') return res.status(403).json({ msg: "Access Denied" });
  try {
    const result = await pool.query(
      `SELECT c.*, u.email 
       FROM companies c 
       JOIN users u ON c.company_id = u.user_id 
       WHERE c.company_id = $1::uuid`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: "Profile not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/company/my-drives
// @desc    Get all drives posted by the logged-in company
router.get('/my-drives', verifyToken, async (req, res) => {
  if (req.user.role !== 'company') return res.status(403).json({ msg: "Access Denied" });

  try {
    const drives = await pool.query(
      `SELECT d.*, 
       (SELECT COUNT(*) FROM applications a WHERE a.drive_id = d.drive_id) as total_applicants
       FROM placement_drives d
       WHERE d.company_id = $1`,
      [req.user.id]
    );
    res.json(drives.rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// POST: Save a new job to PostgreSQL
router.post('/create-drive', verifyToken, async (req, res) => {
  // ALLOW BOTH ADMIN AND COMPANY
  if (req.user.role !== 'admin' && req.user.role !== 'company') {
    return res.status(403).json({ msg: "Access denied. Unauthorized role." });
  }

  const { job_role, min_cgpa, ctc, deadline, company_id } = req.body;

  try {
    const newDrive = await pool.query(
      `INSERT INTO placement_drives (company_id, job_role, min_cgpa_required, ctc_package, deadline, status) 
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
      [company_id, job_role, min_cgpa, ctc, deadline]
    );
    res.json({ msg: "Drive Created Successfully! 🚀", drive: newDrive.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/company/eligible-students/:driveId
// @desc    Req 6: Show students who meet CGPA but haven't applied
router.get('/eligible-students/:driveId', verifyToken, async (req, res) => {
    try {
        const drive = await pool.query('SELECT min_cgpa_required FROM placement_drives WHERE drive_id = $1', [req.params.driveId]);
        if (drive.rowCount === 0) return res.status(404).json({ msg: "Drive not found" });

        const minCgpa = drive.rows[0].min_cgpa_required;
        const result = await pool.query(`
            SELECT s.full_name, s.cgpa, u.email, s.department
            FROM students s
            JOIN users u ON s.student_id = u.user_id
            WHERE s.cgpa >= $1
            AND s.student_id NOT IN (
                SELECT student_id FROM applications WHERE drive_id = $2
            )
        `, [minCgpa, req.params.driveId]);
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// GET: Fetch all jobs
router.get('/api/jobs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jobs ORDER BY posted_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Fetch Error" });
  }
});

router.get('/applicants/:jobId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.full_name, u.email, p.status, p.applied_at 
      FROM placements p
      JOIN students s ON p.student_id = s.student_id
      JOIN users u ON s.student_id = u.user_id
      WHERE p.id = $1
    `, [req.params.jobId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});


// backend/routes/admin.js

// Fetch all applications
router.get('/applications', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                a.application_id,
                a.status,
                s.full_name,
                s.college_id,
                s.department,
                s.cgpa,
                s.resume_url,        -- Add this for the Recruiter to view
                c.company_name,
                d.job_role           -- Pull from placement_drives table
            FROM applications a
            JOIN students s ON a.student_id = s.student_id
            JOIN placement_drives d ON a.drive_id = d.drive_id -- Link to the drive
            JOIN companies c ON d.company_id = c.company_id    -- Link drive to company
            ORDER BY a.applied_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Fetch error:", err.message);
        res.status(500).send("Server Error");
    }
});

// @route   PUT /api/company/applications/:id/next-round
// @desc    Req 7: Advance student to next interview round
router.put('/applications/:id/next-round', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'company') return res.status(403).json({ msg: "Access denied" });
        await pool.query(
            'UPDATE applications SET current_round_index = current_round_index + 1 WHERE application_id = $1',
            [req.params.id]
        );
        res.json({ msg: "Student moved to next round" });
    } catch (err) { res.status(500).send("Server Error"); }
});

// Shortlist logic
router.put('/applications/:id/shortlist', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'company') {
            return res.status(403).json({ msg: "Access denied" });
        }

        const { id } = req.params;
        const { status } = req.body; // Check if this matches your frontend JSON

        const result = await pool.query(
            `UPDATE applications a
             SET shortlist_status = $1
             FROM placement_drives d
             WHERE a.application_id = $2
               AND a.drive_id = d.drive_id
               AND d.company_id = $3
             RETURNING a.*`,
            [status, id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: "Application not found" });
        }

        res.json({ msg: "Status updated", data: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server error" });
    }
});

// Example: Fetching applicants for a specific drive
// Fetch all applications for the logged-in company across different jobs
router.get('/all-applications', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'company') {
            return res.status(403).json({ msg: "Access denied" });
        }

        const companyId = req.user.id; 
        const query = `
            SELECT 
                a.application_id, 
                s.full_name, 
                u.email, 
                s.cgpa, 
                d.job_role, 
                a.shortlist_status 
            FROM applications a
            JOIN students s ON a.student_id = s.student_id
            JOIN users u ON s.student_id = u.user_id
            JOIN placement_drives d ON a.drive_id = d.drive_id
            WHERE d.company_id = $1
            ORDER BY a.created_at DESC
        `;
        const { rows } = await pool.query(query, [companyId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error" });
    }
});

module.exports = router;
