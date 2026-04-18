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

module.exports = router;