const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const ExcelJS = require('exceljs'); // ✅ replaced
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');

const upload = multer({ dest: 'uploads/temp/' });

// Middleware to restrict access to Admins only
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: "Access Denied: Admin role required" });
    }
    next();
};

// --- 1. COMPANY MANAGEMENT ---

router.get('/companies', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, u.email 
            FROM companies c
            LEFT JOIN users u ON c.company_id = u.user_id
            ORDER BY c.company_name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /companies Error:', err);
        res.status(500).json({ error: "Server Error" });
    }
});

router.put('/companies/:id/status', verifyToken, isAdmin, async (req, res) => {
    const { status } = req.body; 
    try {
        const result = await pool.query(
            'UPDATE companies SET status = $1 WHERE company_id = $2 RETURNING *',
            [status, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ msg: "Company not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PUT /companies/:id/status Error:', err);
        res.status(500).json({ error: "Update failed" });
    }
});

router.delete('/delete-company/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE user_id = $1 AND role = $2',
            [req.params.id, 'company']
        );
        if (result.rowCount === 0) return res.status(404).json({ msg: "Company not found" });
        res.json({ msg: "Company and related data deleted" });
    } catch (err) {
        console.error('DELETE /delete-company/:id Error:', err);
        res.status(500).json({ error: "Delete failed" });
    }
});

// --- 2. STUDENT & BULK MANAGEMENT ---

router.get('/students', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.student_id AS id, s.full_name AS name, u.email, s.college_id, s.department, s.cgpa
            FROM students s
            JOIN users u ON s.student_id = u.user_id
            ORDER BY s.full_name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /students Error:', err);
        res.status(500).json({ error: "Server Error" });
    }
});

// --- 2. DRIVE MANAGEMENT ---

router.get('/drives', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.*, c.company_name
            FROM placement_drives d
            JOIN companies c ON d.company_id = c.company_id
            ORDER BY d.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /drives Error:', err);
        res.status(500).json({ error: "Server Error" });
    }
});

// Req: View applicants for all drives of a specific company
router.get('/companies/:id/applicants', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.full_name, s.college_id, s.department, s.cgpa, u.email, d.job_role, a.status, a.applied_at
            FROM applications a
            JOIN students s ON a.student_id = s.student_id
            JOIN users u ON s.student_id = u.user_id
            JOIN placement_drives d ON a.drive_id = d.drive_id
            WHERE d.company_id = $1
            ORDER BY a.applied_at DESC
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /companies/:id/applicants Error:', err);
        res.status(500).json({ error: "Failed to fetch applicants" });
    }
});

router.delete('/delete-student/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE user_id = $1 AND role = $2',
            [req.params.id, 'student']
        );
        if (result.rowCount === 0) return res.status(404).json({ msg: "Student not found" });
        res.json({ msg: "Student and related data deleted" });
    } catch (err) {
        console.error('DELETE /delete-student/:id Error:', err);
        res.status(500).json({ error: "Delete failed" });
    }
});

router.post('/bulk-upload-students', verifyToken, isAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    const client = await pool.connect();

    try {
        // ✅ Read Excel using exceljs
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);

        const worksheet = workbook.worksheets[0];
        const data = [];

        // Convert rows → JSON
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header

            data.push({
                email: row.getCell(1).text || row.getCell(1).value?.toString(),
                password: row.getCell(2).text || row.getCell(2).value?.toString(),
                full_name: row.getCell(3).text || row.getCell(3).value?.toString(),
                college_id: row.getCell(4).text || row.getCell(4).value?.toString(),
                department: row.getCell(5).text || row.getCell(5).value?.toString(),
                batch_year: parseInt(row.getCell(6).value) || 2026,
                intake_type: row.getCell(7).text || row.getCell(7).value?.toString() || 'Regular',
                division: row.getCell(8).text || row.getCell(8).value?.toString() || 'A',
                cgpa: parseFloat(row.getCell(9).value) || 0.00
            });
        });

        await client.query('BEGIN');

        for (let row of data) {
            if (!row.email) continue;

            const userCheck = await client.query(
                'SELECT 1 FROM users WHERE email = $1',
                [row.email]
            );

            if (userCheck.rowCount > 0) continue;

            const hashedPassword = await bcrypt.hash(
                row.password || 'Student@123',
                10
            );

            const userRes = await client.query(
                'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id',
                [row.email, hashedPassword, 'student']
            );

            await client.query(
                `INSERT INTO students 
                (student_id, full_name, college_id, department, batch_year, intake_type, division, cgpa)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    userRes.rows[0].user_id,
                    row.full_name,
                    row.college_id,
                    row.department,
                    row.batch_year,
                    row.intake_type,
                    row.division,
                    row.cgpa
                ]
            );
        }

        await client.query('COMMIT');

        // ✅ delete temp file after use
        fs.unlinkSync(req.file.path);

        res.json({ msg: `Successfully processed ${data.length} records` });

    } catch (err) {
        await client.query('ROLLBACK');

        // delete temp file even if error
        if (req.file) fs.unlinkSync(req.file.path);

        res.status(500).json({
            error: "Bulk upload failed",
            details: err.message
        });
    } finally {
        client.release();
    }
});

// --- 3. ANALYTICS ---

router.get('/analytics/placement-stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                batch_year AS batch,
                department AS branch,
                intake_type,
                COUNT(*) AS total_students,
                COUNT(CASE WHEN placement_status = 'placed' THEN 1 END) AS placed_count,
                COUNT(CASE WHEN placement_status = 'unplaced' THEN 1 END) AS unplaced_count
            FROM students
            WHERE batch_year >= EXTRACT(YEAR FROM CURRENT_DATE) - 2
            GROUP BY batch_year, department, intake_type
            ORDER BY batch_year DESC, department ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('GET /analytics/placement-stats Error:', err);
        res.status(500).json({ error: "Analytics fetch failed" });
    }
});

// Req 6: View eligible students for a specific drive
router.get('/drives/:driveId/eligible', verifyToken, isAdmin, async (req, res) => {
    try {
        const drive = await pool.query('SELECT min_cgpa_required FROM placement_drives WHERE drive_id = $1', [req.params.driveId]);
        if (drive.rowCount === 0) return res.status(404).json({ error: "Drive not found" });

        const result = await pool.query(`
            SELECT s.full_name, s.college_id, s.department, s.cgpa, u.email
            FROM students s
            JOIN users u ON s.student_id = u.user_id
            WHERE s.cgpa >= $1
        `, [drive.rows[0].min_cgpa_required]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch eligible students" });
    }
});

// --- 4. REPORTS ---

router.get('/reports/placed-students', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.full_name, s.college_id, s.department, s.batch_year, 
                   c.company_name, d.job_role, d.ctc_package
            FROM applications a
            JOIN students s ON a.student_id = s.student_id
            JOIN placement_drives d ON a.drive_id = d.drive_id
            JOIN companies c ON d.company_id = c.company_id
            WHERE a.status = 'selected'
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Report generation failed" });
    }
});

// --- 5. TRACKING ---

router.get('/tracking', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.application_id, s.full_name, s.department, c.company_name, d.job_role, d.company_category,
                   a.status, a.applied_at,
                   (SELECT dr.round_name FROM student_round_status srs
                    JOIN drive_rounds dr ON srs.round_id = dr.round_id
                    WHERE srs.application_id = a.application_id
                    ORDER BY dr.round_number DESC LIMIT 1) as current_round,
                   (SELECT COUNT(*) FROM student_round_status WHERE application_id = a.application_id AND status = 'cleared') as rounds_cleared
            FROM applications a
            JOIN students s ON a.student_id = s.student_id
            JOIN placement_drives d ON a.drive_id = d.drive_id
            JOIN companies c ON d.company_id = c.company_id
            ORDER BY a.applied_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Tracking data unavailable" });
    }
});

// --- 6. NOTIFICATIONS ---

router.post('/notifications/broadcast', verifyToken, isAdmin, async (req, res) => {
    const { message, targetRole } = req.body;

    try {
        const query = targetRole === 'all'
            ? 'INSERT INTO notifications (user_id, message) SELECT user_id, $1 FROM users'
            : 'INSERT INTO notifications (user_id, message) SELECT user_id, $1 FROM users WHERE role = $2';

        await pool.query(query, targetRole === 'all' ? [message] : [message, targetRole]);

        res.json({ msg: "Broadcast sent successfully" });
    } catch (err) {
        res.status(500).json({ error: "Notification broadcast failed" });
    }
});

module.exports = router;