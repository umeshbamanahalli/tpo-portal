const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const multer = require('multer');
const path = require('path');

// --- Multer Setup for Resume Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/resumes/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
  fileFilter: (req, file, cb) => {
    const allowedExt = new Set(['.pdf', '.doc', '.docx']);
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowedExt.has(ext)) {
      return cb(new Error('Only PDF, DOC, DOCX files are allowed'));
    }
    cb(null, true);
  }
});

// @route   GET /api/student/profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const studentQuery = await pool.query(
      `SELECT s.full_name, s.college_id, s.department, s.cgpa, s.resume_url, u.email 
       FROM students s 
       JOIN users u ON s.student_id = u.user_id 
       WHERE s.student_id = $1`,
      [req.user.id]
    );
    res.json(studentQuery.rows[0]);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/student/update-profile
// Uses upload.single('resume') to handle the file picker from frontend
router.put('/update-profile', verifyToken, upload.single('resume'), async (req, res) => {
  const { full_name, department, cgpa } = req.body;
  const student_id = req.user.id;
  
  // If a file was uploaded, use the new path, otherwise keep existing link
  let resume_url = req.body.resume_url; 
  if (req.file) {
    resume_url = `/uploads/resumes/${req.file.filename}`;
  }

  try {
    await pool.query(
      `UPDATE students 
       SET full_name = $1, department = $2, cgpa = $3, resume_url = $4 
       WHERE student_id = $5`,
      [full_name, department, cgpa, resume_url, student_id]
    );
    res.json({ msg: "Profile updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.use((err, req, res, next) => {
  if (err && err.message && err.message.includes('Only PDF, DOC, DOCX')) {
    return res.status(400).json({ msg: err.message });
  }
  return next(err);
});

// @route   GET /api/student/drives
// This fetches the actual job openings
router.get("/drives", verifyToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ msg: "Only students can view drives" });
  }

  try {
    const drives = await pool.query(
      `SELECT d.*, COALESCE(c.company_name, 'Confidential Company') AS company_name
       FROM placement_drives d
       LEFT JOIN companies c ON d.company_id = c.company_id
       WHERE d.status = 'active'
         AND d.deadline >= CURRENT_DATE
       ORDER BY d.deadline ASC`
    );
    res.json(drives.rows); // Return all rows, not just [0]
  } catch (err) {
    console.error("Student drives fetch error:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/student/my-applications
// @desc    Fetch applications submitted by logged-in student
router.get('/my-applications', verifyToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ msg: "Only students can view applications" });
  }

  try {
    const result = await pool.query(
      `SELECT
          a.application_id,
          a.drive_id,
          a.status,
          a.applied_at,
          d.job_role,
          d.ctc_package,
          d.deadline,
          COALESCE(c.company_name, 'Confidential Company') AS company_name
       FROM applications a
       JOIN placement_drives d ON a.drive_id = d.drive_id
       LEFT JOIN companies c ON d.company_id = c.company_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Student applications fetch error:", err.message);
    res.status(500).json({ msg: "Failed to load applications" });
  }
});

// @route   POST /api/student/apply
router.post('/apply', verifyToken, async (req, res) => {
  const { drive_id } = req.body; 
  const student_id = req.user.id;

  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ msg: "Only students can apply for drives" });
    }
    if (!drive_id) {
      return res.status(400).json({ msg: "Drive id is required" });
    }

    const studentExists = await pool.query(
      'SELECT 1 FROM students WHERE student_id = $1',
      [student_id]
    );
    if (studentExists.rows.length === 0) {
      return res.status(403).json({ msg: "Student profile not found for this account" });
    }

    const driveExists = await pool.query(
      `SELECT 1
       FROM placement_drives
       WHERE drive_id = $1 AND status = 'active' AND deadline >= CURRENT_DATE`,
      [drive_id]
    );
    if (driveExists.rows.length === 0) {
      return res.status(404).json({ msg: "Drive not found or no longer active" });
    }

    // 1. Check if already applied in the applications table
    const alreadyApplied = await pool.query(
      'SELECT * FROM applications WHERE drive_id = $1 AND student_id = $2',
      [drive_id, student_id]
    );

    if (alreadyApplied.rows.length > 0) {
      return res.status(400).json({ msg: "Already applied!" });
    }

    // 2. Insert into applications table
    await pool.query(
      'INSERT INTO applications (drive_id, student_id, status) VALUES ($1, $2, $3)',
      [drive_id, student_id, 'applied']
    );

    res.status(201).json({ msg: "Applied successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;