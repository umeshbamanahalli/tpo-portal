const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');

// 1. Fetch all companies (for approval/monitoring)
router.get('/companies', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: "Admin only" });
  try {
    const result = await pool.query(`
      SELECT
        c.company_id,
        c.company_name,
        c.website_url,
        c.industry,
        c.location,
        COALESCE(c.status, 'pending') AS status,
        u.email
      FROM companies c
      LEFT JOIN users u ON c.company_id = u.user_id
      ORDER BY c.company_name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// 2. Approve a company
router.put('/approve-company/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: "Admin only" });
  try {
    await pool.query('UPDATE companies SET status = $1 WHERE company_id = $2', ['approved', req.params.id]);
    res.json({ msg: "Company Approved Successfully" });
  } catch (err) {
    res.status(500).send("Approval Failed");
  }
});

// 3. Monitor All Applications (Global Tracking)
router.get('/tracking', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: "Admin only" });
  try {
    const result = await pool.query(`
      SELECT
        s.full_name,
        c.company_name,
        d.job_role AS role,
        a.status,
        a.applied_at
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN placement_drives d ON a.drive_id = d.drive_id
      JOIN companies c ON d.company_id = c.company_id
      ORDER BY a.applied_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Tracking Error");
  }
});

// Route to get all students
router.get('/students', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: "Admin only" });
    try {
        // We join 'students' and 'users' on the UUID keys
        const query = `
            SELECT 
                s.student_id as id, 
                s.full_name as name, 
                u.email, 
                s.college_id, 
                s.department, 
                s.cgpa 
            FROM students s
            JOIN users u ON s.student_id = u.user_id
            WHERE u.role = 'student'
        `;
        
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("DB Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});


// --- DELETE STUDENT ---
// backend/routes/admin.js

router.delete('/delete-student/:id', verifyToken, async (req, res) => {
    // 1. Check Admin Role
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: "Unauthorized" });
    }

    const studentId = req.params.id;

    try {
        // 2. Delete the student's applications first (The Child Records)
        await pool.query('DELETE FROM applications WHERE student_id = $1', [studentId]);

        // 3. Delete the student record from users table (The Parent Record)
        // Note: Ensure your column is 'id' or 'student_id' based on your schema
        const result = await pool.query('DELETE FROM users WHERE user_id = $1 AND role = $2', [studentId, 'student']);

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: "Student not found" });
        }

        res.json({ msg: "Student record deleted successfully" });
    } catch (err) {
        console.error("Student Delete Error:", err.message);
        res.status(500).json({ error: "Database Error", detail: err.message });
    }
});

// --- APPROVE/REJECT COMPANY ---
router.put('/companies/:id/status', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: "Admin only" });
    const { status } = req.body; // e.g., 'approved' or 'rejected'
    try {
        const result = await pool.query(
            'UPDATE companies SET status = $1 WHERE company_id = $2 RETURNING *',
            [status, req.params.id]
        );

        if (result.rowCount === 0) return res.status(404).json({ msg: "Company not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


// backend/routes/admin.js

// backend/routes/admin.js
router.delete('/delete-company/:id', verifyToken, async (req, res) => {
    const companyId = req.params.id;

    try {
        // 1. Delete applications first
        // We use a subquery to find all drives belonging to this company
        await pool.query(`
            DELETE FROM applications 
            WHERE drive_id IN (SELECT drive_id FROM placement_drives WHERE company_id = $1)
        `, [companyId]);

        // 2. Delete the drives
        await pool.query('DELETE FROM placement_drives WHERE company_id = $1', [companyId]);

        // 3. Delete the company user
        // IMPORTANT: Ensure your column is 'id' or 'company_id' here
        const result = await pool.query('DELETE FROM users WHERE user_id = $1', [companyId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: "Company not found" });
        }

        res.json({ msg: "Successfully deleted company and all related data" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Database error", detail: err.message });
    }
});

module.exports = router;
