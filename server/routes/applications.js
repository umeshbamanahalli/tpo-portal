// @route   POST /api/student/apply
// @desc    Student applies for a job drive
router.post('/apply', verifyToken, async (req, res) => {
  const { drive_id } = req.body;
  const student_id = req.user.id;

  try {
    // 1. Check if student meets CGPA criteria before allowing application
    const criteria = await pool.query(
      `SELECT d.min_cgpa_required, s.cgpa 
       FROM placement_drives d, students s 
       WHERE d.drive_id = $1 AND s.student_id = $2`,
      [drive_id, student_id]
    );

    const { min_cgpa_required, cgpa } = criteria.rows[0];

    if (parseFloat(cgpa) < parseFloat(min_cgpa_required)) {
      return res.status(403).json({ msg: "You do not meet the minimum CGPA requirement." });
    }

    // 2. Insert application
    await pool.query(
      'INSERT INTO applications (drive_id, student_id) VALUES ($1, $2)',
      [drive_id, student_id]
    );

    res.json({ msg: "Applied successfully! Good luck. 🎯" });
  } catch (err) {
    if (err.code === '23505') { // Unique violation error code
      return res.status(400).json({ msg: "You have already applied for this drive." });
    }
    res.status(500).send("Server Error");
  }
});