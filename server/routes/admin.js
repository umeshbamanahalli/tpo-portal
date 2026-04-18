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

module.exports = router;