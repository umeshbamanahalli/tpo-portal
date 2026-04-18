const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      email,
      password,
      role,
      company_name,
      website_url,
      website,
      name,
      college_id,
      department,
      cgpa
    } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const allowedRoles = new Set(['admin', 'student', 'company']);

    if (!normalizedEmail || !password || !role) {
      return res.status(400).json({ msg: "Please enter all required fields" });
    }
    if (!allowedRoles.has(role)) {
      return res.status(400).json({ msg: "Invalid role selected" });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    await client.query('BEGIN');

    // 2. Check if user exists
    const userExist = await client.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (userExist.rows.length > 0) {
      await client.query('ROLLBACK'); // Always rollback before returning!
      return res.status(400).json({ msg: "User already exists" });
    }

    // 3. Hash Password (Defining hashedPassword properly)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt); // <--- Variable defined here

    // 4. Insert into 'users' table
    const userRes = await client.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id',
      [normalizedEmail, hashedPassword, role] // <--- hashedPassword is now defined in this scope
    );
    const userId = userRes.rows[0].user_id;

    // 5. Role-Specific Profile Creation
    if (role === 'student') {
      await client.query(
        'INSERT INTO students (student_id, full_name, college_id, department, cgpa) VALUES ($1, $2, $3, $4, $5)',
        [userId, name, college_id, department, cgpa || 0]
      );
    } else if (role === 'company') {
      const resolvedCompanyName = (company_name || name || '').trim();
      const resolvedWebsite = (website_url || website || '').trim() || null;
      if (!resolvedCompanyName) {
        await client.query('ROLLBACK');
        return res.status(400).json({ msg: "Company name is required" });
      }
      await client.query(
        'INSERT INTO companies (company_id, company_name, website_url) VALUES ($1, $2, $3)',
        [userId, resolvedCompanyName, resolvedWebsite]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ msg: "Registration successful ✅" });

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error("SERVER ERROR:", err.message);
    res.status(500).json({ error: "Server error during registration" });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const resUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (resUser.rows.length === 0) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const user = resUser.rows[0];

    // 2. Verify Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // 3. Create JWT Payload
    const payload = {
      user: {
        id: user.user_id,
        role: user.role
      }
    };

    // 4. Sign Token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          role: user.role,
          msg: "Login successful 👋" 
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};