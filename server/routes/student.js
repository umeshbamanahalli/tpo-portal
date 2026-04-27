const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const multer = require('multer');
const path = require('path');

// --- Multer Setup ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = file.fieldname === 'resume' ? 'uploads/resumes/' : 'uploads/bulk/';
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedExt = new Set(['.pdf', '.doc', '.docx', '.xlsx', '.csv']);
        const ext = path.extname(file.originalname || '').toLowerCase();
        if (!allowedExt.has(ext)) return cb(new Error('File type not supported'));
        cb(null, true);
    }
});

// --- 1. PROFILE MANAGEMENT ---

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, u.email FROM students s 
             JOIN users u ON s.student_id = u.user_id WHERE s.student_id = $1`,
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

router.put('/update-profile', verifyToken, upload.single('resume'), async (req, res) => {
    const { full_name, department, cgpa, batch_year, division, intake_type } = req.body;
    let resume_url = req.body.resume_url; 
    if (req.file) resume_url = `/uploads/resumes/${req.file.filename}`;

    try {
        await pool.query(
            `UPDATE students SET full_name = $1, department = $2, cgpa = $3, 
             resume_url = $4, batch_year = $5, division = $6, intake_type = $7 WHERE student_id = $8`,
            [full_name, department, cgpa, resume_url, batch_year, division, intake_type, req.user.id]
        );
        res.json({ msg: "Profile updated successfully" });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// --- 2. DRIVES & ELIGIBILITY (Req 5, 6, 8, 10) ---

router.get("/drives", verifyToken, async (req, res) => {
    const { type } = req.query; // 'Placement', 'Internship', 'Training'
    let filter = "WHERE d.status = 'active' AND d.deadline >= CURRENT_DATE";
    if (type) filter += ` AND d.opportunity_type = '${type}'`;

    try {
        const drives = await pool.query(
           `SELECT d.*, c.company_name,
                (CASE WHEN s.cgpa >= d.min_cgpa_required THEN true ELSE false END) as is_eligible
             FROM placement_drives d
             LEFT JOIN companies c ON d.company_id = c.company_id
             CROSS JOIN students s
             WHERE s.student_id = $1 ${filter.replace('WHERE', 'AND')}
             ORDER BY d.deadline ASC`,
            [req.user.id]
        );
        res.json(drives.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// --- 3. APPLICATION & ROUND TRACKING (Req 7, 12) ---

router.post('/apply', verifyToken, async (req, res) => {
    const { drive_id } = req.body;
    const student_id = req.user.id;

    try {
        // Eligibility Check before Insert
        const check = await pool.query(
            `SELECT (s.cgpa >= d.min_cgpa_required) as eligible 
             FROM students s, placement_drives d 
             WHERE s.student_id = $1 AND d.drive_id = $2`,
            [student_id, drive_id]
        );

        if (!check.rows[0]?.eligible) {
            return res.status(403).json({ msg: "You do not meet the minimum CGPA for this drive" });
        }

        await pool.query(
            'INSERT INTO applications (drive_id, student_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [drive_id, student_id, 'applied']
        );
        res.status(201).json({ msg: "Applied successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

router.get('/my-applications', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.application_id, a.drive_id, a.status as overall_status, a.applied_at,
                    d.job_role, d.opportunity_type, d.ctc_package, c.company_name, d.company_category,
                    r.round_name as current_round
             FROM applications a
             JOIN placement_drives d ON a.drive_id = d.drive_id
             JOIN companies c ON d.company_id = c.company_id
             LEFT JOIN LATERAL (
                SELECT dr.round_name FROM student_round_status srs
                JOIN drive_rounds dr ON srs.round_id = dr.round_id
                WHERE srs.application_id = a.application_id
                ORDER BY dr.round_number DESC LIMIT 1
             ) r ON true
             WHERE a.student_id = $1`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// --- 4. TRAINING SESSIONS (Req 11) ---

router.get('/training', verifyToken, async (req, res) => {
    try {
        const studentDept = await pool.query('SELECT department FROM students WHERE student_id = $1', [req.user.id]);
        const dept = studentDept.rows[0]?.department || 'None';

        const result = await pool.query(
            `SELECT * FROM training_sessions 
             WHERE department_eligibility = 'All' OR department_eligibility = $1
             ORDER BY start_time ASC`,
            [dept]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).send("Server Error"); }
});

// --- 4. ACADEMIC CERTIFICATIONS (Req 9) ---

router.get('/certifications', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM academic_certifications WHERE student_id = $1', [req.user.id]);
        res.json(result.rows);
    } catch (err) { res.status(500).send("Server Error"); }
});

router.post('/certifications', verifyToken, async (req, res) => {
    const { cert_name, issuing_org, issue_date, cert_url } = req.body;
    try {
        await pool.query(
            'INSERT INTO academic_certifications (student_id, cert_name, issuing_org, issue_date, cert_url) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, cert_name, issuing_org, issue_date, cert_url]
        );
        res.json({ msg: "Certification added successfully" });
    } catch (err) { res.status(500).send("Server Error"); }
});


module.exports = router;